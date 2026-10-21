'use client';

import { Link } from '@/core/i18n/navigation';
import { Marquee } from '@/shared/components/ui/marquee';
import type { SectionItem } from '@/shared/types/blocks/landing';

export function ClipMarquee({
  items,
  reduceMotion,
}: {
  items: SectionItem[];
  reduceMotion: boolean | null;
}) {
  const clips = items.map((item, index) => {
    const videoSrc =
      typeof item.video?.src === 'string' ? item.video.src : undefined;
    const href = item.url || '';
    const key = videoSrc || item.image?.src || item.title || index;
    const media = videoSrc ? (
      <video
        src={videoSrc}
        poster={item.image?.src}
        autoPlay={!reduceMotion}
        muted
        loop={!reduceMotion}
        playsInline
        preload="metadata"
        aria-hidden="true"
        className="h-full w-full object-cover"
      />
    ) : (
      item.image?.src && (
        // Static poster in a scrolling strip; next/image is unnecessary here.
        <img
          src={item.image.src}
          alt=""
          className="h-full w-full object-cover"
        />
      )
    );

    const card = (
      <article className="relative h-36 w-64 overflow-hidden rounded-xl border">
        {media}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <p className="absolute inset-x-0 bottom-0 truncate px-3 py-2 text-sm text-white">
          {item.title}
        </p>
      </article>
    );

    return href ? (
      <Link key={key} href={href} className="shrink-0">
        {card}
      </Link>
    ) : (
      <div key={key} className="shrink-0">
        {card}
      </div>
    );
  });

  if (reduceMotion) {
    return (
      <div className="flex gap-4 overflow-x-auto px-2 py-2">{clips}</div>
    );
  }

  return (
    <Marquee pauseOnHover repeat={2} className="[--duration:35s]">
      {clips}
    </Marquee>
  );
}
