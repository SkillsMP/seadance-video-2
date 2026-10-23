import { getTranslations } from 'next-intl/server';

import type { Section } from '@/shared/types/blocks/landing';
import type { Pricing as PricingType } from '@/shared/types/blocks/pricing';

import { Pricing } from './pricing';

interface PricingPlansSection extends Section {
  /** Omit for all plans; use "one-time" to show credit packs only. */
  group?: string;
}

export async function PricingPlans({
  section,
}: {
  section: PricingPlansSection;
}) {
  const t = await getTranslations('pages.pricing');
  const pricing: PricingType = t.raw('page.sections.pricing');

  return (
    <Pricing
      pricing={{
        ...pricing,
        id: section.id ?? pricing.id,
        title: section.title ?? pricing.title,
        description: section.description ?? pricing.description,
        groups: section.group
          ? pricing.groups?.filter((group) => group.name === section.group)
          : pricing.groups,
        items: section.group
          ? pricing.items?.filter((item) => item.group === section.group)
          : pricing.items,
      }}
      className={section.className}
    />
  );
}
