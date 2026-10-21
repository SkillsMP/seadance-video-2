'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { SmartIcon } from '@/shared/blocks/common';
import { BlurFade } from '@/shared/components/magicui/blur-fade';
import { ShimmerButton } from '@/shared/components/magicui/shimmer-button';
import { Button } from '@/shared/components/ui/button';
import { Highlighter } from '@/shared/components/ui/highlighter';
import { cn } from '@/shared/lib/utils';
import { Section } from '@/shared/types/blocks/landing';

export function Hero({
  section,
  className,
}: {
  section: Section;
  className?: string;
}) {
  const highlightText = section.highlight_text ?? '';
  const texts = highlightText ? section.title?.split(highlightText, 2) : null;
  const compact = section.compact === true;

  return (
    <section
      id={section.id}
      className={cn(
        'relative overflow-hidden',
        compact ? 'pt-24 pb-4 md:pt-28 md:pb-6' : 'pt-28 pb-12 md:pt-36 md:pb-16',
        section.className,
        className
      )}
    >
      {/* Cinematic Ambient Background Glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        {/* Soft radial beam center */}
        <div className="absolute top-0 left-1/2 h-[42rem] w-[56rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_50%_30%,oklch(from_var(--primary)_l_c_h_/_0.22)_0%,transparent_70%)] blur-3xl" />
        {/* Secondary ambient highlight */}
        <div className="absolute top-1/4 left-1/3 h-[24rem] w-[36rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(168,85,247,0.12)_0%,transparent_65%)] blur-3xl" />
        {/* Top-to-bottom gentle dark gradient mask */}
        <div className="from-background absolute inset-0 bg-gradient-to-b via-transparent to-background/80" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 text-center sm:px-6">
        {/* Announcement Capsule */}
        {section.announcement && (
          <BlurFade delay={0} inView>
            <div className="mb-8 inline-flex items-center">
              <Link
                href={section.announcement.url || ''}
                target={section.announcement.target || '_self'}
                className="group relative inline-flex items-center gap-3 rounded-full border border-border bg-muted/60 p-1 pl-4 text-xs font-medium text-muted-foreground shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-primary/40 hover:bg-muted/80 hover:text-foreground dark:border-white/10 dark:bg-zinc-900/60 dark:text-zinc-300 dark:hover:border-primary/40 dark:hover:bg-zinc-800/80 dark:hover:text-white"
              >
                <span className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  {section.announcement.title}
                </span>
                <span className="h-3.5 w-px bg-border dark:bg-white/10" />
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted transition-transform duration-300 group-hover:translate-x-0.5 group-hover:bg-primary group-hover:text-primary-foreground dark:bg-white/10 dark:group-hover:text-black">
                  <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            </div>
          </BlurFade>
        )}

        {/* Cinematic Main H1 Headline */}
        <BlurFade delay={0.08} inView>
          <h1 className="text-4xl font-extrabold tracking-tight text-balance sm:text-5xl md:text-6xl lg:text-7xl">
            {texts && texts.length > 0 ? (
              <span className="bg-gradient-to-b from-foreground via-foreground/95 to-muted-foreground bg-clip-text text-transparent dark:from-white dark:via-white/95 dark:to-zinc-400">
                {texts[0]}
                <Highlighter action="underline" color="#3B82F6">
                  <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400">
                    {highlightText}
                  </span>
                </Highlighter>
                {texts[1]}
              </span>
            ) : (
              <span className="bg-gradient-to-b from-foreground via-foreground/95 to-muted-foreground bg-clip-text text-transparent dark:from-white dark:via-white/95 dark:to-zinc-400">
                {section.title}
              </span>
            )}
          </h1>
        </BlurFade>

        {/* Description */}
        {section.description && (
          <BlurFade delay={0.16} inView>
            <motion.p
              className="text-muted-foreground mx-auto mt-6 max-w-2xl text-base leading-relaxed md:text-lg text-pretty"
              dangerouslySetInnerHTML={{ __html: section.description }}
            />
          </BlurFade>
        )}

        {/* CTA Buttons */}
        {section.buttons && section.buttons.length > 0 && (
          <BlurFade delay={0.24} inView>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
              {section.buttons.map((button, idx) => {
                const isPrimary = idx === 0 || button.variant === 'default';

                if (isPrimary) {
                  return (
                    <Link
                      key={idx}
                      href={button.url ?? '#generator'}
                      target={button.target ?? '_self'}
                    >
                      <ShimmerButton
                        shimmerColor="#ffffff"
                        shimmerSize="0.05em"
                        shimmerDuration="3s"
                        borderRadius="100px"
                        background="linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)"
                        className="px-7 py-3.5 text-base font-semibold shadow-xl shadow-blue-600/25 transition-transform duration-200 hover:scale-[1.02]"
                      >
                        {button.icon && (
                          <SmartIcon
                            name={button.icon as string}
                            className="mr-2 h-4 w-4"
                          />
                        )}
                        <span>{button.title}</span>
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </ShimmerButton>
                    </Link>
                  );
                }

                return (
                  <Button
                    key={idx}
                    asChild
                    size={button.size || 'lg'}
                    variant="outline"
                    className="rounded-full border-border bg-card/40 px-6 text-base font-medium text-foreground backdrop-blur-md transition-all duration-200 hover:border-foreground/30 hover:bg-muted/60 hover:text-foreground dark:border-white/15 dark:bg-zinc-900/40 dark:text-zinc-200 dark:hover:border-white/30 dark:hover:bg-zinc-800/60 dark:hover:text-white"
                  >
                    <Link href={button.url ?? ''} target={button.target ?? '_self'}>
                      {button.icon && (
                        <SmartIcon
                          name={button.icon as string}
                          className="mr-2 h-4 w-4"
                        />
                      )}
                      <span>{button.title}</span>
                    </Link>
                  </Button>
                );
              })}
            </div>
          </BlurFade>
        )}

        {/* Tip / Low friction disclaimer */}
        {section.tip && (
          <BlurFade delay={0.32} inView>
            <p
              className="text-muted-foreground/75 mx-auto mt-7 max-w-xl text-xs leading-relaxed"
              dangerouslySetInnerHTML={{ __html: section.tip }}
            />
          </BlurFade>
        )}
      </div>
    </section>
  );
}
