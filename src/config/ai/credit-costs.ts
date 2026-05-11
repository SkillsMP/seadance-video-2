import { MODELS } from './models';

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
