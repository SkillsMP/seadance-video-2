/**
 * Trusted Model Registry
 *
 * 【架构设计核心概念：family】
 * family 是「产品计费策略」与「底层技术供应商（Providers）」之间的核心解耦层。
 * - 前端表现：呈现为稳定、语义清晰、易于用户认知的“产品服务/计费档位”（例如：Seedance 2.0 Fast 720p），屏蔽底层复杂多变的技术实现细节。
 * - 后端处理：作为高内聚的 SKU 抽象，使后端可基于服务可用性、延迟等指标，动态且透明地对真实供应商进行切换与容灾路由。
 * `family` is a stable product model family surfaced as a product choice.
 * Resolution and input billing live in scene metadata and pricing.
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
  /**
   * Optional UI metadata for generator controls.
   * Keep billing out of controls. Pricing decides whether a control affects cost.
   */
  label?: string;
  ui?: 'select' | 'switch';
  order?: number;
}

export type SceneControls = Record<string, ControlOption>;

export interface ScenePricing {
  mode: 'fixed' | 'perSecond';
  credits?: number;
  creditsPerSecond?: number;
  defaultDuration?: number;
  byResolution?: Partial<Record<VideoResolution, VideoResolutionPricing>>;
}

export type SceneParameterMap = Partial<
  Record<string, Record<string, unknown>>
>;
export type SceneControlsMap = Partial<Record<string, SceneControls>>;
export type ScenePricingMap = Partial<Record<string, ScenePricing>>;

export interface ModelEntry {
  /** 媒体类型：图像 ('image') | 视频 ('video') | 音乐 ('music') */
  mediaType: 'image' | 'video' | 'music';
  /** Product model family key used for routing, display grouping, and pricing lookup. */
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
export type VideoResolution = '480p' | '720p' | '1080p';
/**
 * 视频定价可用性状态：
 * - enabled: 普通用户可选，生成器 controls 会展示
 * - candidate: 候选/预埋规格，价格先写好，但普通用户暂不可选
 * - whitelist: 灰度/内部可用，普通用户不可选
 * - disabled: 禁用
 */
export type VideoPricingAvailability =
  | 'enabled'
  | 'candidate'
  | 'whitelist'
  | 'disabled';

export interface VideoResolutionPricing {
  creditsPerSecond: number;
  availability: VideoPricingAvailability;
}

type SeedanceResolution = VideoResolution;

interface SeedanceCatalogItem {
  family: string;
  modelValue: string;
  label: string;
  scene: SeedanceScene;
  enabled: boolean;
  defaultResolution: SeedanceResolution;
  inputBilling: 'no-video-input' | 'video-input';
  credits: number;
  durationOptions: number[];
  byResolution: Partial<Record<SeedanceResolution, VideoResolutionPricing>>;
}

const SEEDANCE_CATALOG: SeedanceCatalogItem[] = [
  {
    family: 'seedance-2-fast',
    modelValue: SEEDANCE_FAST_MODEL_VALUE,
    label: 'Seedance 2.0 Fast',
    scene: 'text-to-video',
    enabled: true,
    defaultResolution: '480p',
    inputBilling: 'no-video-input',
    credits: 45,
    durationOptions: SEEDANCE_TEXT_DURATION_OPTIONS,
    byResolution: {
      '480p': { creditsPerSecond: 12, availability: 'enabled' },
      '720p': { creditsPerSecond: 24, availability: 'enabled' },
    },
  },
  {
    family: 'seedance-2-fast',
    modelValue: SEEDANCE_FAST_MODEL_VALUE,
    label: 'Seedance 2.0 Fast',
    scene: 'image-to-video',
    enabled: true,
    defaultResolution: '480p',
    inputBilling: 'no-video-input',
    credits: 60,
    durationOptions: SEEDANCE_TEXT_DURATION_OPTIONS,
    byResolution: {
      '480p': { creditsPerSecond: 12, availability: 'enabled' },
      '720p': { creditsPerSecond: 24, availability: 'enabled' },
    },
  },
  {
    family: 'seedance-2-fast',
    modelValue: SEEDANCE_FAST_MODEL_VALUE,
    label: 'Seedance 2.0 Fast',
    scene: 'video-to-video',
    enabled: true,
    defaultResolution: '480p',
    inputBilling: 'video-input',
    credits: 45,
    durationOptions: SEEDANCE_VIDEO_DURATION_OPTIONS,
    byResolution: {
      '480p': { creditsPerSecond: 7, availability: 'enabled' },
      '720p': { creditsPerSecond: 15, availability: 'enabled' },
    },
  },
  {
    family: 'seedance-2-standard',
    modelValue: SEEDANCE_STANDARD_MODEL_VALUE,
    label: 'Seedance 2.0 Standard',
    scene: 'text-to-video',
    enabled: true,
    defaultResolution: '480p',
    inputBilling: 'no-video-input',
    credits: 70,
    durationOptions: SEEDANCE_TEXT_DURATION_OPTIONS,
    byResolution: {
      '480p': { creditsPerSecond: 14, availability: 'enabled' },
      '720p': { creditsPerSecond: 30, availability: 'enabled' },
      '1080p': { creditsPerSecond: 75, availability: 'enabled' },
    },
  },
  {
    family: 'seedance-2-standard',
    modelValue: SEEDANCE_STANDARD_MODEL_VALUE,
    label: 'Seedance 2.0 Standard',
    scene: 'image-to-video',
    enabled: true,
    defaultResolution: '480p',
    inputBilling: 'no-video-input',
    credits: 70,
    durationOptions: SEEDANCE_TEXT_DURATION_OPTIONS,
    byResolution: {
      '480p': { creditsPerSecond: 14, availability: 'enabled' },
      '720p': { creditsPerSecond: 30, availability: 'enabled' },
      '1080p': { creditsPerSecond: 75, availability: 'enabled' },
    },
  },
  {
    family: 'seedance-2-standard',
    modelValue: SEEDANCE_STANDARD_MODEL_VALUE,
    label: 'Seedance 2.0 Standard',
    scene: 'video-to-video',
    enabled: true,
    defaultResolution: '480p',
    inputBilling: 'video-input',
    credits: 45,
    durationOptions: SEEDANCE_VIDEO_DURATION_OPTIONS,
    byResolution: {
      '480p': { creditsPerSecond: 9, availability: 'enabled' },
      '720p': { creditsPerSecond: 18, availability: 'enabled' },
      '1080p': { creditsPerSecond: 45, availability: 'enabled' },
    },
  },
];

function getResolutionPricingEntries(
  byResolution: Partial<Record<SeedanceResolution, VideoResolutionPricing>>
): Array<[SeedanceResolution, VideoResolutionPricing | undefined]> {
  return Object.entries(byResolution) as Array<
    [SeedanceResolution, VideoResolutionPricing | undefined]
  >;
}

function getEnabledResolutionOptions(
  byResolution: Partial<Record<SeedanceResolution, VideoResolutionPricing>>
): SeedanceResolution[] {
  return getResolutionPricingEntries(byResolution).flatMap(
    ([resolution, pricing]) =>
      pricing?.availability === 'enabled' ? [resolution] : []
  );
}

function createSeedanceEntry(item: SeedanceCatalogItem): ModelEntry {
  const scene = item.scene;
  const controls: SceneControls = {
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
    generate_audio: {
      type: 'boolean',
      default: false,
      options: [false, true],
      label: 'Generate Audio',
      ui: 'switch',
      order: 40,
    },
  };
  const enabledResolutionOptions = getEnabledResolutionOptions(
    item.byResolution
  );

  if (enabledResolutionOptions.length > 0) {
    controls.resolution = {
      type: 'string',
      default: item.defaultResolution,
      options: enabledResolutionOptions,
    };
  }

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
        inputBilling: item.inputBilling,
      },
    },
    defaults: {
      [scene]: {
        duration: SEEDANCE_DEFAULT_DURATION,
        aspect_ratio: SEEDANCE_DEFAULT_ASPECT_RATIO,
        resolution: item.defaultResolution,
        generate_audio: false,
      },
    },
    controls: {
      [scene]: controls,
    },
    pricing: {
      [scene]: {
        mode: 'perSecond',
        defaultDuration: SEEDANCE_DEFAULT_DURATION,
        byResolution: item.byResolution,
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

function isControlUI(
  value: unknown
): value is NonNullable<ControlOption['ui']> {
  return value === 'select' || value === 'switch';
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

      if (
        control.label !== undefined &&
        (typeof control.label !== 'string' || !control.label.trim())
      ) {
        errors.push(
          `control label is invalid: ${modelRef(model)}/${scene}/${name}`
        );
      }

      if (control.ui !== undefined && !isControlUI(control.ui)) {
        errors.push(
          `control ui is invalid: ${modelRef(model)}/${scene}/${name}`
        );
      }

      if (
        control.order !== undefined &&
        (typeof control.order !== 'number' || !Number.isFinite(control.order))
      ) {
        errors.push(
          `control order is invalid: ${modelRef(model)}/${scene}/${name}`
        );
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

function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function isVideoPricingAvailability(
  value: unknown
): value is VideoPricingAvailability {
  return (
    value === 'enabled' ||
    value === 'candidate' ||
    value === 'whitelist' ||
    value === 'disabled'
  );
}

const VIDEO_INPUT_BILLING_BY_SCENE: Record<SeedanceScene, string> = {
  'text-to-video': 'no-video-input',
  'image-to-video': 'no-video-input',
  'video-to-video': 'video-input',
};

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

    const byResolution = pricing.byResolution;

    if (pricing.mode === 'fixed') {
      if (!isNonNegativeNumber(pricing.credits)) {
        errors.push(
          `pricing fixed credits is invalid: ${modelRef(model)}/${scene}`
        );
      }
      if (byResolution !== undefined) {
        errors.push(
          `pricing byResolution is only valid for perSecond: ${modelRef(model)}/${scene}`
        );
      }
    } else if (pricing.mode === 'perSecond') {
      if (byResolution === undefined) {
        if (!isNonNegativeNumber(pricing.creditsPerSecond)) {
          errors.push(
            `pricing creditsPerSecond is invalid: ${modelRef(model)}/${scene}`
          );
        }
      } else if (!isPlainRecord(byResolution)) {
        errors.push(
          `pricing byResolution must be an object: ${modelRef(model)}/${scene}`
        );
      } else {
        for (const [resolution, resolutionPricing] of Object.entries(
          byResolution
        )) {
          if (!['480p', '720p', '1080p'].includes(resolution)) {
            errors.push(
              `pricing resolution is invalid: ${modelRef(model)}/${scene}/${resolution}`
            );
          }

          if (!isPlainRecord(resolutionPricing)) {
            errors.push(
              `pricing resolution value must be an object: ${modelRef(model)}/${scene}/${resolution}`
            );
            continue;
          }

          if (!isPositiveNumber(resolutionPricing.creditsPerSecond)) {
            errors.push(
              `pricing resolution creditsPerSecond is invalid: ${modelRef(model)}/${scene}/${resolution}`
            );
          }

          if (!isVideoPricingAvailability(resolutionPricing.availability)) {
            errors.push(
              `pricing availability is invalid: ${modelRef(model)}/${scene}/${resolution}`
            );
          }
        }
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

function getVideoInputBilling(
  model: ModelEntry,
  scene: string
): string | undefined {
  if (!(scene in VIDEO_INPUT_BILLING_BY_SCENE)) {
    return undefined;
  }

  const expected =
    VIDEO_INPUT_BILLING_BY_SCENE[
      scene as keyof typeof VIDEO_INPUT_BILLING_BY_SCENE
    ];
  const skuAttributes = model.skuAttributes?.[scene];

  if (!isPlainRecord(skuAttributes)) {
    return expected;
  }

  const inputBilling = skuAttributes.inputBilling;
  return typeof inputBilling === 'string' ? inputBilling : expected;
}

function validateVideoModelMetadata(model: ModelEntry, errors: string[]): void {
  if (model.mediaType !== 'video') {
    return;
  }

  if (
    model.family.startsWith('seedance-2-') &&
    /-\d{3,4}p(?:-|$)|-video-input(?:-|$)/.test(model.family)
  ) {
    errors.push(`video family is not converged: ${model.family}`);
  }

  for (const scene of model.scenes) {
    const expectedInputBilling = getVideoInputBilling(model, scene);
    const configuredInputBilling = model.skuAttributes?.[scene]?.inputBilling;

    if (
      expectedInputBilling &&
      configuredInputBilling !== undefined &&
      configuredInputBilling !== expectedInputBilling
    ) {
      errors.push(
        `inputBilling does not match scene: ${modelRef(model)}/${scene}`
      );
    }
  }
}

function validateVideoResolutionControls(
  model: ModelEntry,
  errors: string[]
): void {
  if (model.mediaType !== 'video' || !model.pricing) {
    return;
  }

  for (const [scene, pricing] of Object.entries(model.pricing)) {
    const byResolution = pricing?.byResolution;
    if (!byResolution) {
      continue;
    }

    const enabledResolutionOptions = getEnabledResolutionOptions(byResolution);
    const resolutionControl = model.controls?.[scene]?.resolution;
    if (enabledResolutionOptions.length === 0) {
      if (model.enabled) {
        errors.push(`missing enabled resolution: ${modelRef(model)}/${scene}`);
      }

      if (resolutionControl) {
        errors.push(
          `resolution control has no enabled pricing: ${modelRef(model)}/${scene}`
        );
      }
      continue;
    }

    if (!resolutionControl) {
      errors.push(`missing resolution control: ${modelRef(model)}/${scene}`);
      continue;
    }

    if (resolutionControl.type !== 'string') {
      errors.push(
        `resolution control must be string: ${modelRef(model)}/${scene}`
      );
      continue;
    }

    const resolutionOptions = resolutionControl.options;
    for (const option of resolutionOptions) {
      if (typeof option !== 'string') {
        errors.push(
          `resolution control option is invalid: ${modelRef(model)}/${scene}/${String(
            option
          )}`
        );
        continue;
      }

      const optionPricing = byResolution[option as VideoResolution];
      if (!optionPricing) {
        errors.push(
          `resolution control option missing pricing: ${modelRef(model)}/${scene}/${option}`
        );
        continue;
      }

      if (optionPricing.availability !== 'enabled') {
        errors.push(
          `resolution control option is not enabled: ${modelRef(model)}/${scene}/${option}`
        );
      }
    }

    const defaultResolution = resolutionControl.default;
    if (typeof defaultResolution !== 'string') {
      continue;
    }

    const defaultPricing = byResolution[defaultResolution as VideoResolution];
    if (!defaultPricing) {
      errors.push(
        `resolution control default missing pricing: ${modelRef(model)}/${scene}/${defaultResolution}`
      );
      continue;
    }

    if (defaultPricing.availability !== 'enabled') {
      errors.push(
        `resolution control default is not enabled: ${modelRef(model)}/${scene}/${defaultResolution}`
      );
    }
  }
}

function validateVideoPricingCostPaths(errors: string[]): void {
  const costsByPath = new Map<string, number>();

  for (const model of MODELS) {
    if (model.mediaType !== 'video' || !model.pricing) {
      continue;
    }

    for (const [scene, pricing] of Object.entries(model.pricing)) {
      const inputBilling = getVideoInputBilling(model, scene);
      if (!inputBilling || !pricing?.byResolution) {
        continue;
      }

      for (const [resolution, resolutionPricing] of Object.entries(
        pricing.byResolution
      )) {
        if (!resolutionPricing) {
          continue;
        }

        const key = `${model.mediaType}/${model.family}/${resolution}/${inputBilling}`;
        const creditsPerSecond = resolutionPricing.creditsPerSecond;

        if (costsByPath.has(key) && costsByPath.get(key) !== creditsPerSecond) {
          errors.push(
            `pricing cost path drift: ${key} has ${costsByPath.get(
              key
            )} and ${creditsPerSecond}`
          );
        } else {
          costsByPath.set(key, creditsPerSecond);
        }
      }
    }
  }
}

function stableStringifyConfig(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringifyConfig).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map(
        (key) => `${JSON.stringify(key)}:${stableStringifyConfig(record[key])}`
      )
      .join(',')}}`;
  }

  return JSON.stringify(value) ?? 'undefined';
}

function getFallbackConfigSignature(model: ModelEntry, scene: string): string {
  return stableStringifyConfig({
    controls: model.controls?.[scene],
    defaults: model.defaults?.[scene],
    enforced: model.enforced?.[scene],
    pricing: model.pricing?.[scene],
    skuAttributes: model.skuAttributes?.[scene],
  });
}

function validateFallbackCandidateConfigConsistency(errors: string[]): void {
  const signaturesByGroup = new Map<string, string>();

  for (const model of MODELS) {
    if (!model.enabled) {
      continue;
    }

    for (const scene of model.scenes) {
      const key = `${model.mediaType}/${model.family}/${scene}`;
      const signature = getFallbackConfigSignature(model, scene);
      const existingSignature = signaturesByGroup.get(key);

      if (existingSignature && existingSignature !== signature) {
        errors.push(`fallback candidate config drift: ${key}`);
      } else {
        signaturesByGroup.set(key, signature);
      }
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
    validateVideoModelMetadata(m, errors);
    validateVideoResolutionControls(m, errors);
  }

  validateVideoPricingCostPaths(errors);
  validateFallbackCandidateConfigConsistency(errors);

  return errors;
}
