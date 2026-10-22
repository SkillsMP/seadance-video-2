import type { Section } from '@/shared/types/blocks/landing';

import { FlowSteps } from '../components/site';

export function FeaturesStep({ section }: { section: Section }) {
  return (
    <FlowSteps
      section={{
        id: section.id || '',
        label: section.label || '',
        title: section.title || '',
        description: section.description || '',
        items: (section.items || []).map((item, index) => ({
          title: item.title || '',
          description: item.description || '',
          order: index + 1,
        })),
      }}
    />
  );
}
