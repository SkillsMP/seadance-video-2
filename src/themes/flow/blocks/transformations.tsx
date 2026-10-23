import Image from 'next/image';
import { ArrowRight, Check } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { cn } from '@/shared/lib/utils';
import type { Section } from '@/shared/types/blocks/landing';

export interface TransformationsSection extends Section {
  badge?: string;
  highlights?: string[];
  items?: {
    title: string;
    label: string;
    description: string;
    video?: string;
    poster?: string;
    image?: {
      src: string;
      alt?: string;
    };
  }[];
  cta_title?: string;
  cta_description?: string;
}

/** Source: flowaivideo-lol/src/shared/blocks/flow/site.tsx, FlowTransformations. */
export function Transformations({
  section,
  className,
}: {
  section: TransformationsSection;
  className?: string;
}) {
  return (
    <section
      className={cn('flow-section', section.className, className)}
      id={section.id}
    >
      <div className="flow-container">
        <div className="flow-section-head">
          {section.badge ? (
            <span className="flow-eyebrow">{section.badge}</span>
          ) : null}
          <h2 className="mt-4">{section.title}</h2>
          <p>{section.description}</p>
        </div>
        <div className="flow-highlight-list justify-center">
          {section.highlights?.map((item) => (
            <span key={item}>
              <Check className="mr-1 inline size-3.5" aria-hidden="true" />
              {item}
            </span>
          ))}
        </div>
        {section.items?.map((item, index) => (
          <div
            className="flow-media-row"
            data-flip={index % 2 === 1}
            key={item.title}
          >
            <div className="flow-media-visual">
              {item.video ? (
                <video
                  src={item.video}
                  poster={item.poster}
                  title={item.title}
                  muted
                  loop
                  autoPlay
                  playsInline
                />
              ) : item.image?.src ? (
                <Image
                  src={item.image.src}
                  alt={item.image.alt ?? item.title}
                  fill
                  sizes="(min-width: 1280px) 592px, (min-width: 900px) 50vw, 100vw"
                  className="object-cover"
                />
              ) : null}
            </div>
            <div className="flow-media-copy">
              <span className="flow-eyebrow">{item.label}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          </div>
        ))}
        {section.cta_title ||
        section.cta_description ||
        section.buttons?.length ? (
          <div className="flow-transformation-cta">
            {section.cta_title ? <h3>{section.cta_title}</h3> : null}
            {section.cta_description ? <p>{section.cta_description}</p> : null}
            {section.buttons?.length ? (
              <div className="flow-hero-actions mt-4">
                {section.buttons.map((button, index) =>
                  button.url ? (
                    <Link
                      key={`${button.url}-${index}`}
                      href={button.url}
                      target={button.target || '_self'}
                      rel={
                        button.target === '_blank'
                          ? 'noopener noreferrer'
                          : undefined
                      }
                      className={
                        button.variant === 'outline'
                          ? 'flow-btn-outline'
                          : 'flow-generate'
                      }
                    >
                      {button.title}
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </Link>
                  ) : null
                )}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
