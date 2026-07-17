import { getTranslations, setRequestLocale } from 'next-intl/server';

import { getThemePage } from '@/core/theme';
import { envConfigs } from '@/config';
import { VideoGenerator } from '@/shared/blocks/generator';
import { JsonLd } from '@/shared/components/seo/json-ld';
import { buildBreadcrumbSchema } from '@/shared/lib/schema';
import { getMetadata } from '@/shared/lib/seo';
import type { DynamicPage } from '@/shared/types/blocks/landing';

export const generateMetadata = getMetadata({
  metadataKey: 'pages.seedance-2-0.metadata',
  canonicalUrl: '/seedance-2-0',
});

export default async function SeedanceTwoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('pages.seedance-2-0');
  const rawPage = t.raw('page') as DynamicPage;
  const page: DynamicPage = {
    ...rawPage,
    sections: {
      ...rawPage.sections,
      generator: {
        component: (
          <div id="generator" className="scroll-mt-20">
            <VideoGenerator
              className="py-8 md:py-10"
              srOnlyTitle={t.raw('generator.title')}
            />
          </div>
        ),
      },
    },
  };

  const Page = await getThemePage('dynamic-page');
  const pageUrl = `${envConfigs.app_url}/seedance-2-0`;
  const faqItems = rawPage.sections?.faq?.items ?? [];
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <>
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: 'Home', url: envConfigs.app_url },
          { name: rawPage.title || 'Seedance 2.0', url: pageUrl },
        ])}
      />
      <JsonLd data={faqSchema} />
      <Page locale={locale} page={page} />
    </>
  );
}
