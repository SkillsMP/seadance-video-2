import { type ControlOption, type ModelEntry } from './models';

export type GenerationOptions = Record<string, unknown>;

export const VIDEO_IMAGE_MODES = [
  'first_frame',
  'first_last_frames',
  'reference_images',
] as const;

export type VideoImageMode = (typeof VIDEO_IMAGE_MODES)[number];

interface ResolveOptionsInput {
  mediaType: string;
  scene: string;
  entry: ModelEntry;
  options?: unknown;
  allowControlOptions?: boolean;
}

interface ResolveAutoOptionsInput {
  entry: ModelEntry;
  scene: string;
  options: GenerationOptions;
}

const SCENE_INPUT_OPTIONS: Record<string, Set<string>> = {
  'image-to-image': new Set(['image_input']),
  'image-to-video': new Set(['image_input']),
  'video-to-video': new Set(['video_input']),
};

export function isVideoImageMode(value: unknown): value is VideoImageMode {
  return (
    typeof value === 'string' &&
    (VIDEO_IMAGE_MODES as readonly string[]).includes(value)
  );
}

export function assertVideoImageInput(
  mode: VideoImageMode,
  imageUrls: readonly unknown[]
): void {
  const hasOnlyNonEmptyUrls = imageUrls.every(
    (url) => typeof url === 'string' && Boolean(url.trim())
  );

  if (!hasOnlyNonEmptyUrls) {
    throw new Error(`invalid image_input for image_mode: ${mode}`);
  }

  const isValidCount =
    (mode === 'first_frame' && imageUrls.length === 1) ||
    (mode === 'first_last_frames' && imageUrls.length === 2) ||
    (mode === 'reference_images' &&
      imageUrls.length >= 2 &&
      imageUrls.length <= 3);

  if (!isValidCount) {
    throw new Error(`invalid image_input for image_mode: ${mode}`);
  }
}

function isPlainRecord(value: unknown): value is GenerationOptions {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getSceneRecord(
  map:
    | ModelEntry['defaults']
    | ModelEntry['skuAttributes']
    | ModelEntry['enforced'],
  scene: string
): GenerationOptions {
  const value = map?.[scene];
  return isPlainRecord(value) ? { ...value } : {};
}

function isAllowedControlValue(
  value: unknown,
  control: ControlOption
): boolean {
  if (control.type === 'number') {
    return typeof value === 'number' && Number.isFinite(value);
  }

  return typeof value === control.type;
}

function hasControlOption(control: ControlOption, value: unknown): boolean {
  return control.options.some((option) => Object.is(option, value));
}

function sanitizeAssetInput(name: string, value: unknown): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`invalid generation option: ${name}`);
  }

  return value.map((item) => {
    if (typeof item !== 'string' || !item.trim()) {
      throw new Error(`invalid generation option: ${name}`);
    }

    return item.trim();
  });
}

function sanitizeVideoImageMode(value: unknown): VideoImageMode {
  if (!isVideoImageMode(value)) {
    throw new Error('invalid generation option: image_mode');
  }

  return value;
}

export function sanitizeGenerationOptions({
  scene,
  entry,
  options,
  allowControlOptions = true,
}: ResolveOptionsInput): GenerationOptions {
  if (options === undefined || options === null) {
    return {};
  }

  if (!isPlainRecord(options)) {
    throw new Error('generation options must be an object');
  }

  const sceneControls = entry.controls?.[scene] ?? {};
  const controls = allowControlOptions ? sceneControls : {};
  const sceneInputOptions = SCENE_INPUT_OPTIONS[scene] ?? new Set<string>();
  const sanitizedOptions: GenerationOptions = {};

  for (const [name, value] of Object.entries(options)) {
    if (value === undefined) {
      continue;
    }

    if (sceneInputOptions.has(name)) {
      sanitizedOptions[name] = sanitizeAssetInput(name, value);
      continue;
    }

    if (scene === 'image-to-video' && name === 'image_mode') {
      sanitizedOptions[name] = sanitizeVideoImageMode(value);
      continue;
    }

    const control = controls[name];
    if (!control) {
      continue;
    }

    if (!isAllowedControlValue(value, control)) {
      throw new Error(`invalid generation option: ${name}`);
    }

    if (!hasControlOption(control, value)) {
      throw new Error(`unsupported generation option: ${name}`);
    }

    sanitizedOptions[name] = value;
  }

  if (scene === 'image-to-video' && sanitizedOptions.image_mode !== undefined) {
    const imageInput = sanitizedOptions.image_input;

    if (!Array.isArray(imageInput)) {
      throw new Error('image_mode requires image_input');
    }

    assertVideoImageInput(
      sanitizedOptions.image_mode as VideoImageMode,
      imageInput
    );
  }

  return sanitizedOptions;
}

export function resolveAutoOptions({
  entry,
  scene,
  options,
}: ResolveAutoOptionsInput): GenerationOptions {
  void entry;
  void scene;
  void options;

  // Phase 0A-2 intentionally returns only derived deltas. Keep base options
  // composition in resolveFinalOptions so auto logic cannot replace it wholesale.
  return {};
}

export function resolveFinalOptions({
  mediaType,
  scene,
  entry,
  options,
  allowControlOptions = true,
}: ResolveOptionsInput): GenerationOptions {
  if (entry.mediaType !== mediaType) {
    throw new Error(
      `invalid mediaType for model: ${entry.family}/${mediaType}`
    );
  }

  if (!entry.scenes.includes(scene)) {
    throw new Error(`invalid scene for model: ${entry.family}/${scene}`);
  }

  const defaults = getSceneRecord(entry.defaults, scene);
  const sanitizedOptions = sanitizeGenerationOptions({
    mediaType,
    scene,
    entry,
    options,
    allowControlOptions,
  });
  const baseOptions = {
    ...defaults,
    ...sanitizedOptions,
  };
  const autoResolvedOptions = resolveAutoOptions({
    entry,
    scene,
    options: baseOptions,
  });
  const skuAttributes = getSceneRecord(entry.skuAttributes, scene);
  const enforced = getSceneRecord(entry.enforced, scene);

  return {
    ...baseOptions,
    ...autoResolvedOptions,
    ...skuAttributes,
    ...enforced,
  };
}
