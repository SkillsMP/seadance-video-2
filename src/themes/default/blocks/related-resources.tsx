import { ArrowUpRight } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { cn } from '@/shared/lib/utils';
import type { Section } from '@/shared/types/blocks/landing';

export function RelatedResources({ section }: { section: Section }) {
  return (
    <section
      id={section.id}
      className={cn('py-16 md:py-20', section.className)}
    >
      <div className="container">
        <h2 className="text-3xl font-semibold tracking-tight">
          {section.title}
        </h2>
        {section.description && (
          <p className="text-muted-foreground mt-4 max-w-2xl">
            {section.description}
          </p>
        )}
        <ul className="mt-8 grid gap-x-12 md:grid-cols-2">
          {section.items?.map((item) => (
            <li key={item.url} className="border-b">
              <Link
                href={item.url || ''}
                className="group focus-visible:outline-ring flex items-start justify-between gap-6 rounded-sm py-6 focus-visible:outline-2 focus-visible:outline-offset-4"
              >
                <div>
                  <h3 className="font-medium underline-offset-4 group-hover:underline">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
                <ArrowUpRight
                  aria-hidden="true"
                  className="mt-1 size-4 shrink-0"
                />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
