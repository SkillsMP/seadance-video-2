'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, DownloadIcon } from 'lucide-react';

import { LazyImage } from '@/shared/blocks/common';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/shared/components/ui/dialog';

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

export function TaskImageGallery({
  imageUrls,
  downloadLabel = 'Download',
}: {
  imageUrls: string[];
  downloadLabel?: string;
}) {
  const validUrls = useMemo(
    () => Array.from(new Set(imageUrls.filter(Boolean))),
    [imageUrls]
  );
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const selectedUrl =
    selectedIndex === null ? undefined : validUrls[selectedIndex];

  useEffect(() => {
    if (selectedIndex !== null && selectedIndex >= validUrls.length) {
      setSelectedIndex(null);
    }
  }, [selectedIndex, validUrls.length]);

  useEffect(() => {
    if (selectedIndex === null || validUrls.length < 2) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        setSelectedIndex((current) =>
          current === null
            ? current
            : current === 0
              ? validUrls.length - 1
              : current - 1
        );
      }

      if (event.key === 'ArrowRight') {
        setSelectedIndex((current) =>
          current === null
            ? current
            : current === validUrls.length - 1
              ? 0
              : current + 1
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, validUrls.length]);

  if (validUrls.length === 0) {
    return <span>-</span>;
  }

  const goPrevious = () => {
    setSelectedIndex((current) =>
      current === null
        ? current
        : current === 0
          ? validUrls.length - 1
          : current - 1
    );
  };

  const goNext = () => {
    setSelectedIndex((current) =>
      current === null
        ? current
        : current === validUrls.length - 1
          ? 0
          : current + 1
    );
  };

  return (
    <>
      <div className="flex max-w-[232px] items-center gap-2 overflow-x-auto py-1">
        {validUrls.map((url, index) => (
          <button
            key={url}
            type="button"
            className="bg-muted hover:border-primary/60 size-14 shrink-0 overflow-hidden rounded-md border transition-colors"
            onClick={() => setSelectedIndex(index)}
          >
            <LazyImage
              src={url}
              alt="Generated image"
              className="h-14 w-14 cursor-zoom-in object-cover"
            />
          </button>
        ))}
      </div>

      <Dialog
        open={selectedIndex !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedIndex(null);
          }
        }}
      >
        <DialogContent className="max-w-[min(1080px,calc(100vw-2rem))] p-3 sm:max-w-[min(1080px,calc(100vw-4rem))]">
          <DialogTitle className="sr-only">Generated image preview</DialogTitle>

          {selectedUrl && (
            <div className="flex flex-col gap-3">
              <div className="bg-muted flex min-h-[240px] items-center justify-center rounded-md">
                <LazyImage
                  src={selectedUrl}
                  alt="Generated image preview"
                  className="max-h-[72vh] w-auto max-w-full object-contain"
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="text-muted-foreground text-sm">
                  {selectedIndex! + 1} / {validUrls.length}
                </div>

                <div className="flex items-center gap-2">
                  {validUrls.length > 1 && (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        onClick={goPrevious}
                        aria-label="Previous image"
                      >
                        <ChevronLeftIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        onClick={goNext}
                        aria-label="Next image"
                      >
                        <ChevronRightIcon className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  <Button asChild variant="outline" size="sm">
                    <a
                      href={getDownloadHref(selectedUrl)}
                      download={getFilename(selectedUrl) || true}
                    >
                      <DownloadIcon className="h-4 w-4" />
                      {downloadLabel}
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
