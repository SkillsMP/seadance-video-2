import assert from 'node:assert/strict';

import {
  buildClientAnalyticsEventInput,
  normalizeClientAnalyticsEvent,
} from '../src/shared/services/analytics-events';

const now = new Date('2026-09-17T08:00:00.000Z');

assert.equal(
  normalizeClientAnalyticsEvent({ eventName: 'purchase' }, now),
  null,
  'server-only events must not be accepted from the browser'
);

const normalized = normalizeClientAnalyticsEvent(
  {
    eventName: 'result_view',
    eventId: 'client-event-1',
    occurredAt: '2026-09-17T07:59:00.000Z',
    anonymousId: 'anon-1',
    sessionId: 'session-1',
    pagePath: '/en/video?prompt=private',
    referrerHost: 'Example.COM',
    taskId: 'task-1',
    tool: 'video',
    model: 'seedance-2-fast',
    locale: 'en',
    surface: 'generator',
    userId: 'attacker-controlled-user',
    properties: {
      surface: 'generator',
      result_url: 'https://example.com/private.mp4',
    },
  },
  now
);

assert.ok(normalized);
assert.equal(normalized.eventName, 'result_view');
assert.equal(normalized.pagePath, '/en/video');
assert.equal(normalized.referrerHost, 'example.com');
assert.equal('userId' in normalized, false);

const trustedInput = buildClientAnalyticsEventInput(normalized, {
  userId: 'trusted-user',
  taskId: 'task-1',
});

assert.equal(trustedInput.source, 'client');
assert.equal(trustedInput.userId, 'trusted-user');
assert.equal(trustedInput.taskId, 'task-1');
assert.equal(trustedInput.dedupeKey, 'client:client-event-1');
assert.deepEqual(trustedInput.properties, { surface: 'generator' });

const anonymousInput = buildClientAnalyticsEventInput(normalized, {
  userId: null,
  taskId: null,
});
assert.equal(anonymousInput.userId, null);
assert.equal(anonymousInput.taskId, null);

console.log('analytics service checks passed.');
