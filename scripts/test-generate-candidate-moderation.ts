/**
 * 【生成前候选词审核时序单测 / 合规核心】
 * 
 * 作用：验证在生成 API（`/api/ai/generate`）触发真实 AI 模型前，提示词审核（Candidate Moderation）必须先执行完毕。
 * 
 * 运行方式：
 * pnpm test:ai-moderation
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const routePath = resolve('src/app/api/ai/generate/route.ts');
const source = readFileSync(routePath, 'utf8');

const candidatePlansIndex = source.indexOf(
  'const candidatePlans: GenerateCandidatePlan[] = candidateEntries.map'
);
const inputModerationIndex = source.indexOf(
  'await moderateGenerationInput({',
  candidatePlansIndex
);
const fallbackLoopIndex = source.indexOf(
  'for (const { entry, finalOptions } of candidatePlans)',
  candidatePlansIndex
);
const singleProviderBranchIndex = source.indexOf(
  '} else if (provider && model) {',
  fallbackLoopIndex
);

assert.notEqual(candidatePlansIndex, -1, 'candidate plans block is missing');
assert.notEqual(inputModerationIndex, -1, 'candidate input moderation is missing');
assert.notEqual(fallbackLoopIndex, -1, 'candidate fallback loop is missing');
assert.notEqual(
  singleProviderBranchIndex,
  -1,
  'single provider branch marker is missing'
);
assert.ok(
  inputModerationIndex < fallbackLoopIndex,
  'candidate input moderation must run before provider fallback loop'
);

const candidateFallbackBlock = source.slice(
  fallbackLoopIndex,
  singleProviderBranchIndex
);
assert.equal(
  /await\s+moderateGenerationInput\s*\(/.test(candidateFallbackBlock),
  false,
  'candidate fallback loop must not call moderateGenerationInput'
);

const candidatePreparationBlock = source.slice(
  candidatePlansIndex,
  fallbackLoopIndex
);
const candidateModerationCalls = candidatePreparationBlock.match(
  /await\s+moderateGenerationInput\s*\(/g
);
assert.equal(
  candidateModerationCalls?.length ?? 0,
  1,
  'candidate path must call moderateGenerationInput exactly once before fallback loop'
);

console.log('generate candidate moderation checks passed.');
