import assert from 'node:assert/strict';

process.env.DATABASE_URL = '';
process.env.SIGHTENGINE_MODERATION_ENABLED = 'false';
process.env.SIGHTENGINE_FAIL_CLOSED = 'true';

async function main() {
  const { AIMediaType, AITaskStatus } = await import(
    '../src/extensions/ai/types'
  );
  const {
    applyGenerationOutputModeration,
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

  console.log('output moderation smoke checks passed.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
