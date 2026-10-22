import Image from 'next/image';

import { Link } from '@/core/i18n/navigation';
import { cn } from '@/shared/lib/utils';
import type { Section } from '@/shared/types/blocks/landing';

import { SectionHeading } from '../components/section-heading';
import styles from '../styles.module.css';

export function Showcases({ section }: { section: Section; }) {
  return (
    <section id={section.id} className={cn(styles.section, styles.showcaseSection, section.className)}>
      <div className={styles.container}>
        <SectionHeading section={section} />
        <div className={styles.gallery}>
          {section.items?.map((item, index) => (
            <figure key={item.id || index}>
              <div className={styles.media}>
                {item.image?.src && <Image src={item.image.src} alt={item.image.alt || item.title || ''}
                  fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover" />}
              </div>
              <figcaption className="mt-4 flex items-start justify-between gap-3 text-sm">
                <div>
                  {item.url ? <Link href={item.url} className="font-medium underline-offset-4 hover:underline">{item.title}</Link>
                    : <span className="font-medium">{item.title}</span>}
                  {item.description && <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>}
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
        {section.tip && <p className="mt-8 text-center text-xs text-muted-foreground">{section.tip}</p>}
      </div>
    </section>
  );
}
