'use client';

import { useMemo, useState } from 'react';
import {
  Check,
  Clipboard,
  ImageIcon,
  Link2,
  Search,
  Share2,
  Shuffle,
  Wand,
} from 'lucide-react';
import { toast } from 'sonner';

import { Link } from '@/core/i18n/navigation';
import { LazyImage } from '@/shared/blocks/common/lazy-image';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { cn } from '@/shared/lib/utils';
import type { Prompt } from '@/shared/models/prompt';
import type { Section } from '@/shared/types/blocks/landing';

type PromptLibraryProps = {
  section: Section;
  items: PromptLibraryItem[];
};

type PromptLibraryItem = Omit<Prompt, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};

function formatTemplate(
  template: string | undefined,
  values: Record<string, number>
) {
  if (!template) {
    return '';
  }

  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template
  );
}

function getPromptText(item: PromptLibraryItem) {
  return item.promptDescription?.trim() || '';
}

function getCreateHref(item: PromptLibraryItem) {
  return `/create?prompt=${encodeURIComponent(item.promptTitle)}`;
}

function getShareUrl(item: PromptLibraryItem) {
  if (typeof window === 'undefined') {
    return getCreateHref(item);
  }

  const localePrefix = window.location.pathname.startsWith('/zh') ? '/zh' : '';
  return `${window.location.origin}${localePrefix}${getCreateHref(item)}`;
}

function getPromptDate(item: PromptLibraryItem) {
  const value = item.createdAt ? new Date(item.createdAt) : null;

  if (!value || Number.isNaN(value.getTime())) {
    return '';
  }

  return value.toISOString().slice(0, 10);
}

function matchesQuery(item: PromptLibraryItem, query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  return [
    item.title,
    item.description,
    item.promptTitle,
    item.promptDescription,
  ].some((value) => value?.toLowerCase().includes(normalizedQuery));
}

export function PromptLibrary({ section, items }: PromptLibraryProps) {
  const initialVisibleCount =
    typeof section.initialVisibleCount === 'number'
      ? section.initialVisibleCount
      : 24;
  const visibleStep =
    typeof section.visibleStep === 'number' ? section.visibleStep : 24;

  const [query, setQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(initialVisibleCount);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredItems = useMemo(
    () => items.filter((item) => matchesQuery(item, query)),
    [items, query]
  );
  const visibleItems = filteredItems.slice(0, visibleCount);
  const copyableItems = filteredItems.filter((item) => getPromptText(item));

  const copyText = async (text: string, id: string) => {
    if (!text) {
      toast.error(section.copyUnavailableLabel || 'Prompt is not available.');
      return;
    }

    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    window.setTimeout(() => setCopiedId(null), 1600);
  };

  const handleCopy = async (item: PromptLibraryItem) => {
    try {
      await copyText(getPromptText(item), item.id);
    } catch (error) {
      console.error('Failed to copy prompt:', error);
      toast.error(section.copyUnavailableLabel || 'Prompt is not available.');
    }
  };

  const handleRandomCopy = async () => {
    if (!copyableItems.length) {
      toast.error(section.emptyDescription || 'Try another keyword.');
      return;
    }

    const item =
      copyableItems[Math.floor(Math.random() * copyableItems.length)];
    await handleCopy(item);
  };

  const handleShare = async (item: PromptLibraryItem) => {
    const url = getShareUrl(item);

    const copyShareUrl = async () => {
      try {
        await navigator.clipboard.writeText(url);
        toast.success(section.shareCopiedLabel || 'Generator link copied.');
      } catch (error) {
        console.error('Failed to copy share link:', error);
        toast.error(section.shareUnavailableLabel || 'Unable to share link.');
      }
    };

    try {
      if (navigator.share) {
        await navigator.share({
          title: item.title,
          text: item.description || item.title,
          url,
        });
        return;
      }

      await copyShareUrl();
    } catch (error) {
      console.error('Failed to share prompt:', error);
      await copyShareUrl();
    }
  };

  return (
    <section
      id={section.id}
      className={cn('bg-background py-16 md:py-24', section.className)}
    >
      <div className="container">
        <div className="mx-auto max-w-4xl text-center">
          {section.eyebrow && (
            <p className="text-primary mb-4 text-xs font-semibold tracking-[0.18em] uppercase">
              {section.eyebrow}
            </p>
          )}
          <h1 className="text-foreground text-4xl font-semibold text-balance md:text-5xl">
            {section.title}
          </h1>
          {section.description && (
            <p className="text-muted-foreground mx-auto mt-5 max-w-2xl text-base md:text-lg">
              {section.description}
            </p>
          )}
        </div>

        <div className="mx-auto mt-10 flex max-w-5xl flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setVisibleCount(initialVisibleCount);
              }}
              placeholder={section.searchPlaceholder}
              className="h-11 pl-9"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-11"
            onClick={handleRandomCopy}
            disabled={!copyableItems.length}
          >
            <Shuffle className="h-4 w-4" />
            {section.randomCopyLabel}
          </Button>
          <div className="text-muted-foreground text-sm md:min-w-28 md:text-right">
            {formatTemplate(section.totalLabel, {
              count: filteredItems.length,
            })}
          </div>
        </div>

        {visibleItems.length > 0 ? (
          <>
            <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {visibleItems.map((item) => {
                const promptText = getPromptText(item);
                const date = getPromptDate(item);
                const hasImage = Boolean(item.image);

                return (
                  <article
                    key={item.id}
                    className="border-border bg-card text-card-foreground group flex flex-col overflow-hidden rounded-lg border shadow-xs"
                  >
                    <div className="bg-muted relative aspect-[4/3] overflow-hidden">
                      {hasImage ? (
                        <LazyImage
                          src={item.image as string}
                          alt={item.title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-2 text-sm">
                          <ImageIcon className="h-8 w-8" />
                          <span>{section.noImageLabel}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col p-5">
                      <div className="text-muted-foreground mb-3 flex items-center justify-between gap-3 text-xs">
                        <span>{date}</span>
                        <span className="inline-flex items-center gap-1">
                          <Link2 className="h-3.5 w-3.5" />
                          {item.promptTitle}
                        </span>
                      </div>

                      <h2 className="text-lg font-semibold text-pretty">
                        {item.title}
                      </h2>
                      {item.description && (
                        <p className="text-muted-foreground mt-2 line-clamp-2 text-sm">
                          {item.description}
                        </p>
                      )}

                      <div className="bg-muted/60 mt-4 rounded-md p-3">
                        <p className="text-muted-foreground mb-1 text-xs font-medium">
                          {section.promptPreviewLabel}
                        </p>
                        <p className="text-foreground line-clamp-4 text-sm leading-6">
                          {promptText || section.copyUnavailableLabel}
                        </p>
                      </div>

                      <div className="mt-auto flex flex-wrap gap-2 pt-5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopy(item)}
                          disabled={!promptText}
                        >
                          {copiedId === item.id ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Clipboard className="h-4 w-4" />
                          )}
                          {copiedId === item.id
                            ? section.copiedLabel
                            : section.copyLabel}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleShare(item)}
                        >
                          <Share2 className="h-4 w-4" />
                          {section.shareLabel}
                        </Button>
                        <Button asChild size="sm" className="ml-auto">
                          <Link
                            href={getCreateHref(item)}
                            target="_self"
                            prefetch={false}
                          >
                            <Wand className="h-4 w-4" />
                            {section.tryItLabel}
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="mt-10 flex flex-col items-center gap-4">
              <p className="text-muted-foreground text-sm">
                {formatTemplate(section.visibleLabel, {
                  visible: visibleItems.length,
                  total: filteredItems.length,
                })}
              </p>
              {visibleItems.length < filteredItems.length && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setVisibleCount((current) => current + visibleStep)
                  }
                >
                  {section.loadMoreLabel}
                </Button>
              )}
            </div>
          </>
        ) : (
          <div className="mx-auto mt-16 max-w-md text-center">
            <div className="bg-muted text-muted-foreground mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
              <Search className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold">{section.emptyTitle}</h2>
            <p className="text-muted-foreground mt-2 text-sm">
              {section.emptyDescription}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
