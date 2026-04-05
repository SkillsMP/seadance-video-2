import { getTranslations, setRequestLocale } from 'next-intl/server';

import { envConfigs } from '@/config';
import { JsonLd } from '@/shared/components/seo/json-ld';
import { buildBreadcrumbSchema } from '@/shared/lib/schema';
import { getMetadata } from '@/shared/lib/seo';
import { ShowcasesFlowDynamic } from '@/themes/default/blocks/showcases-flow-dynamic';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const generateMetadata = getMetadata({
  metadataKey: 'pages.showcases.metadata',
  canonicalUrl: '/showcases',
});

export default async function ShowcasesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('pages.showcases');
  const showcasesData = t.raw('showcases-flow');

  const appUrl = envConfigs.app_url;

  return (
    <>
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: 'Home', url: appUrl },
          { name: 'Showcases', url: `${appUrl}/showcases` },
        ])}
      />
      <ShowcasesFlowDynamic
        title={showcasesData.title}
        description={showcasesData.description}
        containerClassName="py-14"
        usePrompts={true}
      />
    </>
  );
}
