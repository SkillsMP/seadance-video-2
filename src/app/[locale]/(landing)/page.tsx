import { getTranslations, setRequestLocale } from 'next-intl/server';

import { getThemePage } from '@/core/theme';
import { DynamicPage, Section } from '@/shared/types/blocks/landing';

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('landing');

  const showSections = [
    'hero',
    'logos',
    'introduce',
    'benefits',
    'usage',
    'features',
    'stats',
    'testimonials',
    'subscribe',
    'faq',
    'cta',
  ];

  // build page sections
  const page: DynamicPage = {
    sections: showSections.reduce<Record<string, Section>>((acc, section) => {
      const sectionData = t.raw(section) as Section;
      // Skip sections that are explicitly hidden, null, or undefined
      if (
        sectionData &&
        typeof sectionData === 'object' &&
        sectionData.hidden !== true
      ) {
        acc[section] = sectionData;
      }
      return acc;
    }, {}),
  };

  // load page component
  const Page = await getThemePage('dynamic-page');

  return <Page locale={locale} page={page} />;
}
