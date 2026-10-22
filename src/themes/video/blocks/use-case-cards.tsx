'use client';

import { SmartIcon } from '@/shared/blocks/common';
import { cn } from '@/shared/lib/utils';
import type { Section, SectionItem } from '@/shared/types/blocks/landing';

type UseCaseItem = SectionItem & {
  tags?: string[];
};

export function UseCaseCards({
  section,
  className,
}: {
  section: Section;
  className?: string;
}) {
  const items = (section.items ?? []) as UseCaseItem[];

  return (
    <section
      id={section.id || section.name}
      className={cn('relative py-16 md:py-24', section.className, className)}
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      </div>

      <div className="container space-y-8 md:space-y-10">
        <div className="mx-auto max-w-3xl text-center text-balance">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            {section.title}
          </h2>
          {section.description && (
            <p className="text-muted-foreground mt-4">{section.description}</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <article
              key={item.title || index}
              className="bg-card flex h-full min-h-[180px] flex-col rounded-2xl border p-5 shadow-sm shadow-black/[0.04] transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md hover:shadow-black/[0.06] md:p-6 lg:min-h-[192px] dark:shadow-md dark:shadow-black/25 dark:hover:shadow-lg"
            >
              {typeof item.icon === 'string' && (
                <span className="bg-primary/10 text-primary mb-3 flex size-10 shrink-0 items-center justify-center rounded-lg">
                  <SmartIcon name={item.icon} size={20} />
                </span>
              )}

              <h3 className="mb-2 text-base font-semibold tracking-tight md:text-lg">
                {item.title}
              </h3>

              {item.description && (
                <p
                  className="text-muted-foreground flex-1 text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: item.description }}
                />
              )}

              {item.tags && item.tags.length > 0 && (
                <ul className="mt-4 flex flex-wrap gap-1.5 border-t pt-4">
                  {item.tags.map((tag) => (
                    <li
                      key={tag}
                      className="border-primary/15 bg-primary/10 text-primary rounded-full border px-2.5 py-1 text-[11px] font-medium md:text-xs"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
