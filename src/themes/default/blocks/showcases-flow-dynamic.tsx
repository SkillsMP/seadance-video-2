'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Wand, X } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { LazyImage } from '@/shared/blocks/common';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';

interface PromptItem {
  id: string;
  title: string;
  description: string | null;
  image: string | null;
  promptTitle: string;
  promptDescription: string | null;
}

export function ShowcasesFlowDynamic({
  title,
  description,
  className,
}: {
  title?: string;
  description?: string;
  className?: string;
}) {
  const [items, setItems] = useState<PromptItem[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/prompts?page=${page}&limit=12`);
      const result = await response.json();
      
      if (result.success && result.data) {
        if (result.data.length === 0) {
          setHasMore(false);
        } else {
          setItems(prev => [...prev, ...result.data]);
          setPage(prev => prev + 1);
        }
      }
    } catch (error) {
      console.error('Failed to load prompts:', error);
    } finally {
      setLoading(false);
    }
  }, [page, loading, hasMore]);

  useEffect(() => {
    loadMore();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (loading || !hasMore) return;
      
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;
      
      if (scrollTop + clientHeight >= scrollHeight - 500) {
        loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, hasMore, loadMore]);

  const handlePrevious = useCallback(() => {
    setSelectedIndex((prev) =>
      prev !== null
        ? prev === 0
          ? items.length - 1
          : prev - 1
        : null
    );
  }, [items.length]);

  const handleNext = useCallback(() => {
    setSelectedIndex((prev) =>
      prev !== null
        ? prev === items.length - 1
          ? 0
          : prev + 1
        : null
    );
  }, [items.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedIndex === null) return;
      if (e.key === 'Escape') setSelectedIndex(null);
      if (e.key === 'ArrowLeft') handlePrevious();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, handlePrevious, handleNext]);

  return (
    <section className={cn('py-24 md:py-36', className)}>
      <motion.div
        className="container mb-12 text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{
          duration: 0.6,
          ease: [0.22, 1, 0.36, 1] as const,
        }}
      >
        <h2 className="mx-auto mb-6 max-w-full text-3xl font-bold text-pretty md:max-w-5xl lg:text-4xl">
          {title || 'Nano Banana Pro Prompts'}
        </h2>
        <p className="text-muted-foreground text-md mx-auto mb-4 line-clamp-3 max-w-full md:max-w-5xl">
          {description || 'Representative editing and generation cases powered by Nano Banana Pro'}
        </p>
      </motion.div>

      {items.length > 0 ? (
        <div className="container mx-auto columns-1 gap-4 space-y-4 sm:columns-2 lg:columns-3 xl:columns-4">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              className="group relative cursor-zoom-in break-inside-avoid overflow-hidden rounded-xl"
              onClick={() => setSelectedIndex(index)}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{
                duration: 0.6,
                delay: (index % 12) * 0.1,
                ease: [0.22, 1, 0.36, 1] as const,
              }}
              whileHover={{ scale: 1.02 }}
            >
              <LazyImage
                src={item.image || ''}
                alt={item.title}
                className="h-auto w-full transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              />
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <h3 className="mb-3 translate-y-4 text-base font-semibold text-white transition-transform duration-300 group-hover:translate-y-0">
                  {item.title}
                </h3>
                <div
                  className="translate-y-4 transition-transform delay-75 duration-300 group-hover:translate-y-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    asChild
                    variant="default"
                    size="sm"
                    className="inline-flex items-center justify-center whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive rounded-md gap-1.5 has-[>svg]:px-2.5 bg-primary hover:bg-primary/90 text-primary-foreground h-8 w-full border-0 px-1 py-1.5 text-sm font-medium"
                  >
                    <Link
                      href={`/create?prompt=${encodeURIComponent(item.promptTitle)}`}
                      target="_self"
                    >
                      <Wand className="mr-2 size-4" />
                      Create Similar
                    </Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div
          className="text-muted-foreground container text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          {loading ? 'Loading...' : 'No items found.'}
        </motion.div>
      )}

      {loading && items.length > 0 && (
        <div className="container mx-auto mt-8 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
        </div>
      )}

      <AnimatePresence>
        {selectedIndex !== null && items.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm md:p-8"
            onClick={() => setSelectedIndex(null)}
          >
            <button
              className="absolute top-4 right-4 z-50 text-white/70 transition-colors hover:text-white"
              onClick={() => setSelectedIndex(null)}
            >
              <X className="size-8" />
            </button>

            <button
              className="absolute top-1/2 left-4 z-50 -translate-y-1/2 rounded-full bg-black/20 p-2 text-white/70 transition-colors hover:bg-black/40 hover:text-white"
              onClick={(e) => {
                e.stopPropagation();
                handlePrevious();
              }}
            >
              <ChevronLeft className="size-8 md:size-12" />
            </button>

            <button
              className="absolute top-1/2 right-4 z-50 -translate-y-1/2 rounded-full bg-black/20 p-2 text-white/70 transition-colors hover:bg-black/40 hover:text-white"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
            >
              <ChevronRight className="size-8 md:size-12" />
            </button>

            <motion.div
              key={selectedIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="relative flex h-full w-full items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative max-h-full max-w-full overflow-hidden rounded-lg">
                <LazyImage
                  src={items[selectedIndex].image || ''}
                  alt={items[selectedIndex].title}
                  className="h-auto max-h-[90vh] w-auto max-w-full object-contain"
                />
                <div className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-6 text-white">
                  <h3 className="mb-2 text-2xl font-bold">
                    {items[selectedIndex].title}
                  </h3>
                  {items[selectedIndex].description && (
                    <p className="line-clamp-3 text-base text-white/90">
                      {items[selectedIndex].description}
                    </p>
                  )}
                  <div className="mt-4">
                    <Button
                      asChild
                      variant="default"
                      size="default"
                      className="bg-primary hover:bg-primary/90 h-8 border-0 px-3 py-1.5 text-sm font-medium text-white"
                    >
                      <Link
                        href={`/create?prompt=${encodeURIComponent(items[selectedIndex].promptTitle)}`}
                        target="_self"
                      >
                        <Wand className="mr-2 size-4" />
                        Create Similar
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
