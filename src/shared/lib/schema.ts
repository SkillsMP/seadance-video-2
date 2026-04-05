import moment from 'moment';

// ========== Internal Helpers ==========

/**
 * Parse various date string formats into ISO 8601 date (YYYY-MM-DD).
 * Handles: "Apr 4, 2026", "2026/04/04", ISO 8601 strings, etc.
 */
function toISODate(dateStr: string): string {
  const parsed = moment(dateStr, [
    'MMM D, YYYY',
    'YYYY/MM/DD',
    moment.ISO_8601,
  ]);
  return parsed.isValid() ? parsed.format('YYYY-MM-DD') : '';
}

// ========== Schema Builders ==========

/**
 * WebSite: Site Name in search results.
 * ⚠️ SearchAction / sitelinks search box was deprecated by Google on 2024-11-21. Do NOT add potentialAction.
 */
export function buildWebSiteSchema(config: { name: string; url: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: config.name,
    url: config.url,
  };
}

/**
 * Organization: brand entity recognition, knowledge panel foundation.
 */
export function buildOrganizationSchema(config: {
  name: string;
  url: string;
  logo: string;
  sameAs?: string[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: config.name,
    url: config.url,
    logo: config.logo,
    ...(config.sameAs?.length ? { sameAs: config.sameAs } : {}),
  };
}

/**
 * BreadcrumbList: breadcrumb path in search results.
 */
export function buildBreadcrumbSchema(
  items: { name: string; url: string }[]
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Article / BlogPosting: blog post rich snippet candidate.
 * Dates are auto-parsed from display strings via toISODate().
 */
export function buildArticleSchema(post: {
  title: string;
  url: string;
  datePublished: string; // any parseable date string
  dateModified?: string;
  authorName: string;
  image?: string;
  description?: string;
}) {
  const datePublished = toISODate(post.datePublished);
  if (!datePublished) return null;

  const dateModified = post.dateModified
    ? toISODate(post.dateModified)
    : undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    url: post.url,
    datePublished,
    ...(dateModified ? { dateModified } : {}),
    author: { '@type': 'Person', name: post.authorName },
    ...(post.image ? { image: post.image } : {}),
    ...(post.description ? { description: post.description } : {}),
  };
}

