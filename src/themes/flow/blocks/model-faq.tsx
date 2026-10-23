import type { FAQ } from '@/shared/types/blocks/landing';

import { FlowFaq } from '../components/site';

/** Model landing FAQ — same chrome as homepage Flow FAQ (default block is plain divide-y). */
export function ModelFaq({ section }: { section: FAQ }) {
  return (
    <FlowFaq
      section={{
        id: section.id || 'faq',
        title: section.title || '',
        description: section.description || '',
        items: (section.items || []).map((item) => ({
          question: item.question || '',
          answer: item.answer || '',
        })),
      }}
    />
  );
}
