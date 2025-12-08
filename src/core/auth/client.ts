import { oneTapClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

import { envConfigs } from '@/config';

// create default auth client, without plugins
export const authClient = createAuthClient({
  baseURL: envConfigs.auth_url,
  fetchOptions: {
    // Disable automatic refetching on window focus to prevent request storms
    refetchOnWindowFocus: false,
    // Use exponential backoff retry strategy to prevent rapid retries when requests are pending
    retry: {
      type: 'exponential', // 指定使用指数退避策略
      attempts: 2, //最多重试 2 次
      baseDelay: 5000, // 基础延迟 5 秒
      maxDelay: 10000, // 最大延迟 10 秒
    },
  },
});

// export default auth client methods
export const { useSession, signIn, signUp, signOut } = authClient;

// get auth client with plugins
export function getAuthClient(configs: Record<string, string>) {
  const authClient = createAuthClient({
    baseURL: envConfigs.auth_url,
    plugins: getAuthPlugins(configs),
    fetchOptions: {
      // Disable automatic refetching on window focus to prevent request storms
      refetchOnWindowFocus: false,
      // Use exponential backoff retry strategy to prevent rapid retries when requests are pending
      retry: {
        type: 'exponential',
        attempts: 2,
        baseDelay: 2000, // 2 seconds base delay
        maxDelay: 10000, // 10 seconds max delay
      },
    },
  });

  return authClient;
}

// get auth plugins with configs
function getAuthPlugins(configs: Record<string, string>) {
  const authPlugins = [];

  // google one tap plugin
  if (configs.google_client_id && configs.google_one_tap_enabled === 'true') {
    authPlugins.push(
      oneTapClient({
        clientId: configs.google_client_id,
        // Optional client configuration:
        autoSelect: false,
        cancelOnTapOutside: false,
        context: 'signin',
        additionalOptions: {
          // Any extra options for the Google initialize method
        },
        // Configure prompt behavior and exponential backoff:
        promptOptions: {
          baseDelay: 1000, // Base delay in ms (default: 1000)
          maxAttempts: 1, // Only attempt once to avoid multiple error logs (default: 5)
        },
      })
    );
  }

  return authPlugins;
}
