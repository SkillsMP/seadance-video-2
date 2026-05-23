// 以后删，以后等 music 也纳入 MODELS + candidates，并且没有旧 provider/model 路径后，再考虑把 getGenerationCreditCost() 移到 models.ts 或 src/config/ai/pricing.ts，然后删掉 credit-costs.ts
// 明确它是派生层，不是配置源。短期保持，但未来考虑清理。收窄它的职责。
import {
  MODELS,
  type ModelEntry,
  type ScenePricing,
  type VideoResolution,
} from './models';

export type GenerationMediaType = 'image' | 'video' | 'music';

export type GenerationScene =
  | 'text-to-image'
  | 'image-to-image'
  | 'text-to-video'
  | 'image-to-video'
  | 'video-to-video'
  | 'text-to-music';

export interface GenerationCreditCostInput {
  mediaType: GenerationMediaType | string;
  scene?: GenerationScene | string;
  family?: string;
  model?: string;
}

export type FinalGenerationOptions = Record<string, unknown>;

function isFinitePositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function getScenePricing(entry: ModelEntry, scene: string): ScenePricing {
  if (!entry.scenes.includes(scene)) {
    throw new Error(`invalid pricing scene: ${entry.family}/${scene}`);
  }

  const pricing = entry.pricing?.[scene];
  if (!pricing) {
    throw new Error(`missing pricing: ${entry.family}/${scene}`);
  }

  return pricing;
}

function resolveDuration(
  pricing: ScenePricing,
  finalOptions: FinalGenerationOptions
): number {
  const duration = finalOptions.duration ?? pricing.defaultDuration;

  if (!isFinitePositiveNumber(duration)) {
    throw new Error('invalid pricing duration');
  }

  return duration;
}

function resolveResolution(
  entry: ModelEntry,
  scene: string,
  finalOptions: FinalGenerationOptions
): VideoResolution {
  const resolution =
    finalOptions.resolution ?? entry.defaults?.[scene]?.resolution;

  if (
    resolution !== '480p' &&
    resolution !== '720p' &&
    resolution !== '1080p'
  ) {
    throw new Error('invalid pricing resolution');
  }

  return resolution;
}

export function calculateModelCredits(
  entry: ModelEntry,
  scene: string,
  finalOptions: FinalGenerationOptions = {}
): number {
  const pricing = getScenePricing(entry, scene);

  if (pricing.mode === 'fixed') {
    if (!isFinitePositiveNumber(pricing.credits)) {
      throw new Error(`invalid fixed pricing: ${entry.family}/${scene}`);
    }

    return pricing.credits;
  }

  if (pricing.mode === 'perSecond') {
    const resolutionPricing = pricing.byResolution
      ? pricing.byResolution[resolveResolution(entry, scene, finalOptions)]
      : undefined;

    if (resolutionPricing && resolutionPricing.availability !== 'enabled') {
      throw new Error(
        `unavailable pricing resolution: ${entry.family}/${scene}`
      );
    }

    const creditsPerSecond =
      resolutionPricing?.creditsPerSecond ?? pricing.creditsPerSecond;

    if (!isFinitePositiveNumber(creditsPerSecond)) {
      throw new Error(`invalid per-second pricing: ${entry.family}/${scene}`);
    }

    const duration = resolveDuration(pricing, finalOptions);
    const credits = duration * creditsPerSecond;

    if (!Number.isFinite(credits)) {
      throw new Error(`invalid calculated pricing: ${entry.family}/${scene}`);
    }

    return credits;
  }

  throw new Error(`invalid pricing mode: ${entry.family}/${scene}`);
}

const DEFAULT_SCENE_CREDIT_COSTS: Record<
  string,
  Partial<Record<string, number>>
> = {
  image: {
    'text-to-image': 15,
    'image-to-image': 20,
  },
  video: {
    'text-to-video': 45,
    'image-to-video': 60,
    'video-to-video': 90,
  },
  music: {
    'text-to-music': 10,
  },
};

const FAMILY_CREDIT_COST_OVERRIDES = MODELS.reduce<
  Record<string, Partial<Record<string, number>>>
>((costs, model) => {
  if (!model.enabled) {
    return costs;
  }

  const familyCosts = (costs[model.family] ??= {});

  for (const scene of model.scenes) {
    familyCosts[scene] = model.credits[scene];
  }

  return costs;
}, {});

export function getGenerationCreditCost({
  mediaType,
  scene,
  family,
}: GenerationCreditCostInput): number {
  const mediaCosts = DEFAULT_SCENE_CREDIT_COSTS[mediaType];

  if (!mediaCosts) {
    throw new Error('invalid mediaType');
  }

  const normalizedScene = mediaType === 'music' ? 'text-to-music' : scene;

  if (!normalizedScene) {
    throw new Error('invalid scene');
  }

  if (family) {
    const familyCost = FAMILY_CREDIT_COST_OVERRIDES[family]?.[normalizedScene];

    if (typeof familyCost === 'number') {
      return familyCost;
    }
  }

  const cost = mediaCosts[normalizedScene];

  if (typeof cost !== 'number') {
    throw new Error('invalid scene');
  }

  return cost;
}
