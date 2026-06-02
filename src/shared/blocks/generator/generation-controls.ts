import {
  type ControlOption,
  type ControlValue,
  type ModelEntry,
} from '@/config/ai/models';

const GENERATION_CONTROL_ORDER: Record<string, number> = {
  duration: 10,
  aspect_ratio: 20,
  resolution: 30,
  output_format: 35,
  generate_audio: 40,
};

export type GenerationControlEntry = readonly [string, ControlOption];

function compareGenerationControls(
  [leftName, leftControl]: GenerationControlEntry,
  [rightName, rightControl]: GenerationControlEntry
): number {
  const leftOrder =
    leftControl.order ?? GENERATION_CONTROL_ORDER[leftName] ?? 999;
  const rightOrder =
    rightControl.order ?? GENERATION_CONTROL_ORDER[rightName] ?? 999;

  if (leftOrder !== rightOrder) {
    return leftOrder - rightOrder;
  }

  return leftName.localeCompare(rightName);
}

export function getGenerationControlEntries({
  entry,
  scene,
}: {
  entry?: ModelEntry;
  scene: string;
}): GenerationControlEntry[] {
  const controls = entry?.controls?.[scene] ?? {};

  return (Object.entries(controls) as GenerationControlEntry[])
    .sort(compareGenerationControls);
}

function fallbackLabel(name: string): string {
  if (name === 'duration') {
    return 'Duration';
  }

  if (name === 'aspect_ratio') {
    return 'Aspect ratio';
  }

  if (name === 'resolution') {
    return 'Resolution';
  }

  if (name === 'output_format') {
    return 'Output format';
  }

  if (name === 'generate_audio') {
    return 'Generate Audio';
  }

  return name.replaceAll('_', ' ');
}

export function getControlLabel(name: string, control?: ControlOption): string {
  return control?.label ?? fallbackLabel(name);
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
  value: ControlValue,
  control?: ControlOption
): string {
  if (control?.type === 'boolean' && typeof value === 'boolean') {
    return value ? 'On' : 'Off';
  }

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

export function normalizeGenerationControlValues({
  currentValues,
  controlEntries,
}: {
  currentValues: Record<string, string>;
  controlEntries: GenerationControlEntry[];
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

export function buildGenerationOptions({
  controlEntries,
  selectedControlValues,
}: {
  controlEntries: GenerationControlEntry[];
  selectedControlValues: Record<string, string>;
}): Record<string, unknown> {
  const generationOptions: Record<string, unknown> = {};

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
