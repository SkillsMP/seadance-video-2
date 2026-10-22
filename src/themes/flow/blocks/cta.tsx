import type { Section } from '@/shared/types/blocks/landing';

import { FlowCta } from '../components/site';

export function Cta({ section }: { section: Section }) {
  return (
    <FlowCta
      section={{
        id: section.id,
        title: section.title || '',
        description: section.description || '',
        buttons: section.buttons || [],
      }}
    />
  );
}
