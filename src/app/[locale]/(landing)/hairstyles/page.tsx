import { getTranslations, setRequestLocale } from 'next-intl/server';

import { getThemePage } from '@/core/theme';
import { envConfigs } from '@/config';
import { JsonLd } from '@/shared/components/seo/json-ld';
import { buildBreadcrumbSchema } from '@/shared/lib/schema';
import { getMetadata } from '@/shared/lib/seo';
import { DynamicPage, Section } from '@/shared/types/blocks/landing';
import { HairstylesContent } from './hairstyles-content';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const generateMetadata = getMetadata({
  metadataKey: 'pages.hairstyles.metadata',
  canonicalUrl: '/hairstyles',
});

export default async function HairstylesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // load hairstyles data
  const t = await getTranslations('pages.hairstyles');

  const sectionData = t.raw('showcases-flow') as Section;

  // build page sections
  const page: DynamicPage = {
    sections: {
      'hairstyles-content': {
        component: <HairstylesContent sectionData={sectionData} />,
      },
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
          { name: 'Hairstyles', url: `${appUrl}/hairstyles` },
        ])}
      />
      <Page locale={locale} page={page} />
    </>
  );
}
