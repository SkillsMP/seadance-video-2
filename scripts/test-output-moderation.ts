import assert from 'node:assert/strict';

process.env.DATABASE_URL = '';
process.env.MODERATION_ENABLED = 'false';
process.env.SIGHTENGINE_MODERATION_ENABLED = 'false';
process.env.SIGHTENGINE_FAIL_CLOSED = 'true';
process.env.WAVESPEED_API_KEY = 'test-key';

const WAVESPEED_BLOCKED_URL_PARTS = [
  'api.wavespeed.ai',
  'wavespeed.ai/api',
  'wavespeed.ai',
];
const SIGHTENGINE_BLOCKED_URL_PARTS = ['api.sightengine.com'];

function toFetchUrl(input: unknown): string {
  if (typeof input === 'string') {
    return input;
  }

  if (input instanceof URL) {
    return input.toString();
  }

  if (typeof Request !== 'undefined' && input instanceof Request) {
    return input.url;
  }

  return String(input);
}

function isWavespeedUrl(url: string): boolean {
  return WAVESPEED_BLOCKED_URL_PARTS.some((part) => url.includes(part));
}

function isSightengineUrl(url: string): boolean {
  return SIGHTENGINE_BLOCKED_URL_PARTS.some((part) => url.includes(part));
}

function assertWavespeedTestAuth(init?: RequestInit): void {
  assert.equal(
    new Headers(init?.headers).get('authorization'),
    'Bearer test-key',
    'Wavespeed tests must use test-key only'
  );
}

function createWavespeedResult(block: boolean) {
  return {
    harassment: false,
    hate: block,
    sexual: false,
    'sexual/minors': false,
    violence: false,
  };
}

function createSightengineResult() {
  return {
    status: 'success',
  };
}

const originalFetch = globalThis.fetch;
const guardedFetch: typeof fetch = async (input, init) => {
  const url = toFetchUrl(input);
  if (isWavespeedUrl(url) || isSightengineUrl(url)) {
    throw new Error(`Unexpected moderation network request: ${url}`);
  }

  return originalFetch(input, init);
};

globalThis.fetch = guardedFetch;

async function main() {
  try {
    const { AIMediaType, AITaskStatus } = await import(
      '../src/extensions/ai/types'
    );
    const {
      applyGenerationOutputModeration,
      ContentPolicyViolationError,
      moderateGenerationInput,
      moderateGenerationOutput,
      GENERATED_OUTPUT_MISSING_MESSAGE,
    } = await import('../src/shared/services/moderation');

    const pendingResult = await applyGenerationOutputModeration({
      taskId: 'task-pending',
      userId: 'user-1',
      mediaType: AIMediaType.IMAGE,
      scene: 'text-to-image',
      taskStatus: AITaskStatus.PENDING,
      taskInfo: { status: 'provider-pending' },
      taskResult: { raw: true },
    });
    assert.deepEqual(pendingResult, {
      status: AITaskStatus.PENDING,
      taskInfo: { status: 'provider-pending' },
      taskResult: { raw: true },
    });

    const textResult = await applyGenerationOutputModeration({
      taskId: 'task-text',
      userId: 'user-1',
      mediaType: AIMediaType.TEXT,
      scene: 'text',
      taskStatus: AITaskStatus.SUCCESS,
      taskInfo: { text: 'ok' },
      taskResult: { raw: true },
    });
    assert.deepEqual(textResult, {
      status: AITaskStatus.SUCCESS,
      taskInfo: { text: 'ok' },
      taskResult: { raw: true },
    });

    const missingImageOutput = await applyGenerationOutputModeration({
      taskId: 'task-missing-image',
      userId: 'user-1',
      mediaType: AIMediaType.IMAGE,
      scene: 'text-to-image',
      taskStatus: AITaskStatus.SUCCESS,
      taskInfo: { images: [{ imageUrl: 'not-a-url' }] },
      taskResult: { output: 'https://example.com/ignored.png' },
    });
    assert.equal(missingImageOutput.status, AITaskStatus.FAILED);
    assert.equal(
      missingImageOutput.taskInfo?.errorMessage,
      GENERATED_OUTPUT_MISSING_MESSAGE
    );
    assert.equal(
      missingImageOutput.taskResult?.errorCode,
      'GENERATED_OUTPUT_MISSING'
    );

    const successImageResult = await applyGenerationOutputModeration({
      taskId: 'task-success-image',
      userId: 'user-1',
      mediaType: AIMediaType.IMAGE,
      scene: 'text-to-image',
      taskStatus: AITaskStatus.SUCCESS,
      taskInfo: {
        images: [{ imageUrl: ' https://example.com/generated-image.png ' }],
      },
      taskResult: { output: 'https://example.com/ignored.png' },
    });
    assert.equal(successImageResult.status, AITaskStatus.SUCCESS);
    assert.deepEqual(successImageResult.taskInfo, {
      images: [{ imageUrl: ' https://example.com/generated-image.png ' }],
    });
    assert.deepEqual(successImageResult.taskResult, {
      output: 'https://example.com/ignored.png',
    });

    const successVideoResult = await applyGenerationOutputModeration({
      taskId: 'task-success-video',
      userId: 'user-1',
      mediaType: AIMediaType.VIDEO,
      scene: 'text-to-video',
      taskStatus: AITaskStatus.SUCCESS,
      taskInfo: {
        videos: [{ videoUrl: 'https://example.com/generated-video.mp4' }],
      },
      taskResult: { ignored: true },
    });
    assert.equal(successVideoResult.status, AITaskStatus.SUCCESS);
    assert.deepEqual(successVideoResult.taskInfo, {
      videos: [{ videoUrl: 'https://example.com/generated-video.mp4' }],
    });

    await assert.doesNotReject(() =>
      moderateGenerationOutput({
        taskId: 'task-disabled-output',
        userId: 'user-1',
        mediaType: AIMediaType.IMAGE,
        scene: 'text-to-image',
        outputUrls: ['https://example.com/generated-image.png'],
      })
    );

    await assert.doesNotReject(() =>
      moderateGenerationInput({
        userId: 'user-1',
        mediaType: AIMediaType.IMAGE,
        scene: 'image-to-image',
        prompt: 'unsafe prompt that would normally be checked',
        options: {
          image_input: [{ invalid: true }],
        },
      })
    );

    process.env.MODERATION_ENABLED = 'true';
    process.env.MODERATION_PROVIDER = 'wavespeed';
    delete process.env.MODERATION_OUTPUT_VIDEO_PROVIDER;
    process.env.MODERATION_FAIL_CLOSED = 'true';
    process.env.WAVESPEED_API_KEY = 'test-key';
    process.env.WAVESPEED_TEXT_MODEL =
      'wavespeed-ai/molmo2/text-content-moderator';
    process.env.WAVESPEED_IMAGE_MODEL =
      'wavespeed-ai/molmo2/image-content-moderator';
    process.env.WAVESPEED_VIDEO_MODEL =
      'wavespeed-ai/molmo2/video-content-moderator';
    process.env.WAVESPEED_REQUEST_TIMEOUT_MS = '30000';
    process.env.WAVESPEED_POLL_INTERVAL_MS = '1000';
    process.env.WAVESPEED_VIDEO_TIMEOUT_MS = '30000';
    process.env.WAVESPEED_VIDEO_POLL_INTERVAL_MS = '1000';

    let wavespeedSubmitMockHits = 0;
    let wavespeedResultMockHits = 0;
    let wavespeedVideoSubmitMockHits = 0;
    let wavespeedImageSubmitMockHits = 0;

    globalThis.fetch = async (input, init) => {
      const url = toFetchUrl(input);

      if (
        url.includes('/predictions/') &&
        url.endsWith('/result') &&
        init?.method === 'GET'
      ) {
        assertWavespeedTestAuth(init);
        wavespeedResultMockHits += 1;

        const isBlock = url.includes('/predictions/pred_block/');
        const isError = url.includes('/predictions/pred_error/');
        if (isError) {
          return new Response(
            JSON.stringify({
              id: 'pred_error',
              status: 'failed',
            }),
            { status: 200 }
          );
        }

        return new Response(
          JSON.stringify({
            id: isBlock ? 'pred_block' : 'pred_allow',
            status: 'completed',
            outputs: [createWavespeedResult(isBlock)],
          }),
          { status: 200 }
        );
      }

      if (
        url.startsWith('https://api.wavespeed.ai/api/v3/') &&
        !url.includes('/predictions/') &&
        init?.method === 'POST'
      ) {
        assertWavespeedTestAuth(init);
        wavespeedSubmitMockHits += 1;

        const body =
          typeof init.body === 'string'
            ? (JSON.parse(init.body) as Record<string, unknown>)
            : {};
        if (typeof body.image === 'string') {
          wavespeedImageSubmitMockHits += 1;
        }
        if (typeof body.video === 'string') {
          wavespeedVideoSubmitMockHits += 1;
        }
        const isBlock =
          (typeof body.text === 'string' && body.text.includes('unsafe')) ||
          (typeof body.image === 'string' && body.image.includes('unsafe')) ||
          (typeof body.video === 'string' && body.video.includes('unsafe'));
        const isError =
          typeof body.video === 'string' && body.video.includes('error');
        const predictionId = isError
          ? 'pred_error'
          : isBlock
            ? 'pred_block'
            : 'pred_allow';

        return new Response(
          JSON.stringify({
            id: predictionId,
            status: 'created',
          }),
          { status: 200 }
        );
      }

      return guardedFetch(input, init);
    };

    try {
      await assert.doesNotReject(
        () =>
          moderateGenerationInput({
            userId: 'user-1',
            mediaType: AIMediaType.IMAGE,
            scene: 'text-to-image',
            prompt: 'safe prompt',
          }),
        'wavespeed text allow path should pass'
      );

      await assert.doesNotReject(
        () =>
          moderateGenerationOutput({
            taskId: 'task-wavespeed-image-allow',
            userId: 'user-1',
            mediaType: AIMediaType.IMAGE,
            scene: 'text-to-image',
            outputUrls: ['https://example.com/safe-image.png'],
          }),
        'wavespeed image allow path should pass'
      );

      await assert.rejects(
        () =>
          moderateGenerationInput({
            userId: 'user-1',
            mediaType: AIMediaType.IMAGE,
            scene: 'text-to-image',
            prompt: 'unsafe prompt',
          }),
        ContentPolicyViolationError,
        'wavespeed text block path should reject with ContentPolicyViolationError'
      );

      await assert.rejects(
        () =>
          moderateGenerationOutput({
            taskId: 'task-wavespeed-image-block',
            userId: 'user-1',
            mediaType: AIMediaType.IMAGE,
            scene: 'text-to-image',
            outputUrls: ['https://example.com/unsafe-image.png'],
          }),
        ContentPolicyViolationError,
        'wavespeed image block path should reject with ContentPolicyViolationError'
      );

      await assert.rejects(
        () =>
          moderateGenerationOutput({
            taskId: 'task-wavespeed-video-block',
            userId: 'user-1',
            mediaType: AIMediaType.VIDEO,
            scene: 'text-to-video',
            outputUrls: ['https://example.com/unsafe-video.mp4'],
          }),
        ContentPolicyViolationError,
        'wavespeed video block path should reject with ContentPolicyViolationError'
      );

      await assert.doesNotReject(
        () =>
          moderateGenerationOutput({
            taskId: 'task-wavespeed-video-allow',
            userId: 'user-1',
            mediaType: AIMediaType.VIDEO,
            scene: 'text-to-video',
            outputUrls: ['https://example.com/safe-video.mp4'],
          }),
        'wavespeed video allow path should pass'
      );

      await assert.rejects(
        () =>
          moderateGenerationOutput({
            taskId: 'task-wavespeed-video-error',
            userId: 'user-1',
            mediaType: AIMediaType.VIDEO,
            scene: 'text-to-video',
            outputUrls: ['https://example.com/error-video.mp4'],
          }),
        ContentPolicyViolationError,
        'wavespeed video provider error should fail closed'
      );

      const blockResult = await applyGenerationOutputModeration({
        taskId: 'task-wavespeed-block-url-check',
        userId: 'user-1',
        mediaType: AIMediaType.IMAGE,
        scene: 'text-to-image',
        taskStatus: AITaskStatus.SUCCESS,
        taskInfo: {
          images: [{ imageUrl: 'https://example.com/unsafe-image.png' }],
        },
        taskResult: { output: 'https://example.com/unsafe-image.png' },
      });

      assert.equal(blockResult.status, AITaskStatus.MODERATION_BLOCKED);
      const blockResultStr = JSON.stringify(blockResult);
      assert.equal(
        blockResultStr.includes('unsafe-image.png'),
        false,
        'Should not leak original output URL'
      );
      assert.ok(
        blockResult.taskResult?.errorCode === 'CONTENT_POLICY_VIOLATION',
        'errorCode should be correct'
      );
      const videoBlockResult = await applyGenerationOutputModeration({
        taskId: 'task-wavespeed-video-block-url-check',
        userId: 'user-1',
        mediaType: AIMediaType.VIDEO,
        scene: 'text-to-video',
        taskStatus: AITaskStatus.SUCCESS,
        taskInfo: {
          videos: [{ videoUrl: 'https://example.com/unsafe-video.mp4' }],
        },
        taskResult: { output: 'https://example.com/unsafe-video.mp4' },
      });

      assert.equal(videoBlockResult.status, AITaskStatus.MODERATION_BLOCKED);
      const videoBlockResultStr = JSON.stringify(videoBlockResult);
      assert.equal(
        videoBlockResultStr.includes('unsafe-video.mp4'),
        false,
        'Should not leak original video output URL'
      );
      assert.ok(
        wavespeedSubmitMockHits > 0,
        'Wavespeed submit endpoint must be covered by mock fetch'
      );
      assert.ok(
        wavespeedResultMockHits > 0,
        'Wavespeed result polling endpoint must be covered by mock fetch'
      );
      assert.ok(
        wavespeedVideoSubmitMockHits > 0,
        'Wavespeed video submit endpoint must be covered by mock fetch'
      );
      assert.ok(
        wavespeedImageSubmitMockHits > 0,
        'Wavespeed image submit endpoint must be covered by mock fetch'
      );
    } finally {
      globalThis.fetch = guardedFetch;
    }

    process.env.MODERATION_PROVIDER = 'sightengine';
    process.env.MODERATION_OUTPUT_VIDEO_PROVIDER = 'wavespeed';
    process.env.SIGHTENGINE_API_USER = 'test-user';
    process.env.SIGHTENGINE_API_SECRET = 'test-secret';

    let sightengineMockHits = 0;
    let routedWavespeedSubmitHits = 0;
    let routedWavespeedResultHits = 0;

    globalThis.fetch = async (input, init) => {
      const url = toFetchUrl(input);

      if (isSightengineUrl(url)) {
        sightengineMockHits += 1;
        return new Response(JSON.stringify(createSightengineResult()), {
          status: 200,
        });
      }

      if (
        url.includes('/predictions/') &&
        url.endsWith('/result') &&
        init?.method === 'GET'
      ) {
        assertWavespeedTestAuth(init);
        routedWavespeedResultHits += 1;
        return new Response(
          JSON.stringify({
            id: 'pred_routed_video',
            status: 'completed',
            outputs: [createWavespeedResult(false)],
          }),
          { status: 200 }
        );
      }

      if (
        url.startsWith('https://api.wavespeed.ai/api/v3/') &&
        !url.includes('/predictions/') &&
        init?.method === 'POST'
      ) {
        assertWavespeedTestAuth(init);
        routedWavespeedSubmitHits += 1;

        const body =
          typeof init.body === 'string'
            ? (JSON.parse(init.body) as Record<string, unknown>)
            : {};
        assert.equal(
          typeof body.video,
          'string',
          'only output video moderation should use Wavespeed in routed test'
        );
        assert.equal(
          body.image,
          undefined,
          'output image moderation must not use Wavespeed in routed test'
        );
        assert.equal(
          body.text,
          undefined,
          'input text moderation must not use Wavespeed in routed test'
        );

        return new Response(
          JSON.stringify({
            id: 'pred_routed_video',
            status: 'created',
          }),
          { status: 200 }
        );
      }

      return guardedFetch(input, init);
    };

    try {
      await assert.doesNotReject(
        () =>
          moderateGenerationInput({
            userId: 'user-1',
            mediaType: AIMediaType.IMAGE,
            scene: 'image-to-image',
            prompt: 'safe routed prompt',
            options: {
              image_input: 'https://example.com/input-image.png',
            },
          }),
        'input moderation should keep using the default provider'
      );

      await assert.doesNotReject(
        () =>
          moderateGenerationOutput({
            taskId: 'task-routed-image-output',
            userId: 'user-1',
            mediaType: AIMediaType.IMAGE,
            scene: 'text-to-image',
            outputUrls: ['https://example.com/routed-image.png'],
          }),
        'output image moderation should keep using the default provider'
      );

      const sightengineHitsBeforeVideo = sightengineMockHits;

      await assert.doesNotReject(
        () =>
          moderateGenerationOutput({
            taskId: 'task-routed-video-output',
            userId: 'user-1',
            mediaType: AIMediaType.VIDEO,
            scene: 'text-to-video',
            outputUrls: ['https://example.com/routed-video.mp4'],
          }),
        'output video moderation should use the configured video provider'
      );

      assert.ok(
        sightengineMockHits >= 3,
        'input text, input image, and output image should use Sightengine'
      );
      assert.equal(
        sightengineMockHits,
        sightengineHitsBeforeVideo,
        'output video should not call Sightengine when routed to Wavespeed'
      );
      assert.equal(
        routedWavespeedSubmitHits,
        1,
        'only output video should submit to Wavespeed'
      );
      assert.equal(
        routedWavespeedResultHits,
        1,
        'output video should poll Wavespeed once in routed test'
      );
    } finally {
      globalThis.fetch = guardedFetch;
    }

    console.log('output moderation smoke checks passed.');
  } finally {
    globalThis.fetch = originalFetch;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
