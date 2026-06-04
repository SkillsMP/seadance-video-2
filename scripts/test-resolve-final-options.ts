import assert from 'node:assert/strict';

import { MODELS, type ModelEntry } from '../src/config/ai/models';
import { resolveFinalOptions } from '../src/config/ai/options';
import {
  buildGenerationOptions,
  getGenerationControlEntries,
  normalizeGenerationControlValues,
} from '../src/shared/blocks/generator/generation-controls';

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
const imageEntry = findEnabledModel('seedance-2-fast', 'image-to-video');
const nanoBananaProTextEntry = findEnabledModel(
  'nano-banana-pro',
  'text-to-image'
);
const nanoBanana2TextEntry = findEnabledModel(
  'nano-banana-2',
  'text-to-image'
);
const legacyNanoBananaTextEntry = findEnabledModel(
  'nano-banana',
  'text-to-image'
);
const standardTextEntry = findEnabledModel(
  'seedance-2-standard',
  'text-to-video'
);
const standardVideoInputEntry = findEnabledModel(
  'seedance-2-standard',
  'video-to-video'
);

assert.equal(
  MODELS.some((model) =>
    /seedance-2-(?:fast|standard)-\d{3,4}p(?:-|$)|seedance-2-(?:fast|standard).*video-input/.test(
      model.family
    )
  ),
  false
);

assert.equal(textEntry.defaults?.[textScene]?.generate_audio, false);
assert.deepEqual(textEntry.controls?.[textScene]?.generate_audio, {
  type: 'boolean',
  default: false,
  options: [false, true],
  label: 'Generate Audio',
  ui: 'switch',
  order: 40,
});
assert.deepEqual(textEntry.controls?.[textScene]?.resolution?.options, [
  '480p',
  '720p',
]);
assert.deepEqual(imageEntry.controls?.['image-to-video']?.resolution?.options, [
  '480p',
  '720p',
]);
assert.deepEqual(
  standardTextEntry.controls?.['text-to-video']?.resolution?.options,
  ['480p', '720p', '1080p']
);
assert.deepEqual(
  standardVideoInputEntry.controls?.['video-to-video']?.resolution?.options,
  ['480p', '720p', '1080p']
);

const openControlEntries = getGenerationControlEntries({
  entry: textEntry,
  scene: textScene,
});
assert.deepEqual(
  openControlEntries.map(([name]) => name),
  ['duration', 'aspect_ratio', 'resolution', 'generate_audio']
);
const openControlValues = normalizeGenerationControlValues({
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
  generate_audio: 'false',
});
assert.deepEqual(
  buildGenerationOptions({
    controlEntries: openControlEntries,
    selectedControlValues: openControlValues,
  }),
  {
    duration: 10,
    aspect_ratio: '9:16',
    resolution: '720p',
    generate_audio: false,
  }
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
});

assert.equal(controlledOptions.duration, 10);
assert.equal(controlledOptions.aspect_ratio, '9:16');
assert.equal(controlledOptions.resolution, '720p');
assert.equal(controlledOptions.generate_audio, true);
assert.equal(controlledOptions.inputBilling, 'no-video-input');

const imageOptions = resolveFinalOptions({
  mediaType: 'video',
  scene: 'image-to-video',
  entry: imageEntry,
  options: {
    image_input: [' https://example.com/reference.png '],
    duration: 6,
    resolution: '720p',
  },
  allowControlOptions: true,
});

assert.deepEqual(imageOptions.image_input, [
  'https://example.com/reference.png',
]);
assert.equal(imageOptions.duration, 6);
assert.equal(imageOptions.resolution, '720p');
assert.equal(imageOptions.inputBilling, 'no-video-input');

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
assert.equal(ignoredInvalidOptions.generate_audio, false);

const videoInputEntry = findEnabledModel('seedance-2-fast', 'video-to-video');
assert.deepEqual(
  videoInputEntry.controls?.['video-to-video']?.resolution?.options,
  ['480p', '720p']
);
const videoInputControlEntries = getGenerationControlEntries({
  entry: videoInputEntry,
  scene: 'video-to-video',
});
assert.deepEqual(
  normalizeGenerationControlValues({
    currentValues: openControlValues,
    controlEntries: videoInputControlEntries,
  }),
  {
    duration: '10',
    aspect_ratio: '9:16',
    resolution: '720p',
    generate_audio: 'false',
  }
);
assert.deepEqual(
  normalizeGenerationControlValues({
    currentValues: {
      duration: '15',
      aspect_ratio: '9:16',
      resolution: '1080p',
    },
    controlEntries: videoInputControlEntries,
  }),
  {
    duration: '5',
    aspect_ratio: '9:16',
    resolution: '480p',
    generate_audio: 'false',
  }
);
const videoInputOpenOptions = resolveFinalOptions({
  mediaType: 'video',
  scene: 'video-to-video',
  entry: videoInputEntry,
  options: {
    resolution: '720p',
    duration: 10,
  },
  allowControlOptions: true,
});
assert.equal(videoInputOpenOptions.resolution, '720p');
assert.equal(videoInputOpenOptions.duration, 10);
assert.equal(videoInputOpenOptions.generate_audio, false);
assert.throws(
  () =>
    resolveFinalOptions({
      mediaType: 'video',
      scene: 'video-to-video',
      entry: videoInputEntry,
      options: {
        resolution: '1080p',
      },
      allowControlOptions: true,
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
assert.equal(videoInputOptions.generate_audio, false);

const nanoBananaProControlEntries = getGenerationControlEntries({
  entry: nanoBananaProTextEntry,
  scene: 'text-to-image',
});
assert.deepEqual(
  nanoBananaProControlEntries.map(([name]) => name),
  ['aspect_ratio', 'resolution', 'output_format']
);
assert.deepEqual(
  nanoBananaProTextEntry.controls?.['text-to-image']?.output_format?.options,
  ['png', 'jpg']
);
assert.deepEqual(nanoBananaProTextEntry.defaults?.['text-to-image'], {
  aspect_ratio: '1:1',
  resolution: '2K',
  output_format: 'png',
});
assert.deepEqual(
  buildGenerationOptions({
    controlEntries: nanoBananaProControlEntries,
    selectedControlValues: {
      aspect_ratio: '16:9',
      resolution: '4K',
      output_format: 'jpg',
    },
  }),
  {
    aspect_ratio: '16:9',
    resolution: '4K',
    output_format: 'jpg',
  }
);

const nanoBananaProImageOptions = resolveFinalOptions({
  mediaType: 'image',
  scene: 'text-to-image',
  entry: nanoBananaProTextEntry,
  options: {
    aspect_ratio: '16:9',
    resolution: '4K',
    output_format: 'jpg',
    unknown_option: 'ignored',
  },
  allowControlOptions: true,
});
assert.equal(nanoBananaProImageOptions.aspect_ratio, '16:9');
assert.equal(nanoBananaProImageOptions.resolution, '4K');
assert.equal(nanoBananaProImageOptions.output_format, 'jpg');
assert.equal('unknown_option' in nanoBananaProImageOptions, false);

assert.deepEqual(
  nanoBanana2TextEntry.controls?.['text-to-image']?.resolution?.options,
  ['2K']
);
assert.deepEqual(
  nanoBanana2TextEntry.controls?.['text-to-image']?.output_format?.options,
  ['png', 'jpg']
);
assert.deepEqual(nanoBanana2TextEntry.defaults?.['text-to-image'], {
  aspect_ratio: '1:1',
  resolution: '2K',
  output_format: 'png',
});

assert.equal(
  legacyNanoBananaTextEntry.controls?.['text-to-image']?.resolution,
  undefined
);
assert.equal(
  legacyNanoBananaTextEntry.controls?.['text-to-image']?.output_format,
  undefined
);
const legacyNanoBananaOptions = resolveFinalOptions({
  mediaType: 'image',
  scene: 'text-to-image',
  entry: legacyNanoBananaTextEntry,
  options: {
    aspect_ratio: '16:9',
    resolution: '4K',
    output_format: 'png',
  },
  allowControlOptions: true,
});
assert.equal(legacyNanoBananaOptions.aspect_ratio, '16:9');
assert.equal('resolution' in legacyNanoBananaOptions, false);
assert.equal('output_format' in legacyNanoBananaOptions, false);

console.log('resolveFinalOptions checks passed.');
