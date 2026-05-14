// 以后删，以后等 music 也纳入 MODELS + candidates，并且没有旧 provider/model 路径后，再考虑把 getGenerationCreditCost() 移到 models.ts 或 src/config/ai/pricing.ts，然后删掉 credit-costs.ts
// 明确它是派生层，不是配置源。短期保持，但未来考虑清理。收窄它的职责。
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
