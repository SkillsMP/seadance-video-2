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

export type ControlValue = string | number | boolean;

export interface ControlOption<T extends ControlValue = ControlValue> {
  type: 'string' | 'number' | 'boolean';
  default: T;
  options: T[];
}

export type SceneControls = Record<string, ControlOption>;

export interface ScenePricing {
  mode: 'fixed' | 'perSecond';
  credits?: number;
  creditsPerSecond?: number;
  defaultDuration?: number;
}

export type SceneParameterMap = Partial<
  Record<string, Record<string, unknown>>
>;
export type SceneControlsMap = Partial<Record<string, SceneControls>>;
export type ScenePricingMap = Partial<Record<string, ScenePricing>>;

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
  /** SKU intrinsic attributes reserved for future finalOptions/pricing resolution. */
  skuAttributes?: SceneParameterMap;
  /** Default generation options reserved for future dynamic controls. */
  defaults?: SceneParameterMap;
  /** User-controllable option schema reserved for future UI/server validation. */
  controls?: SceneControlsMap;
  /** Pricing metadata reserved for future dynamic billing. Not used for current charging. */
  pricing?: ScenePricingMap;
  /** 服务端强控参数字典。指定场景下，后端发起生成请求时强制覆盖/注入的 API 参数（例如分辨率、宽高比、时长限制等） */
  enforced?: SceneParameterMap;
}

const SEEDANCE_FAST_MODEL_VALUE = 'bytedance/seedance-2-fast';
const SEEDANCE_STANDARD_MODEL_VALUE = 'bytedance/seedance-2';
const SEEDANCE_DEFAULT_DURATION = 5;
const SEEDANCE_DEFAULT_ASPECT_RATIO = '16:9';
const SEEDANCE_TEXT_DURATION_OPTIONS = [
  4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
];
const SEEDANCE_VIDEO_DURATION_OPTIONS = [5, 10];
const SEEDANCE_ASPECT_RATIO_OPTIONS = ['16:9', '9:16', '1:1', '4:3', '3:4'];

type SeedanceScene = 'text-to-video' | 'image-to-video' | 'video-to-video';
type SeedanceResolution = '480p' | '720p' | '1080p';

interface SeedanceCatalogItem {
  family: string;
  modelValue: string;
  label: string;
  scene: SeedanceScene;
  enabled: boolean;
  resolution: SeedanceResolution;
  inputBilling: 'no-video-input' | 'video-input';
  credits: number;
  creditsPerSecond?: number;
  durationOptions: number[];
}

const SEEDANCE_CATALOG: SeedanceCatalogItem[] = [
  {
    family: 'seedance-2-fast-480p',
    modelValue: SEEDANCE_FAST_MODEL_VALUE,
    label: 'Seedance 2.0 Fast 480p',
    scene: 'text-to-video',
    enabled: true,
    resolution: '480p',
    inputBilling: 'no-video-input',
    credits: 45,
    durationOptions: SEEDANCE_TEXT_DURATION_OPTIONS,
  },
  {
    family: 'seedance-2-fast-480p',
    modelValue: SEEDANCE_FAST_MODEL_VALUE,
    label: 'Seedance 2.0 Fast 480p',
    scene: 'image-to-video',
    enabled: false,
    resolution: '480p',
    inputBilling: 'no-video-input',
    credits: 60,
    creditsPerSecond: 12,
    durationOptions: SEEDANCE_TEXT_DURATION_OPTIONS,
  },
  {
    family: 'seedance-2-fast-720p',
    modelValue: SEEDANCE_FAST_MODEL_VALUE,
    label: 'Seedance 2.0 Fast 720p',
    scene: 'text-to-video',
    enabled: true,
    resolution: '720p',
    inputBilling: 'no-video-input',
    credits: 90,
    durationOptions: SEEDANCE_TEXT_DURATION_OPTIONS,
  },
  {
    family: 'seedance-2-fast-720p',
    modelValue: SEEDANCE_FAST_MODEL_VALUE,
    label: 'Seedance 2.0 Fast 720p',
    scene: 'image-to-video',
    enabled: false,
    resolution: '720p',
    inputBilling: 'no-video-input',
    credits: 120,
    creditsPerSecond: 24,
    durationOptions: SEEDANCE_TEXT_DURATION_OPTIONS,
  },
  {
    family: 'seedance-2-fast-480p-video-input',
    modelValue: SEEDANCE_FAST_MODEL_VALUE,
    label: 'Seedance 2.0 Fast 480p',
    scene: 'video-to-video',
    enabled: true,
    resolution: '480p',
    inputBilling: 'video-input',
    credits: 45,
    durationOptions: SEEDANCE_VIDEO_DURATION_OPTIONS,
  },
  {
    family: 'seedance-2-fast-720p-video-input',
    modelValue: SEEDANCE_FAST_MODEL_VALUE,
    label: 'Seedance 2.0 Fast 720p',
    scene: 'video-to-video',
    enabled: false,
    resolution: '720p',
    inputBilling: 'video-input',
    credits: 75,
    creditsPerSecond: 15,
    durationOptions: SEEDANCE_TEXT_DURATION_OPTIONS,
  },
  {
    family: 'seedance-2-standard-480p',
    modelValue: SEEDANCE_STANDARD_MODEL_VALUE,
    label: 'Seedance 2.0 Standard 480p',
    scene: 'text-to-video',
    enabled: false,
    resolution: '480p',
    inputBilling: 'no-video-input',
    credits: 70,
    creditsPerSecond: 14,
    durationOptions: SEEDANCE_TEXT_DURATION_OPTIONS,
  },
  {
    family: 'seedance-2-standard-480p',
    modelValue: SEEDANCE_STANDARD_MODEL_VALUE,
    label: 'Seedance 2.0 Standard 480p',
    scene: 'image-to-video',
    enabled: false,
    resolution: '480p',
    inputBilling: 'no-video-input',
    credits: 70,
    creditsPerSecond: 14,
    durationOptions: SEEDANCE_TEXT_DURATION_OPTIONS,
  },
  {
    family: 'seedance-2-standard-480p-video-input',
    modelValue: SEEDANCE_STANDARD_MODEL_VALUE,
    label: 'Seedance 2.0 Standard 480p',
    scene: 'video-to-video',
    enabled: false,
    resolution: '480p',
    inputBilling: 'video-input',
    credits: 45,
    creditsPerSecond: 9,
    durationOptions: SEEDANCE_TEXT_DURATION_OPTIONS,
  },
  {
    family: 'seedance-2-standard-720p',
    modelValue: SEEDANCE_STANDARD_MODEL_VALUE,
    label: 'Seedance 2.0 Standard 720p',
    scene: 'text-to-video',
    enabled: false,
    resolution: '720p',
    inputBilling: 'no-video-input',
    credits: 150,
    creditsPerSecond: 30,
    durationOptions: SEEDANCE_TEXT_DURATION_OPTIONS,
  },
  {
    family: 'seedance-2-standard-720p',
    modelValue: SEEDANCE_STANDARD_MODEL_VALUE,
    label: 'Seedance 2.0 Standard 720p',
    scene: 'image-to-video',
    enabled: false,
    resolution: '720p',
    inputBilling: 'no-video-input',
    credits: 150,
    creditsPerSecond: 30,
    durationOptions: SEEDANCE_TEXT_DURATION_OPTIONS,
  },
  {
    family: 'seedance-2-standard-720p-video-input',
    modelValue: SEEDANCE_STANDARD_MODEL_VALUE,
    label: 'Seedance 2.0 Standard 720p',
    scene: 'video-to-video',
    enabled: false,
    resolution: '720p',
    inputBilling: 'video-input',
    credits: 90,
    creditsPerSecond: 18,
    durationOptions: SEEDANCE_TEXT_DURATION_OPTIONS,
  },
  {
    family: 'seedance-2-standard-1080p',
    modelValue: SEEDANCE_STANDARD_MODEL_VALUE,
    label: 'Seedance 2.0 Standard 1080p',
    scene: 'text-to-video',
    enabled: false,
    resolution: '1080p',
    inputBilling: 'no-video-input',
    credits: 375,
    creditsPerSecond: 75,
    durationOptions: SEEDANCE_TEXT_DURATION_OPTIONS,
  },
  {
    family: 'seedance-2-standard-1080p',
    modelValue: SEEDANCE_STANDARD_MODEL_VALUE,
    label: 'Seedance 2.0 Standard 1080p',
    scene: 'image-to-video',
    enabled: false,
    resolution: '1080p',
    inputBilling: 'no-video-input',
    credits: 375,
    creditsPerSecond: 75,
    durationOptions: SEEDANCE_TEXT_DURATION_OPTIONS,
  },
  {
    family: 'seedance-2-standard-1080p-video-input',
    modelValue: SEEDANCE_STANDARD_MODEL_VALUE,
    label: 'Seedance 2.0 Standard 1080p',
    scene: 'video-to-video',
    enabled: false,
    resolution: '1080p',
    inputBilling: 'video-input',
    credits: 225,
    creditsPerSecond: 45,
    durationOptions: SEEDANCE_TEXT_DURATION_OPTIONS,
  },
];

function createSeedanceEntry(item: SeedanceCatalogItem): ModelEntry {
  const scene = item.scene;

  return {
    mediaType: 'video',
    family: item.family,
    value: item.modelValue,
    label: item.label,
    provider: 'kie',
    scenes: [scene],
    enabled: item.enabled,
    credits: { [scene]: item.credits },
    skuAttributes: {
      [scene]: {
        resolution: item.resolution,
        inputBilling: item.inputBilling,
      },
    },
    defaults: {
      [scene]: {
        duration: SEEDANCE_DEFAULT_DURATION,
        aspect_ratio: SEEDANCE_DEFAULT_ASPECT_RATIO,
      },
    },
    controls: {
      [scene]: {
        duration: {
          type: 'number',
          default: SEEDANCE_DEFAULT_DURATION,
          options: item.durationOptions,
        },
        aspect_ratio: {
          type: 'string',
          default: SEEDANCE_DEFAULT_ASPECT_RATIO,
          options: SEEDANCE_ASPECT_RATIO_OPTIONS,
        },
      },
    },
    pricing: {
      [scene]: {
        mode: 'perSecond',
        // Enabled legacy entries mirror current fixed credits; disabled
        // candidates may carry the Phase 0A-post matrix prefill.
        creditsPerSecond:
          item.creditsPerSecond ?? item.credits / SEEDANCE_DEFAULT_DURATION,
        defaultDuration: SEEDANCE_DEFAULT_DURATION,
      },
    },
    enforced: {
      [scene]: {
        resolution: item.resolution,
        duration: SEEDANCE_DEFAULT_DURATION,
        generate_audio: false,
        aspect_ratio: SEEDANCE_DEFAULT_ASPECT_RATIO,
      },
    },
  };
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
  ...SEEDANCE_CATALOG.map(createSeedanceEntry),
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

const SCENE_CONFIG_FIELDS = [
  'skuAttributes',
  'defaults',
  'controls',
  'pricing',
  'enforced',
] as const;

function modelRef(model: ModelEntry): string {
  return `${model.mediaType}/${model.provider}/${model.family}/${model.value}`;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isControlType(value: unknown): value is ControlOption['type'] {
  return value === 'string' || value === 'number' || value === 'boolean';
}

function valueMatchesType(
  value: unknown,
  type: ControlOption['type']
): boolean {
  if (type === 'number') {
    return typeof value === 'number' && Number.isFinite(value);
  }

  return typeof value === type;
}

function optionsIncludeValue(options: unknown[], value: unknown): boolean {
  return options.some((option) => Object.is(option, value));
}

function validateSceneConfigKeys(model: ModelEntry, errors: string[]): void {
  for (const field of SCENE_CONFIG_FIELDS) {
    const configByScene = model[field];

    if (configByScene === undefined) {
      continue;
    }

    if (!isPlainRecord(configByScene)) {
      errors.push(`${field} must be an object: ${modelRef(model)}`);
      continue;
    }

    for (const scene of Object.keys(configByScene)) {
      if (!model.scenes.includes(scene)) {
        errors.push(`${field} scene not in scenes: ${model.family}/${scene}`);
      }
    }
  }
}

function validateParameterMaps(model: ModelEntry, errors: string[]): void {
  for (const field of ['skuAttributes', 'defaults', 'enforced'] as const) {
    const configByScene = model[field];

    if (!configByScene) {
      continue;
    }

    for (const [scene, params] of Object.entries(configByScene)) {
      if (!isPlainRecord(params)) {
        errors.push(
          `${field} scene value must be an object: ${modelRef(model)}/${scene}`
        );
      }
    }
  }
}

function validateControls(model: ModelEntry, errors: string[]): void {
  if (!model.controls) {
    return;
  }

  if (!isPlainRecord(model.controls)) {
    errors.push(`controls must be an object: ${modelRef(model)}`);
    return;
  }

  for (const [scene, controls] of Object.entries(model.controls)) {
    if (!isPlainRecord(controls)) {
      errors.push(
        `controls scene value must be an object: ${modelRef(model)}/${scene}`
      );
      continue;
    }

    for (const [name, control] of Object.entries(controls)) {
      if (!isPlainRecord(control)) {
        errors.push(
          `control must be an object: ${modelRef(model)}/${scene}/${name}`
        );
        continue;
      }

      const { type, options, default: defaultValue } = control;

      if (!isControlType(type)) {
        errors.push(
          `control type is invalid: ${modelRef(model)}/${scene}/${name}`
        );
        continue;
      }

      if (!('default' in control)) {
        errors.push(
          `control default is required: ${modelRef(model)}/${scene}/${name}`
        );
      } else if (!valueMatchesType(defaultValue, type)) {
        errors.push(
          `control default type mismatch: ${modelRef(model)}/${scene}/${name}`
        );
      }

      if (!('options' in control)) {
        errors.push(
          `control options are required: ${modelRef(model)}/${scene}/${name}`
        );
      } else if (!Array.isArray(options)) {
        errors.push(
          `control options must be an array: ${modelRef(model)}/${scene}/${name}`
        );
      }

      if (Array.isArray(options)) {
        for (const option of options) {
          if (!valueMatchesType(option, type)) {
            errors.push(
              `control option type mismatch: ${modelRef(model)}/${scene}/${name}`
            );
            break;
          }
        }

        if (
          'default' in control &&
          !optionsIncludeValue(options, defaultValue)
        ) {
          errors.push(
            `control default not in options: ${modelRef(model)}/${scene}/${name}`
          );
        }
      }
    }
  }
}

function validateDefaultsAgainstControls(
  model: ModelEntry,
  errors: string[]
): void {
  if (!model.defaults || !model.controls) {
    return;
  }

  for (const [scene, defaults] of Object.entries(model.defaults)) {
    if (!isPlainRecord(defaults)) {
      continue;
    }

    const controls = model.controls[scene];
    if (!isPlainRecord(controls)) {
      continue;
    }

    for (const [name, value] of Object.entries(defaults)) {
      const control = controls[name];
      if (!isPlainRecord(control) || !isControlType(control.type)) {
        continue;
      }

      if (!valueMatchesType(value, control.type)) {
        errors.push(
          `default value type mismatch: ${modelRef(model)}/${scene}/${name}`
        );
      }

      if (
        Array.isArray(control.options) &&
        !optionsIncludeValue(control.options, value)
      ) {
        errors.push(
          `default value not in options: ${modelRef(model)}/${scene}/${name}`
        );
      }
    }
  }
}

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function validatePricing(model: ModelEntry, errors: string[]): void {
  if (!model.pricing) {
    return;
  }

  if (!isPlainRecord(model.pricing)) {
    errors.push(`pricing must be an object: ${modelRef(model)}`);
    return;
  }

  for (const [scene, pricing] of Object.entries(model.pricing)) {
    if (!isPlainRecord(pricing)) {
      errors.push(
        `pricing scene value must be an object: ${modelRef(model)}/${scene}`
      );
      continue;
    }

    if (pricing.mode === 'fixed') {
      if (!isNonNegativeNumber(pricing.credits)) {
        errors.push(
          `pricing fixed credits is invalid: ${modelRef(model)}/${scene}`
        );
      }
    } else if (pricing.mode === 'perSecond') {
      if (!isNonNegativeNumber(pricing.creditsPerSecond)) {
        errors.push(
          `pricing creditsPerSecond is invalid: ${modelRef(model)}/${scene}`
        );
      }
    } else {
      errors.push(`pricing mode is invalid: ${modelRef(model)}/${scene}`);
    }

    if (
      pricing.defaultDuration !== undefined &&
      (!isNonNegativeNumber(pricing.defaultDuration) ||
        pricing.defaultDuration === 0)
    ) {
      errors.push(
        `pricing defaultDuration is invalid: ${modelRef(model)}/${scene}`
      );
    }
  }
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

  for (const m of MODELS) {
    validateSceneConfigKeys(m, errors);
    validateParameterMaps(m, errors);
    validateControls(m, errors);
    validateDefaultsAgainstControls(m, errors);
    validatePricing(m, errors);
  }

  return errors;
}
