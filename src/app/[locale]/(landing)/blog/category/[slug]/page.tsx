import moment from 'moment';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { getThemePage } from '@/core/theme';
import { envConfigs } from '@/config';
import { Empty } from '@/shared/blocks/common';
import { JsonLd } from '@/shared/components/seo/json-ld';
import { buildBreadcrumbSchema } from '@/shared/lib/schema';
import {
  buildLanguageAlternates,
  getCanonicalUrl,
} from '@/shared/lib/seo';
import {
  PostType as DBPostType,
  getPosts,
  PostStatus,
} from '@/shared/models/post';
import {
  findTaxonomy,
  getTaxonomies,
  TaxonomyStatus,
  TaxonomyType,
} from '@/shared/models/taxonomy';
import {
  Blog as BlogType,
  Category as CategoryType,
  Post as PostType,
} from '@/shared/types/blocks/blog';
import { DynamicPage } from '@/shared/types/blocks/landing';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const t = await getTranslations('pages.blog.metadata');
  const pagePath = `/blog/category/${slug}`;
  const canonicalUrl = await getCanonicalUrl(pagePath, locale);
  const languages = await buildLanguageAlternates(pagePath);

  return {
    title: `${slug} | ${t('title')}`,
    description: t('description'),
    alternates: {
      canonical: canonicalUrl,
      languages,
    },
  };
}

export default async function CategoryBlogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ page?: number; pageSize?: number }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  // load blog data
  const t = await getTranslations('blog');

  const { page: pageNum, pageSize } = await searchParams;
  const page = pageNum || 1;
  const limit = pageSize || 30;

  // get current category
  const categoryData = await findTaxonomy({
    slug,
    status: TaxonomyStatus.PUBLISHED,
  });
  if (!categoryData) {
    return <Empty message={`category not found`} />;
  }

  // get posts data
  const postsData = await getPosts({
    category: categoryData.id,
    type: DBPostType.ARTICLE,
    status: PostStatus.PUBLISHED,
    page,
    limit,
  });

  // get categories data
  const categoriesData = await getTaxonomies({
    type: TaxonomyType.CATEGORY,
    status: TaxonomyStatus.PUBLISHED,
  });

  // current category data
  const currentCategory: CategoryType = {
    id: categoryData.id,
    slug: categoryData.slug,
    title: categoryData.title,
    url: `/blog/category/${categoryData.slug}`,
  };

  // build category
  const categories: CategoryType[] = categoriesData.map((category) => ({
    id: category.id,
    slug: category.slug,
    title: category.title,
    url: `/blog/category/${category.slug}`,
  }));
  categories.unshift({
    id: 'all',
    slug: 'all',
    title: t('page.all'),
    url: `/blog`,
  });

  // build posts
  const posts: PostType[] = postsData.map((post) => ({
    id: post.id,
    title: post.title || '',
    description: post.description || '',
    author_name: post.authorName || '',
    author_image: post.authorImage || '',
    created_at: moment(post.createdAt).format('MMM D, YYYY') || '',
    image: post.image || '',
    url: `/blog/${post.slug}`,
  }));

  // build blog
  const blog: BlogType = {
    ...t.raw('blog'),
    categories,
    currentCategory,
    posts,
  };

  // build page sections
  const _page: DynamicPage = {
    sections: {
      blog: {
        block: 'blog',
        data: {
          blog,
        },
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
          { name: 'Blog', url: `${appUrl}/blog` },
          {
            name: categoryData.title,
            url: `${appUrl}/blog/category/${categoryData.slug}`,
          },
        ])}
      />
      <Page locale={locale} page={_page} />
    </>
  );
}
