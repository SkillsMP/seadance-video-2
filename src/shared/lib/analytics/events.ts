export const ANALYTICS_EVENT_NAMES = [
  'landing_view',
  'tool_start',
  'upload_completed',
  'generation_submit_failed',
  'generation_started',
  'generation_succeeded',
  'generation_failed',
  'result_view',
  'download_result',
  'sign_up',
  'login_complete',
  'pricing_view',
  'checkout_started',
  'purchase',
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENT_NAMES)[number];

export type AnalyticsEventSource = 'client' | 'server';

export type AnalyticsPropertyValue = string | number | boolean;

export type AnalyticsProperties = Record<string, unknown>;

export type AnalyticsEventDefinition = {
  source: AnalyticsEventSource;
  propertyKeys: readonly string[];
};

const COMMON_PROPERTY_KEYS = [
  'locale',
  'surface',
  'tool',
  'scene',
  'model',
] as const;

const ANALYTICS_EVENT_DEFINITIONS: Record<
  AnalyticsEventName,
  AnalyticsEventDefinition
> = {
  landing_view: {
    source: 'client',
    propertyKeys: [
      'page_path',
      'referrer_host',
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'locale',
      'surface',
    ],
  },
  tool_start: {
    source: 'client',
    propertyKeys: COMMON_PROPERTY_KEYS,
  },
  upload_completed: {
    source: 'client',
    propertyKeys: [
      ...COMMON_PROPERTY_KEYS,
      'input_kind',
      'file_count',
      'file_size_bucket',
    ],
  },
  generation_submit_failed: {
    source: 'client',
    propertyKeys: [...COMMON_PROPERTY_KEYS, 'error_type'],
  },
  generation_started: {
    source: 'server',
    propertyKeys: COMMON_PROPERTY_KEYS,
  },
  generation_succeeded: {
    source: 'server',
    propertyKeys: [...COMMON_PROPERTY_KEYS, 'duration_bucket', 'retries'],
  },
  generation_failed: {
    source: 'server',
    propertyKeys: [...COMMON_PROPERTY_KEYS, 'duration_bucket', 'error_type'],
  },
  result_view: {
    source: 'client',
    propertyKeys: [...COMMON_PROPERTY_KEYS, 'surface'],
  },
  download_result: {
    source: 'client',
    propertyKeys: [...COMMON_PROPERTY_KEYS, 'download_type'],
  },
  sign_up: {
    source: 'server',
    propertyKeys: ['method', 'locale', 'source'],
  },
  login_complete: {
    source: 'client',
    propertyKeys: ['method', 'locale', 'source'],
  },
  pricing_view: {
    source: 'client',
    propertyKeys: ['plan', 'billing_cycle', 'locale', 'surface'],
  },
  checkout_started: {
    source: 'server',
    propertyKeys: ['provider', 'plan', 'billing_cycle', 'currency', 'locale'],
  },
  purchase: {
    source: 'server',
    propertyKeys: ['provider', 'plan', 'billing_cycle', 'currency', 'locale'],
  },
};

const MAX_PROPERTY_VALUE_LENGTH = 160;
const MAX_PROPERTIES = 24;

export function isAnalyticsEventName(
  eventName: string
): eventName is AnalyticsEventName {
  return Object.prototype.hasOwnProperty.call(
    ANALYTICS_EVENT_DEFINITIONS,
    eventName
  );
}

export function getAnalyticsEventDefinition(
  eventName: string
): AnalyticsEventDefinition | undefined {
  if (!isAnalyticsEventName(eventName)) return undefined;
  return ANALYTICS_EVENT_DEFINITIONS[eventName];
}

export function isClientAnalyticsEvent(eventName: string): boolean {
  return getAnalyticsEventDefinition(eventName)?.source === 'client';
}

export function sanitizeAnalyticsProperties(
  eventName: string,
  properties: AnalyticsProperties | undefined
): Record<string, AnalyticsPropertyValue> {
  const definition = getAnalyticsEventDefinition(eventName);
  if (!definition || !properties) return {};

  const allowedKeys = new Set(definition.propertyKeys);
  const sanitized: Record<string, AnalyticsPropertyValue> = {};

  for (const [key, value] of Object.entries(properties)) {
    if (Object.keys(sanitized).length >= MAX_PROPERTIES) break;
    if (!allowedKeys.has(key)) continue;

    if (typeof value === 'string') {
      if (value.length === 0 || value.length > MAX_PROPERTY_VALUE_LENGTH) {
        continue;
      }
      sanitized[key] = value;
      continue;
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      sanitized[key] = value;
      continue;
    }

    if (typeof value === 'boolean') {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

export function getDurationBucket(
  durationMs: number
): 'lt_30s' | '30_60s' | '60_120s' | '120_300s' | 'gte_300s' {
  const duration = Number.isFinite(durationMs) ? Math.max(0, durationMs) : 0;

  if (duration < 30_000) return 'lt_30s';
  if (duration < 60_000) return '30_60s';
  if (duration < 120_000) return '60_120s';
  if (duration < 300_000) return '120_300s';
  return 'gte_300s';
}
