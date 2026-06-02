import {
  type ImageResolution,
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

function resolveImageResolution(
  finalOptions: FinalGenerationOptions
): ImageResolution {
  const resolution = finalOptions.resolution;

  if (resolution === undefined) {
    throw new Error('missing pricing image resolution');
  }

  if (resolution !== '1K' && resolution !== '2K' && resolution !== '4K') {
    throw new Error('invalid pricing image resolution');
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

    if (pricing.byImageResolution) {
      const resolution = resolveImageResolution(finalOptions);
      const resolutionPricing = pricing.byImageResolution[resolution];

      if (!resolutionPricing) {
        throw new Error(
          `missing pricing image resolution: ${entry.family}/${scene}`
        );
      }

      if (resolutionPricing.availability !== 'enabled') {
        throw new Error(
          `unavailable pricing image resolution: ${entry.family}/${scene}`
        );
      }

      if (!isFinitePositiveNumber(resolutionPricing.credits)) {
        throw new Error(
          `invalid fixed image resolution pricing: ${entry.family}/${scene}`
        );
      }

      return resolutionPricing.credits;
    }

    return pricing.credits;
  }

  if (pricing.mode === 'perSecond') {
    let creditsPerSecond = pricing.creditsPerSecond;

    if (pricing.byResolution) {
      const resolution = resolveResolution(entry, scene, finalOptions);
      const resolutionPricing = pricing.byResolution[resolution];

      if (!resolutionPricing) {
        throw new Error(`missing pricing resolution: ${entry.family}/${scene}`);
      }

      if (resolutionPricing.availability !== 'enabled') {
        throw new Error(
          `unavailable pricing resolution: ${entry.family}/${scene}`
        );
      }

      creditsPerSecond = resolutionPricing.creditsPerSecond;
    }

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
  music: {
    'text-to-music': 10,
  },
};

/**
 * Legacy static credit fallback for non image/video generation paths.
 * Image and video pricing must use resolveGenerationPricingSnapshot().
 */
export function getGenerationCreditCost({
  mediaType,
  scene,
}: GenerationCreditCostInput): number {
  if (mediaType === 'image' || mediaType === 'video') {
    throw new Error('legacy credit cost is unavailable for image/video');
  }

  const mediaCosts = DEFAULT_SCENE_CREDIT_COSTS[mediaType];

  if (!mediaCosts) {
    throw new Error('invalid mediaType');
  }

  const normalizedScene = mediaType === 'music' ? 'text-to-music' : scene;

  if (!normalizedScene) {
    throw new Error('invalid scene');
  }

  const cost = mediaCosts[normalizedScene];

  if (typeof cost !== 'number') {
    throw new Error('invalid scene');
  }

  return cost;
}
