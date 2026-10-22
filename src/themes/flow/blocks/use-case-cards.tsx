import { SmartIcon } from '@/shared/blocks/common/smart-icon';
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
      id={section.id}
      className={cn('flow-section', section.className, className)}
    >
      <div className="flow-container">
        <div className="flow-section-head">
          {section.label ? (
            <span className="flow-eyebrow">{section.label}</span>
          ) : null}
          <h2 className="mt-4">{section.title}</h2>
          {section.description ? <p>{section.description}</p> : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <article
              className="flow-card flow-use-case-card flex h-full flex-col"
              key={item.title}
            >
              {typeof item.icon === 'string' ? (
                <SmartIcon
                  name={item.icon}
                  className="mb-3 size-6 text-[var(--flow-amber)]"
                />
              ) : null}
              <h3 className="text-lg font-semibold">{item.title}</h3>
              {item.description ? (
                <p
                  className="mt-2 flex-1 text-sm text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: item.description }}
                />
              ) : null}
              {item.tags && item.tags.length > 0 ? (
                <ul className="mt-4 flex flex-wrap gap-1.5 border-t border-border pt-4">
                  {item.tags.map((tag) => (
                    <li key={tag} className="flow-use-case-tag">
                      {tag}
                    </li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
