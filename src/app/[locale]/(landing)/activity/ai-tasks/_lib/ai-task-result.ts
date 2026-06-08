import type { AITaskInfo } from '@/extensions/ai';

type UnknownRecord = Record<string, unknown>;

export type AITaskAudioResult = {
  id?: string;
  title?: string;
  audioUrl: string;
};

export type AITaskDisplayResult = {
  taskInfo: AITaskInfo | null;
  taskResult: UnknownRecord | null;
  imageUrls: string[];
  audioResults: AITaskAudioResult[];
  videoUrls: string[];
  errorCode?: string;
  errorMessage?: string;
  providerStatus?: string;
  hasResult: boolean;
};

function parseJsonRecord(value?: string | null): UnknownRecord | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed
      : null;
  } catch {
    return null;
  }
}

function getString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function isHttpUrl(value: unknown): value is string {
  const url = getString(value);
  if (!url) {
    return false;
  }

  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function uniqueUrls(urls: unknown[]) {
  const result: string[] = [];
  const seen = new Set<string>();

  for (const url of urls) {
    if (!isHttpUrl(url) || seen.has(url)) {
      continue;
    }

    seen.add(url);
    result.push(url);
  }

  return result;
}

function getArray(value: unknown): UnknownRecord[] {
  return Array.isArray(value)
    ? value.filter(
        (item): item is UnknownRecord =>
          item !== null && typeof item === 'object' && !Array.isArray(item)
      )
    : [];
}

function extractAudioResults(taskInfo: AITaskInfo | null) {
  const songs = getArray(taskInfo?.songs);
  const seen = new Set<string>();
  const results: AITaskAudioResult[] = [];

  for (const song of songs) {
    const audioUrl = getString(song.audioUrl);
    if (!isHttpUrl(audioUrl) || seen.has(audioUrl)) {
      continue;
    }

    seen.add(audioUrl);
    results.push({
      id: getString(song.id) || undefined,
      title: getString(song.title) || undefined,
      audioUrl,
    });
  }

  return results;
}

export function parseAITaskDisplayResult({
  taskInfo,
  taskResult,
}: {
  taskInfo?: string | null;
  taskResult?: string | null;
}): AITaskDisplayResult {
  const parsedTaskInfo = parseJsonRecord(taskInfo) as AITaskInfo | null;
  const parsedTaskResult = parseJsonRecord(taskResult);

  const imageUrls = uniqueUrls(
    getArray(parsedTaskInfo?.images).map((image) => image.imageUrl)
  );
  const videoUrls = uniqueUrls(
    getArray(parsedTaskInfo?.videos).map((video) => video.videoUrl)
  );
  const audioResults = extractAudioResults(parsedTaskInfo);

  const errorCode =
    getString(parsedTaskInfo?.errorCode) ||
    getString(parsedTaskResult?.errorCode) ||
    undefined;
  const errorMessage =
    getString(parsedTaskInfo?.errorMessage) ||
    getString(parsedTaskResult?.userErrorMessage) ||
    getString(parsedTaskResult?.errorMessage) ||
    getString(parsedTaskResult?.message) ||
    undefined;
  const providerStatus =
    getString(parsedTaskInfo?.status) ||
    getString(parsedTaskResult?.status) ||
    undefined;

  return {
    taskInfo: parsedTaskInfo,
    taskResult: parsedTaskResult,
    imageUrls,
    audioResults,
    videoUrls,
    errorCode,
    errorMessage,
    providerStatus,
    hasResult:
      imageUrls.length > 0 || audioResults.length > 0 || videoUrls.length > 0,
  };
}
