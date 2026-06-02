import {
  calculateModelCredits,
  type FinalGenerationOptions,
} from './credit-costs';
import { type ModelEntry } from './models';
import { resolveFinalOptions } from './options';

interface ResolveGenerationPricingSnapshotInput {
  mediaType: string;
  scene: string;
  entry: ModelEntry;
  options?: unknown;
}

export interface GenerationPricingSnapshot {
  finalOptions: FinalGenerationOptions;
  costCredits: number;
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
      .join(',')}}`;
  }

  return JSON.stringify(value) ?? 'undefined';
}

export function resolveGenerationPricingSnapshot({
  mediaType,
  scene,
  entry,
  options,
}: ResolveGenerationPricingSnapshotInput): GenerationPricingSnapshot {
  const finalOptions = resolveFinalOptions({
    mediaType,
    scene,
    entry,
    options,
  });
  const costCredits = calculateModelCredits(entry, scene, finalOptions);

  return {
    finalOptions,
    costCredits,
  };
}

export function assertGenerationPricingConsistency(
  expected: GenerationPricingSnapshot,
  actual: GenerationPricingSnapshot
): void {
  if (
    expected.costCredits !== actual.costCredits ||
    stableStringify(expected.finalOptions) !== stableStringify(actual.finalOptions)
  ) {
    throw new Error('generation pricing drift');
  }
}
