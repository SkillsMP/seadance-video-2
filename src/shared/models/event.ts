import { db } from '@/core/db';
import { analyticsEvent } from '@/config/db/schema';
import {
  sanitizeAnalyticsProperties,
  type AnalyticsEventName,
  type AnalyticsEventSource,
  type AnalyticsProperties,
} from '@/shared/lib/analytics/events';
import { getUuid } from '@/shared/lib/hash';

export interface AnalyticsEventInput {
  id?: string;
  dedupeKey?: string | null;
  eventName: AnalyticsEventName;
  source: AnalyticsEventSource;
  schemaVersion?: number;
  buildId?: string | null;
  occurredAt?: Date;
  receivedAt?: Date;
  anonymousId?: string | null;
  userId?: string | null;
  sessionId?: string | null;
  pagePath?: string | null;
  referrerHost?: string | null;
  taskId?: string | null;
  orderId?: string | null;
  tool?: string | null;
  model?: string | null;
  locale?: string | null;
  surface?: string | null;
  properties?: AnalyticsProperties;
}

export interface AnalyticsEventRecord {
  id: string;
  dedupeKey: string | null;
  eventName: AnalyticsEventName;
  schemaVersion: number;
  buildId: string | null;
  occurredAt: Date;
  receivedAt: Date;
  source: AnalyticsEventSource;
  anonymousId: string | null;
  userId: string | null;
  sessionId: string | null;
  pagePath: string | null;
  referrerHost: string | null;
  taskId: string | null;
  orderId: string | null;
  tool: string | null;
  model: string | null;
  locale: string | null;
  surface: string | null;
  properties: string;
}

function normalizeText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized || null;
}

function normalizeDate(value: Date | undefined, fallback: Date): Date {
  return value instanceof Date && !Number.isNaN(value.getTime())
    ? value
    : fallback;
}

export function buildAnalyticsEventRecord(
  input: AnalyticsEventInput
): AnalyticsEventRecord {
  const now = new Date();
  const properties = sanitizeAnalyticsProperties(
    input.eventName,
    input.properties
  );

  const propertyPagePath = properties.page_path;
  const propertyReferrerHost = properties.referrer_host;
  const propertyTool = properties.tool;
  const propertyModel = properties.model;
  const propertyLocale = properties.locale;
  const propertySurface = properties.surface;

  delete properties.page_path;
  delete properties.referrer_host;
  delete properties.tool;
  delete properties.model;
  delete properties.locale;
  delete properties.surface;

  return {
    id: normalizeText(input.id) || getUuid(),
    dedupeKey: normalizeText(input.dedupeKey),
    eventName: input.eventName,
    schemaVersion: 1,
    buildId: normalizeText(input.buildId),
    occurredAt: normalizeDate(input.occurredAt, now),
    receivedAt: normalizeDate(input.receivedAt, now),
    source: input.source,
    anonymousId: normalizeText(input.anonymousId),
    userId: normalizeText(input.userId),
    sessionId: normalizeText(input.sessionId),
    pagePath: normalizeText(input.pagePath) || normalizeText(propertyPagePath),
    referrerHost:
      normalizeText(input.referrerHost) || normalizeText(propertyReferrerHost),
    taskId: normalizeText(input.taskId),
    orderId: normalizeText(input.orderId),
    tool: normalizeText(input.tool) || normalizeText(propertyTool),
    model: normalizeText(input.model) || normalizeText(propertyModel),
    locale: normalizeText(input.locale) || normalizeText(propertyLocale),
    surface: normalizeText(input.surface) || normalizeText(propertySurface),
    properties: JSON.stringify(properties),
  };
}

export async function insertAnalyticsEvent(
  input: AnalyticsEventInput
): Promise<boolean> {
  const record = buildAnalyticsEventRecord(input);

  try {
    await db()
      .insert(analyticsEvent)
      .values(record)
      .onConflictDoNothing({ target: analyticsEvent.dedupeKey });
    return true;
  } catch (error) {
    console.error('Failed to record analytics event:', error);
    return false;
  }
}
