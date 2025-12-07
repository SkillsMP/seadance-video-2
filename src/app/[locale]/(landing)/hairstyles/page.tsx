import { getTranslations, setRequestLocale } from 'next-intl/server';

import { getThemePage } from '@/core/theme';
import { getMetadata } from '@/shared/lib/seo';
import { DynamicPage } from '@/shared/types/blocks/landing';

export const generateMetadata = getMetadata({
  metadataKey: 'hairstyles.metadata',
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
  const t = await getTranslations('hairstyles');

  // build page sections
  const page: DynamicPage = {
    
    sections: {
      'showcases-flow': t.raw('showcases-flow'),
    },
  };

  // load page component
  const Page = await getThemePage('dynamic-page');

  return <Page locale={locale} page={page} />;
}
