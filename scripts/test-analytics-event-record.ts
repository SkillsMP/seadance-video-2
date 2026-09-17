import assert from 'node:assert/strict';

import { buildAnalyticsEventRecord } from '../src/shared/models/event';

const occurredAt = new Date('2026-09-17T08:00:00.000Z');
const receivedAt = new Date('2026-09-17T08:00:01.000Z');

const record = buildAnalyticsEventRecord({
  id: 'event-1',
  dedupeKey: 'generation_succeeded:task-1',
  eventName: 'generation_succeeded',
  source: 'server',
  schemaVersion: 1,
  buildId: '',
  occurredAt,
  receivedAt,
  anonymousId: 'anon-1',
  userId: 'user-1',
  sessionId: 'session-1',
  pagePath: '/en/video',
  referrerHost: 'example.com',
  taskId: 'task-1',
  orderId: '',
  tool: 'video',
  model: 'seedance-2-fast',
  locale: 'en',
  surface: 'generator',
  properties: {
    duration_bucket: '30_60s',
    prompt: 'must never be stored',
    result_url: 'https://example.com/result.mp4',
  },
});

assert.deepEqual(record, {
  id: 'event-1',
  dedupeKey: 'generation_succeeded:task-1',
  eventName: 'generation_succeeded',
  schemaVersion: 1,
  buildId: null,
  occurredAt,
  receivedAt,
  source: 'server',
  anonymousId: 'anon-1',
  userId: 'user-1',
  sessionId: 'session-1',
  pagePath: '/en/video',
  referrerHost: 'example.com',
  taskId: 'task-1',
  orderId: null,
  tool: 'video',
  model: 'seedance-2-fast',
  locale: 'en',
  surface: 'generator',
  properties: JSON.stringify({ duration_bucket: '30_60s' }),
});

const defaultedRecord = buildAnalyticsEventRecord({
  eventName: 'landing_view',
  source: 'client',
  properties: { page_path: '/en', locale: 'en' },
});

assert.match(defaultedRecord.id, /^[0-9a-f-]{36}$/i);
assert.equal(defaultedRecord.schemaVersion, 1);
assert.equal(defaultedRecord.buildId, null);
assert.ok(defaultedRecord.occurredAt instanceof Date);
assert.ok(defaultedRecord.receivedAt instanceof Date);

console.log('analytics event record checks passed.');
