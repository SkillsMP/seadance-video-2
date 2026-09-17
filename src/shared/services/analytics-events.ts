import { and, asc, eq, gte, lte } from 'drizzle-orm';

import { db } from '@/core/db';
import { aiTask, analyticsEvent, order } from '@/config/db/schema';
import {
  getDurationBucket,
  isAnalyticsEventName,
  isClientAnalyticsEvent,
  sanitizeAnalyticsProperties,
  type AnalyticsEventName,
  type AnalyticsProperties,
} from '@/shared/lib/analytics/events';
import { getUuid } from '@/shared/lib/hash';
import { findAITaskById } from '@/shared/models/ai_task';
import {
  insertAnalyticsEvent,
  type AnalyticsEventInput,
} from '@/shared/models/event';

const ANALYTICS_EVENT_WINDOW_MS = 24 * 60 * 60 * 1000;

export interface NormalizedClientAnalyticsEvent {
  eventName: AnalyticsEventName;
  eventId: string | null;
  occurredAt: Date;
  anonymousId: string | null;
  sessionId: string | null;
  pagePath: string | null;
  referrerHost: string | null;
  taskId: string | null;
  tool: string | null;
  model: string | null;
  locale: string | null;
  surface: string | null;
  properties: AnalyticsProperties;
}

export interface ClientAnalyticsContext {
  userId?: string | null;
  consentDenied?: boolean;
}

export interface AnalyticsReportEvent {
  id: string;
  eventName: AnalyticsEventName;
  occurredAt: Date | string | number;
  userId?: string | null;
  anonymousId?: string | null;
  sessionId?: string | null;
  taskId?: string | null;
  orderId?: string | null;
  pagePath?: string | null;
  referrerHost?: string | null;
  tool?: string | null;
  model?: string | null;
  properties?: string | AnalyticsProperties | null;
}

export interface AnalyticsReportTask {
  id: string;
  userId?: string | null;
  status: string;
  model?: string | null;
  costCredits?: number | null;
}

export interface AnalyticsReportOrder {
  id: string;
  userId?: string | null;
  status: string;
  amount?: number | null;
  paymentAmount?: number | null;
  currency?: string | null;
  paymentCurrency?: string | null;
  paidAt?: Date | string | null;
}

interface AnalyticsMetric {
  events: number;
  actors: number;
}

type FunnelEventName =
  | 'landing_view'
  | 'sign_up'
  | 'checkout_started'
  | 'purchase';

const ACQUISITION_FUNNEL: readonly FunnelEventName[] = [
  'landing_view',
  'sign_up',
  'checkout_started',
  'purchase',
];

const PRODUCT_EVENT_NAMES = [
  'tool_start',
  'generation_started',
  'generation_succeeded',
  'result_view',
  'download_result',
] as const;

function parseReportProperties(
  value: string | AnalyticsProperties | null | undefined
): AnalyticsProperties {
  if (!value) return {};
  if (typeof value === 'object') return value;

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as AnalyticsProperties)
      : {};
  } catch {
    return {};
  }
}

function getReportProperty(event: AnalyticsReportEvent, key: string): unknown {
  const fieldMap: Record<string, unknown> = {
    page_path: event.pagePath,
    referrer_host: event.referrerHost,
    tool: event.tool,
    model: event.model,
  };
  const fieldValue = fieldMap[key];
  if (fieldValue !== null && fieldValue !== undefined) return fieldValue;
  return parseReportProperties(event.properties)[key];
}

function getReportString(value: unknown): string | null {
  return typeof value === 'string' && value ? value : null;
}

function getReportTime(event: AnalyticsReportEvent): number {
  const time = new Date(event.occurredAt).getTime();
  return Number.isFinite(time) ? time : 0;
}

function getAnonymousActorKey(event: AnalyticsReportEvent): string | null {
  if (!event.anonymousId || !event.sessionId) return null;
  return `anonymous:${event.anonymousId}:${event.sessionId}`;
}

function buildActorAliases(events: readonly AnalyticsReportEvent[]) {
  const aliases = new Map<string, string>();

  for (const event of events) {
    if (!event.userId) continue;
    const anonymousKey = getAnonymousActorKey(event);
    if (anonymousKey) {
      aliases.set(anonymousKey, `user:${event.userId}`);
    }
  }

  return aliases;
}

function getActorKey(
  event: AnalyticsReportEvent,
  aliases: Map<string, string>
): string {
  if (event.userId) return `user:${event.userId}`;

  const anonymousKey = getAnonymousActorKey(event);
  if (anonymousKey) return aliases.get(anonymousKey) || anonymousKey;

  return `event:${event.id}`;
}

function getEventMetrics(
  events: readonly AnalyticsReportEvent[],
  aliases: Map<string, string>
): Record<string, AnalyticsMetric> {
  const metrics: Record<string, AnalyticsMetric> = {};
  const actorSets: Record<string, Set<string>> = {};

  for (const event of events) {
    metrics[event.eventName] ||= { events: 0, actors: 0 };
    actorSets[event.eventName] ||= new Set<string>();
    metrics[event.eventName].events += 1;
    actorSets[event.eventName].add(getActorKey(event, aliases));
  }

  for (const [eventName, actors] of Object.entries(actorSets)) {
    metrics[eventName].actors = actors.size;
  }

  return metrics;
}

function getOrderedFunnelActors(
  events: readonly AnalyticsReportEvent[],
  aliases: Map<string, string>
): Record<FunnelEventName, AnalyticsMetric & { orderedActors: number }> {
  const byActor = new Map<string, AnalyticsReportEvent[]>();
  const metrics = getEventMetrics(events, aliases);

  for (const event of events) {
    if (!ACQUISITION_FUNNEL.includes(event.eventName as FunnelEventName)) {
      continue;
    }

    const actorKey = getActorKey(event, aliases);
    const actorEvents = byActor.get(actorKey) || [];
    actorEvents.push(event);
    byActor.set(actorKey, actorEvents);
  }

  const result = {} as Record<
    FunnelEventName,
    AnalyticsMetric & { orderedActors: number }
  >;

  for (let index = 0; index < ACQUISITION_FUNNEL.length; index += 1) {
    const eventName = ACQUISITION_FUNNEL[index];
    let orderedActors = 0;

    for (const actorEvents of byActor.values()) {
      let nextStep = 0;
      for (const event of actorEvents.sort(
        (left, right) => getReportTime(left) - getReportTime(right)
      )) {
        if (event.eventName === ACQUISITION_FUNNEL[nextStep]) {
          nextStep += 1;
        }
        if (nextStep > index) {
          orderedActors += 1;
          break;
        }
      }
    }

    result[eventName] = {
      ...(metrics[eventName] || { events: 0, actors: 0 }),
      orderedActors,
    };
  }

  return result;
}

function countByProperty(
  events: readonly AnalyticsReportEvent[],
  eventName: AnalyticsEventName
): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const event of events) {
    if (event.eventName !== eventName) continue;
    const value =
      getReportString(getReportProperty(event, 'error_type')) || 'unknown';
    counts[value] = (counts[value] || 0) + 1;
  }

  return counts;
}

export function buildAnalyticsReport(
  events: readonly AnalyticsReportEvent[],
  tasks: readonly AnalyticsReportTask[] = [],
  orders: readonly AnalyticsReportOrder[] = [],
  range?: { from?: Date; to?: Date }
) {
  const aliases = buildActorAliases(events);
  const metrics = getEventMetrics(events, aliases);
  const funnel = getOrderedFunnelActors(events, aliases);
  const revenueByCurrency: Record<string, { orders: number; amount: number }> =
    {};

  for (const order of orders) {
    if (order.status !== 'paid') continue;
    const currency = (
      order.paymentCurrency ||
      order.currency ||
      'unknown'
    ).toLowerCase();
    const amount = order.paymentAmount ?? order.amount ?? 0;
    revenueByCurrency[currency] ||= { orders: 0, amount: 0 };
    revenueByCurrency[currency].orders += 1;
    revenueByCurrency[currency].amount += amount;
  }

  const productMetrics: Record<string, AnalyticsMetric> = {};
  for (const eventName of PRODUCT_EVENT_NAMES) {
    productMetrics[eventName] = metrics[eventName] || { events: 0, actors: 0 };
  }

  const taskFailuresByType = countByProperty(events, 'generation_failed');
  const taskOutcomesByModel: Record<
    string,
    { succeeded: number; failed: number }
  > = {};
  const terminalTaskStatuses = new Set([
    'success',
    'failed',
    'canceled',
    'moderation_blocked',
    'moderation_failed',
  ]);

  for (const task of tasks) {
    if (!terminalTaskStatuses.has(task.status)) continue;
    const model = getReportString(task.model) || 'unknown';
    taskOutcomesByModel[model] ||= { succeeded: 0, failed: 0 };
    if (task.status === 'success') {
      taskOutcomesByModel[model].succeeded += 1;
    } else {
      taskOutcomesByModel[model].failed += 1;
    }
  }

  const landingBySource: Record<string, AnalyticsMetric> = {};
  const landingByPage: Record<string, AnalyticsMetric> = {};
  const landingSourceActors = new Map<string, Set<string>>();
  const landingPageActors = new Map<string, Set<string>>();
  for (const event of events) {
    if (event.eventName !== 'landing_view') continue;
    const source =
      getReportString(getReportProperty(event, 'utm_source')) || 'direct';
    const page =
      getReportString(getReportProperty(event, 'page_path')) || 'unknown';
    const actorKey = getActorKey(event, aliases);

    for (const [key, target, actors] of [
      [source, landingBySource, landingSourceActors],
      [page, landingByPage, landingPageActors],
    ] as const) {
      target[key] ||= { events: 0, actors: 0 };
      target[key].events += 1;
      const actorSet = actors.get(key) || new Set<string>();
      actorSet.add(actorKey);
      actors.set(key, actorSet);
    }
  }

  for (const [key, actors] of landingSourceActors) {
    landingBySource[key].actors = actors.size;
  }
  for (const [key, actors] of landingPageActors) {
    landingByPage[key].actors = actors.size;
  }

  const totalCostCredits = tasks.reduce(
    (total, task) => total + Math.max(0, task.costCredits || 0),
    0
  );

  return {
    range: {
      from: range?.from?.toISOString() || null,
      to: range?.to?.toISOString() || null,
    },
    coverage: {
      totalEvents: events.length,
      eventCounts: Object.fromEntries(
        Object.entries(metrics).map(([name, value]) => [name, value.events])
      ) as Record<string, number>,
      eventActors: Object.fromEntries(
        Object.entries(metrics).map(([name, value]) => [name, value.actors])
      ) as Record<string, number>,
    },
    acquisition: {
      funnel,
      landingBySource,
      landingByPage,
      revenueByCurrency,
    },
    productUsage: {
      events: productMetrics,
      tasks: {
        started: tasks.length,
        succeeded: tasks.filter((task) => task.status === 'success').length,
        failed: tasks.filter(
          (task) =>
            terminalTaskStatuses.has(task.status) && task.status !== 'success'
        ).length,
        processing: tasks.filter(
          (task) => !terminalTaskStatuses.has(task.status)
        ).length,
      },
    },
    failuresAndCost: {
      submitFailures: metrics.generation_submit_failed?.events || 0,
      submitFailuresByType: countByProperty(events, 'generation_submit_failed'),
      taskFailuresByType,
      taskOutcomesByModel,
      totalCostCredits,
    },
  };
}

function normalizeText(value: unknown, maxLength = 160): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  if (!normalized || normalized.length > maxLength) return null;
  return normalized;
}

function normalizePath(value: unknown): string | null {
  const normalized = normalizeText(value, 500);
  if (!normalized || !normalized.startsWith('/')) return null;
  return normalized.split(/[?#]/, 1)[0] || '/';
}

function normalizeReferrerHost(value: unknown): string | null {
  const normalized = normalizeText(value, 255);
  if (!normalized) return null;

  try {
    return new URL(
      normalized.includes('://') ? normalized : `https://${normalized}`
    ).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function normalizeOccurredAt(value: unknown, now: Date): Date {
  const date =
    value instanceof Date
      ? value
      : typeof value === 'number' || typeof value === 'string'
        ? new Date(value)
        : null;

  if (!date || Number.isNaN(date.getTime())) return now;
  if (Math.abs(date.getTime() - now.getTime()) > ANALYTICS_EVENT_WINDOW_MS) {
    return now;
  }
  return date;
}

function normalizeProperties(value: unknown): AnalyticsProperties {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as AnalyticsProperties;
}

export function normalizeClientAnalyticsEvent(
  payload: unknown,
  now = new Date()
): NormalizedClientAnalyticsEvent | null {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return null;
  }

  const input = payload as Record<string, unknown>;
  const eventName = input.eventName;
  if (
    typeof eventName !== 'string' ||
    !isAnalyticsEventName(eventName) ||
    !isClientAnalyticsEvent(eventName)
  ) {
    return null;
  }

  return {
    eventName,
    eventId: normalizeText(input.eventId, 120),
    occurredAt: normalizeOccurredAt(input.occurredAt, now),
    anonymousId: normalizeText(input.anonymousId, 120),
    sessionId: normalizeText(input.sessionId, 120),
    pagePath: normalizePath(input.pagePath),
    referrerHost: normalizeReferrerHost(input.referrerHost),
    taskId: normalizeText(input.taskId, 120),
    tool: normalizeText(input.tool),
    model: normalizeText(input.model),
    locale: normalizeText(input.locale, 20),
    surface: normalizeText(input.surface, 80),
    properties: sanitizeAnalyticsProperties(
      eventName,
      normalizeProperties(input.properties)
    ),
  };
}

export function buildClientAnalyticsEventInput(
  event: NormalizedClientAnalyticsEvent,
  context: ClientAnalyticsContext & { taskId?: string | null }
): AnalyticsEventInput {
  return {
    id: event.eventId || getUuid(),
    dedupeKey: event.eventId ? `client:${event.eventId}` : null,
    eventName: event.eventName,
    source: 'client',
    occurredAt: event.occurredAt,
    anonymousId: event.anonymousId,
    userId: normalizeText(context.userId, 120),
    sessionId: event.sessionId,
    pagePath: event.pagePath,
    referrerHost: event.referrerHost,
    taskId: normalizeText(
      context.taskId ?? (context.userId ? event.taskId : null),
      120
    ),
    tool: event.tool,
    model: event.model,
    locale: event.locale,
    surface: event.surface,
    properties: event.properties,
  };
}

export type TrustedAnalyticsEvent = Omit<AnalyticsEventInput, 'source'>;

export async function recordEvent(
  input: TrustedAnalyticsEvent
): Promise<boolean> {
  return insertAnalyticsEvent({ ...input, source: 'server' });
}

export async function recordGenerationStartedEvent({
  taskId,
  userId,
  mediaType,
  model,
  scene,
  occurredAt,
}: {
  taskId: string;
  userId: string;
  mediaType: string;
  model: string;
  scene?: string | null;
  occurredAt?: Date;
}): Promise<boolean> {
  return recordEvent({
    dedupeKey: `generation_started:${taskId}`,
    eventName: 'generation_started',
    occurredAt,
    userId,
    taskId,
    tool: mediaType,
    model,
    properties: { scene },
  });
}

export async function recordGenerationTerminalEvent({
  taskId,
  userId,
  mediaType,
  model,
  scene,
  status,
  createdAt,
  occurredAt,
}: {
  taskId: string;
  userId: string;
  mediaType: string;
  model: string;
  scene?: string | null;
  status: string;
  createdAt?: Date | null;
  occurredAt?: Date;
}): Promise<boolean> {
  const eventOccurredAt = occurredAt || new Date();
  const isSuccess = status === 'success';
  const terminalStatuses = new Set([
    'success',
    'failed',
    'canceled',
    'moderation_blocked',
    'moderation_failed',
  ]);

  if (!terminalStatuses.has(status)) return false;

  const properties: AnalyticsProperties = {
    scene,
    duration_bucket: createdAt
      ? getDurationBucket(eventOccurredAt.getTime() - createdAt.getTime())
      : undefined,
  };

  if (!isSuccess) {
    properties.error_type = status;
  }

  return recordEvent({
    dedupeKey: `generation_terminal:${taskId}`,
    eventName: isSuccess ? 'generation_succeeded' : 'generation_failed',
    occurredAt: eventOccurredAt,
    userId,
    taskId,
    tool: mediaType,
    model,
    properties,
  });
}

export async function recordPurchaseEvent({
  orderId,
  userId,
  provider,
  plan,
  billingCycle,
  currency,
  occurredAt,
}: {
  orderId: string;
  userId: string;
  provider: string;
  plan?: string | null;
  billingCycle?: string | null;
  currency?: string | null;
  occurredAt?: Date | null;
}): Promise<boolean> {
  return recordEvent({
    dedupeKey: `purchase:${orderId}`,
    eventName: 'purchase',
    occurredAt: occurredAt || undefined,
    userId,
    orderId,
    properties: {
      provider,
      plan,
      billing_cycle: billingCycle,
      currency,
    },
  });
}

async function getOwnedTaskId(
  taskId: string | null,
  userId: string | null
): Promise<string | null> {
  if (!taskId || !userId) return null;

  const task = await findAITaskById(taskId);
  return task?.userId === userId ? task.id : null;
}

export async function recordClientEvent(
  payload: unknown,
  context: ClientAnalyticsContext = {}
): Promise<boolean> {
  if (context.consentDenied) return false;

  const event = normalizeClientAnalyticsEvent(payload);
  if (!event) return false;

  try {
    const userId = normalizeText(context.userId, 120);
    const taskId = await getOwnedTaskId(event.taskId, userId);
    return await insertAnalyticsEvent(
      buildClientAnalyticsEventInput(event, { userId, taskId })
    );
  } catch (error) {
    console.error('Failed to record client analytics event:', error);
    return false;
  }
}

const DEFAULT_ANALYTICS_REPORT_DAYS = 28;
const MAX_ANALYTICS_REPORT_ROWS = 50_000;

function getValidDate(value: Date | undefined, fallback: Date): Date {
  return value instanceof Date && !Number.isNaN(value.getTime())
    ? value
    : fallback;
}

export async function getAnalyticsReport({
  from,
  to,
  limit = MAX_ANALYTICS_REPORT_ROWS,
}: {
  from?: Date;
  to?: Date;
  limit?: number;
} = {}) {
  const end = getValidDate(to, new Date());
  const defaultStart = new Date(
    end.getTime() - DEFAULT_ANALYTICS_REPORT_DAYS * 24 * 60 * 60 * 1000
  );
  const start = getValidDate(from, defaultStart);
  const rowLimit = Math.min(
    MAX_ANALYTICS_REPORT_ROWS,
    Math.max(
      1,
      Number.isFinite(limit) ? Math.floor(limit) : MAX_ANALYTICS_REPORT_ROWS
    )
  );

  const eventRows = await db()
    .select()
    .from(analyticsEvent)
    .where(
      and(
        gte(analyticsEvent.occurredAt, start),
        lte(analyticsEvent.occurredAt, end)
      )
    )
    .orderBy(asc(analyticsEvent.occurredAt))
    .limit(rowLimit);

  const taskRows = await db()
    .select({
      id: aiTask.id,
      userId: aiTask.userId,
      status: aiTask.status,
      model: aiTask.model,
      costCredits: aiTask.costCredits,
    })
    .from(aiTask)
    .where(and(gte(aiTask.createdAt, start), lte(aiTask.createdAt, end)))
    .limit(rowLimit);

  const orderRows = await db()
    .select({
      id: order.id,
      userId: order.userId,
      status: order.status,
      amount: order.amount,
      paymentAmount: order.paymentAmount,
      currency: order.currency,
      paymentCurrency: order.paymentCurrency,
      paidAt: order.paidAt,
    })
    .from(order)
    .where(
      and(
        eq(order.status, 'paid'),
        gte(order.paidAt, start),
        lte(order.paidAt, end)
      )
    )
    .limit(rowLimit);

  return buildAnalyticsReport(
    eventRows as AnalyticsReportEvent[],
    taskRows as AnalyticsReportTask[],
    orderRows as AnalyticsReportOrder[],
    { from: start, to: end }
  );
}
