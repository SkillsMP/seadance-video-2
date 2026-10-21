'use client';

import Image from 'next/image';
import { useReducedMotion } from 'framer-motion';

import { Link } from '@/core/i18n/navigation';
import { cn } from '@/shared/lib/utils';
import { Section } from '@/shared/types/blocks/landing';

import { ClipMarquee } from '../components/clip-marquee';

export function Showcases({
  section,
  className,
}: {
  section: Section;
  className?: string;
}) {
  const shouldReduceMotion = useReducedMotion();
  const compact = section.compact === true;

  if (compact) {
    return (
      <section
        id={section.id || section.name}
        className={cn('py-2 md:py-3', section.className, className)}
      >
        {section.title && (
          <h2 className="sr-only">{section.title}</h2>
        )}
        <ClipMarquee
          items={section.items ?? []}
          reduceMotion={shouldReduceMotion}
        />
      </section>
    );
  }

  return (
    <section
      id={section.id || section.name}
      className={cn('py-16 md:py-24', section.className, className)}
    >
      <div className="container mb-10 max-w-3xl md:mb-14">
        {section.sr_only_title && (
          <h1 className="sr-only">{section.sr_only_title}</h1>
        )}
        <h2 className="text-3xl font-semibold tracking-tight text-pretty md:text-4xl">
          {section.title}
        </h2>
        {section.description && (
          <p className="text-muted-foreground mt-4 text-pretty">
            {section.description}
          </p>
        )}
      </div>

      <div
        className={cn(
          'container grid grid-cols-1 gap-5 md:grid-cols-2',
          section.columns === 3 && 'lg:grid-cols-3'
        )}
      >
        {section.items?.map((item, index) => {
          const videoSrc =
            typeof item.video?.src === 'string' ? item.video.src : undefined;
          const href = item.url || '';
          const key = videoSrc || item.image?.src || item.title || index;
          const card = (
            <article className="group bg-card relative overflow-hidden rounded-2xl border">
              <div className="relative aspect-video overflow-hidden">
                {videoSrc ? (
                  <video
                    src={videoSrc}
                    poster={item.image?.src}
                    autoPlay={!shouldReduceMotion}
                    muted
                    loop={!shouldReduceMotion}
                    playsInline
                    preload="metadata"
                    aria-hidden="true"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                ) : (
                  <Image
                    src={item.image?.src ?? ''}
                    alt={item.image?.alt ?? item.title ?? ''}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <h3 className="text-lg font-medium text-balance text-white">
                    {item.title}
                  </h3>
                </div>
              </div>
            </article>
          );

          return href ? (
            <Link key={key} href={href} target={item.target}>
              {card}
            </Link>
          ) : (
            <div key={key}>{card}</div>
          );
        })}
      </div>
    </section>
  );
}
