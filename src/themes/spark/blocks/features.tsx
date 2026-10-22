import Image from 'next/image';

import { SmartIcon } from '@/shared/blocks/common/smart-icon';
import { cn } from '@/shared/lib/utils';
import type { Section } from '@/shared/types/blocks/landing';

import { Actions } from '../components/actions';
import { SectionHeading } from '../components/section-heading';
import styles from '../styles.module.css';

export function Features({ section }: { section: Section; }) {
  return (
    <section id={section.id} className={cn(styles.section, section.className)}>
      <div className={styles.container}>
        <SectionHeading section={section} />
        <div className="grid gap-5 md:grid-cols-2">
          {section.items?.map((item, index) => (
            <article key={item.id || index} className={styles.featureCard}>
              {item.image?.src && <div className={styles.featureArtwork}>
                <Image src={item.image.src} alt={item.image.alt || ''} width={480} height={360}
                  sizes="(max-width: 768px) 75vw, 35vw" />
              </div>}
              {typeof item.icon === 'string' && <SmartIcon name={item.icon} className="mb-5 size-6 text-brand" />}
              <h3 className="text-lg font-semibold">{item.title}</h3>
              {item.description && <p className={cn('mt-3 text-sm leading-relaxed text-muted-foreground', styles.richText)}
                dangerouslySetInnerHTML={{ __html: item.description }} />}
            </article>
          ))}
        </div>
        <Actions buttons={section.buttons} className="mt-10" />
      </div>
    </section>
  );
}
