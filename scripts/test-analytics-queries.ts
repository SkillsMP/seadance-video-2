import assert from 'node:assert/strict';

import { buildAnalyticsReport } from '../src/shared/services/analytics-events';

const events = [
  {
    id: 'landing-1',
    eventName: 'landing_view' as const,
    occurredAt: new Date('2026-09-17T08:00:00.000Z'),
    userId: null,
    anonymousId: 'anon-1',
    sessionId: 'session-1',
    taskId: null,
    orderId: null,
    tool: null,
    model: null,
    properties: JSON.stringify({
      page_path: '/en/video',
      utm_source: 'google',
    }),
  },
  {
    id: 'login-1',
    eventName: 'login_complete' as const,
    occurredAt: new Date('2026-09-17T08:01:00.000Z'),
    userId: 'user-1',
    anonymousId: 'anon-1',
    sessionId: 'session-1',
    taskId: null,
    orderId: null,
    tool: null,
    model: null,
    properties: '{}',
  },
  {
    id: 'signup-1',
    eventName: 'sign_up' as const,
    occurredAt: new Date('2026-09-17T08:02:00.000Z'),
    userId: 'user-1',
    anonymousId: null,
    sessionId: null,
    taskId: null,
    orderId: null,
    tool: null,
    model: null,
    properties: '{}',
  },
  {
    id: 'tool-1',
    eventName: 'tool_start' as const,
    occurredAt: new Date('2026-09-17T08:03:00.000Z'),
    userId: 'user-1',
    anonymousId: 'anon-1',
    sessionId: 'session-1',
    taskId: null,
    orderId: null,
    tool: 'video',
    model: 'seedance-2-fast',
    properties: '{}',
  },
  {
    id: 'started-1',
    eventName: 'generation_started' as const,
    occurredAt: new Date('2026-09-17T08:04:00.000Z'),
    userId: 'user-1',
    anonymousId: null,
    sessionId: null,
    taskId: 'task-1',
    orderId: null,
    tool: 'video',
    model: 'seedance-2-fast',
    properties: '{}',
  },
  {
    id: 'succeeded-1',
    eventName: 'generation_succeeded' as const,
    occurredAt: new Date('2026-09-17T08:05:00.000Z'),
    userId: 'user-1',
    anonymousId: null,
    sessionId: null,
    taskId: 'task-1',
    orderId: null,
    tool: 'video',
    model: 'seedance-2-fast',
    properties: JSON.stringify({ duration_bucket: '60_120s' }),
  },
  {
    id: 'result-1',
    eventName: 'result_view' as const,
    occurredAt: new Date('2026-09-17T08:06:00.000Z'),
    userId: 'user-1',
    anonymousId: 'anon-1',
    sessionId: 'session-1',
    taskId: 'task-1',
    orderId: null,
    tool: 'video',
    model: 'seedance-2-fast',
    properties: '{}',
  },
  {
    id: 'checkout-1',
    eventName: 'checkout_started' as const,
    occurredAt: new Date('2026-09-17T08:07:00.000Z'),
    userId: 'user-1',
    anonymousId: null,
    sessionId: null,
    taskId: null,
    orderId: 'order-1',
    tool: null,
    model: null,
    properties: JSON.stringify({ currency: 'usd' }),
  },
  {
    id: 'purchase-1',
    eventName: 'purchase' as const,
    occurredAt: new Date('2026-09-17T08:08:00.000Z'),
    userId: 'user-1',
    anonymousId: null,
    sessionId: null,
    taskId: null,
    orderId: 'order-1',
    tool: null,
    model: null,
    properties: JSON.stringify({ currency: 'usd' }),
  },
  {
    id: 'failure-1',
    eventName: 'generation_failed' as const,
    occurredAt: new Date('2026-09-17T08:09:00.000Z'),
    userId: 'user-1',
    anonymousId: null,
    sessionId: null,
    taskId: 'task-2',
    orderId: null,
    tool: 'video',
    model: 'seedance-2-fast',
    properties: JSON.stringify({ error_type: 'provider_rate_limited' }),
  },
];

const report = buildAnalyticsReport(
  events,
  [
    {
      id: 'task-1',
      userId: 'user-1',
      status: 'success',
      model: 'seedance-2-fast',
      costCredits: 12,
    },
    {
      id: 'task-2',
      userId: 'user-1',
      status: 'failed',
      model: 'seedance-2-fast',
      costCredits: 8,
    },
  ],
  [
    {
      id: 'order-1',
      userId: 'user-1',
      status: 'paid',
      amount: 1999,
      paymentAmount: 1999,
      currency: 'usd',
      paymentCurrency: 'usd',
      paidAt: new Date('2026-09-17T08:08:00.000Z'),
    },
  ]
);

assert.equal(report.acquisition.funnel.landing_view.actors, 1);
assert.equal(report.acquisition.funnel.sign_up.actors, 1);
assert.equal(report.acquisition.funnel.checkout_started.actors, 1);
assert.equal(report.acquisition.funnel.purchase.actors, 1);
assert.equal(report.acquisition.revenueByCurrency.usd.amount, 1999);
assert.equal(report.productUsage.tasks.started, 2);
assert.equal(report.productUsage.tasks.succeeded, 1);
assert.equal(report.productUsage.tasks.failed, 1);
assert.equal(report.productUsage.tasks.processing, 0);
assert.equal(report.productUsage.events.result_view.actors, 1);
assert.equal(report.failuresAndCost.submitFailures, 0);
assert.equal(
  report.failuresAndCost.taskFailuresByType.provider_rate_limited,
  1
);
assert.equal(report.failuresAndCost.totalCostCredits, 20);
assert.equal(report.coverage.eventCounts.generation_succeeded, 1);

console.log('analytics query checks passed.');
