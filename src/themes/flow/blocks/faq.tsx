import type { Section } from '@/shared/types/blocks/landing';

import { FlowFaq } from '../components/site';

export function Faq({ section }: { section: Section }) {
  return (
    <FlowFaq
      section={{
        id: section.id || '',
        title: section.title || '',
        description: section.description || '',
        items: (section.items || []).map((item) => ({
          question: item.question || item.title || '',
          answer: item.answer || item.description || '',
        })),
      }}
    />
  );
}
