import { getSessionCookie } from 'better-auth/cookies';

import { getCookieFromHeader } from '@/shared/lib/cookie';
import { respData, respErr } from '@/shared/lib/resp';
import { getUserInfo } from '@/shared/models/user';
import { recordClientEvent } from '@/shared/services/analytics-events';

export const MAX_CLIENT_EVENT_BYTES = 8 * 1024;

export async function POST(request: Request) {
  let rawBody = '';

  try {
    rawBody = await request.text();
  } catch (error) {
    console.error('Failed to read analytics event:', error);
    return respData({ accepted: false });
  }

  if (!rawBody || rawBody.length > MAX_CLIENT_EVENT_BYTES) {
    return respErr('invalid analytics event');
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return respErr('invalid analytics event');
  }

  const cookieHeader = request.headers.get('cookie');
  const consentDenied =
    getCookieFromHeader(cookieHeader, 'analytics_consent') === 'denied';

  let userId: string | null = null;
  if (!consentDenied && getSessionCookie(request)) {
    try {
      userId = (await getUserInfo())?.id || null;
    } catch (error) {
      console.error('Failed to resolve analytics user:', error);
    }
  }

  const accepted = await recordClientEvent(payload, {
    userId,
    consentDenied,
  });

  return respData({ accepted });
}
