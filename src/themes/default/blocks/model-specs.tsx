import { Link } from '@/core/i18n/navigation';
import { Button } from '@/shared/components/ui/button';
import {
  formatDurations,
  formatPrimaryWithExceptions,
  getModelSpecRows,
  summarizeModelSpecRows,
  type ModelSpecsSelection,
} from '@/shared/lib/model-specs';
import { cn } from '@/shared/lib/utils';
import type { Section } from '@/shared/types/blocks/landing';

export interface ModelSpecsSection extends Section, ModelSpecsSelection {
  labels: {
    input: string;
    limits: string;
    pricing: string;
    model: string;
    workflows: string;
    resolution: string;
    duration: string;
    seconds: string;
    exampleCredits: string;
    scenes: Record<string, string>;
  };
  inputItems: { title: string; description: string }[];
  limitsItems: { title: string; description: string }[];
  limitsNote: string;
}

/** Server-rendered block; numeric specifications never live in page copy. */
export function ModelSpecs({ section }: { section: ModelSpecsSection }) {
  const rows = getModelSpecRows(section);
  if (!rows.length) return null;
  const { labels } = section;
  const sceneName = (scene: string) => labels.scenes[scene] ?? scene;
  const summaries = summarizeModelSpecRows(rows);

  return (
    <section
      id={section.id}
      className={cn(
        'bg-muted/30 scroll-mt-24 border-y py-16 md:py-20',
        section.className
      )}
    >
      <div className="container min-w-0 space-y-10">
        <header className="max-w-3xl">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            {section.title}
          </h2>
          <p className="text-muted-foreground mt-4 leading-relaxed">
            {section.description}
          </p>
        </header>

        <div className="grid gap-8 md:grid-cols-2 md:gap-16">
          <div>
            <h3 className="text-xl font-semibold">{labels.input}</h3>
            <dl className="mt-5 space-y-4">
              {section.inputItems.map((item) => (
                <div key={item.title}>
                  <dt className="font-medium">{item.title}</dt>
                  <dd className="text-muted-foreground mt-1 text-sm leading-relaxed">
                    {item.description}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <div>
            <h3 className="text-xl font-semibold">{labels.limits}</h3>
            <dl className="mt-5 space-y-4">
              {section.limitsItems.map((item) => (
                <div key={item.title}>
                  <dt className="font-medium">{item.title}</dt>
                  <dd className="text-muted-foreground mt-1 text-sm leading-relaxed">
                    {item.description}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
              {section.limitsNote}
            </p>
          </div>
        </div>

        <div>
          <h3
            id={`${section.id}-pricing`}
            className="mb-5 text-xl font-semibold"
          >
            {labels.pricing}
          </h3>
          <div className="relative w-full overflow-x-auto">
            <table
              aria-labelledby={`${section.id}-pricing`}
              className="w-full caption-bottom text-sm"
            >
              <thead>
                <tr className="border-b">
                  {[
                    labels.model,
                    labels.workflows,
                    labels.resolution,
                    labels.duration,
                    labels.exampleCredits,
                  ].map((label) => (
                    <th
                      scope="col"
                      key={label}
                      className="text-foreground h-10 px-3 text-left align-middle font-medium whitespace-nowrap"
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {summaries.map((row) => (
                  <tr key={row.family} className="border-b last:border-0">
                    <th
                      scope="row"
                      className="text-foreground px-3 py-3 text-left align-middle font-medium whitespace-nowrap"
                    >
                      {row.label}
                    </th>
                    <td className="text-muted-foreground px-3 py-3 align-middle">
                      {row.scenes.map(sceneName).join(', ')}
                    </td>
                    <td className="px-3 py-3 align-middle whitespace-nowrap">
                      {row.resolutions.join(', ') || '—'}
                    </td>
                    <td className="px-3 py-3 align-middle">
                      {formatPrimaryWithExceptions(
                        row.durationByScene.map((item) => ({
                          group: sceneName(item.scene),
                          value: item.durations.length
                            ? `${formatDurations(item.durations)} ${labels.seconds}`
                            : '—',
                        }))
                      )}
                    </td>
                    <td className="px-3 py-3 align-middle font-medium tabular-nums">
                      {formatPrimaryWithExceptions(
                        row.creditsByScene.map((item) => ({
                          group: sceneName(item.scene),
                          value: String(item.credits),
                        }))
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-muted-foreground mt-5 max-w-3xl text-sm leading-relaxed">
            {section.tip}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            {section.buttons?.map((button) => (
              <Button
                key={button.url}
                asChild
                variant={button.variant || 'outline'}
              >
                <Link href={button.url || ''}>{button.title}</Link>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
