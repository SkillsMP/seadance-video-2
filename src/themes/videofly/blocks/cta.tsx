'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Check, Sparkles } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { SmartIcon } from '@/shared/blocks/common/smart-icon';
import { BlurFade } from '@/shared/components/magicui/blur-fade';
import { BorderBeam } from '@/shared/components/magicui/border-beam';
import { ShimmerButton } from '@/shared/components/magicui/shimmer-button';
import { cn } from '@/shared/lib/utils';
import { Section } from '@/shared/types/blocks/landing';

const defaultBenefits = [
  'Free trial with complimentary starter credits',
  'No credit card required to explore models',
  'Multi-model generation (Sora 2, Seedance 2.0, Wan 2.6)',
  'Commercial usage rights for generated video clips',
];

export function Cta({
  section,
  className,
}: {
  section: Section;
  className?: string;
}) {
  return (
    <section
      id={section.id}
      className={cn('relative py-20 md:py-28 overflow-hidden', section.className, className)}
    >
      {/* Background radial highlight */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 h-[30rem] w-[50rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="container mx-auto px-4">
        <div className="relative mx-auto max-w-5xl">
          <BlurFade inView>
            <div className="relative overflow-hidden rounded-3xl border border-border bg-card/80 p-8 shadow-2xl backdrop-blur-2xl sm:p-12 md:p-14 dark:border-white/10 dark:bg-zinc-950/80">
              {/* Animated Border Beam */}
              <BorderBeam
                size={380}
                duration={14}
                borderWidth={2}
                colorFrom="#3B82F6"
                colorTo="#A855F7"
              />

              <div className="grid gap-8 md:grid-cols-2 md:items-center">
                {/* Left: Copy & Actions */}
                <div className="space-y-6">
                  {/* Badge */}
                  <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-medium text-primary">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>{section.label || 'Ready to Create?'}</span>
                  </div>

                  {/* Title */}
                  <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                    <span className="bg-gradient-to-b from-foreground via-foreground/95 to-muted-foreground bg-clip-text text-transparent dark:from-white dark:via-white/95 dark:to-zinc-400">
                      {section.title}
                    </span>
                  </h2>

                  {/* Description */}
                  {section.description && (
                    <p
                      className="text-muted-foreground text-base leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: section.description }}
                    />
                  )}

                  {/* Benefit Checklist */}
                  <ul className="space-y-2.5 pt-1">
                    {defaultBenefits.map((benefit, idx) => (
                      <li
                        key={idx}
                        className="flex items-center gap-2.5 text-xs text-muted-foreground sm:text-sm dark:text-zinc-300"
                      >
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                          <Check className="h-2.5 w-2.5" />
                        </span>
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Action Button */}
                  <div className="pt-2">
                    {section.buttons && section.buttons.length > 0 ? (
                      section.buttons.map((btn, idx) => (
                        <Link
                          key={idx}
                          href={btn.url || '#generator'}
                          target={btn.target || '_self'}
                        >
                          <ShimmerButton
                            shimmerColor="#ffffff"
                            shimmerSize="0.05em"
                            shimmerDuration="3s"
                            borderRadius="100px"
                            background="linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)"
                            className="px-8 py-3.5 text-base font-semibold shadow-xl shadow-blue-500/25"
                          >
                            {btn.icon && (
                              <SmartIcon
                                name={btn.icon as string}
                                className="mr-2 h-4 w-4"
                              />
                            )}
                            <span>{btn.title || 'Start Generating Free'}</span>
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </ShimmerButton>
                        </Link>
                      ))
                    ) : (
                      <Link href="#generator">
                        <ShimmerButton
                          shimmerColor="#ffffff"
                          shimmerSize="0.05em"
                          shimmerDuration="3s"
                          borderRadius="100px"
                          background="linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)"
                          className="px-8 py-3.5 text-base font-semibold shadow-xl shadow-blue-500/25"
                        >
                          <span>Start Generating Now</span>
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </ShimmerButton>
                      </Link>
                    )}
                  </div>
                </div>

                {/* Right: Simulated Video Render Card */}
                <div className="relative">
                  <div className="relative overflow-hidden rounded-2xl border border-border bg-muted/60 p-4 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/60">
                    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-zinc-950">
                      <img
                        src="/imgs/seadance/showcase_1.jpg"
                        alt="AI Video Generation Preview"
                        className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3">
                        <p className="text-xs font-medium text-white">
                          En Plein Air at Sunset
                        </p>
                        <p className="text-[11px] text-zinc-400">
                          Seedance 2.0 Standard • 1080p
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar Display */}
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground dark:text-zinc-400">Rendering status</span>
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                          Complete • 100%
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted dark:bg-zinc-800">
                        <div className="h-full w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
                      </div>
                      <p className="text-[10px] text-muted-foreground text-center dark:text-zinc-500">
                        Average render time: 2-3 minutes
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </BlurFade>
        </div>
      </div>
    </section>
  );
}
