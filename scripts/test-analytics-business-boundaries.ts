import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function readSource(path: string): string {
  return readFileSync(resolve(path), 'utf8');
}

function assertContains(source: string, fragment: string, message: string) {
  assert.ok(source.includes(fragment), message);
}

function assertAfter(
  source: string,
  first: string,
  second: string,
  message: string
) {
  const firstIndex = source.indexOf(first);
  const secondIndex = source.indexOf(second);
  assert.notEqual(firstIndex, -1, `${first} is missing`);
  assert.notEqual(secondIndex, -1, `${second} is missing`);
  assert.ok(firstIndex < secondIndex, message);
}

const generateRoute = readSource('src/app/api/ai/generate/route.ts');
assertContains(
  generateRoute,
  "from '@/shared/services/analytics-events'",
  'generate route must use the self-owned analytics service'
);
assertAfter(
  generateRoute,
  'await createAITask(newAITask);',
  'await recordGenerationStartedEvent({',
  'generation_started must be recorded after the task is committed'
);

const queryRoute = readSource('src/app/api/ai/query/route.ts');
assertAfter(
  queryRoute,
  'await updateAITaskById(task.id, updateAITask);',
  'await recordGenerationTerminalEvent({',
  'terminal generation events must be recorded after the task update'
);

const checkoutRoute = readSource('src/app/api/payment/checkout/route.ts');
assertAfter(
  checkoutRoute,
  'status: OrderStatus.CREATED',
  'recordEvent({',
  'checkout_started must be recorded after checkout creation succeeds'
);

const paymentService = readSource('src/shared/services/payment.ts');
assertContains(
  paymentService,
  'recordPurchaseEvent',
  'payment service must record purchase events through one shared helper'
);
assertAfter(
  paymentService,
  'await updateOrderInTransaction({',
  'await recordPurchaseEvent({',
  'purchase must be recorded after order and entitlement updates'
);

const authConfig = readSource('src/core/auth/config.ts');
assertAfter(
  authConfig,
  'await grantRoleForNewUser(user);',
  "eventName: 'sign_up'",
  'sign_up must be recorded after the user has been created'
);

const landingLayout = readSource('src/app/[locale]/(landing)/layout.tsx');
assertContains(
  landingLayout,
  '<LandingViewEvent />',
  'landing layout must mount the landing_view client boundary'
);

const pricing = readSource('src/themes/default/blocks/pricing.tsx');
assertContains(
  pricing,
  "track('pricing_view'",
  'pricing must record pricing_view'
);

for (const path of [
  'src/shared/blocks/generator/video.tsx',
  'src/shared/blocks/generator/image.tsx',
]) {
  const generator = readSource(path);
  assertContains(
    generator,
    "track('tool_start'",
    `${path} must record tool_start`
  );
  assertContains(
    generator,
    "track('generation_submit_failed'",
    `${path} must record generation_submit_failed`
  );
  assertContains(generator, "'result_view'", `${path} must record result_view`);
  assertContains(
    generator,
    "'download_result'",
    `${path} must record download_result`
  );
}

console.log('analytics business boundary checks passed.');
