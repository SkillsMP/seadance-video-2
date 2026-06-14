import { getTranslations, setRequestLocale } from 'next-intl/server';

import { envConfigs } from '@/config';
import { defaultLocale } from '@/config/locale';
import { JsonLd } from '@/shared/components/seo/json-ld';
import { buildBreadcrumbSchema } from '@/shared/lib/schema';
import { getMetadata } from '@/shared/lib/seo';
import { getPrompts, PromptStatus } from '@/shared/models/prompt';
import { PromptLibrary } from '@/themes/default/blocks/prompt-library';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const generateMetadata = getMetadata({
  metadataKey: 'pages.prompts.metadata',
  canonicalUrl: '/prompts',
});

export default async function PromptsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('pages.prompts');
  const section = t.raw('prompt-library');
  let prompts: Awaited<ReturnType<typeof getPrompts>> = [];
  try {
    prompts = await getPrompts({
      page: 1,
      limit: section.dataLimit || 60,
      status: PromptStatus.PUBLISHED,
    });
  } catch (error) {
    console.error('Failed to load prompt library:', error);
  }
  const promptItems = prompts.map((item) => ({
    ...item,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }));

  const appUrl = envConfigs.app_url;
  const localizedPromptsUrl = `${appUrl}${
    locale === defaultLocale ? '' : `/${locale}`
  }/prompts`;

  return (
    <>
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: section.breadcrumbHome || 'Home', url: appUrl },
          {
            name: section.breadcrumbCurrent || 'Prompts',
            url: localizedPromptsUrl,
          },
        ])}
      />
      <PromptLibrary section={section} items={promptItems} />
    </>
  );
}
