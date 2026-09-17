import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(
  resolve('src/app/api/analytics/events/route.ts'),
  'utf8'
);

for (const fragment of [
  'recordClientEvent',
  'getUserInfo',
  'getSessionCookie',
  'getCookieFromHeader',
  'request.text()',
  'MAX_CLIENT_EVENT_BYTES',
]) {
  assert.ok(
    source.includes(fragment),
    `missing analytics route boundary: ${fragment}`
  );
}

assert.equal(
  /userId\s*:\s*input/.test(source),
  false,
  'client payload must not provide the analytics user id'
);

console.log('analytics route contract checks passed.');
