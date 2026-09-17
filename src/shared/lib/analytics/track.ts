import { deleteCookie, getCookie, setCookie } from '@/shared/lib/cookie';
import { getUuid } from '@/shared/lib/hash';

import {
  isClientAnalyticsEvent,
  sanitizeAnalyticsProperties,
  type AnalyticsEventName,
  type AnalyticsProperties,
} from './events';

const ANALYTICS_CONSENT_COOKIE = 'analytics_consent';
const ANALYTICS_ANONYMOUS_ID_COOKIE = 'analytics_anon_id';
const ANALYTICS_SESSION_ID_COOKIE = 'analytics_session_id';
const ANALYTICS_SESSION_STARTED_COOKIE = 'analytics_session_started_at';
const ANALYTICS_COOKIE_DAYS = 365;
const ANALYTICS_SESSION_TIMEOUT_MS = 30 * 60 * 1000;

export function resetAnalyticsContext(): void {
  deleteCookie(ANALYTICS_ANONYMOUS_ID_COOKIE);
  deleteCookie(ANALYTICS_SESSION_ID_COOKIE);
  deleteCookie(ANALYTICS_SESSION_STARTED_COOKIE);
}

export interface TrackOptions {
  eventId?: string;
  oncePerSession?: boolean;
  occurredAt?: Date;
  taskId?: string;
  tool?: string;
  model?: string;
  locale?: string;
  surface?: string;
  pagePath?: string;
  referrerHost?: string;
}

function getPagePath(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  return window.location.pathname.split(/[?#]/, 1)[0] || '/';
}

function getReferrerHost(): string | undefined {
  if (typeof document === 'undefined' || !document.referrer) return undefined;

  try {
    return new URL(document.referrer).hostname;
  } catch {
    return undefined;
  }
}

function getLocale(): string | undefined {
  if (typeof document === 'undefined') return undefined;
  return document.documentElement?.lang || undefined;
}

function getAnalyticsContext() {
  let anonymousId = getCookie(ANALYTICS_ANONYMOUS_ID_COOKIE);
  if (!anonymousId) {
    anonymousId = getUuid();
    setCookie(
      ANALYTICS_ANONYMOUS_ID_COOKIE,
      anonymousId,
      ANALYTICS_COOKIE_DAYS
    );
  }

  const now = Date.now();
  const startedAt = Number(getCookie(ANALYTICS_SESSION_STARTED_COOKIE) || 0);
  let sessionId = getCookie(ANALYTICS_SESSION_ID_COOKIE);
  if (
    !sessionId ||
    !startedAt ||
    now - startedAt >= ANALYTICS_SESSION_TIMEOUT_MS
  ) {
    sessionId = getUuid();
    setCookie(ANALYTICS_SESSION_ID_COOKIE, sessionId, ANALYTICS_COOKIE_DAYS);
    setCookie(
      ANALYTICS_SESSION_STARTED_COOKIE,
      String(now),
      ANALYTICS_COOKIE_DAYS
    );
  }

  return { anonymousId, sessionId };
}

export function track(
  eventName: AnalyticsEventName,
  properties: AnalyticsProperties = {},
  options: TrackOptions = {}
): void {
  if (typeof window === 'undefined' || !isClientAnalyticsEvent(eventName)) {
    return;
  }

  if (getCookie(ANALYTICS_CONSENT_COOKIE) === 'denied') return;

  const { anonymousId, sessionId } = getAnalyticsContext();
  const eventId =
    options.eventId ||
    (options.oncePerSession ? `${eventName}:${sessionId}` : getUuid());
  const body = {
    eventName,
    eventId,
    occurredAt: (options.occurredAt || new Date()).toISOString(),
    anonymousId,
    sessionId,
    pagePath: options.pagePath || getPagePath(),
    referrerHost: options.referrerHost || getReferrerHost(),
    taskId: options.taskId,
    tool: options.tool,
    model: options.model,
    locale: options.locale || getLocale(),
    surface: options.surface,
    properties: sanitizeAnalyticsProperties(eventName, properties),
  };

  try {
    void fetch('/api/analytics/events', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // Analytics must never affect the user flow.
  }
}
