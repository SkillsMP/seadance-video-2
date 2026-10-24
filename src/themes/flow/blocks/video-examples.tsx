'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Play,
} from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { cn } from '@/shared/lib/utils';
import type { Section, SectionItem } from '@/shared/types/blocks/landing';

import { FlowSectionHead } from '../components/site';

type ShowcaseUi = {
  play?: string;
  reference_prompt?: string;
  copy_prompt?: string;
  copied?: string;
  copy_failed?: string;
  prev?: string;
  next?: string;
  go_generator?: string;
  browse_all?: string;
};

type ExampleItem = {
  title: string;
  description: string;
  prompt: string;
  video: string;
  poster: string;
  alt?: string;
  aspectRatio: string;
};

function defaultAspectRatio(videoSrc: string) {
  if (videoSrc.includes('monster-bakery')) return '16 / 10';
  if (videoSrc.includes('web-acrobat')) return '4 / 5';
  if (videoSrc.includes('paper-dragon')) return '3 / 4';
  if (videoSrc.includes('glacier-titan')) return '16 / 9';
  if (videoSrc.includes('airglide')) return '1 / 1';
  if (videoSrc.includes('desert-poppies')) return '2 / 3';
  if (videoSrc.includes('monster-commuter')) return '3 / 2';
  if (videoSrc.includes('new-york-dragon')) return '9 / 16';
  return '16 / 9';
}

function stripPromptQuotes(text: string) {
  return text.replace(/^["']+|["']+$/g, '').trim();
}

function mapItems(items: SectionItem[] | undefined): ExampleItem[] {
  return (items || [])
    .map((item): ExampleItem | null => {
      const video =
        typeof item.video === 'string' ? item.video : item.video?.src || '';
      const poster = item.image?.src || '';
      const description = item.description || '';
      const prompt =
        typeof item.prompt === 'string' && item.prompt.trim()
          ? item.prompt.trim()
          : stripPromptQuotes(description);

      if (!video) {
        return null;
      }

      const aspectRatio =
        typeof item.aspectRatio === 'string' && item.aspectRatio.trim()
          ? item.aspectRatio.trim()
          : defaultAspectRatio(video);

      return {
        title: item.title || '',
        description,
        prompt,
        video,
        poster,
        alt: item.image?.alt,
        aspectRatio,
      };
    })
    .filter((item): item is ExampleItem => Boolean(item));
}

function ExampleCard({
  item,
  playLabel,
  onOpen,
}: {
  item: ExampleItem;
  playLabel: string;
  onOpen: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const handlePreviewStart = () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    void videoRef.current?.play().catch(() => {});
  };

  const handlePreviewStop = () => {
    videoRef.current?.pause();
  };

  return (
    <article className="group relative mb-2 block break-inside-avoid overflow-hidden rounded-xl bg-[color-mix(in_oklab,var(--muted)_55%,#e5e5e5)] dark:bg-white/5">
      <div
        className="relative flex w-full items-center justify-center overflow-hidden"
        style={{ aspectRatio: item.aspectRatio }}
        onMouseEnter={handlePreviewStart}
        onMouseLeave={handlePreviewStop}
      >
        <video
          ref={videoRef}
          src={`${item.video}#t=0.001`}
          poster={item.poster || undefined}
          title={item.title}
          aria-label={item.alt || item.title}
          muted
          loop
          playsInline
          preload="metadata"
          className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          onFocus={handlePreviewStart}
          onBlur={handlePreviewStop}
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/10 opacity-45 transition-opacity group-hover:opacity-80 motion-reduce:transition-none"
          aria-hidden
        />
        <span className="pointer-events-none absolute top-1/2 left-1/2 flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white opacity-90 shadow-lg backdrop-blur-md transition group-focus-within:opacity-100 group-hover:scale-105 group-hover:opacity-100 motion-reduce:transition-none [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-focus-within:opacity-100 [@media(hover:hover)]:group-hover:opacity-100">
          <Play className="ml-0.5 size-4 fill-current" aria-hidden />
        </span>
        {item.prompt ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col px-3 pt-12 pb-3 text-white opacity-0 transition-opacity duration-150 group-focus-within:opacity-100 group-hover:opacity-100 motion-reduce:opacity-100 [@media(hover:none)]:opacity-100">
            <p className="line-clamp-3 text-sm">{item.prompt}</p>
          </div>
        ) : null}
        <button
          type="button"
          className="absolute inset-0 cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--flow-amber)] focus-visible:outline-none focus-visible:ring-inset"
          aria-label={`${playLabel}: ${item.title}`}
          onClick={onOpen}
        />
      </div>
    </article>
  );
}

function CopyPromptButton({
  text,
  labels,
}: {
  text: string;
  labels: { copy: string; copied: string; failed: string };
}) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');

  useEffect(() => {
    if (state === 'idle') {
      return;
    }
    const timer = window.setTimeout(() => setState('idle'), 2000);
    return () => window.clearTimeout(timer);
  }, [state]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setState('copied');
    } catch {
      setState('failed');
    }
  };

  const label =
    state === 'copied'
      ? labels.copied
      : state === 'failed'
        ? labels.failed
        : labels.copy;

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
      {state === 'copied' ? (
        <Check className="size-4" aria-hidden />
      ) : (
        <Copy className="size-4" aria-hidden />
      )}
      {label}
    </Button>
  );
}

export function VideoExamples({ section }: { section: Section }) {
  const ui = (section.ui || {}) as ShowcaseUi;
  const items = useMemo(() => mapItems(section.items), [section.items]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const collapseGallery = items.length > 4;
  const showBrowseAll = collapseGallery && !isExpanded;

  const labels = {
    play: ui.play || 'Play video',
    referencePrompt: ui.reference_prompt || 'Reference prompt',
    copy: ui.copy_prompt || 'Copy prompt',
    copied: ui.copied || 'Copied!',
    failed: ui.copy_failed || 'Copy failed',
    prev: ui.prev || 'Previous example',
    next: ui.next || 'Next example',
    goGenerator: ui.go_generator || 'Go to generator',
    browseAll: ui.browse_all || 'Browse all',
  };

  const selected = selectedIndex === null ? null : items[selectedIndex] || null;

  const navigate = useCallback(
    (direction: number) => {
      setSelectedIndex((current) => {
        if (current === null || items.length === 0) {
          return current;
        }
        return (current + direction + items.length) % items.length;
      });
    },
    [items.length]
  );

  useEffect(() => {
    if (selectedIndex !== null && selectedIndex >= items.length) {
      setSelectedIndex(null);
    }
  }, [items.length, selectedIndex]);

  return (
    <section className="flow-section" id={section.id || 'showcases'}>
      <div className="flow-container">
        <FlowSectionHead
          label={section.label}
          title={section.title || ''}
          description={section.description || ''}
        />
        <div
          className={cn(
            'relative mx-auto mt-2 w-full',
            collapseGallery && !isExpanded
              ? 'h-[580px] overflow-hidden md:h-[680px] lg:h-[760px]'
              : 'pb-2'
          )}
        >
          <div className="columns-2 gap-2 rounded-[24px] sm:columns-3 lg:columns-4">
            {items.map((item, index) => (
              <ExampleCard
                key={`${item.video}-${index}`}
                item={item}
                playLabel={labels.play}
                onOpen={() => setSelectedIndex(index)}
              />
            ))}
          </div>

          {showBrowseAll ? (
            <>
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-52 bg-gradient-to-b from-transparent via-background/80 to-background md:h-64 lg:h-72"
                aria-hidden
              />
              <div className="absolute right-0 bottom-6 left-0 z-30 flex justify-center md:bottom-10">
                <button
                  type="button"
                  aria-expanded={isExpanded}
                  onClick={() => setIsExpanded(true)}
                  className="inline-flex w-auto max-w-[calc(100%-2rem)] cursor-pointer items-center justify-center rounded-full border border-white/15 bg-[#2563eb] px-5 py-2.5 text-sm font-medium text-white shadow-[0_10px_28px_rgba(37,99,235,0.28)] transition-[transform,box-shadow] duration-200 hover:scale-[1.02] hover:shadow-[0_12px_32px_rgba(37,99,235,0.34)] motion-reduce:transition-none motion-reduce:hover:scale-100"
                >
                  {labels.browseAll}
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>

      <Dialog
        open={selectedIndex !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedIndex(null);
          }
        }}
      >
        <DialogContent
          className={cn(
            'max-h-[min(92dvh,calc(100vh-2rem))] max-w-[min(1100px,calc(100vw-2rem))] gap-0 overflow-hidden p-0',
            'sm:max-w-[min(1100px,calc(100vw-4rem))]'
          )}
        >
          {selected ? (
            <>
              <DialogTitle className="sr-only">{selected.title}</DialogTitle>
              <div className="grid max-h-[min(92dvh,calc(100vh-2rem))] md:grid-cols-[minmax(0,1fr)_18rem]">
                <div className="relative flex min-h-[220px] items-center justify-center bg-black p-3 md:min-h-[360px] md:p-5">
                  <video
                    key={selected.video}
                    src={selected.video}
                    poster={selected.poster || undefined}
                    controls
                    autoPlay
                    playsInline
                    className="max-h-[52dvh] w-full object-contain md:max-h-[min(72dvh,calc(92dvh-4rem))]"
                  />
                  {items.length > 1 ? (
                    <>
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        className="absolute top-1/2 left-2 -translate-y-1/2 bg-background/80"
                        aria-label={labels.prev}
                        onClick={() => navigate(-1)}
                      >
                        <ChevronLeft className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        className="absolute top-1/2 right-2 -translate-y-1/2 bg-background/80"
                        aria-label={labels.next}
                        onClick={() => navigate(1)}
                      >
                        <ChevronRight className="size-4" />
                      </Button>
                    </>
                  ) : null}
                </div>
                <aside className="flex max-h-[40dvh] min-h-0 flex-col gap-3 overflow-y-auto border-t p-4 md:max-h-none md:border-t-0 md:border-l">
                  <div>
                    <h3 className="text-base font-semibold">{selected.title}</h3>
                    {selectedIndex !== null ? (
                      <p className="text-muted-foreground mt-1 text-xs">
                        {selectedIndex + 1} / {items.length}
                      </p>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                      {labels.referencePrompt}
                    </p>
                    <p className="text-sm leading-relaxed">{selected.prompt}</p>
                  </div>
                  <div className="mt-auto flex flex-col gap-2 pt-2">
                    <CopyPromptButton
                      text={selected.prompt}
                      labels={{
                        copy: labels.copy,
                        copied: labels.copied,
                        failed: labels.failed,
                      }}
                    />
                    <Button asChild variant="default" size="sm">
                      <Link href="/#generator">{labels.goGenerator}</Link>
                    </Button>
                  </div>
                </aside>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}
