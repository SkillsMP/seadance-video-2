'use client';

import type { ReactNode } from 'react';

import { Link } from '@/core/i18n/navigation';
import { SmartIcon } from '@/shared/blocks/common/smart-icon';
import { cn } from '@/shared/lib/utils';
import type { Button } from '@/shared/types/blocks/common';

function flowActionClassName(button: Button) {
  return button.variant === 'outline'
    ? 'flow-btn-outline'
    : 'flow-generate';
}

type HeroSection = {
  id?: string;
  badge?: string;
  announcement?: Button;
  title: string;
  model_tag?: string;
  subtitle: string;
  social_users?: string;
  buttons?: Button[];
  tip?: string;
};

// The source button's subscription gate is replaced with the site's real links.
export function FlowAction({
  children,
  className = 'flow-generate mx-auto mt-4 max-w-xs',
  button,
}: {
  children: ReactNode;
  className?: string;
  button: Button;
}) {
  return (
    <Link
      href={button.url || ''}
      target={button.target || '_self'}
      onClick={button.onClick}
      className={className}
    >
      {children}
    </Link>
  );
}

export function FlowHero({
  hero,
}: {
  hero: HeroSection;
}) {
  return (
    <section className="flow-hero" id={hero.id}>
      <div className="flow-container flow-hero-inner">
        {hero.badge ? (
          <span className="flow-eyebrow">
            {hero.announcement ? (
              <Link href={hero.announcement.url || ''} target={hero.announcement.target || '_self'}>
                {hero.badge}
              </Link>
            ) : hero.badge}
          </span>
        ) : null}
        <h1>{hero.title}</h1>
        {hero.model_tag ? <p className="flow-model-tag">{hero.model_tag}</p> : null}
        <p className="flow-subtitle" dangerouslySetInnerHTML={{ __html: hero.subtitle }} />
        {hero.social_users ? <p className="flow-social">{hero.social_users}</p> : null}
        {hero.buttons && hero.buttons.length > 0 ? (
          <div className="flow-hero-actions">
            {hero.buttons.map((button, index) => (
              <FlowAction
                key={button.url || index}
                button={button}
                className={flowActionClassName(button)}
              >
                {button.icon ? (
                  <SmartIcon name={button.icon as string} className="size-4" />
                ) : null}
                {button.title}
              </FlowAction>
            ))}
          </div>
        ) : null}
        {hero.tip ? <p className="flow-social" dangerouslySetInnerHTML={{ __html: hero.tip }} /> : null}
      </div>
    </section>
  );
}

export function FlowSectionHead({
  label,
  title,
  description,
}: {
  label?: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flow-section-head">
      {label ? <span className="flow-eyebrow">{label}</span> : null}
      <h2 className="mt-4">{title}</h2>
      <p>{description}</p>
    </div>
  );
}

export function FlowShowcase({
  section,
}: {
  section: {
    id: string;
    title: string;
    description: string;
    columns?: number;
    items: { poster: string; video: string; title?: string; description?: string; url?: string }[];
  };
}) {
  return (
    <section className="flow-section" id={section.id}>
      <div className="flow-container">
        <FlowSectionHead title={section.title} description={section.description} />
        <div
          className={cn(
            'flow-video-grid',
            section.columns === 2 && 'flow-video-grid--cols-2'
          )}
        >
          {section.items.map((item, index) => (
            <Link className="flow-video-card" href={item.url || item.video || item.poster} aria-label={item.title || undefined} key={`${item.poster}-${index}`}>
              <video
                src={item.video || undefined}
                title={item.title}
                aria-label={item.description || item.title}
                poster={item.poster}
                muted
                loop
                playsInline
                preload="none"
                onMouseEnter={(event) => void event.currentTarget.play().catch(() => {})}
                onMouseLeave={(event) => event.currentTarget.pause()}
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FlowFeatures({
  section,
}: {
  section: {
    id: string;
    label: string;
    title: string;
    description: string;
        items: { title: string; description: string; icon: string }[];
    columns?: number;
  };
}) {
  const gridClass =
    section.columns === 4
      ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-4'
      : section.columns === 2
        ? 'grid gap-4 sm:grid-cols-2'
        : 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3';

  return (
    <section className="flow-section" id={section.id}>
      <div className="flow-container">
        <FlowSectionHead label={section.label} title={section.title} description={section.description} />
        <div className={gridClass}>
          {section.items.map((item) => {
            return (
              <article className="flow-card" key={item.title}>
                <SmartIcon name={item.icon || 'Sparkles'} className="mb-3 size-6 text-[var(--flow-amber)]" />
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function FlowSteps({
  section,
}: {
  section: {
    id: string;
    label: string;
    title: string;
    description: string;
    items: { title: string; description: string; order: number }[];
  };
}) {
  return (
    <section className="flow-section" id={section.id}>
      <div className="flow-container">
        <FlowSectionHead label={section.label} title={section.title} description={section.description} />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {section.items.map((item) => (
            <article className="flow-card" key={item.title}>
              <span className="flow-eyebrow">0{item.order}</span>
              <h3 className="mt-3 text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FlowFaq({
  section,
}: {
  section: {
    id: string;
    title: string;
    description: string;
    items: { question: string; answer: string }[];
  };
}) {
  return (
    <section className="flow-section" id={section.id}>
      <div className="flow-container">
        <FlowSectionHead title={section.title} description={section.description} />
        <div className="mx-auto max-w-3xl divide-y divide-border rounded-[var(--radius)] border border-border bg-[color-mix(in_oklab,var(--card)_88%,transparent)]">
          {section.items.map((item, index) => (
            <details className="group px-5 py-4" key={item.question}>
              <summary className="flex cursor-pointer items-center justify-between gap-4 font-medium">
                <span>
                  <span className="mr-2 text-[var(--flow-amber)]">{index + 1}</span>
                  {item.question}
                </span>
                <span className="text-[var(--flow-amber)] group-open:rotate-45">+</span>
              </summary>
              <p className="rich-text mt-3 text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: item.answer }} />
            </details>
          ))}
        </div>

      </div>
    </section>
  );
}

// JSX copied from the source landing page's final CTA; only data/links are adapted.
export function FlowCta({
  section,
}: {
  section: { id?: string; title: string; description: string; buttons: Button[] };
}) {
  return (
    <section className="flow-section" id={section.id}>
      <div className="flow-container">
        <div className="flow-transformation-cta">
          <h3 className="text-2xl md:text-3xl">{section.title}</h3>
          <p>{section.description}</p>
          <div className="flow-hero-actions mt-2">
            {section.buttons.map((button, index) => (
              <FlowAction
                key={button.url || index}
                button={button}
                className={flowActionClassName(button)}
              >
                {button.icon ? (
                  <SmartIcon name={button.icon as string} className="size-4" />
                ) : null}
                {button.title}
              </FlowAction>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
