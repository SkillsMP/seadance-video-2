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
const refreshPage = readSource(
  'src/app/[locale]/(landing)/activity/ai-tasks/[id]/refresh/page.tsx'
);
const imageGenerator = readSource('src/shared/blocks/generator/image.tsx');
const videoGenerator = readSource('src/shared/blocks/generator/video.tsx');
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
  'AITaskStatus.MODERATION_FAILED',
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

for (const status of [
  'AITaskStatus.SUCCESS',
  'AITaskStatus.FAILED',
  'AITaskStatus.CANCELED',
  'AITaskStatus.MODERATION_BLOCKED',
  'AITaskStatus.MODERATION_FAILED',
]) {
  assert.match(
    refreshPage,
    new RegExp(status.replace('.', '\\.')),
    `refresh page terminal statuses must include ${status}`
  );
}
assertBefore(
  refreshPage,
  'if (TERMINAL_TASK_STATUSES.has(task.status))',
  'const aiService = await getAIService()',
  'refresh page must short-circuit terminal tasks before requesting provider'
);
assertBefore(
  refreshPage,
  'await applyGenerationOutputModeration({',
  'await updateAITaskById(task.id, updateAITask)',
  'refresh page must moderate provider success output before persisting task data'
);
assert.match(
  refreshPage,
  /task\.userId !== user\.id/,
  'refresh page must enforce task ownership before provider query'
);
assert.match(
  refreshPage,
  /mediaType: task\.mediaType,[\s\S]*model: task\.model/,
  'refresh page provider query must pass mediaType and model context'
);
assert.doesNotMatch(
  refreshPage,
  /status:\s*result\.taskStatus/,
  'refresh page must persist moderated status, not raw provider status'
);

assert.match(
  aiTaskModel,
  /updateAITask\.status === AITaskStatus\.FAILED && updateAITask\.creditId/,
  'automatic refund must be tied only to provider failed status'
);
assert.doesNotMatch(
  aiTaskModel,
  /MODERATION_(?:BLOCKED|FAILED)[\s\S]{0,200}credit|credit[\s\S]{0,200}MODERATION_(?:BLOCKED|FAILED)/,
  'moderation terminal statuses must not be coupled to automatic refund logic'
);

assert.match(
  moderationService,
  /function createModerationBlockedTaskPayload\(\)[\s\S]*?createSafeTaskPayload\(\s*AITaskStatus\.MODERATION_BLOCKED,\s*CONTENT_POLICY_VIOLATION_CODE,\s*GENERATED_CONTENT_SAFETY_MESSAGE\s*\)/,
  'blocked output must use a sanitized moderation_blocked payload'
);
assert.match(
  moderationService,
  /error instanceof ContentPolicyViolationError[\s\S]*?return createModerationBlockedTaskPayload\(\);[\s\S]*?error instanceof ModerationServiceUnavailableError[\s\S]*?return createModerationFailedTaskPayload\(\);/,
  'content policy violations must not return original provider output'
);
assert.match(
  moderationService,
  /function createModerationFailedTaskPayload\(\)[\s\S]*?createSafeTaskPayload\(\s*AITaskStatus\.MODERATION_FAILED,\s*MODERATION_SERVICE_UNAVAILABLE_CODE,\s*GENERATED_CONTENT_MODERATION_FAILED_MESSAGE\s*\)/,
  'moderation provider errors must use a sanitized moderation_failed payload'
);
assert.match(
  moderationService,
  /const failClosed = true;[\s\S]*?createModerationProviderContext\(configs, mediaType\)/,
  'output moderation must fail closed even when global moderation fail-open is configured'
);
assert.match(
  moderationService,
  /throw new ModerationServiceUnavailableError\(unavailableMessage\)/,
  'provider errors must not be converted into content policy violations'
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

function assertFrontendModerationCopy(source: string, label: string): void {
  assert.match(
    source,
    /const GENERATED_CONTENT_SAFETY_MESSAGE =\s*'This generated result violates our content safety policy and cannot be displayed\. Please revise your prompt and try again\.'/,
    `${label} must keep content policy violation copy distinct`
  );
  assert.match(
    source,
    /const GENERATED_CONTENT_MODERATION_FAILED_MESSAGE =\s*'Content moderation is temporarily unavailable\. The generated result cannot be verified or displayed\.'/,
    `${label} must keep moderation service unavailable copy distinct`
  );
  assert.match(
    source,
    /currentStatus === AITaskStatus\.MODERATION_BLOCKED[\s\S]{0,180}toast\.error\(GENERATED_CONTENT_SAFETY_MESSAGE\)/,
    `${label} polling blocked status must show content policy copy`
  );
  assert.match(
    source,
    /currentStatus === AITaskStatus\.MODERATION_FAILED[\s\S]{0,180}toast\.error\(GENERATED_CONTENT_MODERATION_FAILED_MESSAGE\)/,
    `${label} polling failed status must show unavailable copy`
  );
  assert.match(
    source,
    /data\.status === AITaskStatus\.MODERATION_BLOCKED[\s\S]{0,180}toast\.error\(GENERATED_CONTENT_SAFETY_MESSAGE\)/,
    `${label} immediate blocked status must show content policy copy`
  );
  assert.match(
    source,
    /data\.status === AITaskStatus\.MODERATION_FAILED[\s\S]{0,180}toast\.error\(GENERATED_CONTENT_MODERATION_FAILED_MESSAGE\)/,
    `${label} immediate failed status must show unavailable copy`
  );
}

assertFrontendModerationCopy(imageGenerator, 'image generator');
assertFrontendModerationCopy(videoGenerator, 'video generator');

console.log('ai moderation route contract checks passed.');
