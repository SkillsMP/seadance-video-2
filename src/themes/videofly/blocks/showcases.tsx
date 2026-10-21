'use client';

import * as React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, Play, Sparkles } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { BlurFade } from '@/shared/components/magicui/blur-fade';
import { BorderBeam } from '@/shared/components/magicui/border-beam';
import { ShimmerButton } from '@/shared/components/magicui/shimmer-button';
import { cn } from '@/shared/lib/utils';
import { Section, SectionItem } from '@/shared/types/blocks/landing';

function VideoCardItem({
  item,
  index,
  totalColumns,
}: {
  item: SectionItem;
  index: number;
  totalColumns?: number;
}) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const videoSrc = typeof item.video?.src === 'string' ? item.video.src : undefined;
  const href = item.url || '';
  const tag = item.badge || item.tag || 'AI Video';

  const handleMouseEnter = () => {
    if (videoRef.current && videoSrc) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleMouseLeave = () => {
    if (videoRef.current && videoSrc) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const cardContent = (
    <div
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-border bg-card shadow-lg transition-all duration-300 hover:shadow-2xl hover:border-primary/40 dark:bg-zinc-950/70"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* BorderBeam on the first featured card (videofly design) */}
      {index === 0 && (
        <BorderBeam
          size={300}
          duration={14}
          borderWidth={2}
          colorFrom="#3B82F6"
          colorTo="#A855F7"
        />
      )}

      {/* 16:9 Video/Thumbnail Container */}
      <div className="relative aspect-video w-full overflow-hidden bg-zinc-900">
        {videoSrc ? (
          <video
            ref={videoRef}
            src={videoSrc}
            poster={item.image?.src}
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden="true"
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : item.image?.src ? (
          <Image
            src={item.image.src}
            alt={item.image.alt || item.title || ''}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : null}

        {/* Hover overlay mask */}
        <div
          className={cn(
            'absolute inset-0 bg-black/20 transition-colors duration-300 group-hover:bg-black/40',
            isPlaying && 'bg-transparent'
          )}
        />

        {/* Centered Play Button with pulse animation */}
        <div
          className={cn(
            'pointer-events-none absolute inset-0 flex items-center justify-center transition-all duration-300',
            isPlaying ? 'opacity-0 scale-90' : 'opacity-90 group-hover:opacity-100 group-hover:scale-110'
          )}
        >
          <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-xl backdrop-blur-sm transition-all duration-300 dark:bg-black/80 group-hover:bg-gradient-to-br group-hover:from-blue-500 group-hover:to-purple-500">
            <Play className="h-6 w-6 text-foreground transition-colors group-hover:text-white ml-0.5" />
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 animate-ping opacity-0 group-hover:opacity-30" />
          </div>
        </div>

        {/* Tag Pill on top-left */}
        <div className="absolute top-3 left-3 rounded-full border border-white/20 bg-black/60 px-3 py-1 backdrop-blur-sm">
          <span className="text-xs font-medium text-white">{tag}</span>
        </div>
      </div>

      {/* Video Info below media (videofly layout) */}
      <div className="p-4 sm:p-5">
        <h3 className="text-lg font-semibold tracking-tight text-foreground transition-all duration-300 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text">
          {item.title}
        </h3>
        {item.description && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground leading-relaxed">
            {item.description}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <BlurFade delay={index * 0.05} inView>
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.45, delay: index * 0.05 }}
        className="group relative"
      >
        {href ? (
          <Link href={href} target={item.target}>
            {cardContent}
          </Link>
        ) : (
          cardContent
        )}
      </motion.div>
    </BlurFade>
  );
}

export function Showcases({
  section,
  className,
}: {
  section: Section;
  className?: string;
}) {
  const items = section.items ?? [];
  const columns = section.columns || (items.length >= 3 ? 3 : 2);

  return (
    <section
      id={section.id || section.name}
      className={cn('relative py-20 md:py-32 overflow-hidden', section.className, className)}
    >
      {/* Background subtle gradient decoration */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/30 to-background" />
      </div>

      <div className="container mx-auto px-4">
        {/* Section Header */}
        <BlurFade inView>
          <div className="mx-auto mb-16 max-w-3xl text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-gradient-to-r from-blue-500/10 to-purple-500/10 px-4 py-1.5"
            >
              <Sparkles className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                {section.label || 'AI Video Showcase'}
              </span>
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl"
            >
              {section.title}
            </motion.h2>

            {/* Description */}
            {section.description && (
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-muted-foreground mx-auto mt-4 max-w-2xl text-base sm:text-lg text-pretty"
              >
                {section.description}
              </motion.p>
            )}
          </div>
        </BlurFade>

        {/* Video Grid (VideoFly Authentic 2/3 Column Grid) */}
        <div
          className={cn(
            'grid grid-cols-1 gap-6 sm:grid-cols-2 mb-12',
            columns === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2'
          )}
        >
          {items.map((item, index) => (
            <VideoCardItem
              key={item.video?.src || item.image?.src || item.title || index}
              item={item}
              index={index}
              totalColumns={columns}
            />
          ))}
        </div>

        {/* Bottom CTA */}
        {section.buttons && section.buttons.length > 0 && (
          <BlurFade delay={0.3} inView>
            <div className="text-center">
              {section.buttons.map((btn, idx) => (
                <Link key={idx} href={btn.url || '#generator'}>
                  <ShimmerButton
                    shimmerColor="#ffffff"
                    shimmerSize="0.05em"
                    shimmerDuration="3s"
                    borderRadius="100px"
                    background="linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)"
                    className="px-8 py-3 text-base font-medium shadow-lg shadow-blue-500/25"
                  >
                    <span>{btn.title || 'Start Creating Videos'}</span>
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </ShimmerButton>
                </Link>
              ))}
            </div>
          </BlurFade>
        )}
      </div>
    </section>
  );
}
