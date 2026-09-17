import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(
  resolve('src/app/api/analytics/funnel/route.ts'),
  'utf8'
);

for (const fragment of [
  'getAnalyticsReport',
  'PERMISSIONS.ADMIN_ACCESS',
  'hasPermission',
  'getUserInfo',
  'export async function POST',
]) {
  assert.ok(
    source.includes(fragment),
    `missing funnel route boundary: ${fragment}`
  );
}

assert.equal(
  source.includes('.from(analyticsEvent)'),
  false,
  'the route must use the analytics service instead of exposing raw events'
);

console.log('analytics funnel route contract checks passed.');
