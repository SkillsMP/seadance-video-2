import { getTranslations, setRequestLocale } from 'next-intl/server';

import { getThemePage } from '@/core/theme';
import { ImageGenerator } from '@/shared/blocks/generator';
import { getMetadata } from '@/shared/lib/seo';
import { DynamicPage } from '@/shared/types/blocks/landing';

export const generateMetadata = getMetadata({
  metadataKey: 'pages.index.metadata',
  canonicalUrl: '/',
});

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('pages.index');
  const rawPage: DynamicPage = t.raw('page');

  // build a fresh page object to avoid mutating the t.raw() internal reference
  const page: DynamicPage = {
    ...rawPage,
    sections: {
      ...rawPage.sections,
      generator: {
        component: (
          <ImageGenerator
            className="py-8 md:py-10"
            srOnlyTitle={t.raw('generator.title')}
          />
        ),
      },
    },
  };

  const Page = await getThemePage('dynamic-page');

  return <Page locale={locale} page={page} />;
}
