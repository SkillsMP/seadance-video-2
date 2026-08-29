import { envConfigs } from '..';

export const localeNames: Record<string, string> = {
  en: 'English',
};

export const locales = ['en'];

export const defaultLocale = envConfigs.locale;

export const localePrefix = 'as-needed';

export const localeDetection = false;

export const localeMessagesRootPath = '@/config/locale/messages';

export const localeMessagesPaths = [
  'common',
  'landing',
  'settings/sidebar',
  'settings/profile',
  'settings/security',
  'settings/billing',
  'settings/payments',
  'settings/credits',
  'settings/apikeys',
  'admin/sidebar',
  'admin/users',
  'admin/roles',
  'admin/permissions',
  'admin/categories',
  'admin/posts',
  'admin/payments',
  'admin/subscriptions',
  'admin/credits',
  'admin/settings',
  'admin/apikeys',
  'admin/ai-tasks',
  'admin/chats',
  'ai/music',
  'ai/chat',
  'ai/image',
  'ai/video',
  'activity/sidebar',
  'activity/ai-tasks',
  'activity/chats',
  'pages/index',
  'pages/pricing',
  'pages/showcases',
  'pages/prompts',
  'pages/blog',
  'pages/updates',
  'pages/create',
  'pages/hairstyles',
  'pages/seedance-2-0',
  'admin/prompts',
  'admin/showcases',
  'pages/how-to-use-seedance',
  'pages/prompts/seedance-2-0',
  'pages/seedance-2-5',
  'pages/seedance-2-5/api',
  'pages/seedance-2-5/examples',
  'pages/seedance-2-5/platforms',
  'pages/seedance-2-5/pricing',
  'pages/seedance-2-5/reference-to-video',
  'pages/seedance-2-5/vs-seedance-2-0',
  'pages/seedance-api',
  'pages/seedance-examples',
  'pages/seedance-pricing',
  'pages/seedance/open-source',
  'pages/seedance/platforms',
  'pages/seedance/troubleshooting',
  'pages/seedance/versions',
  'pages/seedance/video-to-video',
  'pages/seedance/watermark-copyright',
  'pages/what-is-seedance',
  'pages/compare',
  'pages/compare/seedance-vs-kling',
  'pages/compare/seedance-vs-minimax-h3',
  'pages/compare/seedance-vs-veo',
  'pages/use-cases/seedance-ugc-video',
];
