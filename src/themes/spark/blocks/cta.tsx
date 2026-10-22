import { Sparkles } from 'lucide-react';

import { cn } from '@/shared/lib/utils';
import type { CTA } from '@/shared/types/blocks/landing';

import { Actions } from '../components/actions';
import { SectionHeading } from '../components/section-heading';
import styles from '../styles.module.css';

export function Cta({ section }: { section: CTA; }) {
  return (
    <section id={section.id} className={cn(styles.section, section.className)}>
      <div className={styles.container}>
        <div className="rounded-3xl border bg-secondary/60 px-6 py-14 text-center md:px-12 md:py-20">
          <Sparkles aria-hidden="true" className="mx-auto mb-6 size-8 text-brand" />
          <SectionHeading section={section} />
          <Actions buttons={section.buttons} />
        </div>
      </div>
    </section>
  );
}
