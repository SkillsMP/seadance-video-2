import { getTranslations, setRequestLocale } from 'next-intl/server';

import { getThemePage } from '@/core/theme';
import { envConfigs } from '@/config';
import { VideoGenerator } from '@/shared/blocks/generator';
import { JsonLd } from '@/shared/components/seo/json-ld';
import { buildVideoSchema } from '@/shared/lib/schema';
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

  const videoSchemas = (page.sections?.showcases?.items ?? []).flatMap(
    (item) => {
      const video = item.video;
      const thumbnailPath = item.image?.src;

      if (
        !item.title ||
        !item.description ||
        !video?.src ||
        !video.uploadDate ||
        !thumbnailPath
      ) {
        return [];
      }

      return [
        buildVideoSchema({
          name: item.title,
          description: item.description,
          thumbnailUrl: new URL(thumbnailPath, envConfigs.app_url).toString(),
          uploadDate: video.uploadDate,
          contentUrl: new URL(video.src, envConfigs.app_url).toString(),
          duration: video.duration,
        }),
      ];
    }
  );

  const Page = await getThemePage('dynamic-page');

  return (
    <>
      {videoSchemas.map((videoSchema) => (
        <JsonLd key={videoSchema.contentUrl} data={videoSchema} />
      ))}
      <Page locale={locale} page={page} />
    </>
  );
}
