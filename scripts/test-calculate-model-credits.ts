import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  calculateModelCredits,
  getGenerationCreditCost,
} from '../src/config/ai/credit-costs';
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

assert.equal(
  calculateModelCredits(
    findEnabledModel('seedance-2-fast-480p', 'text-to-video'),
    'text-to-video',
    { duration: 5 }
  ),
  60
);
assert.equal(
  calculateModelCredits(
    findEnabledModel('seedance-2-fast-720p', 'text-to-video'),
    'text-to-video',
    { duration: 5 }
  ),
  120
);
assert.equal(
  calculateModelCredits(
    findEnabledModel('seedance-2-fast-480p-video-input', 'video-to-video'),
    'video-to-video',
    { duration: 5 }
  ),
  35
);

assert.equal(
  getGenerationCreditCost({
    mediaType: 'video',
    scene: 'text-to-video',
    family: 'seedance-2-fast-480p',
  }),
  45
);
assert.equal(
  getGenerationCreditCost({
    mediaType: 'video',
    scene: 'text-to-video',
    family: 'seedance-2-fast-720p',
  }),
  90
);
assert.equal(
  getGenerationCreditCost({
    mediaType: 'video',
    scene: 'video-to-video',
    family: 'seedance-2-fast-480p-video-input',
  }),
  45
);

const generateRoute = readFileSync(
  join(process.cwd(), 'src/app/api/ai/generate/route.ts'),
  'utf8'
);
assert.equal(generateRoute.includes('calculateModelCredits'), true);

console.log('calculateModelCredits checks passed.');
