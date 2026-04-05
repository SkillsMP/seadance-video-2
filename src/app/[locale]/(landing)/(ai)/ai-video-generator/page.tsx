import { getTranslations, setRequestLocale } from 'next-intl/server';

import { getThemePage } from '@/core/theme';
import { envConfigs } from '@/config';
import { VideoGenerator } from '@/shared/blocks/generator';
import { JsonLd } from '@/shared/components/seo/json-ld';
import { buildBreadcrumbSchema } from '@/shared/lib/schema';
import { getMetadata } from '@/shared/lib/seo';
import { DynamicPage } from '@/shared/types/blocks/landing';

export const generateMetadata = getMetadata({
  metadataKey: 'ai.video.metadata',
  canonicalUrl: '/ai-video-generator',
});

export default async function AiVideoGeneratorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // get ai video data
  const t = await getTranslations('ai.video');

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
        component: <VideoGenerator srOnlyTitle={t.raw('generator.title')} />,
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
          { name: 'AI Video Generator', url: `${appUrl}/ai-video-generator` },
        ])}
      />
      <Page locale={locale} page={page} />
    </>
  );
}
