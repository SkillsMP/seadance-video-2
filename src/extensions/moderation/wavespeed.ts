import type { ModerationProvider, ModerationResult } from './types';

export interface WavespeedConfig {
  apiKey: string;
  textModel: string;
  imageModel: string;
  videoModel: string;
  requestTimeoutMs: number;
  pollIntervalMs: number;
  videoTimeoutMs: number;
  videoPollIntervalMs: number;
}

const API_BASE_URL = 'https://api.wavespeed.ai/api/v3';
const RISK_CATEGORY_KEYS = [
  'harassment',
  'hate',
  'sexual',
  'sexual/minors',
  'violence',
];
const IN_PROGRESS_STATUSES = new Set([
  'created',
  'queued',
  'pending',
  'processing',
  'running',
  'starting',
]);
const FAILED_STATUSES = new Set(['failed', 'canceled', 'cancelled']);

export async function checkText(
  text: string,
  config: WavespeedConfig
): Promise<ModerationResult> {
  return runPrediction(
    config.textModel,
    {
      text,
      enable_sync_mode: true,
    },
    config
  );
}

export async function checkImageUrl(
  url: string,
  config: WavespeedConfig,
  text?: string
): Promise<ModerationResult> {
  return runPrediction(
    config.imageModel,
    {
      image: url,
      ...(text ? { text } : {}),
      enable_sync_mode: true,
    },
    config
  );
}

export async function checkVideoUrl(
  url: string,
  config: WavespeedConfig,
  text?: string
): Promise<ModerationResult> {
  assertVideoConfig(config);

  return runVideoPrediction(
    config.videoModel,
    {
      video: url,
      ...(text ? { text } : {}),
    },
    config
  );
}

export function createWavespeedModerationProvider(
  config: WavespeedConfig
): ModerationProvider {
  assertConfig(config);

  return {
    name: 'wavespeed',
    checkText: (text) => checkText(text, config),
    checkImageUrl: (url, text) => checkImageUrl(url, config, text),
    checkVideoUrl: (url, text) => checkVideoUrl(url, config, text),
  };
}

async function runPrediction(
  model: string,
  payload: Record<string, unknown>,
  config: WavespeedConfig
): Promise<ModerationResult> {
  const deadline = Date.now() + config.requestTimeoutMs;
  const submitted = await submitPrediction(model, payload, config, deadline);
  const submitOutput = resolvePredictionOutput(submitted);
  if (submitOutput !== undefined) {
    return normalizeWavespeedOutput(submitOutput);
  }

  const requestId = resolvePredictionId(submitted);
  if (!requestId) {
    throw new Error('Wavespeed moderation prediction id missing');
  }

  const completed = await pollPrediction(requestId, config, deadline);
  const output = resolvePredictionOutput(completed);
  if (output === undefined) {
    throw new Error('Wavespeed moderation output missing');
  }

  return normalizeWavespeedOutput(output);
}

async function runVideoPrediction(
  model: string,
  payload: Record<string, unknown>,
  config: WavespeedConfig
): Promise<ModerationResult> {
  const deadline = Date.now() + config.videoTimeoutMs;
  const submitted = await submitPrediction(model, payload, config, deadline);
  const requestId = resolvePredictionId(submitted);
  if (!requestId) {
    throw new Error('Wavespeed moderation prediction id missing');
  }

  const completed = await pollVideoPrediction(requestId, config, deadline);
  const output = resolvePredictionOutput(completed);
  if (output === undefined) {
    throw new Error('Wavespeed moderation output missing');
  }

  return normalizeWavespeedOutput(output);
}

async function submitPrediction(
  model: string,
  payload: Record<string, unknown>,
  config: WavespeedConfig,
  deadline: number
): Promise<unknown> {
  return fetchJsonWithTimeout(
    `${API_BASE_URL}/${model}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
    remainingMs(deadline)
  );
}

async function pollPrediction(
  requestId: string,
  config: WavespeedConfig,
  deadline: number
): Promise<unknown> {
  while (Date.now() < deadline) {
    const raw = await fetchJsonWithTimeout(
      `${API_BASE_URL}/predictions/${requestId}/result`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
        },
      },
      remainingMs(deadline)
    );

    const output = resolvePredictionOutput(raw);
    if (output !== undefined) {
      return raw;
    }

    const status = resolvePredictionStatus(raw);
    if (status === 'completed') {
      throw new Error('Wavespeed moderation output missing');
    }
    if (status && FAILED_STATUSES.has(status)) {
      throw new Error(`Wavespeed moderation prediction ${status}`);
    }
    if (status && !IN_PROGRESS_STATUSES.has(status)) {
      throw new Error(`Wavespeed moderation prediction status: ${status}`);
    }

    await sleep(Math.min(config.pollIntervalMs, remainingMs(deadline)));
  }

  throw new Error('Wavespeed moderation prediction timed out');
}

async function pollVideoPrediction(
  requestId: string,
  config: WavespeedConfig,
  deadline: number
): Promise<unknown> {
  while (Date.now() < deadline) {
    const raw = await fetchJsonWithTimeout(
      `${API_BASE_URL}/predictions/${requestId}/result`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
        },
      },
      remainingMs(deadline)
    );

    const status = resolvePredictionStatus(raw);
    if (status === 'completed') {
      const output = resolvePredictionOutput(raw);
      if (output === undefined) {
        throw new Error('Wavespeed moderation output missing');
      }

      return raw;
    }
    if (status && FAILED_STATUSES.has(status)) {
      throw new Error(`Wavespeed moderation prediction ${status}`);
    }
    if (status && IN_PROGRESS_STATUSES.has(status)) {
      await sleep(Math.min(config.videoPollIntervalMs, remainingMs(deadline)));
      continue;
    }
    if (!status) {
      throw new Error('Wavespeed moderation prediction status missing');
    }

    throw new Error(`Wavespeed moderation prediction status: ${status}`);
  }

  throw new Error('Wavespeed moderation prediction timed out');
}

async function fetchJsonWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<unknown> {
  if (timeoutMs <= 0) {
    throw new Error('Wavespeed moderation request timed out');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    });
    const json = (await response.json().catch(() => null)) as unknown;

    if (!response.ok) {
      throw new Error(`Wavespeed moderation request failed: ${response.status}`);
    }
    if (!json) {
      throw new Error('Wavespeed moderation response missing');
    }

    const data = asRecord(json);
    const code = data?.code;
    if (typeof code === 'number' && code >= 400) {
      throw new Error(`Wavespeed moderation response code: ${code}`);
    }

    return json;
  } finally {
    clearTimeout(timeout);
  }
}

function resolvePredictionOutput(raw: unknown): unknown {
  const data = resolvePredictionData(raw);
  if (!data) {
    return undefined;
  }

  if (hasKnownBooleanCategory(data)) {
    return data;
  }

  const outputs = data.outputs;
  if (!Array.isArray(outputs) || outputs.length === 0) {
    return undefined;
  }

  return outputs[0];
}

function resolvePredictionId(raw: unknown): string | undefined {
  const data = resolvePredictionData(raw);
  const id = data?.id ?? data?.request_id ?? data?.task_id;
  return typeof id === 'string' && id.trim() ? id.trim() : undefined;
}

function resolvePredictionStatus(raw: unknown): string | undefined {
  const data = resolvePredictionData(raw);
  const status = data?.status ?? asRecord(raw)?.status;
  return typeof status === 'string' ? status.toLowerCase() : undefined;
}

function resolvePredictionData(raw: unknown): Record<string, unknown> | undefined {
  const root = asRecord(raw);
  if (!root) {
    return undefined;
  }

  return asRecord(root.data) ?? root;
}

function normalizeWavespeedOutput(output: unknown): ModerationResult {
  const normalizedOutput = parseOutput(output);
  const categories = RISK_CATEGORY_KEYS.filter(
    (category) => normalizedOutput[category] === true
  );

  return {
    decision: categories.length > 0 ? 'block' : 'allow',
    provider: 'wavespeed',
    categories,
    raw: output,
  };
}

function parseOutput(output: unknown): Record<string, unknown> {
  if (typeof output === 'string') {
    const trimmed = output.trim();
    if (/^https?:\/\//i.test(trimmed)) {
      throw new Error('Wavespeed moderation output URL is not supported');
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      throw new Error('Wavespeed moderation output is not valid JSON');
    }

    return parseOutput(parsed);
  }

  const record = asRecord(output);
  if (!record || !hasKnownBooleanCategory(record)) {
    throw new Error('Wavespeed moderation output missing boolean categories');
  }

  return record;
}

function hasKnownBooleanCategory(record: Record<string, unknown>): boolean {
  return RISK_CATEGORY_KEYS.some(
    (category) => typeof record[category] === 'boolean'
  );
}

function assertConfig(config: WavespeedConfig) {
  if (!config.apiKey) {
    throw new Error('Wavespeed moderation API key missing');
  }
  if (!config.textModel) {
    throw new Error('Wavespeed moderation text model missing');
  }
  if (!config.imageModel) {
    throw new Error('Wavespeed moderation image model missing');
  }
  if (!Number.isFinite(config.requestTimeoutMs) || config.requestTimeoutMs <= 0) {
    throw new Error('Wavespeed moderation timeout invalid');
  }
  if (!Number.isFinite(config.pollIntervalMs) || config.pollIntervalMs <= 0) {
    throw new Error('Wavespeed moderation poll interval invalid');
  }
}

function assertVideoConfig(config: WavespeedConfig) {
  if (!config.videoModel) {
    throw new Error('Wavespeed moderation video model missing');
  }
  if (!Number.isFinite(config.videoTimeoutMs) || config.videoTimeoutMs <= 0) {
    throw new Error('Wavespeed moderation video timeout invalid');
  }
  if (
    !Number.isFinite(config.videoPollIntervalMs) ||
    config.videoPollIntervalMs <= 0
  ) {
    throw new Error('Wavespeed moderation video poll interval invalid');
  }
}

function remainingMs(deadline: number): number {
  return Math.max(0, deadline - Date.now());
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }

  return value as Record<string, unknown>;
}
