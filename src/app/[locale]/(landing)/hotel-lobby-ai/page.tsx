import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Link } from '@/core/i18n/navigation';
import { getThemePage } from '@/core/theme';
import { envConfigs } from '@/config';
import { VideoGenerator } from '@/shared/blocks/generator';
import { JsonLd } from '@/shared/components/seo/json-ld';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/shared/components/ui/breadcrumb';
import { buildBreadcrumbSchema } from '@/shared/lib/schema';
import { getMetadata } from '@/shared/lib/seo';
import type { DynamicPage } from '@/shared/types/blocks/landing';

export const generateMetadata = getMetadata({
  metadataKey: 'pages.hotel-lobby-ai.metadata',
  canonicalUrl: '/hotel-lobby-ai',
});

export default async function HotelLobbyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('pages.hotel-lobby-ai');
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
              srOnlyTitle={t('generator.title')}
              initialTab="image-to-video"
              initialImageKind="reference_images"
              initialPrompt={t('generator.prompt')}
            />
          </div>
        ),
      },
    },
  };
  const Page = await getThemePage('dynamic-page');

  return (
    <>
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: t('breadcrumb.home'), url: envConfigs.app_url },
          {
            name: t('breadcrumb.current'),
            url: `${envConfigs.app_url}/hotel-lobby-ai`,
          },
        ])}
      />
      <div className="container pt-24">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">{t('breadcrumb.home')}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{t('breadcrumb.current')}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <Page locale={locale} page={page} />
    </>
  );
}
