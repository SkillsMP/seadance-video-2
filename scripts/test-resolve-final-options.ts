import assert from 'node:assert/strict';

import { MODELS, type ModelEntry } from '../src/config/ai/models';
import { resolveFinalOptions } from '../src/config/ai/options';
import { resolveVideoGenerationFeatureFlags } from '../src/config/ai/video-feature-flags';
import {
  buildVideoGenerationOptions,
  getVideoControlEntries,
  normalizeVideoControlValues,
} from '../src/shared/blocks/generator/video-controls';

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

const textEntry = findEnabledModel('seedance-2-fast', 'text-to-video');
const textScene = 'text-to-video';

assert.deepEqual(
  resolveVideoGenerationFeatureFlags({
    ENABLE_DYNAMIC_VIDEO_PRICING: 'true',
    ENABLE_VIDEO_RESOLUTION_CONTROL: 'false',
  }),
  {
    dynamicVideoPricingEnabled: true,
    videoResolutionControlEnabled: false,
  }
);
assert.deepEqual(
  resolveVideoGenerationFeatureFlags({
    ENABLE_DYNAMIC_VIDEO_PRICING: 'true',
    ENABLE_VIDEO_RESOLUTION_CONTROL: 'true',
  }),
  {
    dynamicVideoPricingEnabled: true,
    videoResolutionControlEnabled: true,
  }
);
assert.deepEqual(
  resolveVideoGenerationFeatureFlags({
    ENABLE_DYNAMIC_VIDEO_PRICING: 'false',
    ENABLE_VIDEO_RESOLUTION_CONTROL: 'true',
  }),
  {
    dynamicVideoPricingEnabled: false,
    videoResolutionControlEnabled: false,
  }
);

assert.deepEqual(textEntry.enforced?.[textScene], {
  generate_audio: false,
});
assert.deepEqual(textEntry.controls?.[textScene]?.resolution?.options, [
  '480p',
  '720p',
]);

const openControlEntries = getVideoControlEntries({
  entry: textEntry,
  scene: textScene,
  allowResolutionControl: true,
});
assert.deepEqual(
  openControlEntries.map(([name]) => name),
  ['duration', 'aspect_ratio', 'resolution']
);
const openControlValues = normalizeVideoControlValues({
  currentValues: {
    duration: '10',
    aspect_ratio: '9:16',
    resolution: '720p',
  },
  controlEntries: openControlEntries,
});
assert.deepEqual(openControlValues, {
  duration: '10',
  aspect_ratio: '9:16',
  resolution: '720p',
});
assert.deepEqual(
  buildVideoGenerationOptions({
    dynamicVideoPricingEnabled: true,
    controlEntries: openControlEntries,
    selectedControlValues: openControlValues,
  }),
  {
    duration: 10,
    aspect_ratio: '9:16',
    resolution: '720p',
  }
);

const lockedControlEntries = getVideoControlEntries({
  entry: textEntry,
  scene: textScene,
  allowResolutionControl: false,
});
assert.deepEqual(
  lockedControlEntries.map(([name]) => name),
  ['duration', 'aspect_ratio']
);
assert.deepEqual(
  buildVideoGenerationOptions({
    dynamicVideoPricingEnabled: true,
    controlEntries: lockedControlEntries,
    selectedControlValues: openControlValues,
  }),
  {
    duration: 10,
    aspect_ratio: '9:16',
  }
);
assert.deepEqual(
  buildVideoGenerationOptions({
    dynamicVideoPricingEnabled: false,
    controlEntries: openControlEntries,
    selectedControlValues: openControlValues,
  }),
  {}
);

const controlledOptions = resolveFinalOptions({
  mediaType: 'video',
  scene: textScene,
  entry: textEntry,
  options: {
    duration: 10,
    aspect_ratio: '9:16',
    resolution: '720p',
    generate_audio: true,
  },
  allowControlOptions: true,
  allowResolutionControl: true,
});

assert.equal(controlledOptions.duration, 10);
assert.equal(controlledOptions.aspect_ratio, '9:16');
assert.equal(controlledOptions.resolution, '720p');
assert.equal(controlledOptions.generate_audio, false);
assert.equal(controlledOptions.inputBilling, 'no-video-input');

const resolutionLockedOptions = resolveFinalOptions({
  mediaType: 'video',
  scene: textScene,
  entry: textEntry,
  options: {
    duration: 10,
    aspect_ratio: '9:16',
    resolution: '720p',
  },
  allowControlOptions: true,
  allowResolutionControl: false,
});

assert.equal(resolutionLockedOptions.duration, 10);
assert.equal(resolutionLockedOptions.aspect_ratio, '9:16');
assert.equal(resolutionLockedOptions.resolution, '480p');

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
assert.equal(ignoredInvalidOptions.resolution, '480p');

const videoInputEntry = findEnabledModel('seedance-2-fast', 'video-to-video');
assert.deepEqual(
  videoInputEntry.controls?.['video-to-video']?.resolution?.options,
  ['480p']
);
const videoInputControlEntries = getVideoControlEntries({
  entry: videoInputEntry,
  scene: 'video-to-video',
  allowResolutionControl: true,
});
assert.deepEqual(
  normalizeVideoControlValues({
    currentValues: openControlValues,
    controlEntries: videoInputControlEntries,
  }),
  {
    duration: '10',
    aspect_ratio: '9:16',
    resolution: '480p',
  }
);
assert.throws(
  () =>
    resolveFinalOptions({
      mediaType: 'video',
      scene: 'video-to-video',
      entry: videoInputEntry,
      options: {
        resolution: '720p',
      },
      allowControlOptions: true,
      allowResolutionControl: true,
    }),
  /unsupported generation option: resolution/
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
assert.equal(videoInputOptions.resolution, '480p');

console.log('resolveFinalOptions checks passed.');
