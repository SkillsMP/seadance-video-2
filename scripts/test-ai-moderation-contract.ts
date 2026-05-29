import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function readSource(path: string): string {
  return readFileSync(resolve(path), 'utf8');
}

function assertBefore(
  source: string,
  firstNeedle: string,
  secondNeedle: string,
  message: string
): void {
  const firstIndex = source.indexOf(firstNeedle);
  const secondIndex = source.indexOf(secondNeedle);

  assert.notEqual(firstIndex, -1, `${firstNeedle} is missing`);
  assert.notEqual(secondIndex, -1, `${secondNeedle} is missing`);
  assert.ok(firstIndex < secondIndex, message);
}

const generateRoute = readSource('src/app/api/ai/generate/route.ts');
const queryRoute = readSource('src/app/api/ai/query/route.ts');
const aiTaskModel = readSource('src/shared/models/ai_task.ts');
const moderationService = readSource('src/shared/services/moderation.ts');
const moderationTypes = readSource('src/extensions/moderation/types.ts');
const moderationFactory = readSource('src/extensions/moderation/index.ts');

assertBefore(
  generateRoute,
  'await applyGenerationOutputModeration({',
  'const newAITask: NewAITask = {',
  'generate route must moderate provider success output before persisting or returning task data'
);
assertBefore(
  generateRoute,
  'const newAITask: NewAITask = {',
  'return respData(newAITask)',
  'generate route must return the moderated persisted task payload'
);

const terminalStatusesMatch = queryRoute.match(
  /const TERMINAL_TASK_STATUSES = new Set<string>\(\[([\s\S]*?)\]\);/
);
assert.ok(terminalStatusesMatch, 'query terminal status set is missing');
const terminalStatusesBlock = terminalStatusesMatch[1];
for (const status of [
  'AITaskStatus.SUCCESS',
  'AITaskStatus.FAILED',
  'AITaskStatus.CANCELED',
  'AITaskStatus.MODERATION_BLOCKED',
]) {
  assert.match(
    terminalStatusesBlock,
    new RegExp(status.replace('.', '\\.')),
    `terminal statuses must include ${status}`
  );
}
assertBefore(
  queryRoute,
  'if (TERMINAL_TASK_STATUSES.has(task.status))',
  'const aiService = await getAIService()',
  'query route must short-circuit terminal tasks before requesting provider'
);
assertBefore(
  queryRoute,
  'if (TERMINAL_TASK_STATUSES.has(task.status))',
  'await applyGenerationOutputModeration({',
  'query route must short-circuit terminal tasks before output moderation'
);

assert.match(
  aiTaskModel,
  /updateAITask\.status === AITaskStatus\.FAILED && updateAITask\.creditId/,
  'automatic refund must be tied only to provider failed status'
);
assert.doesNotMatch(
  aiTaskModel,
  /MODERATION_BLOCKED[\s\S]{0,200}credit|credit[\s\S]{0,200}MODERATION_BLOCKED/,
  'moderation_blocked must not be coupled to automatic refund logic'
);

assert.match(
  moderationService,
  /function createModerationBlockedTaskPayload\(\)[\s\S]*?createSafeTaskPayload\(\s*AITaskStatus\.MODERATION_BLOCKED,\s*CONTENT_POLICY_VIOLATION_CODE,\s*GENERATED_CONTENT_SAFETY_MESSAGE\s*\)/,
  'blocked output must use a sanitized moderation_blocked payload'
);
assert.match(
  moderationService,
  /if \(\s*!\(error instanceof ContentPolicyViolationError\)\s*\)[\s\S]*?throw error;[\s\S]*?return createModerationBlockedTaskPayload\(\);/,
  'content policy violations must not return original provider output'
);
assert.match(
  moderationService,
  /taskResult:\s*\{\s*errorCode,\s*errorMessage,\s*\}/,
  'safe task payload must not include provider output URLs'
);

assert.match(
  moderationTypes,
  /ModerationProviderName = 'sightengine' \| 'wavespeed'/,
  'moderation provider type must include Wavespeed'
);
assert.match(
  moderationFactory,
  /config\.provider === 'wavespeed'[\s\S]*createWavespeedModerationProvider/,
  'moderation factory must create Wavespeed only for the Wavespeed provider'
);
assert.match(
  moderationService,
  /checkType: 'config'[\s\S]*providerContext\.createProvider\(\)/,
  'provider creation and config validation must run through moderation error handling'
);

assert.match(
  moderationService,
  /if\s*\(\s*providerName\s*===\s*'sightengine'\s*\)[\s\S]*?provider:\s*'sightengine'/,
  'when MODERATION_PROVIDER is sightengine, Wavespeed provider must not be created or called'
);

assert.match(
  moderationService,
  /if\s*\(\s*providerName\s*===\s*'wavespeed'\s*\)[\s\S]*?provider:\s*'wavespeed'/,
  'when MODERATION_PROVIDER is wavespeed, Sightengine provider must not be created or called'
);

assert.doesNotMatch(
  moderationService,
  /wavespeed[\s\S]{0,100}fallback[\s\S]{0,100}sightengine|sightengine[\s\S]{0,100}fallback[\s\S]{0,100}wavespeed/,
  'Wavespeed and Sightengine must not do automatic fallback or simultaneous moderation'
);

const wavespeedSource = readSource('src/extensions/moderation/wavespeed.ts');
assert.equal(
  wavespeedSource.includes('checkVideoUrl'),
  true,
  'Wavespeed provider must implement checkVideoUrl'
);
assert.match(
  moderationService,
  /moderation_output_video_provider/,
  'output video moderation provider override must be supported'
);
assert.match(
  moderationService,
  /mediaType\s*!==\s*AIMediaType\.VIDEO[\s\S]*defaultProviderName[\s\S]*moderation_output_video_provider/,
  'output video provider override must only apply to video output moderation'
);

assert.match(
  moderationService,
  /AITaskStatus\.MODERATION_BLOCKED/,
  'Wavespeed block must map to MODERATION_BLOCKED task status'
);

assert.doesNotMatch(
  moderationService,
  /createModerationBlockedTaskPayload[\s\S]{0,300}raw/,
  'moderation blocked payload must not contain raw provider output or categories'
);

console.log('ai moderation route contract checks passed.');
