import type { ModerationProvider, ModerationResult } from './types';

export interface SightengineConfig {
  apiUser: string;
  apiSecret: string;
  timeoutMs: number;
}

const TEXT_ENDPOINT = 'https://api.sightengine.com/1.0/text/check.json';
const IMAGE_ENDPOINT = 'https://api.sightengine.com/1.0/check.json';
const VIDEO_SYNC_ENDPOINT =
  'https://api.sightengine.com/1.0/video/check-sync.json';

const TEXT_MODELS = ['general', 'self-harm'];
const TEXT_CATEGORIES = [
  'profanity',
  'drug',
  'weapon',
  'spam',
  'content-trade',
  'extremism',
  'violence',
  'self-harm',
];

const IMAGE_MODELS = [
  'nudity-2.1',
  'gore-2.0',
  'weapon',
  'violence',
  'offensive-2.0',
  'text-content',
];
const IMAGE_RESULT_ROOTS = [
  'nudity',
  'gore',
  'weapon',
  'violence',
  'offensive',
  'text-content',
];
const VIDEO_MODELS = [
  'nudity-2.1',
  'gore-2.0',
  'weapon',
  'violence',
  'offensive',
];
const VIDEO_RESULT_ROOTS = [
  'nudity',
  'gore',
  'weapon',
  'violence',
  'offensive',
];

const SCORE_THRESHOLD = 0.75;
const SAFE_SCORE_KEYS = new Set([
  'safe',
  'none',
  'not-offensive',
  'not_offensive',
  'unknown',
]);
const IGNORED_SCORE_PATHS = new Set([
  'request',
  'media',
  'context',
  'available',
  'id',
  'timestamp',
  'operations',
]);

export async function checkText(
  text: string,
  config: SightengineConfig
): Promise<ModerationResult> {
  const body = new FormData();
  body.append('text', text);
  body.append('lang', 'en');
  body.append('mode', 'rules,ml');
  body.append('models', TEXT_MODELS.join(','));
  body.append('categories', TEXT_CATEGORIES.join(','));
  body.append('api_user', config.apiUser);
  body.append('api_secret', config.apiSecret);

  const raw = await fetchJsonWithTimeout(
    TEXT_ENDPOINT,
    {
      method: 'POST',
      body,
    },
    config.timeoutMs
  );

  return normalizeTextResult(raw);
}

export async function checkImageUrl(
  url: string,
  config: SightengineConfig
): Promise<ModerationResult> {
  const endpoint = new URL(IMAGE_ENDPOINT);
  endpoint.searchParams.set('url', url);
  endpoint.searchParams.set('models', IMAGE_MODELS.join(','));
  endpoint.searchParams.set('api_user', config.apiUser);
  endpoint.searchParams.set('api_secret', config.apiSecret);

  const raw = await fetchJsonWithTimeout(
    endpoint.toString(),
    {
      method: 'GET',
    },
    config.timeoutMs
  );

  return normalizeImageResult(raw);
}

export async function checkVideoUrl(
  url: string,
  config: SightengineConfig
): Promise<ModerationResult> {
  const body = new FormData();
  body.append('stream_url', url);
  body.append('models', VIDEO_MODELS.join(','));
  body.append('api_user', config.apiUser);
  body.append('api_secret', config.apiSecret);

  const raw = await fetchJsonWithTimeout(
    VIDEO_SYNC_ENDPOINT,
    {
      method: 'POST',
      body,
    },
    config.timeoutMs
  );

  return normalizeVideoResult(raw);
}

export function createSightengineModerationProvider(
  config: SightengineConfig
): ModerationProvider {
  return {
    name: 'sightengine',
    checkText: (text) => checkText(text, config),
    checkImageUrl: (url) => checkImageUrl(url, config),
    checkVideoUrl: (url) => checkVideoUrl(url, config),
  };
}

async function fetchJsonWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    });

    const json = (await response.json().catch(() => null)) as unknown;
    if (!response.ok) {
      throw new Error(`Sightengine request failed: ${response.status}`);
    }

    assertSuccessResponse(json);
    return json;
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeTextResult(raw: unknown): ModerationResult {
  const categories = new Set<string>();
  const data = asRecord(raw);
  if (!data) {
    throw new Error('Sightengine moderation failed');
  }

  for (const category of TEXT_CATEGORIES) {
    const ruleResult = asRecord(data[category]);
    const matches = ruleResult?.matches;
    if (Array.isArray(matches) && hasBlockingRuleMatches(category, matches)) {
      categories.add(category);
    }
  }

  const moderationClasses = asRecord(data.moderation_classes);
  const available = moderationClasses?.available;
  if (Array.isArray(available)) {
    for (const category of available) {
      if (typeof category !== 'string') {
        continue;
      }

      const score = moderationClasses?.[category];
      if (typeof score === 'number' && score >= SCORE_THRESHOLD) {
        categories.add(category);
      }
    }
  }

  return {
    decision: categories.size > 0 ? 'block' : 'allow',
    provider: 'sightengine',
    categories: Array.from(categories),
    raw,
  };
}

function normalizeImageResult(raw: unknown): ModerationResult {
  const categories = new Set<string>();
  const data = asRecord(raw);
  if (!data) {
    throw new Error('Sightengine moderation failed');
  }

  for (const root of IMAGE_RESULT_ROOTS) {
    collectRiskCategories(data[root], [root], categories);
  }

  return {
    decision: categories.size > 0 ? 'block' : 'allow',
    provider: 'sightengine',
    categories: Array.from(categories),
    raw,
  };
}

function normalizeVideoResult(raw: unknown): ModerationResult {
  const categories = new Set<string>();
  const data = asRecord(raw);
  if (!data) {
    throw new Error('Sightengine moderation failed');
  }

  const videoData = asRecord(data.data);
  const frames = videoData?.frames;
  let hasModerationData = false;

  if (Array.isArray(frames)) {
    hasModerationData = frames.length > 0;
    frames.forEach((frame) => {
      const frameData = asRecord(frame);
      for (const root of VIDEO_RESULT_ROOTS) {
        collectRiskCategories(frameData?.[root], [root], categories);
      }
    });
  } else {
    for (const root of VIDEO_RESULT_ROOTS) {
      const result = videoData?.[root] ?? data[root];
      if (result !== undefined) {
        hasModerationData = true;
      }
      collectRiskCategories(result, [root], categories);
    }
  }

  if (!hasModerationData) {
    throw new Error('Sightengine moderation failed');
  }

  return {
    decision: categories.size > 0 ? 'block' : 'allow',
    provider: 'sightengine',
    categories: Array.from(categories),
    raw,
  };
}

function collectRiskCategories(
  value: unknown,
  path: string[],
  categories: Set<string>
) {
  if (typeof value === 'number') {
    const key = path[path.length - 1];
    if (
      value >= SCORE_THRESHOLD &&
      key &&
      !SAFE_SCORE_KEYS.has(key) &&
      !path.some((part) => IGNORED_SCORE_PATHS.has(part))
    ) {
      categories.add(path.join('.'));
    }
    return;
  }

  if (Array.isArray(value)) {
    if (path[path.length - 1] === 'matches' && value.length > 0) {
      categories.add(path.slice(0, -1).join('.') || 'text-content');
      return;
    }

    value.forEach((item, index) => {
      collectRiskCategories(item, [...path, String(index)], categories);
    });
    return;
  }

  const record = asRecord(value);
  if (!record) {
    return;
  }

  Object.entries(record).forEach(([key, child]) => {
    collectRiskCategories(child, [...path, key], categories);
  });
}

function hasBlockingRuleMatches(category: string, matches: unknown[]): boolean {
  if (category !== 'profanity') {
    return matches.length > 0;
  }

  return matches.some((match) => {
    const matchRecord = asRecord(match);
    return matchRecord?.intensity !== 'low';
  });
}

function assertSuccessResponse(value: unknown) {
  const data = asRecord(value);
  if (!data || data.status !== 'success') {
    throw new Error('Sightengine moderation failed');
  }
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }

  return value as Record<string, unknown>;
}
