import assert from 'node:assert/strict';

import { track } from '../src/shared/lib/analytics/track';

let cookieValue = '';
const requests: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];

Object.defineProperty(globalThis, 'document', {
  configurable: true,
  value: {
    get cookie() {
      return cookieValue;
    },
    set cookie(value: string) {
      cookieValue = cookieValue ? `${cookieValue}; ${value}` : value;
    },
    referrer: 'https://www.google.com/search?q=video',
  },
});

Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: {
    location: { pathname: '/en/video?private=1' },
  },
});

const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  requests.push({ input, init });
  return new Response(null, { status: 204 });
};

try {
  track(
    'result_view',
    { tool: 'video', model: 'seedance-2-fast', result_url: 'drop me' },
    { taskId: 'task-1' }
  );

  assert.equal(requests.length, 1);
  const body = JSON.parse(String(requests[0].init?.body));
  assert.equal(body.eventName, 'result_view');
  assert.equal(body.pagePath, '/en/video');
  assert.equal(body.referrerHost, 'www.google.com');
  assert.equal(body.taskId, 'task-1');
  assert.match(body.eventId, /^[0-9a-f-]{36}$/i);
  assert.match(cookieValue, /analytics_anon_id=/);
  assert.match(cookieValue, /analytics_session_id=/);

  track('landing_view', {}, { oncePerSession: true });
  const landingEventId = JSON.parse(String(requests[1].init?.body)).eventId;
  assert.match(landingEventId, /^landing_view:/);

  track('landing_view', {}, { oncePerSession: true });
  const repeatedLandingEventId = JSON.parse(
    String(requests[2].init?.body)
  ).eventId;
  assert.equal(repeatedLandingEventId, landingEventId);
  assert.equal(requests.length, 3);

  cookieValue = 'analytics_consent=denied';
  track('landing_view', { page_path: '/en' });
  track('purchase', {});
  assert.equal(requests.length, 3);
} finally {
  globalThis.fetch = originalFetch;
}

console.log('analytics track checks passed.');
