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
  useDynamicVideoPricing: boolean;
  allowControlOptions: boolean;
  allowResolutionControl: boolean;
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

function getStaticCredits(entry: ModelEntry, scene: string): number {
  const costCredits = entry.credits[scene];

  if (typeof costCredits !== 'number') {
    throw new Error(`invalid credits: ${entry.family}/${scene}`);
  }

  return costCredits;
}

export function resolveGenerationPricingSnapshot({
  mediaType,
  scene,
  entry,
  options,
  useDynamicVideoPricing,
  allowControlOptions,
  allowResolutionControl,
}: ResolveGenerationPricingSnapshotInput): GenerationPricingSnapshot {
  const finalOptions = resolveFinalOptions({
    mediaType,
    scene,
    entry,
    options,
    allowControlOptions,
    allowResolutionControl,
  });
  const costCredits = useDynamicVideoPricing
    ? calculateModelCredits(entry, scene, finalOptions)
    : getStaticCredits(entry, scene);

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
