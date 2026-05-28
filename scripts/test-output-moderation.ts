import assert from 'node:assert/strict';

process.env.DATABASE_URL = '';
process.env.MODERATION_ENABLED = 'false';
process.env.SIGHTENGINE_MODERATION_ENABLED = 'false';
process.env.SIGHTENGINE_FAIL_CLOSED = 'true';

async function main() {
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

  // Setup Wavespeed mock fetch
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (urlStr: any, init?: RequestInit) => {
    const url = urlStr.toString();
    
    if (url.includes('predictions')) {
      return new Response(JSON.stringify({
        id: 'pred_polled',
        status: 'completed',
        outputs: [{
          harassment: false,
          hate: false,
          sexual: false,
          "sexual/minors": false,
          violence: false
        }]
      }), { status: 200 });
    }

    const body = init?.body ? JSON.parse(init.body as string) : {};
    const isBlock = (body.text && body.text.includes('unsafe')) || 
                    (body.image && body.image.includes('unsafe'));

    if (isBlock) {
      return new Response(JSON.stringify({
        id: 'pred_block',
        status: 'completed',
        outputs: [{
          harassment: false,
          hate: true,
          sexual: false,
          "sexual/minors": false,
          violence: false
        }]
      }), { status: 200 });
    } else {
      return new Response(JSON.stringify({
        id: 'pred_allow',
        status: 'completed',
        outputs: [{
          harassment: false,
          hate: false,
          sexual: false,
          "sexual/minors": false,
          violence: false
        }]
      }), { status: 200 });
    }
  };

  try {
    process.env.MODERATION_ENABLED = 'true';
    process.env.MODERATION_PROVIDER = 'wavespeed';
    process.env.MODERATION_FAIL_CLOSED = 'true';
    process.env.WAVESPEED_API_KEY = 'test-key';
    process.env.WAVESPEED_TEXT_MODEL =
      'wavespeed-ai/molmo2/text-content-moderator';
    process.env.WAVESPEED_IMAGE_MODEL =
      'wavespeed-ai/molmo2/image-content-moderator';
    process.env.WAVESPEED_REQUEST_TIMEOUT_MS = '30000';
    process.env.WAVESPEED_POLL_INTERVAL_MS = '1000';

    // 1. wavespeed text/image allow 路径
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

    // 2. wavespeed text/image block 路径
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

    // 3. wavespeed 不支持 checkVideoUrl 时不能静默放行
    await assert.rejects(
      () =>
        moderateGenerationOutput({
          taskId: 'task-wavespeed-video-14b',
          userId: 'user-1',
          mediaType: AIMediaType.VIDEO,
          scene: 'text-to-video',
          outputUrls: ['https://example.com/generated-video.mp4'],
        }),
      ContentPolicyViolationError,
      '14B Wavespeed provider must not silently allow video moderation'
    );

    // 4. block 后不泄露原始 output URL
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
    assert.equal(blockResultStr.includes('unsafe-image.png'), false, 'Should not leak original output URL');
    assert.ok(blockResult.taskResult?.errorCode === 'CONTENT_POLICY_VIOLATION', 'errorCode should be correct');

    console.log('output moderation smoke checks passed.');
  } finally {
    globalThis.fetch = originalFetch;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
