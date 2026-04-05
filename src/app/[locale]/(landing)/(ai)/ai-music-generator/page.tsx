import { getTranslations, setRequestLocale } from 'next-intl/server';

import { getThemePage } from '@/core/theme';
import { envConfigs } from '@/config';
import { MusicGenerator } from '@/shared/blocks/generator';
import { JsonLd } from '@/shared/components/seo/json-ld';
import { buildBreadcrumbSchema } from '@/shared/lib/schema';
import { getMetadata } from '@/shared/lib/seo';
import { DynamicPage } from '@/shared/types/blocks/landing';

export const generateMetadata = getMetadata({
  metadataKey: 'ai.music.metadata',
  canonicalUrl: '/ai-music-generator',
});

export default async function AiMusicGeneratorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // get ai music data
  const t = await getTranslations('ai.music');

  // build page sections
  const page: DynamicPage = {
    sections: {
      hero: {
        title: t.raw('page.title'),
        description: t.raw('page.description'),
        background_image: {
          src: '/imgs/bg/tree.jpg',
          alt: 'hero background',
        },
      },
      generator: {
        component: <MusicGenerator srOnlyTitle={t.raw('generator.title')} />,
      },
      faq: t.raw('page.sections.faq'),
      cta: t.raw('page.sections.cta'),
    },
  };

  // load page component
  const Page = await getThemePage('dynamic-page');

  const appUrl = envConfigs.app_url;

  return (
    <>
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: 'Home', url: appUrl },
          { name: 'AI Music Generator', url: `${appUrl}/ai-music-generator` },
        ])}
      />
      <Page locale={locale} page={page} />
    </>
  );
}
