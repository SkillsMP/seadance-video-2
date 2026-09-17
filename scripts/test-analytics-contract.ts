import assert from 'node:assert/strict';

import {
  ANALYTICS_EVENT_NAMES,
  getAnalyticsEventDefinition,
  getDurationBucket,
  isClientAnalyticsEvent,
  sanitizeAnalyticsProperties,
} from '../src/shared/lib/analytics/events';

assert.equal(ANALYTICS_EVENT_NAMES.length, 14);
assert.deepEqual(
  new Set(ANALYTICS_EVENT_NAMES).size,
  ANALYTICS_EVENT_NAMES.length
);

for (const eventName of ANALYTICS_EVENT_NAMES) {
  assert.ok(getAnalyticsEventDefinition(eventName));
}

assert.equal(isClientAnalyticsEvent('landing_view'), true);
assert.equal(isClientAnalyticsEvent('login_complete'), true);
assert.equal(isClientAnalyticsEvent('generation_started'), false);
assert.equal(isClientAnalyticsEvent('purchase'), false);

assert.equal(getDurationBucket(0), 'lt_30s');
assert.equal(getDurationBucket(29_999), 'lt_30s');
assert.equal(getDurationBucket(30_000), '30_60s');
assert.equal(getDurationBucket(60_000), '60_120s');
assert.equal(getDurationBucket(120_000), '120_300s');
assert.equal(getDurationBucket(300_000), 'gte_300s');

assert.deepEqual(
  sanitizeAnalyticsProperties('generation_succeeded', {
    tool: 'video',
    scene: 'text-to-video',
    model: 'seedance-2-fast',
    duration_bucket: '30_60s',
    prompt: 'must never be stored',
    result_url: 'https://example.com/result.mp4',
    nested: { unsafe: true },
    retries: 2,
  }),
  {
    tool: 'video',
    scene: 'text-to-video',
    model: 'seedance-2-fast',
    duration_bucket: '30_60s',
    retries: 2,
  }
);

assert.deepEqual(
  sanitizeAnalyticsProperties('landing_view', {
    page_path: '/en/video',
    referrer_host: 'example.com',
    utm_source: 'google',
    unknown: 'drop me',
  }),
  {
    page_path: '/en/video',
    referrer_host: 'example.com',
    utm_source: 'google',
  }
);

console.log('analytics contract checks passed.');
