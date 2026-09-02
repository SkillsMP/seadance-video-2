import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { MODELS, type ModelEntry } from '../src/config/ai/models';
import {
  assertModelInputConstraints,
  resolveFinalOptions,
} from '../src/config/ai/options';
import { KieProvider } from '../src/extensions/ai/kie';
import { AIMediaType, AITaskStatus } from '../src/extensions/ai/types';

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const videoImageInputsSource = readFileSync(
  join(repositoryRoot, 'src/shared/blocks/generator/video-image-inputs.tsx'),
  'utf8'
);

function readVideoFormMessages(locale: 'en' | 'zh') {
  const messages = JSON.parse(
    readFileSync(
      join(
        repositoryRoot,
        `src/config/locale/messages/${locale}/ai/video.json`
      ),
      'utf8'
    )
  );

  return messages.generator.form as Record<string, string>;
}

function assertSourceIncludes(fragment: string) {
  assert.ok(
    videoImageInputsSource.includes(fragment),
    `missing VideoImageInputs contract: ${fragment}`
  );
}

// UI smoke contracts: capability-based mode selection, mounted drafts, and guarded end frame.
[
  'type="single"',
  'value={activeKind}',
  'if (value)',
  'value="frames"',
  'value="reference_images"',
  "selectedKind === 'reference_images'",
  "(!supportsFrames || activeKind !== 'frames') && 'hidden'",
  "(!supportsReferenceImages || activeKind !== 'reference_images') &&",
  'setSelectedKind(activeKind)',
  'disabled={!supportsFrames}',
  'disabled={!supportsEndFrame || isEndFrameLocked}',
  'disabled={!supportsReferenceImages}',
  "'form.upload_start_image_first'",
  "imageModes.includes('first_frame')",
  "imageModes.includes('first_last_frames')",
  "imageModes.includes('reference_images')",
].forEach(assertSourceIncludes);

assert.ok(
  !videoImageInputsSource.includes('only_active_image_mode_used'),
  'engineering-only active-mode copy must stay hidden from users'
);

for (const locale of ['en', 'zh'] as const) {
  const form = readVideoFormMessages(locale);

  for (const key of [
    'image_input',
    'frames',
    'reference_images_mode',
    'start_image',
    'end_image',
    'required',
    'optional',
    'upload_start_image_first',
    'frames_hint',
    'reference_images_hint',
  ]) {
    assert.equal(
      typeof form[key],
      'string',
      `missing ${locale} video form message: ${key}`
    );
    assert.ok(
      form[key].length > 0,
      `empty ${locale} video form message: ${key}`
    );
  }
}

const imageEntry = MODELS.find(
  (model) =>
    model.enabled &&
    model.family === 'seedance-2-fast' &&
    model.scenes.includes('image-to-video')
);
assert.ok(imageEntry, 'missing enabled Seedance 2 Fast image-to-video model');

const minimaxH3TextEntry = MODELS.find(
  (model) => model.value === 'minimax-h3/text-to-video'
);
const minimaxH3ImageEntry = MODELS.find(
  (model) => model.value === 'minimax-h3/image-to-video'
);
assert.ok(minimaxH3TextEntry, 'missing MiniMax H3 text-to-video entry');
assert.ok(minimaxH3ImageEntry, 'missing MiniMax H3 image-to-video entry');
assert.equal(minimaxH3TextEntry.enabled, true);
assert.equal(minimaxH3ImageEntry.enabled, true);
assert.deepEqual(
  minimaxH3TextEntry.controls?.['text-to-video']?.duration?.options,
  [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
);
assert.deepEqual(
  minimaxH3TextEntry.controls?.['text-to-video']?.aspect_ratio?.options,
  ['21:9', '16:9', '4:3', '1:1', '3:4', '9:16']
);
assert.deepEqual(
  minimaxH3TextEntry.controls?.['text-to-video']?.resolution?.options,
  ['768P', '2K']
);
assert.deepEqual(
  minimaxH3ImageEntry.controls?.['image-to-video']?.resolution?.options,
  ['768P', '2K']
);
assert.deepEqual(minimaxH3ImageEntry.inputConstraints?.['image-to-video'], {
  imageModes: ['first_frame', 'first_last_frames'],
  promptRequired: true,
  uploadMaxSizeMB: 30,
});
assert.deepEqual(imageEntry.inputConstraints?.['image-to-video']?.imageModes, [
  'first_frame',
  'first_last_frames',
  'reference_images',
]);

const optionCases = [
  {
    mode: 'first_frame',
    imageInput: ['https://example.com/start.png'],
  },
  {
    mode: 'first_last_frames',
    imageInput: [
      'https://example.com/start.png',
      'https://example.com/end.png',
    ],
  },
  {
    mode: 'reference_images',
    imageInput: [
      'https://example.com/reference-1.png',
      'https://example.com/reference-2.png',
    ],
  },
] as const;

for (const testCase of optionCases) {
  const options = resolveFinalOptions({
    mediaType: 'video',
    scene: 'image-to-video',
    entry: imageEntry,
    options: {
      image_input: [...testCase.imageInput],
      image_mode: testCase.mode,
    },
  });

  assert.equal(options.image_mode, testCase.mode);
  assert.deepEqual(options.image_input, testCase.imageInput);
}

assert.throws(
  () =>
    resolveFinalOptions({
      mediaType: 'video',
      scene: 'image-to-video',
      entry: imageEntry,
      options: {
        image_input: ['https://example.com/reference-1.png'],
        image_mode: 'reference_images',
      },
    }),
  /invalid image_input for image_mode: reference_images/
);

const restrictedEntry: ModelEntry = {
  ...imageEntry,
  inputConstraints: {
    'image-to-video': {
      imageModes: ['first_frame'],
      promptRequired: true,
    },
  },
};
const restrictedOptions = resolveFinalOptions({
  mediaType: 'video',
  scene: 'image-to-video',
  entry: restrictedEntry,
  options: {
    image_input: [
      'https://example.com/reference-1.png',
      'https://example.com/reference-2.png',
    ],
    image_mode: 'reference_images',
  },
});

assert.throws(
  () =>
    assertModelInputConstraints({
      entry: restrictedEntry,
      scene: 'image-to-video',
      prompt: 'Keep the subject consistent.',
      options: restrictedOptions,
    }),
  /unsupported image_mode for model/
);
assert.throws(
  () =>
    assertModelInputConstraints({
      entry: restrictedEntry,
      scene: 'image-to-video',
      prompt: ' ',
      options: {
        image_input: ['https://example.com/start.png'],
        image_mode: 'first_frame',
      },
    }),
  /prompt is required for model/
);
assert.doesNotThrow(() =>
  assertModelInputConstraints({
    entry: { ...imageEntry, inputConstraints: undefined },
    scene: 'image-to-video',
    prompt: '',
    options: restrictedOptions,
  })
);

const kieCases = [
  {
    options: {
      image_input: ['https://example.com/start.png'],
      image_mode: 'first_frame',
    },
    expectedInput: {
      first_frame_url: 'https://example.com/start.png',
    },
  },
  {
    options: {
      image_input: [
        'https://example.com/start.png',
        'https://example.com/end.png',
      ],
      image_mode: 'first_last_frames',
    },
    expectedInput: {
      first_frame_url: 'https://example.com/start.png',
      last_frame_url: 'https://example.com/end.png',
    },
  },
  {
    options: {
      image_input: [
        'https://example.com/reference-1.png',
        'https://example.com/reference-2.png',
      ],
      image_mode: 'reference_images',
    },
    expectedInput: {
      reference_image_urls: [
        'https://example.com/reference-1.png',
        'https://example.com/reference-2.png',
      ],
    },
  },
  {
    options: {
      image_input: ['https://example.com/legacy.png'],
    },
    expectedInput: {
      image_urls: ['https://example.com/legacy.png'],
    },
  },
] as const;

async function assertKieMappings() {
  const originalFetch = globalThis.fetch;
  let requestIndex = 0;

  globalThis.fetch = async (input, init) => {
    assert.equal(String(input), 'https://api.kie.ai/api/v1/jobs/createTask');
    assert.equal(init?.method, 'POST');

    const expected = kieCases[requestIndex];
    assert.ok(expected, 'unexpected extra Kie request');

    const body = JSON.parse(String(init?.body));
    assert.deepEqual(body.input, {
      prompt: 'Animate the image naturally.',
      ...expected.expectedInput,
    });

    requestIndex += 1;

    return new Response(
      JSON.stringify({
        code: 200,
        msg: 'success',
        data: { taskId: `video-image-smoke-${requestIndex}` },
      })
    );
  };

  try {
    for (const testCase of kieCases) {
      const result = await new KieProvider({
        apiKey: 'test-api-key',
        customStorage: false,
      }).generate({
        params: {
          mediaType: AIMediaType.VIDEO,
          model: 'bytedance/seedance-2-fast',
          prompt: 'Animate the image naturally.',
          callbackUrl: 'https://example.com/api/ai/notify/kie',
          options: testCase.options,
        },
      });

      assert.equal(result.taskStatus, AITaskStatus.PENDING);
    }
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(requestIndex, kieCases.length);
}

async function assertMinimaxH3Mappings() {
  const h3Cases = [
    {
      model: 'minimax-h3/text-to-video',
      options: {
        duration: 4,
        aspect_ratio: '16:9',
        resolution: '2K',
        generate_audio: true,
        n_frames: 24,
        image_urls: ['https://example.com/ignored.png'],
      },
      expectedInput: {
        prompt: 'A paper boat crosses a rain puddle.',
        aspect_ratio: '16:9',
        duration: 4,
        resolution: '2K',
      },
    },
    {
      model: 'minimax-h3/image-to-video',
      options: {
        duration: 4,
        image_mode: 'first_frame',
        image_input: ['https://example.com/start.png'],
        resolution: '768P',
        generate_audio: true,
        n_frames: 24,
        image_urls: ['https://example.com/ignored.png'],
      },
      expectedInput: {
        prompt: 'Animate the first frame naturally.',
        first_frame_url: 'https://example.com/start.png',
        duration: 4,
        resolution: '768P',
      },
    },
    {
      model: 'minimax-h3/image-to-video',
      options: {
        duration: 4,
        image_mode: 'first_last_frames',
        image_input: [
          'https://example.com/start.png',
          'https://example.com/end.png',
        ],
        resolution: '2K',
        generate_audio: true,
        n_frames: 24,
        image_urls: ['https://example.com/ignored.png'],
      },
      expectedInput: {
        prompt: 'Transition from the first frame to the last frame.',
        first_frame_url: 'https://example.com/start.png',
        last_frame_url: 'https://example.com/end.png',
        duration: 4,
        resolution: '2K',
      },
    },
  ] as const;

  const originalFetch = globalThis.fetch;
  let requestIndex = 0;

  globalThis.fetch = async (input, init) => {
    assert.equal(String(input), 'https://api.kie.ai/api/v1/jobs/createTask');
    assert.equal(init?.method, 'POST');

    const expected = h3Cases[requestIndex];
    assert.ok(expected, 'unexpected extra MiniMax H3 request');

    const body = JSON.parse(String(init?.body));
    assert.deepEqual(body, {
      model: expected.model,
      input: expected.expectedInput,
    });
    assert.equal('callBackUrl' in body, false);

    requestIndex += 1;

    return new Response(
      JSON.stringify({
        code: 200,
        msg: 'success',
        data: { taskId: `minimax-h3-smoke-${requestIndex}` },
      })
    );
  };

  try {
    for (const testCase of h3Cases) {
      const result = await new KieProvider({
        apiKey: 'test-api-key',
        customStorage: false,
      }).generate({
        params: {
          mediaType: AIMediaType.VIDEO,
          model: testCase.model,
          prompt: testCase.expectedInput.prompt,
          callbackUrl: 'https://example.com/api/ai/notify/kie',
          options: testCase.options,
        },
      });

      assert.equal(result.taskStatus, AITaskStatus.PENDING);
    }
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(requestIndex, h3Cases.length);
}

void assertKieMappings()
  .then(assertMinimaxH3Mappings)
  .then(() => {
    console.log('video image input smoke checks passed.');
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
