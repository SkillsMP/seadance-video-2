import { Sparkles } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { cn } from '@/shared/lib/utils';
import type { Hero as HeroType } from '@/shared/types/blocks/landing';

import { Actions } from '../components/actions';
import styles from '../styles.module.css';

export function Hero({ section }: { section: HeroType; }) {
  const title = section.title || '';
  const highlight = section.highlight_text;
  const position = highlight ? title.indexOf(highlight) : -1;
  return (
    <section id={section.id} className={cn(styles.hero, 'scroll-mt-24', section.className)}>
      <div className={styles.container}>
        {section.announcement?.title && (
          <div className="mb-7 flex justify-center">
            <Link href={section.announcement.url || '/'}
              className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring">
              <Sparkles aria-hidden="true" className="size-3.5 text-brand" />{section.announcement.title}
            </Link>
          </div>
        )}
        <h1 className={cn(styles.display, styles.heroTitle)}>
          {highlight && position >= 0 ? <>{title.slice(0, position)}<em>{highlight}</em>{title.slice(position + highlight.length)}</> : title}
        </h1>
        {section.description && <p className={cn(styles.description, 'mt-6', styles.richText)}
          dangerouslySetInnerHTML={{ __html: section.description }} />}
        <Actions buttons={section.buttons} className="mt-8" />
        {section.tip && <p className={cn('mx-auto mt-6 max-w-xl text-xs leading-relaxed text-muted-foreground', styles.richText)}
          dangerouslySetInnerHTML={{ __html: section.tip }} />}
      </div>
    </section>
  );
}
