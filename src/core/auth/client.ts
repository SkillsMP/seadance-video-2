import { oneTapClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

import { envConfigs } from '@/config';

// Request deduplication map to prevent concurrent identical requests
const pendingRequests = new Map<string, Promise<any>>();

// Custom fetch wrapper with request deduplication
const debouncedFetch: typeof fetch = async (input, init?) => {
  const url = typeof input === 'string' ? input : (input as any).url;
  const method = init?.method || 'GET';
  const requestKey = `${method}:${url}`;

  // If there's already a pending request for this endpoint, return it
  if (pendingRequests.has(requestKey)) {
    console.log(`[Auth] Deduplicating request: ${requestKey}`);
    return pendingRequests.get(requestKey)!;
  }

  // Create new request and store it
  const requestPromise = fetch(input, init).finally(() => {
    // Clean up after request completes
    pendingRequests.delete(requestKey);
  });

  pendingRequests.set(requestKey, requestPromise);
  return requestPromise;
};

// create default auth client, without plugins
export const authClient = createAuthClient({
  baseURL: envConfigs.auth_url,
  fetchOptions: {
    // Use custom fetch with request deduplication
    customFetchImpl: debouncedFetch,
    // Disable automatic refetching on window focus to prevent request storms
    refetchOnWindowFocus: false,
    // 禁用网络重连时的自动刷新
    refetchOnReconnect: false,
    // 禁用自动后台轮询（这是最关键的）
    refetchInterval: false,
    // 设置 5 分钟的数据新鲜时间，期间不会自动重新请求
    staleTime: 5 * 60 * 1000,
    // 设置 10 分钟的缓存时间
    cacheTime: 10 * 60 * 1000,
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
      // Use custom fetch with request deduplication
      customFetchImpl: debouncedFetch,
      // Disable automatic refetching on window focus to prevent request storms
      refetchOnWindowFocus: false,
      // Disable automatic refetching on network reconnect
      refetchOnReconnect: false,
      // Disable automatic background refetching
      refetchInterval: false,
      // Set stale time to prevent automatic refetching (5 minutes)
      staleTime: 5 * 60 * 1000,
      // Cache time for inactive queries (10 minutes)
      cacheTime: 10 * 60 * 1000,
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
