import { Plus } from 'lucide-react';

import { cn } from '@/shared/lib/utils';
import type { FAQ } from '@/shared/types/blocks/landing';

import { SectionHeading } from '../components/section-heading';
import styles from '../styles.module.css';

export function Faq({ section }: { section: FAQ; }) {
  return (
    <section id={section.id} className={cn(styles.section, styles.faq, section.className)}>
      <div className={styles.container}>
        <SectionHeading section={section} />
        <div className="mx-auto max-w-3xl divide-y divide-border border-y">
          {section.items?.map((item, index) => (
            <details key={item.id || index} className="py-6">
              <summary className="flex items-center justify-between gap-5 text-base font-medium">
                {item.question || item.title}<Plus aria-hidden="true" className={cn('size-5', styles.faqIcon)} />
              </summary>
              <div className={cn('pt-4 pr-8 text-sm leading-relaxed text-muted-foreground', styles.richText)}
                dangerouslySetInnerHTML={{ __html: item.answer || item.description || '' }} />
            </details>
          ))}
        </div>
        {section.tip && <p className={cn('mx-auto mt-6 max-w-3xl text-sm text-muted-foreground', styles.richText)}
          dangerouslySetInnerHTML={{ __html: section.tip }} />}
      </div>
    </section>
  );
}
