import { AIMediaType, AITaskStatus } from '@/extensions/ai/types';
import {
  createModerationProvider,
  type CreateModerationProviderConfig,
  type ModerationProvider,
  type ModerationResult,
  type SightengineConfig,
  type WavespeedConfig,
} from '@/extensions/moderation';
import { getAllConfigs } from '@/shared/models/config';

export const CONTENT_SAFETY_MESSAGE =
  'This request violates our content safety policy. Please revise it and try again.';
export const GENERATED_CONTENT_SAFETY_MESSAGE =
  'This generated result violates our content safety policy and cannot be displayed. Please revise your prompt and try again.';
export const CONTENT_POLICY_VIOLATION_CODE = 'CONTENT_POLICY_VIOLATION';
export const GENERATED_OUTPUT_MISSING_MESSAGE =
  'The provider returned no generated output URLs.';

interface ModerateGenerationInputParams {
  userId: string;
  mediaType?: string;
  scene?: string;
  prompt?: string;
  options?: any;
}

interface ModerateGenerationOutputParams {
  taskId?: string;
  userId: string;
  mediaType?: string;
  scene?: string | null;
  outputUrls: string[];
}

interface ExtractGenerationOutputUrlsParams {
  mediaType?: string;
  taskInfo?: any;
}

interface ApplyGenerationOutputModerationParams
  extends ExtractGenerationOutputUrlsParams {
  taskId?: string;
  userId: string;
  scene?: string | null;
  taskStatus: AITaskStatus;
  taskResult?: any;
}

interface ApplyGenerationOutputModerationResult {
  status: AITaskStatus;
  taskInfo?: any;
  taskResult?: any;
}

const TEXT_OPTION_FIELDS = [
  'title',
  'style',
  'lyrics',
  'negative_prompt',
  'negativePrompt',
];

const DEFAULT_WAVESPEED_TEXT_MODEL =
  'wavespeed-ai/molmo2/text-content-moderator';
const DEFAULT_WAVESPEED_IMAGE_MODEL =
  'wavespeed-ai/molmo2/image-content-moderator';
const DEFAULT_WAVESPEED_VIDEO_MODEL =
  'wavespeed-ai/molmo2/video-content-moderator';

interface ModerationProviderContext {
  providerName: string;
  createProvider: () => ModerationProvider;
}

export class ContentPolicyViolationError extends Error {
  constructor(message = CONTENT_SAFETY_MESSAGE) {
    super(message);
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

  if (!isModerationEnabled(configs)) {
    return;
  }

  const failClosed = isModerationFailClosed(configs);
  const providerContext = createModerationProviderContext(configs);
  const provider = await createReadyProvider({
    userId,
    mediaType,
    scene,
    failClosed,
    providerContext,
  });
  if (!provider) {
    return;
  }

  const text = extractModerationText(prompt, options);
  if (text) {
    await runModerationCheck({
      userId,
      mediaType,
      scene,
      failClosed,
      providerName: provider.name,
      checkType: 'text',
      check: () => getProviderCheck(provider, 'checkText')(text),
    });
  }

  const imageUrls = extractImageInputUrls(options);
  for (const imageUrl of imageUrls) {
    await runModerationCheck({
      userId,
      mediaType,
      scene,
      failClosed,
      providerName: provider.name,
      checkType: 'image',
      check: () => getProviderCheck(provider, 'checkImageUrl')(imageUrl),
    });
  }

  console.log('generation moderation allowed', {
    userId,
    mediaType,
    scene,
  });
}

export async function moderateGenerationOutput({
  taskId,
  userId,
  mediaType,
  scene,
  outputUrls,
}: ModerateGenerationOutputParams) {
  if (mediaType !== AIMediaType.IMAGE && mediaType !== AIMediaType.VIDEO) {
    return;
  }

  const configs = await getAllConfigs();

  if (!isModerationEnabled(configs)) {
    return;
  }

  const failClosed = isModerationFailClosed(configs);
  const providerContext = createModerationProviderContext(configs, mediaType);
  const provider = await createReadyProvider({
    userId,
    mediaType,
    scene: scene ?? undefined,
    failClosed,
    providerContext,
    violationMessage: GENERATED_CONTENT_SAFETY_MESSAGE,
  });
  if (!provider) {
    return;
  }

  for (const outputUrl of outputUrls) {
    await runModerationCheck({
      userId,
      mediaType,
      scene: scene ?? undefined,
      failClosed,
      providerName: provider.name,
      checkType:
        mediaType === AIMediaType.VIDEO ? 'output_video' : 'output_image',
      violationMessage: GENERATED_CONTENT_SAFETY_MESSAGE,
      check: () =>
        getProviderCheck(
          provider,
          mediaType === AIMediaType.VIDEO ? 'checkVideoUrl' : 'checkImageUrl'
        )(outputUrl),
    });
  }

  console.log('generation output moderation allowed', {
    taskId,
    userId,
    mediaType,
    scene,
  });
}

function extractGenerationOutputUrls({
  mediaType,
  taskInfo,
}: ExtractGenerationOutputUrlsParams): string[] {
  const config = getOutputUrlConfig(mediaType);
  if (!config) {
    return [];
  }

  return normalizeHttpUrls(
    getArrayField(taskInfo, config.collectionKey).map(
      (item) => asRecord(item)?.[config.taskInfoUrlKey]
    )
  );
}

export async function applyGenerationOutputModeration({
  taskId,
  userId,
  mediaType,
  scene,
  taskStatus,
  taskInfo,
  taskResult,
}: ApplyGenerationOutputModerationParams): Promise<ApplyGenerationOutputModerationResult> {
  const originalResult = {
    status: taskStatus,
    taskInfo,
    taskResult,
  };

  if (
    taskStatus !== AITaskStatus.SUCCESS ||
    (mediaType !== AIMediaType.IMAGE && mediaType !== AIMediaType.VIDEO)
  ) {
    return originalResult;
  }

  const outputUrls = extractGenerationOutputUrls({
    mediaType,
    taskInfo,
  });

  if (outputUrls.length === 0) {
    return createOutputMissingTaskPayload();
  }

  try {
    await moderateGenerationOutput({
      taskId,
      userId,
      mediaType,
      scene,
      outputUrls,
    });
  } catch (error) {
    if (!(error instanceof ContentPolicyViolationError)) {
      throw error;
    }

    return createModerationBlockedTaskPayload();
  }

  return originalResult;
}

function createModerationBlockedTaskPayload() {
  return createSafeTaskPayload(
    AITaskStatus.MODERATION_BLOCKED,
    CONTENT_POLICY_VIOLATION_CODE,
    GENERATED_CONTENT_SAFETY_MESSAGE
  );
}

function createOutputMissingTaskPayload() {
  return createSafeTaskPayload(
    AITaskStatus.FAILED,
    'GENERATED_OUTPUT_MISSING',
    GENERATED_OUTPUT_MISSING_MESSAGE
  );
}

function createSafeTaskPayload(
  status: AITaskStatus,
  errorCode: string,
  errorMessage: string
) {
  const taskInfo = {
    status,
    errorCode,
    errorMessage,
    createTime: new Date(),
  };

  return {
    status,
    taskInfo,
    taskResult: {
      errorCode,
      errorMessage,
    },
  };
}

async function createReadyProvider({
  userId,
  mediaType,
  scene,
  failClosed,
  providerContext,
  violationMessage = CONTENT_SAFETY_MESSAGE,
}: {
  userId: string;
  mediaType?: string;
  scene?: string;
  failClosed: boolean;
  providerContext: ModerationProviderContext;
  violationMessage?: string;
}): Promise<ModerationProvider | undefined> {
  let provider: ModerationProvider | undefined;

  await runModerationCheck({
    userId,
    mediaType,
    scene,
    failClosed,
    providerName: providerContext.providerName,
    checkType: 'config',
    violationMessage,
    check: async () => {
      provider = providerContext.createProvider();
      return {
        decision: 'allow',
        provider: provider.name,
        categories: [],
      };
    },
  });

  return provider;
}

async function runModerationCheck({
  userId,
  mediaType,
  scene,
  failClosed,
  providerName,
  checkType,
  check,
  violationMessage = CONTENT_SAFETY_MESSAGE,
}: {
  userId: string;
  mediaType?: string;
  scene?: string;
  failClosed: boolean;
  providerName: string;
  checkType: 'config' | 'text' | 'image' | 'output_image' | 'output_video';
  violationMessage?: string;
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
      throw new ContentPolicyViolationError(violationMessage);
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
      provider: providerName,
      error: error instanceof Error ? error.message : String(error),
    });

    if (failClosed) {
      throw new ContentPolicyViolationError(violationMessage);
    }
  }
}

function getProviderCheck(
  provider: ModerationProvider,
  checkName: 'checkText' | 'checkImageUrl' | 'checkVideoUrl'
): (value: string) => Promise<ModerationResult> {
  const check = provider[checkName];
  if (!check) {
    throw new Error(
      `Moderation provider ${provider.name} does not support ${checkName}`
    );
  }

  return check;
}

function isModerationEnabled(configs: Record<string, string>): boolean {
  if (hasConfigValue(configs.moderation_enabled)) {
    return configs.moderation_enabled === 'true';
  }

  return configs.sightengine_moderation_enabled === 'true';
}

function isModerationFailClosed(configs: Record<string, string>): boolean {
  if (hasConfigValue(configs.moderation_fail_closed)) {
    return configs.moderation_fail_closed !== 'false';
  }

  return configs.sightengine_fail_closed !== 'false';
}

function createModerationProviderContext(
  configs: Record<string, string>,
  mediaType?: string
): ModerationProviderContext {
  const providerName = resolveModerationProviderName(configs, mediaType);

  if (providerName === 'sightengine') {
    const providerConfig: CreateModerationProviderConfig = {
      provider: 'sightengine',
      sightengine: createSightengineConfig(configs, mediaType),
    };

    return {
      providerName,
      createProvider: () => createModerationProvider(providerConfig),
    };
  }

  if (providerName === 'wavespeed') {
    const providerConfig: CreateModerationProviderConfig = {
      provider: 'wavespeed',
      wavespeed: createWavespeedConfig(configs),
    };

    return {
      providerName,
      createProvider: () => createModerationProvider(providerConfig),
    };
  }

  return {
    providerName,
    createProvider: () => {
      throw new Error(`Unsupported moderation provider: ${providerName}`);
    },
  };
}

function createSightengineConfig(
  configs: Record<string, string>,
  mediaType?: string
): SightengineConfig {
  return {
    apiUser: configs.sightengine_api_user ?? '',
    apiSecret: configs.sightengine_api_secret ?? '',
    timeoutMs:
      mediaType === AIMediaType.VIDEO
        ? parseTimeoutMs(configs.sightengine_video_timeout_ms, 15000)
        : parseTimeoutMs(configs.sightengine_timeout_ms, 3500),
  };
}

function createWavespeedConfig(configs: Record<string, string>): WavespeedConfig {
  return {
    apiKey: configs.wavespeed_api_key ?? '',
    textModel:
      configs.wavespeed_text_model?.trim() || DEFAULT_WAVESPEED_TEXT_MODEL,
    imageModel:
      configs.wavespeed_image_model?.trim() || DEFAULT_WAVESPEED_IMAGE_MODEL,
    videoModel:
      configs.wavespeed_video_model?.trim() || DEFAULT_WAVESPEED_VIDEO_MODEL,
    requestTimeoutMs: parseTimeoutMs(
      configs.wavespeed_request_timeout_ms,
      30000
    ),
    pollIntervalMs: parseTimeoutMs(configs.wavespeed_poll_interval_ms, 1000),
    videoTimeoutMs: parseTimeoutMs(configs.wavespeed_video_timeout_ms, 120000),
    videoPollIntervalMs: parseTimeoutMs(
      configs.wavespeed_video_poll_interval_ms,
      parseTimeoutMs(configs.wavespeed_poll_interval_ms, 2000)
    ),
  };
}

function resolveModerationProviderName(
  configs: Record<string, string>,
  mediaType?: string
): string {
  const defaultProviderName =
    configs.moderation_provider?.trim() || 'sightengine';
  if (mediaType !== AIMediaType.VIDEO) {
    return defaultProviderName;
  }

  return (
    configs.moderation_output_video_provider?.trim() || defaultProviderName
  );
}

function hasConfigValue(value?: string): boolean {
  return value !== undefined && value !== '';
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

function parseTimeoutMs(value?: string, fallback = 3500): number {
  const timeoutMs = Number.parseInt(value ?? '', 10);
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    return fallback;
  }

  return timeoutMs;
}

function getOutputUrlConfig(mediaType?: string) {
  if (mediaType === AIMediaType.IMAGE) {
    return {
      collectionKey: 'images',
      taskInfoUrlKey: 'imageUrl',
    };
  }

  if (mediaType === AIMediaType.VIDEO) {
    return {
      collectionKey: 'videos',
      taskInfoUrlKey: 'videoUrl',
    };
  }

  return undefined;
}

function getArrayField(value: unknown, key: string): unknown[] {
  const field = asRecord(value)?.[key];
  return Array.isArray(field) ? field : [];
}

function normalizeHttpUrls(values: unknown[]): string[] {
  const urls = new Set<string>();

  values.forEach((value) => {
    if (typeof value !== 'string' || !value.trim()) {
      return;
    }

    try {
      const parsedUrl = new URL(value.trim());
      if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
        urls.add(parsedUrl.toString());
      }
    } catch {
      // Invalid provider fields are handled by the route as missing output.
    }
  });

  return Array.from(urls);
}

function asRecord(value: unknown): Record<string, any> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }

  return value as Record<string, any>;
}
