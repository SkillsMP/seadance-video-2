import { useTranslations } from 'next-intl';

import { AudioPlayer } from '@/shared/blocks/common';

import { getAITaskErrorDisplay } from '../_lib/ai-task-error';
import { parseAITaskDisplayResult } from '../_lib/ai-task-result';
import { TaskImageGallery } from './task-image-gallery';

const ERROR_RESULT_LABEL_KEYS: Record<string, string> = {
  'list.errors.failed': 'list.result_labels.failed',
  'list.errors.canceled': 'list.result_labels.canceled',
  'list.errors.moderation_blocked': 'list.result_labels.moderation_blocked',
  'list.errors.moderation_failed': 'list.result_labels.moderation_failed',
  'list.errors.safety_blocked': 'list.result_labels.safety_blocked',
  'list.errors.timeout': 'list.result_labels.timeout',
  'list.errors.no_result': 'list.result_labels.no_result',
};

const ERROR_RESULT_LABEL_FALLBACKS: Record<string, string> = {
  'list.errors.failed': 'Failed',
  'list.errors.canceled': 'Canceled',
  'list.errors.moderation_blocked': 'Blocked',
  'list.errors.moderation_failed': 'Unavailable',
  'list.errors.safety_blocked': 'Blocked',
  'list.errors.timeout': 'Timeout',
  'list.errors.no_result': 'No result',
};

function getDownloadHref(href: string) {
  return /^https?:\/\//.test(href)
    ? `/api/proxy/file?url=${encodeURIComponent(href)}`
    : href;
}

function getFilename(href: string) {
  try {
    const url = new URL(href, 'http://x');
    return decodeURIComponent(url.pathname.split('/').pop() || '');
  } catch {
    return '';
  }
}

function DownloadLink({ href, title }: { href: string; title: string }) {
  return (
    <a
      href={getDownloadHref(href)}
      download={getFilename(href) || true}
      className="text-primary text-sm font-medium hover:underline"
    >
      {title}
    </a>
  );
}

function ResultUnavailableBadge({
  label,
  title,
}: {
  label: string;
  title: string;
}) {
  return (
    <span
      title={title}
      className="text-muted-foreground inline-flex max-w-[140px] truncate rounded-md border px-2 py-1 text-xs font-medium whitespace-nowrap"
    >
      {label}
    </span>
  );
}

export function TaskResultCell({
  taskInfo,
  taskResult,
  mediaType,
  status,
  downloadLabel,
  errorMessages = {},
}: {
  taskInfo?: string | null;
  taskResult?: string | null;
  mediaType?: string | null;
  status?: string | null;
  downloadLabel: string;
  errorMessages?: Record<string, string>;
}) {
  const t = useTranslations('activity.ai-tasks');
  const result = parseAITaskDisplayResult({ taskInfo, taskResult });
  const error = getAITaskErrorDisplay({
    status,
    errorCode: result.errorCode,
    errorMessage: result.errorMessage,
    providerStatus: result.providerStatus,
  });

  if (error) {
    const title = errorMessages[error.key] || error.fallback;
    const labelKey = ERROR_RESULT_LABEL_KEYS[error.key];
    const label =
      labelKey && t.has(labelKey)
        ? t(labelKey)
        : ERROR_RESULT_LABEL_FALLBACKS[error.key] || 'Unavailable';

    return <ResultUnavailableBadge label={label} title={title} />;
  }

  if (result.imageUrls.length > 0 && (!mediaType || mediaType === 'image')) {
    return (
      <TaskImageGallery
        imageUrls={result.imageUrls}
        downloadLabel={downloadLabel}
      />
    );
  }

  if (result.audioResults.length > 0) {
    return (
      <div className="flex max-w-80 flex-col gap-2">
        {result.audioResults.map((audio) => (
          <div key={audio.id || audio.audioUrl} className="flex flex-col gap-2">
            <AudioPlayer
              src={audio.audioUrl}
              title={audio.title}
              className="w-full"
            />
            <DownloadLink href={audio.audioUrl} title={downloadLabel} />
          </div>
        ))}
      </div>
    );
  }

  if (result.videoUrls.length > 0) {
    return (
      <div className="flex flex-col gap-1">
        {result.videoUrls.map((videoUrl, index) => (
          <DownloadLink
            key={videoUrl}
            href={videoUrl}
            title={
              result.videoUrls.length > 1
                ? `${downloadLabel} ${index + 1}`
                : downloadLabel
            }
          />
        ))}
      </div>
    );
  }

  return <span>-</span>;
}
