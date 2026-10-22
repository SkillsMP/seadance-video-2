import type { Section } from '@/shared/types/blocks/landing';

import { FlowHero } from '../components/site';

export function Hero({ section }: { section: Section }) {
  return (
    <FlowHero
      hero={{
        id: section.id,
        title: section.title || '',
        subtitle: section.description || '',
        badge: section.announcement?.title,
        announcement: section.announcement,
        buttons: section.buttons,
        tip: section.tip,
      }}
    />
  );
}
