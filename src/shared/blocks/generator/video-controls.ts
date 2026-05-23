import {
  type ControlOption,
  type ControlValue,
  type ModelEntry,
} from '@/config/ai/models';

const VIDEO_BASE_CONTROL_NAMES = ['duration', 'aspect_ratio'] as const;
const VIDEO_RESOLUTION_CONTROL_NAME = 'resolution';

export type VideoControlEntry = readonly [string, ControlOption];

export function getVideoControlNames(allowResolutionControl: boolean) {
  return allowResolutionControl
    ? [...VIDEO_BASE_CONTROL_NAMES, VIDEO_RESOLUTION_CONTROL_NAME]
    : [...VIDEO_BASE_CONTROL_NAMES];
}

export function getVideoControlEntries({
  entry,
  scene,
  allowResolutionControl,
}: {
  entry?: ModelEntry;
  scene: string;
  allowResolutionControl: boolean;
}): VideoControlEntry[] {
  return getVideoControlNames(allowResolutionControl).flatMap((name) => {
    const control = entry?.controls?.[scene]?.[name];
    return control ? ([[name, control]] as const) : [];
  });
}

export function getControlLabel(name: string): string {
  if (name === 'duration') {
    return 'Duration';
  }

  if (name === 'aspect_ratio') {
    return 'Aspect ratio';
  }

  if (name === VIDEO_RESOLUTION_CONTROL_NAME) {
    return 'Resolution';
  }

  return name.replaceAll('_', ' ');
}

export function getControlDefaultValue(control: ControlOption): string {
  return String(control.default ?? control.options[0] ?? '');
}

export function controlHasValue(
  control: ControlOption,
  value: string
): boolean {
  return control.options.some((option) => String(option) === value);
}

export function parseControlValue(
  value: string,
  control: ControlOption
): ControlValue | undefined {
  if (control.type === 'number') {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : undefined;
  }

  if (control.type === 'boolean') {
    return value === 'true';
  }

  return value;
}

export function formatControlOption(
  name: string,
  value: ControlValue
): string {
  if (name === 'duration' && typeof value === 'number') {
    return `${value}s`;
  }

  return String(value);
}

export function areControlValuesEqual(
  left: Record<string, string>,
  right: Record<string, string>
): boolean {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);

  if (leftKeys.length !== rightKeys.length) {
    return false;
  }

  return leftKeys.every((key) => left[key] === right[key]);
}

export function normalizeVideoControlValues({
  currentValues,
  controlEntries,
}: {
  currentValues: Record<string, string>;
  controlEntries: VideoControlEntry[];
}): Record<string, string> {
  const nextValues: Record<string, string> = {};

  for (const [name, control] of controlEntries) {
    const currentValue = currentValues[name];
    nextValues[name] =
      currentValue && controlHasValue(control, currentValue)
        ? currentValue
        : getControlDefaultValue(control);
  }

  return nextValues;
}

export function buildVideoGenerationOptions({
  dynamicVideoPricingEnabled,
  controlEntries,
  selectedControlValues,
}: {
  dynamicVideoPricingEnabled: boolean;
  controlEntries: VideoControlEntry[];
  selectedControlValues: Record<string, string>;
}): Record<string, unknown> {
  const generationOptions: Record<string, unknown> = {};

  if (!dynamicVideoPricingEnabled) {
    return generationOptions;
  }

  for (const [name, control] of controlEntries) {
    const selectedValue =
      selectedControlValues[name] ?? getControlDefaultValue(control);

    if (!selectedValue || !controlHasValue(control, selectedValue)) {
      continue;
    }

    const parsedValue = parseControlValue(selectedValue, control);
    if (parsedValue !== undefined) {
      generationOptions[name] = parsedValue;
    }
  }

  return generationOptions;
}
