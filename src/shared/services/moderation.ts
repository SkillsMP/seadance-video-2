import {
  checkImageUrl,
  checkText,
  ModerationResult,
  SightengineConfig,
} from '@/extensions/moderation/sightengine';
import { getAllConfigs } from '@/shared/models/config';

export const CONTENT_SAFETY_MESSAGE =
  'This request violates our content safety policy. Please revise it and try again.';

interface ModerateGenerationInputParams {
  userId: string;
  mediaType?: string;
  scene?: string;
  prompt?: string;
  options?: any;
}

const TEXT_OPTION_FIELDS = [
  'title',
  'style',
  'lyrics',
  'negative_prompt',
  'negativePrompt',
];

let hasWarnedMissingSightengineConfig = false;

export class ContentPolicyViolationError extends Error {
  constructor() {
    super(CONTENT_SAFETY_MESSAGE);
    this.name = 'ContentPolicyViolationError';
  }
}

export async function moderateGenerationInput({
  userId,
  mediaType,
  scene,
  prompt,
  options,
}: ModerateGenerationInputParams) {
  const configs = await getAllConfigs();

  if (configs.sightengine_moderation_enabled !== 'true') {
    return;
  }

  const failClosed = configs.sightengine_fail_closed !== 'false';
  const sightengineConfig: SightengineConfig = {
    apiUser: configs.sightengine_api_user ?? '',
    apiSecret: configs.sightengine_api_secret ?? '',
    timeoutMs: parseTimeoutMs(configs.sightengine_timeout_ms),
  };

  if (!sightengineConfig.apiUser || !sightengineConfig.apiSecret) {
    if (!hasWarnedMissingSightengineConfig) {
      console.warn('generation moderation config missing', {
        provider: 'sightengine',
        failClosed,
      });
      hasWarnedMissingSightengineConfig = true;
    }

    if (failClosed) {
      throw new ContentPolicyViolationError();
    }
    return;
  }

  const text = extractModerationText(prompt, options);
  if (text) {
    await runModerationCheck({
      userId,
      mediaType,
      scene,
      failClosed,
      checkType: 'text',
      check: () => checkText(text, sightengineConfig),
    });
  }

  const imageUrls = extractImageInputUrls(options);
  for (const imageUrl of imageUrls) {
    await runModerationCheck({
      userId,
      mediaType,
      scene,
      failClosed,
      checkType: 'image',
      check: () => checkImageUrl(imageUrl, sightengineConfig),
    });
  }
}

async function runModerationCheck({
  userId,
  mediaType,
  scene,
  failClosed,
  checkType,
  check,
}: {
  userId: string;
  mediaType?: string;
  scene?: string;
  failClosed: boolean;
  checkType: 'text' | 'image';
  check: () => Promise<ModerationResult>;
}) {
  try {
    const result = await check();
    if (result.decision === 'block') {
      console.warn('generation moderation blocked', {
        userId,
        mediaType,
        scene,
        checkType,
        provider: result.provider,
        categories: result.categories,
      });
      throw new ContentPolicyViolationError();
    }
  } catch (error) {
    if (error instanceof ContentPolicyViolationError) {
      throw error;
    }

    console.warn('generation moderation check failed', {
      userId,
      mediaType,
      scene,
      checkType,
      provider: 'sightengine',
      error: error instanceof Error ? error.message : String(error),
    });

    if (failClosed) {
      throw new ContentPolicyViolationError();
    }
  }
}

function extractModerationText(prompt?: string, options?: any): string {
  const parts: string[] = [];

  if (typeof prompt === 'string' && prompt.trim()) {
    parts.push(prompt.trim());
  }

  for (const field of TEXT_OPTION_FIELDS) {
    const value = options?.[field];
    if (typeof value === 'string' && value.trim()) {
      parts.push(value.trim());
    }
  }

  return parts.join('\n');
}

function extractImageInputUrls(options?: any): string[] {
  const imageInput = options?.image_input;
  if (imageInput === undefined || imageInput === null) {
    return [];
  }

  const values = Array.isArray(imageInput) ? imageInput : [imageInput];

  return values.map((value) => {
    if (typeof value !== 'string' || !value.trim()) {
      throw new Error('invalid image_input URL');
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(value.trim());
    } catch {
      throw new Error('invalid image_input URL');
    }

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      throw new Error('invalid image_input URL');
    }

    return parsedUrl.toString();
  });
}

function parseTimeoutMs(value?: string): number {
  const timeoutMs = Number.parseInt(value ?? '', 10);
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    return 3500;
  }

  return timeoutMs;
}
