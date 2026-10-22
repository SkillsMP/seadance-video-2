import type { Section } from '@/shared/types/blocks/landing';

import { FlowShowcase } from '../components/site';

export function Showcases({ section }: { section: Section }) {
  return (
    <FlowShowcase
      section={{
        id: section.id || '',
        title: section.title || '',
        description: section.description || '',
        columns: section.columns,
        items: (section.items || []).map((item) => ({
          title: item.title,
          description: item.description,
          url: item.url || item.button?.url,
          video: typeof item.video === 'string' ? item.video : item.video?.src || '',
          poster: item.image?.src || '',
        })),
      }}
    />
  );
}
