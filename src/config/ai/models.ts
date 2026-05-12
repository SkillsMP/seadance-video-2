/**
 * Trusted Model Registry
 *
 * `family` is a stable billing SKU identifier surfaced as a product choice,
 * not a model lineage tag. For example, `seedance-2-fast-480p-video-input` is
 * a billing tier, not a model family name.
 *
 * Invariant: for the same (mediaType, family, scene), credits MUST be
 * identical across all providers. family is a billing SKU; price is a property
 * of the SKU, not of the provider serving it.
 */

export interface ModelEntry {
  mediaType: 'image' | 'video' | 'music';
  family: string;
  value: string;
  label: string;
  provider: string;
  scenes: string[];
  enabled: boolean;
  credits: Record<string, number>;
  enforced?: Record<string, Record<string, unknown>>;
}

export const MODELS: ModelEntry[] = [
  {
    mediaType: 'image',
    family: 'nano-banana-pro',
    value: 'nano-banana-pro',
    label: 'Nano Banana Pro',
    provider: 'kie',
    scenes: ['text-to-image', 'image-to-image'],
    enabled: true,
    credits: { 'text-to-image': 20, 'image-to-image': 20 },
  },
  {
    mediaType: 'image',
    family: 'nano-banana-2',
    value: 'nano-banana-2',
    label: 'Nano Banana 2',
    provider: 'kie',
    scenes: ['text-to-image', 'image-to-image'],
    enabled: true,
    credits: { 'text-to-image': 15, 'image-to-image': 15 },
  },
  {
    mediaType: 'image',
    family: 'nano-banana',
    value: 'google/nano-banana',
    label: 'Nano Banana',
    provider: 'kie',
    scenes: ['text-to-image'],
    enabled: true,
    credits: { 'text-to-image': 5 },
  },
  {
    mediaType: 'image',
    family: 'nano-banana',
    value: 'google/nano-banana-edit',
    label: 'Nano Banana',
    provider: 'kie',
    scenes: ['image-to-image'],
    enabled: true,
    credits: { 'image-to-image': 5 },
  },
  {
    mediaType: 'video',
    family: 'sora-2-lite',
    value: 'sora-2-text-to-video',
    label: 'Sora 2 Lite',
    provider: 'kie',
    scenes: ['text-to-video'],
    enabled: true,
    credits: { 'text-to-video': 30 },
  },
  {
    mediaType: 'video',
    family: 'seedance-2-fast-480p',
    value: 'bytedance/seedance-2-fast',
    label: 'Seedance 2.0 Fast 480p',
    provider: 'kie',
    scenes: ['text-to-video'],
    enabled: true,
    credits: { 'text-to-video': 45 },
    enforced: {
      'text-to-video': {
        resolution: '480p',
        duration: 5,
        generate_audio: false,
        aspect_ratio: '16:9',
      },
    },
  },
  {
    mediaType: 'video',
    family: 'seedance-2-fast-720p',
    value: 'bytedance/seedance-2-fast',
    label: 'Seedance 2.0 Fast 720p',
    provider: 'kie',
    scenes: ['text-to-video'],
    enabled: true,
    credits: { 'text-to-video': 90 },
    enforced: {
      'text-to-video': {
        resolution: '720p',
        duration: 5,
        generate_audio: false,
        aspect_ratio: '16:9',
      },
    },
  },
  {
    mediaType: 'video',
    family: 'seedance-2-fast-480p-video-input',
    value: 'bytedance/seedance-2-fast',
    label: 'Seedance 2.0 Fast 480p',
    provider: 'kie',
    scenes: ['video-to-video'],
    enabled: true,
    credits: { 'video-to-video': 45 },
    enforced: {
      'video-to-video': {
        resolution: '480p',
        duration: 5,
        generate_audio: false,
        aspect_ratio: '16:9',
      },
    },
  },
  {
    mediaType: 'video',
    family: 'sora-2-pro',
    value: 'sora-2-pro-image-to-video',
    label: 'Sora 2 Pro',
    provider: 'kie',
    scenes: ['image-to-video'],
    enabled: true,
    credits: { 'image-to-video': 90 },
  },
  {
    mediaType: 'video',
    family: 'sora-2-pro',
    value: 'sora-2-pro-text-to-video',
    label: 'Sora 2 Pro',
    provider: 'kie',
    scenes: ['text-to-video'],
    enabled: true,
    credits: { 'text-to-video': 90 },
  },
];

export function findModel(
  mediaType: string,
  provider: string,
  family: string,
  scene: string,
  model: string
): ModelEntry | undefined {
  return MODELS.find(
    (m) =>
      m.enabled &&
      m.mediaType === mediaType &&
      m.provider === provider &&
      m.family === family &&
      m.scenes.includes(scene) &&
      m.value === model
  );
}

export function validateModels(): string[] {
  const errors: string[] = [];
  const enabledModels = MODELS.filter((m) => m.enabled);

  for (const m of enabledModels) {
    for (const scene of m.scenes) {
      if (typeof m.credits[scene] !== 'number') {
        errors.push(`missing credits: ${m.family}/${scene}`);
      }
    }
  }

  const creditsSeen = new Map<string, number>();
  for (const m of enabledModels) {
    for (const scene of m.scenes) {
      const key = `${m.mediaType}/${m.family}/${scene}`;
      const cost = m.credits[scene];

      if (creditsSeen.has(key) && creditsSeen.get(key) !== cost) {
        errors.push(
          `credits drift: ${key} has ${creditsSeen.get(key)} and ${cost}`
        );
      } else {
        creditsSeen.set(key, cost);
      }
    }
  }

  const entryKeys = new Set<string>();
  for (const m of enabledModels) {
    for (const scene of m.scenes) {
      const key = `${m.mediaType}/${m.provider}/${m.family}/${scene}/${m.value}`;
      if (entryKeys.has(key)) {
        errors.push(`duplicate model entry: ${key}`);
      }
      entryKeys.add(key);
    }
  }

  for (const m of enabledModels) {
    for (const enforcedScene of Object.keys(m.enforced ?? {})) {
      if (!m.scenes.includes(enforcedScene)) {
        errors.push(
          `enforced scene not in scenes: ${m.family}/${enforcedScene}`
        );
      }
    }
  }

  return errors;
}
