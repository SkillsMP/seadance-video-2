import type { DynamicPage } from '@/shared/types/blocks/landing';

/** Keep optional showcase sections and their local links in sync. */
export function prepareModelLandingPage(page: DynamicPage): DynamicPage {
  const examples = page.sections?.examples;
  const visible =
    !!examples &&
    !examples.disabled &&
    !!examples.items?.length &&
    (!page.show_sections || page.show_sections.includes('examples'));
  if (visible) return page;

  const isExampleLink = (url?: string) =>
    url?.split('#')[1] === (examples?.id || 'examples');
  return {
    ...page,
    sections: Object.fromEntries(
      Object.entries(page.sections ?? {}).map(([key, section]) => [
        key,
        {
          ...section,
          ...(key === 'examples' ? { disabled: true } : {}),
          ...(section.buttons
            ? {
                buttons: section.buttons.filter(
                  (button) => !isExampleLink(button.url)
                ),
              }
            : {}),
          ...(isExampleLink(section.announcement?.url)
            ? { announcement: undefined }
            : {}),
          ...(section.items
            ? {
                items: section.items.filter((item) => !isExampleLink(item.url)),
              }
            : {}),
        },
      ])
    ),
  };
}
