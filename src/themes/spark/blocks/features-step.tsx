import { cn } from '@/shared/lib/utils';
import type { Section } from '@/shared/types/blocks/landing';

import { SectionHeading } from '../components/section-heading';
import styles from '../styles.module.css';

export function FeaturesStep({ section }: { section: Section; }) {
  return (
    <section id={section.id} className={cn(styles.section, section.className)}>
      <div className={styles.container}>
        <SectionHeading section={section} />
        <ol className="mx-auto max-w-3xl divide-y divide-border border-y">
          {section.items?.map((item, index) => (
            <li key={item.id || index} className="flex gap-6 py-8 md:gap-10">
              <span aria-hidden="true" className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary font-serif text-xl text-primary-foreground">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div>
                <h3 className="font-serif text-2xl md:text-3xl">{item.title}</h3>
                {item.description && <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.description}</p>}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
