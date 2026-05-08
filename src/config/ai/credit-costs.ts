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
    'text-to-image': 4,
    'image-to-image': 6,
  },
  video: {
    'text-to-video': 6,
    'image-to-video': 8,
    'video-to-video': 10,
  },
  music: {
    'text-to-music': 10,
  },
};

export function getGenerationCreditCost({
  mediaType,
  scene,
}: GenerationCreditCostInput): number {
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
