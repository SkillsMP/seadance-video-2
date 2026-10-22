import type { Section } from '@/shared/types/blocks/landing';

import { FlowFeatures } from '../components/site';

export function Features({ section }: { section: Section }) {
  return (
    <FlowFeatures
      section={{
        id: section.id || '',
        label: section.label || '',
        title: section.title || '',
        description: section.description || '',
        columns: section.columns,
        items: (section.items || []).map((item) => ({
          title: item.title || '',
          description: item.description || '',
          icon: typeof item.icon === 'string' ? item.icon : 'Sparkles',
        })),
      }}
    />
  );
}
