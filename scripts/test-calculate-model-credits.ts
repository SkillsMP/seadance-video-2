import assert from 'node:assert/strict';

import {
  calculateModelCredits,
  getGenerationCreditCost,
} from '../src/config/ai/credit-costs';
import {
  assertGenerationPricingConsistency,
  resolveGenerationPricingSnapshot,
} from '../src/config/ai/generation-pricing';
import { MODELS, type ModelEntry } from '../src/config/ai/models';

function createEntry(overrides: Partial<ModelEntry> = {}): ModelEntry {
  return {
    mediaType: 'video',
    family: 'test-family',
    value: 'test-model',
    label: 'Test Model',
    provider: 'test-provider',
    scenes: ['text-to-video'],
    enabled: true,
    credits: { 'text-to-video': 999 },
    ...overrides,
  };
}

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

const fixedEntry = createEntry({
  pricing: {
    'text-to-video': {
      mode: 'fixed',
      credits: 42,
    },
  },
});
assert.equal(calculateModelCredits(fixedEntry, 'text-to-video', {}), 42);

const perSecondEntry = createEntry({
  pricing: {
    'text-to-video': {
      mode: 'perSecond',
      creditsPerSecond: 12,
      defaultDuration: 5,
    },
  },
});
assert.equal(
  calculateModelCredits(perSecondEntry, 'text-to-video', { duration: 6 }),
  72
);
assert.equal(calculateModelCredits(perSecondEntry, 'text-to-video', {}), 60);

assert.throws(
  () => calculateModelCredits(fixedEntry, 'video-to-video', {}),
  /invalid pricing scene/
);

assert.throws(
  () => calculateModelCredits(createEntry(), 'text-to-video', {}),
  /missing pricing/
);

assert.throws(
  () =>
    calculateModelCredits(
      createEntry({
        pricing: {
          'text-to-video': {
            mode: 'fixed',
          },
        },
      }),
      'text-to-video',
      {}
    ),
  /invalid fixed pricing/
);

assert.throws(
  () =>
    calculateModelCredits(
      createEntry({
        pricing: {
          'text-to-video': {
            mode: 'fixed',
            credits: 0,
          },
        },
      }),
      'text-to-video',
      {}
    ),
  /invalid fixed pricing/
);

assert.throws(
  () =>
    calculateModelCredits(
      createEntry({
        pricing: {
          'text-to-video': {
            mode: 'perSecond',
            creditsPerSecond: 12,
          },
        },
      }),
      'text-to-video',
      {}
    ),
  /invalid pricing duration/
);

assert.throws(
  () =>
    calculateModelCredits(
      createEntry({
        pricing: {
          'text-to-video': {
            mode: 'perSecond',
            creditsPerSecond: 0,
            defaultDuration: 5,
          },
        },
      }),
      'text-to-video',
      {}
    ),
  /invalid per-second pricing/
);
assert.throws(
  () =>
    calculateModelCredits(
      createEntry({
        defaults: {
          'text-to-video': {
            duration: 5,
            resolution: '720p',
          },
        },
        pricing: {
          'text-to-video': {
            mode: 'perSecond',
            defaultDuration: 5,
            byResolution: {
              '480p': { creditsPerSecond: 12, availability: 'enabled' },
            },
          },
        },
      }),
      'text-to-video',
      { duration: 5, resolution: '720p' }
    ),
  /missing pricing resolution/
);

assert.equal(
  calculateModelCredits(
    findEnabledModel('seedance-2-fast', 'text-to-video'),
    'text-to-video',
    { duration: 5 }
  ),
  60
);
assert.equal(
  calculateModelCredits(
    findEnabledModel('seedance-2-fast', 'text-to-video'),
    'text-to-video',
    { duration: 10 }
  ),
  120
);
assert.equal(
  calculateModelCredits(
    findEnabledModel('seedance-2-fast', 'text-to-video'),
    'text-to-video',
    { duration: 5, resolution: '720p' }
  ),
  120
);
assert.equal(
  calculateModelCredits(
    findEnabledModel('seedance-2-fast', 'text-to-video'),
    'text-to-video',
    { duration: 10, resolution: '720p' }
  ),
  240
);
assert.equal(
  calculateModelCredits(
    findEnabledModel('seedance-2-fast', 'video-to-video'),
    'video-to-video',
    { duration: 5 }
  ),
  35
);
assert.equal(
  calculateModelCredits(
    findEnabledModel('seedance-2-fast', 'video-to-video'),
    'video-to-video',
    { duration: 10 }
  ),
  70
);
assert.throws(
  () =>
    calculateModelCredits(
      findEnabledModel('seedance-2-fast', 'video-to-video'),
      'video-to-video',
      { duration: 5, resolution: '720p' }
    ),
  /unavailable pricing resolution/
);

const textEntry = findEnabledModel('seedance-2-fast', 'text-to-video');
const lockedResolutionSnapshot = resolveGenerationPricingSnapshot({
  mediaType: 'video',
  scene: 'text-to-video',
  entry: textEntry,
  options: { duration: 10, resolution: '720p' },
  useDynamicVideoPricing: true,
  allowControlOptions: true,
  allowResolutionControl: false,
});

assert.equal(lockedResolutionSnapshot.finalOptions.duration, 10);
assert.equal(lockedResolutionSnapshot.finalOptions.resolution, '480p');
assert.equal(lockedResolutionSnapshot.costCredits, 120);

const staticPricingSnapshot = resolveGenerationPricingSnapshot({
  mediaType: 'video',
  scene: 'text-to-video',
  entry: textEntry,
  options: {
    duration: 10,
    aspect_ratio: '9:16',
    resolution: '720p',
  },
  useDynamicVideoPricing: false,
  allowControlOptions: false,
  allowResolutionControl: false,
});

assert.equal(staticPricingSnapshot.finalOptions.duration, 5);
assert.equal(staticPricingSnapshot.finalOptions.aspect_ratio, '16:9');
assert.equal(staticPricingSnapshot.finalOptions.resolution, '480p');
assert.equal(staticPricingSnapshot.costCredits, 45);

const openResolutionSnapshot = resolveGenerationPricingSnapshot({
  mediaType: 'video',
  scene: 'text-to-video',
  entry: textEntry,
  options: { duration: 10, resolution: '720p' },
  useDynamicVideoPricing: true,
  allowControlOptions: true,
  allowResolutionControl: true,
});

assert.equal(openResolutionSnapshot.finalOptions.resolution, '720p');
assert.equal(openResolutionSnapshot.costCredits, 240);

const sameFallbackEntry: ModelEntry = {
  ...textEntry,
  provider: 'fallback-provider',
  value: 'fallback-model',
};
const sameFallbackSnapshot = resolveGenerationPricingSnapshot({
  mediaType: 'video',
  scene: 'text-to-video',
  entry: sameFallbackEntry,
  options: { duration: 10, resolution: '720p' },
  useDynamicVideoPricing: true,
  allowControlOptions: true,
  allowResolutionControl: false,
});

assert.doesNotThrow(() =>
  assertGenerationPricingConsistency(
    lockedResolutionSnapshot,
    sameFallbackSnapshot
  )
);

const finalOptionsDriftEntry: ModelEntry = {
  ...textEntry,
  provider: 'fallback-provider',
  value: 'fallback-model',
  defaults: {
    ...textEntry.defaults,
    'text-to-video': {
      ...textEntry.defaults?.['text-to-video'],
      aspect_ratio: '9:16',
    },
  },
};
const finalOptionsDriftSnapshot = resolveGenerationPricingSnapshot({
  mediaType: 'video',
  scene: 'text-to-video',
  entry: finalOptionsDriftEntry,
  options: { duration: 10, resolution: '720p' },
  useDynamicVideoPricing: true,
  allowControlOptions: true,
  allowResolutionControl: false,
});

assert.throws(
  () =>
    assertGenerationPricingConsistency(
      lockedResolutionSnapshot,
      finalOptionsDriftSnapshot
    ),
  /generation pricing drift/
);

const costDriftEntry: ModelEntry = {
  ...textEntry,
  provider: 'fallback-provider',
  value: 'fallback-model',
  pricing: {
    ...textEntry.pricing,
    'text-to-video': {
      mode: 'perSecond',
      defaultDuration: 5,
      byResolution: {
        '480p': { creditsPerSecond: 13, availability: 'enabled' },
        '720p': { creditsPerSecond: 24, availability: 'enabled' },
      },
    },
  },
};
const costDriftSnapshot = resolveGenerationPricingSnapshot({
  mediaType: 'video',
  scene: 'text-to-video',
  entry: costDriftEntry,
  options: { duration: 10, resolution: '720p' },
  useDynamicVideoPricing: true,
  allowControlOptions: true,
  allowResolutionControl: false,
});

assert.throws(
  () =>
    assertGenerationPricingConsistency(lockedResolutionSnapshot, costDriftSnapshot),
  /generation pricing drift/
);

assert.equal(
  getGenerationCreditCost({
    mediaType: 'video',
    scene: 'text-to-video',
    family: 'seedance-2-fast',
  }),
  45
);
assert.equal(
  getGenerationCreditCost({
    mediaType: 'video',
    scene: 'video-to-video',
    family: 'seedance-2-fast',
  }),
  45
);

console.log('calculateModelCredits checks passed.');
