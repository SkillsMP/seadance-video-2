import assert from 'node:assert/strict';

import {
  calculateModelCredits,
  getGenerationCreditCost,
} from '../src/config/ai/credit-costs';
import {
  assertGenerationPricingConsistency,
  resolveGenerationPricingSnapshot,
} from '../src/config/ai/generation-pricing';
import {
  MODELS,
  type ImageResolution,
  type ModelEntry,
  type VideoResolution,
} from '../src/config/ai/models';

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

const fixedImageResolutionEntry = createEntry({
  mediaType: 'image',
  scenes: ['text-to-image'],
  credits: { 'text-to-image': 20 },
  pricing: {
    'text-to-image': {
      mode: 'fixed',
      credits: 20,
      byImageResolution: {
        '1K': { credits: 20, availability: 'enabled' },
        '2K': { credits: 20, availability: 'enabled' },
        '4K': { credits: 30, availability: 'candidate' },
      },
    },
  },
});
assert.equal(
  calculateModelCredits(fixedImageResolutionEntry, 'text-to-image', {
    resolution: '1K',
  }),
  20
);
assert.throws(
  () =>
    calculateModelCredits(
      fixedImageResolutionEntry,
      'text-to-image',
      {}
    ),
  /missing pricing image resolution/
);
assert.throws(
  () =>
    calculateModelCredits(fixedImageResolutionEntry, 'text-to-image', {
      resolution: '3K',
    }),
  /invalid pricing image resolution/
);
assert.throws(
  () =>
    calculateModelCredits(fixedImageResolutionEntry, 'text-to-image', {
      resolution: '4K',
    }),
  /unavailable pricing image resolution/
);
assert.throws(
  () =>
    calculateModelCredits(
      createEntry({
        mediaType: 'image',
        scenes: ['text-to-image'],
        credits: { 'text-to-image': 20 },
        pricing: {
          'text-to-image': {
            mode: 'fixed',
            credits: 20,
            byImageResolution: {
              '1K': { credits: 0, availability: 'enabled' },
            },
          },
        },
      }),
      'text-to-image',
      { resolution: '1K' }
    ),
  /invalid fixed image resolution pricing/
);

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
assert.equal(
  calculateModelCredits(
    findEnabledModel('seedance-2-fast', 'video-to-video'),
    'video-to-video',
    { duration: 5, resolution: '720p' }
  ),
  75
);

const seedancePricingMatrix = [
  {
    family: 'seedance-2-fast',
    scenes: ['text-to-video', 'image-to-video'],
    inputBilling: 'no-video-input',
    byResolution: {
      '480p': 12,
      '720p': 24,
    },
  },
  {
    family: 'seedance-2-fast',
    scenes: ['video-to-video'],
    inputBilling: 'video-input',
    byResolution: {
      '480p': 7,
      '720p': 15,
    },
  },
  {
    family: 'seedance-2-standard',
    scenes: ['text-to-video', 'image-to-video'],
    inputBilling: 'no-video-input',
    byResolution: {
      '480p': 14,
      '720p': 30,
      '1080p': 75,
    },
  },
  {
    family: 'seedance-2-standard',
    scenes: ['video-to-video'],
    inputBilling: 'video-input',
    byResolution: {
      '480p': 9,
      '720p': 18,
      '1080p': 45,
    },
  },
] as const;

let openedSeedanceMatrixRows = 0;

for (const row of seedancePricingMatrix) {
  const resolutionEntries = Object.entries(row.byResolution);
  openedSeedanceMatrixRows += resolutionEntries.length;

  for (const scene of row.scenes) {
    const entry = findEnabledModel(row.family, scene);
    const resolutionControlOptions =
      entry.controls?.[scene]?.resolution?.options ?? [];

    assert.equal(entry.enabled, true);
    assert.equal(entry.skuAttributes?.[scene]?.inputBilling, row.inputBilling);

    for (const [resolution, creditsPerSecond] of resolutionEntries) {
      const typedResolution = resolution as VideoResolution;
      const resolutionPricing =
        entry.pricing?.[scene]?.byResolution?.[typedResolution];

      assert.equal(resolutionPricing?.availability, 'enabled');
      assert.equal(resolutionPricing?.creditsPerSecond, creditsPerSecond);
      assert.equal(resolutionControlOptions.includes(typedResolution), true);
      assert.equal(
        calculateModelCredits(entry, scene, {
          duration: 5,
          resolution: typedResolution,
        }),
        creditsPerSecond * 5
      );

      const snapshot = resolveGenerationPricingSnapshot({
        mediaType: 'video',
        scene,
        entry,
        options: {
          duration: 5,
          resolution: typedResolution,
        },
      });

      assert.equal(snapshot.finalOptions.resolution, typedResolution);
      assert.equal(snapshot.costCredits, creditsPerSecond * 5);
    }
  }
}

assert.equal(openedSeedanceMatrixRows, 10);
assert.equal(
  MODELS.some((model) =>
    /seedance-2-(?:fast|standard)-\d{3,4}p(?:-|$)|seedance-2-(?:fast|standard).*video-input/.test(
      model.family
    )
  ),
  false
);

const imageResolutionPricingMatrix = [
  {
    family: 'nano-banana-pro',
    scenes: ['text-to-image', 'image-to-image'],
    byImageResolution: {
      '1K': 20,
      '2K': 20,
      '4K': 30,
    },
  },
  {
    family: 'nano-banana-2',
    scenes: ['text-to-image', 'image-to-image'],
    byImageResolution: {
      '2K': 15,
    },
  },
] as const;

for (const row of imageResolutionPricingMatrix) {
  for (const scene of row.scenes) {
    const entry = findEnabledModel(row.family, scene);
    const resolutionPricing = entry.pricing?.[scene]?.byImageResolution ?? {};

    assert.deepEqual(
      Object.keys(resolutionPricing).sort(),
      Object.keys(row.byImageResolution).sort()
    );

    for (const [resolution, credits] of Object.entries(
      row.byImageResolution
    )) {
      const typedResolution = resolution as ImageResolution;
      const optionPricing = resolutionPricing[typedResolution];

      assert.equal(optionPricing?.availability, 'enabled');
      assert.equal(optionPricing?.credits, credits);
      assert.equal(
        calculateModelCredits(entry, scene, {
          resolution: typedResolution,
        }),
        credits
      );
    }
  }
}

const legacyNanoBananaEntry = findEnabledModel(
  'nano-banana',
  'text-to-image'
);
assert.equal(
  calculateModelCredits(legacyNanoBananaEntry, 'text-to-image', {}),
  5
);
assert.equal(
  legacyNanoBananaEntry.pricing?.['text-to-image']?.byImageResolution,
  undefined
);

const legacyNanoBananaEditEntry = findEnabledModel(
  'nano-banana',
  'image-to-image'
);
assert.equal(
  calculateModelCredits(legacyNanoBananaEditEntry, 'image-to-image', {}),
  5
);
assert.equal(
  legacyNanoBananaEditEntry.pricing?.['image-to-image']?.byImageResolution,
  undefined
);

const imageToVideoEntry = findEnabledModel('seedance-2-fast', 'image-to-video');
const imageToVideoSnapshot = resolveGenerationPricingSnapshot({
  mediaType: 'video',
  scene: 'image-to-video',
  entry: imageToVideoEntry,
  options: {
    image_input: [' https://example.com/reference.png '],
    duration: 6,
    resolution: '720p',
  },
});

assert.deepEqual(imageToVideoSnapshot.finalOptions.image_input, [
  'https://example.com/reference.png',
]);
assert.equal(imageToVideoSnapshot.finalOptions.inputBilling, 'no-video-input');
assert.equal(imageToVideoSnapshot.finalOptions.resolution, '720p');
assert.equal(imageToVideoSnapshot.costCredits, 144);

const textEntry = findEnabledModel('seedance-2-fast', 'text-to-video');
const textVideoSnapshot = resolveGenerationPricingSnapshot({
  mediaType: 'video',
  scene: 'text-to-video',
  entry: textEntry,
  options: { duration: 10, resolution: '720p' },
});

assert.equal(textVideoSnapshot.finalOptions.duration, 10);
assert.equal(textVideoSnapshot.finalOptions.resolution, '720p');
assert.equal(textVideoSnapshot.costCredits, 240);

const openResolutionSnapshot = resolveGenerationPricingSnapshot({
  mediaType: 'video',
  scene: 'text-to-video',
  entry: textEntry,
  options: { duration: 10, resolution: '720p' },
});

assert.equal(openResolutionSnapshot.finalOptions.resolution, '720p');
assert.equal(openResolutionSnapshot.costCredits, 240);

const audioEnabledSnapshot = resolveGenerationPricingSnapshot({
  mediaType: 'video',
  scene: 'text-to-video',
  entry: textEntry,
  options: { duration: 10, resolution: '720p', generate_audio: true },
});

assert.equal(audioEnabledSnapshot.finalOptions.generate_audio, true);
assert.equal(audioEnabledSnapshot.costCredits, 240);

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
});

assert.doesNotThrow(() =>
  assertGenerationPricingConsistency(
    textVideoSnapshot,
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
});

assert.throws(
  () =>
    assertGenerationPricingConsistency(
      textVideoSnapshot,
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
        '720p': { creditsPerSecond: 25, availability: 'enabled' },
      },
    },
  },
};
const costDriftSnapshot = resolveGenerationPricingSnapshot({
  mediaType: 'video',
  scene: 'text-to-video',
  entry: costDriftEntry,
  options: { duration: 10, resolution: '720p' },
});

assert.throws(
  () =>
    assertGenerationPricingConsistency(
      textVideoSnapshot,
      costDriftSnapshot
    ),
  /generation pricing drift/
);

assert.equal(
  getGenerationCreditCost({
    mediaType: 'music',
    scene: 'text-to-music',
  }),
  10
);
assert.equal(
  getGenerationCreditCost({
    mediaType: 'music',
  }),
  10
);

console.log('calculateModelCredits checks passed.');
