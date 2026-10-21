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
      className={cn('py-16 md:py-24', section.className, className)}
    >
      <div className="container space-y-10 md:space-y-14">
        <div className="mx-auto max-w-3xl text-center text-balance">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            {section.title}
          </h2>
          {section.description && (
            <p className="text-muted-foreground mt-4">{section.description}</p>
          )}
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {items.map((item, index) => (
            <article
              key={item.title || index}
              className="bg-card flex h-full flex-col rounded-2xl border p-6 md:p-7"
            >
              <div className="flex items-start gap-3">
                {typeof item.icon === 'string' && (
                  <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl">
                    <SmartIcon name={item.icon} size={20} />
                  </span>
                )}
                <div className="min-w-0 space-y-2">
                  <h3 className="text-lg font-semibold tracking-tight">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p
                      className="text-muted-foreground text-sm leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: item.description }}
                    />
                  )}
                </div>
              </div>

              {item.tags && item.tags.length > 0 && (
                <ul className="mt-5 flex flex-wrap gap-2 border-t pt-5">
                  {item.tags.map((tag) => (
                    <li
                      key={tag}
                      className="bg-muted text-muted-foreground rounded-full px-3 py-1 text-xs font-medium"
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
