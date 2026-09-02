import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { MODELS } from '../src/config/ai/models';
import { resolveFinalOptions } from '../src/config/ai/options';
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

// UI smoke contracts: lightweight mode switch, mounted drafts, and guarded end frame.
[
  'type="single"',
  'value={activeKind}',
  'if (value)',
  'value="frames"',
  'value="reference_images"',
  "activeKind !== 'frames' && 'hidden'",
  "activeKind !== 'reference_images' && 'hidden'",
  'disabled={isEndFrameLocked}',
  "'form.upload_start_image_first'",
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

void assertKieMappings()
  .then(() => {
    console.log('video image input smoke checks passed.');
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
