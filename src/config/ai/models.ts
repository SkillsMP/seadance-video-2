/**
 * Trusted Model Registry
 *
 * 【架构设计核心概念：family】
 * family 是「产品计费策略」与「底层技术供应商（Providers）」之间的核心解耦层。
 * - 前端表现：呈现为稳定、语义清晰、易于用户认知的“产品服务/计费档位”（例如：Seedance 2.0 Fast 720p），屏蔽底层复杂多变的技术实现细节。
 * - 后端处理：作为高内聚的 SKU 抽象，使后端可基于服务可用性、延迟等指标，动态且透明地对真实供应商进行切换与容灾路由。
 * `family` is a stable billing SKU identifier surfaced as a product choice,
 * not a model lineage tag. For example, `seedance-2-fast-480p-video-input` is
 * a billing tier, not a model family name.
 *
 * 核心约束（Invariant）：
 * 相同的 (mediaType, family, scene) 组合，其积分消耗（credits）在所有供应商（providers）之间必须完全一致。
 * 价格是属于 SKU（family）的固有属，family is a billing SKU，而不是底层具体服务供应商的属性。
 */

export interface ModelEntry {
  /** 媒体类型：图像 ('image') | 视频 ('video') | 音乐 ('music') */
  mediaType: 'image' | 'video' | 'music';
  /** 统一计费 SKU 标识符，作为产品选项，也是路由和计费校验的核心标识（如 'seedance-2-fast-720p'） */
  family: string;
  /** 底层具体技术供应商的模型物理名/版本 ID（例如：'bytedance/seedance-2-fast'） */
  value: string;
  /** 前端下拉框或界面呈现给用户的友好显示名称（例如：'Seedance 2.0 Fast 720p'） */
  label: string;
  /** 模型供应商的唯一标识符（例如：'kie', 'replicate'） */
  provider: string;
  /** 适用的生成场景列表（例如：['text-to-video', 'video-to-video']） */
  scenes: string[];
  /** 是否启用该模型项。设置为 false 则不参与前端展示与后端路由 */
  enabled: boolean;
  /** 积分消耗配置。Key 为具体场景 (scene)，Value 为单次生成所需消耗的积分数量 */
  credits: Record<string, number>;
  /** 服务端强控参数字典。指定场景下，后端发起生成请求时强制覆盖/注入的 API 参数（例如分辨率、宽高比、时长限制等） */
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
