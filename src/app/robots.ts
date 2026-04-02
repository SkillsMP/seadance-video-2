import { MetadataRoute } from 'next';

import { envConfigs } from '@/config';

export default function robots(): MetadataRoute.Robots {
  const appUrl = envConfigs.app_url;

  return {
    rules: [
      {
        // 1. 白名单组：允许【主流搜索 + AI 搜索 + 社交媒体 + 用户即时交互】
        userAgent: [
          'Googlebot',
          'Bingbot',
          'Baiduspider',
          'Applebot',
          'OAI-SearchBot',
          'PerplexityBot',
          'ChatGPT-User',
          'Claude-Web',
          'facebookexternalhit',
          'FacebookBot',
          'Twitterbot',
          'LinkedInBot',
        ],
        allow: ['/', '/_next/static/', '/_next/image'],
        disallow: ['/api/', '/admin/', '/login/', '/settings/*', '/activity/*'],
      },
      {
        // 2. 黑名单组：严厉拒绝【纯训练数据采集】(拒绝白嫖)
        userAgent: [
          'GPTBot',
          'ClaudeBot',
          'AnthropicAI',
          'Google-Extended',
          'CCBot',
          'Bytespider',
          'Amazonbot',
        ],
        disallow: ['/'],
      },
      {
        // 3. 默认组：针对所有未列出的普通爬虫
        userAgent: '*',
        allow: ['/', '/_next/static/', '/_next/image'],
        disallow: [
          '/api/',
          '/admin/',
          '/login/',
          '/settings/*',
          '/activity/*',
        ],
      },
    ],
    sitemap: `${appUrl}/sitemap.xml`,
  };
}

