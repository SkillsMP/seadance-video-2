import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { MODELS, type ModelEntry } from '../src/config/ai/models';
import { resolveFinalOptions } from '../src/config/ai/options';

function findEnabledModel(family: string, scene: string): ModelEntry {
  const entry = MODELS.find(
    (model) =>
      model.enabled && model.family === family && model.scenes.includes(scene)
  );

  if (!entry) {
    throw new Error(`missing enabled model fixture: ${family}/${scene}`);
  }

  return entry;
}

const textEntry = findEnabledModel('seedance-2-fast-480p', 'text-to-video');
const textScene = 'text-to-video';

assert.deepEqual(textEntry.enforced?.[textScene], {
  generate_audio: false,
});

const controlledOptions = resolveFinalOptions({
  mediaType: 'video',
  scene: textScene,
  entry: textEntry,
  options: {
    duration: 10,
    aspect_ratio: '9:16',
    resolution: '1080p',
    generate_audio: true,
  },
  allowControlOptions: true,
});

assert.equal(controlledOptions.duration, 10);
assert.equal(controlledOptions.aspect_ratio, '9:16');
assert.equal(controlledOptions.resolution, '480p');
assert.equal(controlledOptions.generate_audio, false);
assert.equal(controlledOptions.inputBilling, 'no-video-input');

const fallbackOptions = resolveFinalOptions({
  mediaType: 'video',
  scene: textScene,
  entry: textEntry,
  options: {
    duration: 10,
    aspect_ratio: '9:16',
    resolution: '1080p',
    unknown_option: 'ignored',
  },
  allowControlOptions: false,
});

assert.equal(fallbackOptions.duration, 5);
assert.equal(fallbackOptions.aspect_ratio, '16:9');
assert.equal(fallbackOptions.resolution, '480p');
assert.equal(fallbackOptions.generate_audio, false);
assert.equal('unknown_option' in fallbackOptions, false);

assert.throws(
  () =>
    resolveFinalOptions({
      mediaType: 'video',
      scene: textScene,
      entry: textEntry,
      options: { duration: 16 },
      allowControlOptions: true,
    }),
  /unsupported generation option: duration/
);

const ignoredInvalidOptions = resolveFinalOptions({
  mediaType: 'video',
  scene: textScene,
  entry: textEntry,
  options: { duration: 16, aspect_ratio: '2:1' },
  allowControlOptions: false,
});

assert.equal(ignoredInvalidOptions.duration, 5);
assert.equal(ignoredInvalidOptions.aspect_ratio, '16:9');

const videoInputEntry = findEnabledModel(
  'seedance-2-fast-480p-video-input',
  'video-to-video'
);
const videoInputOptions = resolveFinalOptions({
  mediaType: 'video',
  scene: 'video-to-video',
  entry: videoInputEntry,
  options: {
    video_input: [' https://example.com/reference.mp4 '],
    duration: 10,
  },
  allowControlOptions: false,
});

assert.deepEqual(videoInputOptions.video_input, [
  'https://example.com/reference.mp4',
]);
assert.equal(videoInputOptions.duration, 5);
assert.equal(videoInputOptions.aspect_ratio, '16:9');

const generateRoute = readFileSync(
  join(process.cwd(), 'src/app/api/ai/generate/route.ts'),
  'utf8'
);
assert.equal(generateRoute.includes('allowControlOptions'), true);

console.log('resolveFinalOptions checks passed.');
