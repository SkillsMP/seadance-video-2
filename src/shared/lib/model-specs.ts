import { calculateModelCredits } from '@/config/ai/credit-costs';
import { resolveGenerationPricingSnapshot } from '@/config/ai/generation-pricing';
import { MODELS, type ModelEntry } from '@/config/ai/models';

export interface ModelSpecsSelection {
  mediaType: 'video' | 'image';
  modelFamilies: string[];
  scenes?: string[];
}

export interface ModelSpecRow {
  family: string;
  label: string;
  scene: string;
  resolution?: string;
  durations: number[];
  aspectRatios: string[];
  imageModes: string[];
  audio: boolean;
  creditsPerSecond?: number;
  exampleDuration?: number;
  exampleCredits: number;
}

function controlValues(entry: ModelEntry, scene: string, name: string) {
  const locked = entry.enforced?.[scene]?.[name];
  if (locked !== undefined) return [locked];
  return entry.controls?.[scene]?.[name]?.options ?? [];
}

/** Read-only presentation data. Generation and billing remain in config/ai. */
export function getModelSpecRows(
  selection: ModelSpecsSelection
): ModelSpecRow[] {
  const rows: ModelSpecRow[] = [];
  const seen = new Set<string>();

  for (const family of selection.modelFamilies) {
    for (const entry of MODELS.filter(
      (model) =>
        model.enabled &&
        model.mediaType === selection.mediaType &&
        model.family === family
    )) {
      for (const scene of entry.scenes) {
        if (selection.scenes && !selection.scenes.includes(scene)) continue;
        const pricing = entry.pricing?.[scene];
        if (!pricing) continue;
        const durations = controlValues(entry, scene, 'duration')
          .filter((value): value is number => typeof value === 'number')
          .sort((a, b) => a - b);
        const duration = durations.includes(10)
          ? 10
          : durations.includes(pricing.defaultDuration ?? 0)
            ? pricing.defaultDuration
            : (durations[0] ?? pricing.defaultDuration);
        const resolutionPricing =
          pricing.byResolution ?? pricing.byImageResolution;
        const availableResolutions = controlValues(
          entry,
          scene,
          'resolution'
        ).map(String);
        const resolutions = resolutionPricing
          ? Object.entries(resolutionPricing)
              .filter(
                ([resolution, rate]) =>
                  rate?.availability === 'enabled' &&
                  (!availableResolutions.length ||
                    availableResolutions.includes(resolution))
              )
              .map(([resolution]) => resolution)
          : [undefined];

        for (const resolution of resolutions) {
          const { finalOptions, costCredits } =
            resolveGenerationPricingSnapshot({
              mediaType: selection.mediaType,
              scene,
              entry,
              options: {
                resolution,
                ...(pricing.mode === 'perSecond' ? { duration } : {}),
              },
            });
          const row: ModelSpecRow = {
            family,
            label: entry.label,
            scene,
            resolution,
            durations,
            aspectRatios: controlValues(entry, scene, 'aspect_ratio').map(
              String
            ),
            imageModes: [
              ...(entry.inputConstraints?.[scene]?.imageModes ?? []),
            ],
            audio: controlValues(entry, scene, 'generate_audio').includes(true),
            ...(pricing.mode === 'perSecond'
              ? {
                  creditsPerSecond: calculateModelCredits(entry, scene, {
                    ...finalOptions,
                    duration: 1,
                  }),
                  exampleDuration: Number(finalOptions.duration),
                }
              : {}),
            exampleCredits: costCredits,
          };
          // Equivalent provider entries must not duplicate public specifications.
          const key = JSON.stringify(row);
          if (!seen.has(key)) {
            seen.add(key);
            rows.push(row);
          }
        }
      }
    }
  }
  return rows;
}

export function formatDurations(values: number[]): string {
  if (
    values.length > 1 &&
    values.every((value, index) => !index || value === values[index - 1] + 1)
  ) {
    return `${values[0]}–${values[values.length - 1]}`;
  }
  return values.join(', ');
}

export interface ModelSpecSummary {
  family: string;
  label: string;
  scenes: string[];
  resolutions: string[];
  durationByScene: { scene: string; durations: number[] }[];
  exampleResolution?: string;
  exampleDuration?: number;
  creditsByScene: { scene: string; credits: number }[];
}

/** Collapse per-workflow rows into one comparison row per model. */
export function summarizeModelSpecRows(
  rows: ModelSpecRow[]
): ModelSpecSummary[] {
  const families = [...new Set(rows.map((row) => row.family))];
  return families.map((family) => {
    const modelRows = rows.filter((row) => row.family === family);
    const scenes = [...new Set(modelRows.map((row) => row.scene))];
    const resolutions = [
      ...new Set(
        modelRows.flatMap((row) => (row.resolution ? [row.resolution] : []))
      ),
    ];
    const exampleResolution = resolutions.includes('720p')
      ? '720p'
      : resolutions[0];
    const durationByScene = scenes.map((scene) => ({
      scene,
      durations: modelRows.find((row) => row.scene === scene)!.durations,
    }));
    const creditsByScene = scenes.map((scene) => {
      const match =
        modelRows.find(
          (row) =>
            row.scene === scene &&
            (exampleResolution
              ? row.resolution === exampleResolution
              : !row.resolution)
        ) ?? modelRows.find((row) => row.scene === scene)!;
      return { scene, credits: match.exampleCredits };
    });
    return {
      family,
      label: modelRows[0].label,
      scenes,
      resolutions,
      durationByScene,
      exampleResolution,
      exampleDuration: modelRows.find(
        (row) => !exampleResolution || row.resolution === exampleResolution
      )?.exampleDuration,
      creditsByScene,
    };
  });
}

/** Show the common value, then name the scenes that differ. */
export function formatPrimaryWithExceptions(
  items: { group: string; value: string }[]
): string {
  const groups = new Map<string, string[]>();
  for (const item of items) {
    const list = groups.get(item.value) ?? [];
    list.push(item.group);
    groups.set(item.value, list);
  }
  const ranked = [...groups.entries()].sort(
    (left, right) => right[1].length - left[1].length
  );
  const primary = ranked[0];
  if (!primary) return '—';
  const rest = ranked.slice(1);
  if (!rest.length) return primary[0];
  return `${primary[0]} (${rest
    .map(([value, names]) => `${[...new Set(names)].join(', ')}: ${value}`)
    .join('; ')})`;
}
