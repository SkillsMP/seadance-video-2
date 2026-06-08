import { AITaskStatus } from '@/extensions/ai';

export type AITaskErrorDisplay = {
  key: string;
  fallback: string;
};

function normalize(value?: string | null) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

function includesAny(value: string, keywords: string[]) {
  return keywords.some((keyword) => value.includes(keyword));
}

export function getAITaskErrorDisplay({
  status,
  errorCode,
  errorMessage,
  providerStatus,
}: {
  status?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  providerStatus?: string | null;
}): AITaskErrorDisplay | null {
  const taskStatus = normalize(status);
  const code = normalize(errorCode);
  const message = normalize(errorMessage);
  const provider = normalize(providerStatus);
  const text = `${code} ${message} ${provider}`;

  if (taskStatus === AITaskStatus.MODERATION_BLOCKED) {
    return {
      key: 'list.errors.moderation_blocked',
      fallback:
        'This result cannot be shown because it did not pass safety review.',
    };
  }

  if (taskStatus === AITaskStatus.MODERATION_FAILED) {
    return {
      key: 'list.errors.moderation_failed',
      fallback: 'This result cannot be verified right now and cannot be shown.',
    };
  }

  if (taskStatus === AITaskStatus.CANCELED) {
    return {
      key: 'list.errors.canceled',
      fallback: 'This task was canceled.',
    };
  }

  const hasError =
    taskStatus === AITaskStatus.FAILED || Boolean(code || message);

  if (!hasError) {
    return null;
  }

  if (
    includesAny(text, [
      'content policy',
      'moderation',
      'safety',
      'unsafe',
      'rejected',
      'violation',
    ])
  ) {
    return {
      key: 'list.errors.safety_blocked',
      fallback: 'This request or result could not pass safety review.',
    };
  }

  if (includesAny(text, ['timeout', 'timed out'])) {
    return {
      key: 'list.errors.timeout',
      fallback: 'The generation timed out. Please try again.',
    };
  }

  if (
    includesAny(text, [
      'no result',
      'no results',
      'no images',
      'no image',
      'no videos',
      'no video',
      'no audio',
      'no songs',
      'returned no',
    ])
  ) {
    return {
      key: 'list.errors.no_result',
      fallback: 'The provider returned no usable result. Please try again.',
    };
  }

  return {
    key: 'list.errors.failed',
    fallback: 'Generation failed. Please try again.',
  };
}
