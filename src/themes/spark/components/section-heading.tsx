import type { Section } from '@/shared/types/blocks/landing';
import { cn } from '@/shared/lib/utils';

import styles from '../styles.module.css';

export function SectionHeading({ section, centered = true }: {
  section: Section;
  centered?: boolean;
}) {
  return (
    <div className={cn('mb-10 md:mb-14', centered && 'text-center')}>
      {section.label && <p className={cn(styles.eyebrow, 'text-brand mb-4')}>{section.label}</p>}
      {section.title && <h2 className={cn(styles.display, 'text-4xl md:text-5xl')}>{section.title}</h2>}
      {section.description && (
        <p className={cn(styles.description, 'mt-5', !centered && 'ml-0')}
          dangerouslySetInnerHTML={{ __html: section.description }} />
      )}
    </div>
  );
}
