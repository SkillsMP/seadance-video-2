'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { SmartIcon } from '@/shared/blocks/common';
import { Button } from '@/shared/components/ui/button';
import { Highlighter } from '@/shared/components/ui/highlighter';
import { cn } from '@/shared/lib/utils';
import { Section } from '@/shared/types/blocks/landing';

const fade = (delay: number) => ({
  initial: { opacity: 0, y: 16, filter: 'blur(6px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] as const },
});

export function Hero({
  section,
  className,
}: {
  section: Section;
  className?: string;
}) {
  const highlightText = section.highlight_text ?? '';
  const texts = highlightText ? section.title?.split(highlightText, 2) : null;

  return (
    <section
      id={section.id}
      className={cn(
        'relative overflow-hidden',
        section.compact
          ? 'pt-24 pb-2 md:pt-24 md:pb-3'
          : 'pt-24 pb-10 md:pt-32 md:pb-12',
        section.className,
        className
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 isolate opacity-70 contain-strict"
      >
        <div className="absolute top-0 left-1/2 h-[36rem] w-[48rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,var(--primary)/.22,transparent)]" />
        <div className="from-background absolute inset-0 bg-gradient-to-b via-transparent to-transparent" />
      </div>

      <div className="relative mx-auto max-w-5xl px-6 text-center">
        {section.announcement && (
          <motion.div {...fade(0)}>
            <Link
              href={section.announcement.url || ''}
              target={section.announcement.target || '_self'}
              className="hover:bg-background dark:hover:border-t-border bg-muted group mx-auto mb-8 flex w-fit items-center gap-4 rounded-full border p-1 pl-4 shadow-md shadow-zinc-950/5 transition-colors duration-300 dark:border-t-white/5 dark:shadow-zinc-950"
            >
              <span className="text-foreground text-sm">
                {section.announcement.title}
              </span>
              <span className="dark:border-background block h-4 w-0.5 border-l bg-white dark:bg-zinc-700" />
              <div className="bg-background group-hover:bg-muted size-6 overflow-hidden rounded-full duration-500">
                <div className="flex w-12 -translate-x-1/2 duration-500 ease-in-out group-hover:translate-x-0">
                  <span className="flex size-6">
                    <ArrowRight className="m-auto size-3" />
                  </span>
                  <span className="flex size-6">
                    <ArrowRight className="m-auto size-3" />
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>
        )}

        <motion.h1
          {...fade(0.12)}
          className="text-foreground text-4xl font-semibold text-balance sm:text-5xl md:text-6xl"
        >
          {texts && texts.length > 0 ? (
            <>
              {texts[0]}
              <Highlighter action="underline" color="#FF9800">
                {highlightText}
              </Highlighter>
              {texts[1]}
            </>
          ) : (
            section.title
          )}
        </motion.h1>

        {section.description && (
          <motion.p
            {...fade(0.24)}
            className="text-muted-foreground mx-auto mt-6 max-w-2xl text-lg text-pretty"
            dangerouslySetInnerHTML={{ __html: section.description }}
          />
        )}

        {section.buttons && section.buttons.length > 0 && (
          <motion.div
            {...fade(0.36)}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            {section.buttons.map((button, idx) => (
              <Button
                asChild
                size={button.size || 'lg'}
                variant={button.variant || 'default'}
                className="px-5 text-base"
                key={idx}
              >
                <Link href={button.url ?? ''} target={button.target ?? '_self'}>
                  {button.icon && <SmartIcon name={button.icon as string} />}
                  <span>{button.title}</span>
                </Link>
              </Button>
            ))}
          </motion.div>
        )}

        {section.tip && (
          <motion.p
            {...fade(0.48)}
            className="text-muted-foreground mx-auto mt-6 max-w-xl text-xs leading-relaxed"
            dangerouslySetInnerHTML={{ __html: section.tip }}
          />
        )}
      </div>
    </section>
  );
}
