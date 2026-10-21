'use client';

import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';

import { SmartIcon } from '@/shared/blocks/common/smart-icon';
import { BlurFade } from '@/shared/components/magicui/blur-fade';
import { MagicCard } from '@/shared/components/magicui/magic-card';
import { cn } from '@/shared/lib/utils';
import { Section } from '@/shared/types/blocks/landing';

const stepGradients = [
  { from: '#3B82F6', to: '#60A5FA' },
  { from: '#8B5CF6', to: '#A78BFA' },
  { from: '#EC4899', to: '#F472B6' },
  { from: '#F59E0B', to: '#FBBF24' },
];

export function FeaturesStep({
  section,
  className,
}: {
  section: Section;
  className?: string;
}) {
  const items = section.items ?? [];

  return (
    <section
      id={section.id}
      className={cn('relative py-20 md:py-28 overflow-hidden', section.className, className)}
    >
      {/* Background ambient gradient */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      </div>

      <div className="container mx-auto px-4">
        {/* Section Header */}
        <BlurFade inView>
          <div className="mx-auto mb-16 max-w-3xl text-center">
            {section.label && (
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-medium text-primary">
                <Clock className="h-3.5 w-3.5" />
                <span>{section.label}</span>
              </div>
            )}
            <h2 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl md:text-5xl">
              {section.title}
            </h2>
            {section.description && (
              <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-base md:text-lg text-pretty">
                {section.description}
              </p>
            )}
          </div>
        </BlurFade>

        {/* Steps Grid */}
        <div
          className={cn(
            'grid grid-cols-1 gap-6 sm:grid-cols-2',
            items.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4'
          )}
        >
          {items.map((item, index) => {
            const stepNumber = String(index + 1).padStart(2, '0');
            const gradient = stepGradients[index % stepGradients.length];

            return (
              <BlurFade key={index} delay={index * 0.1} inView>
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  <MagicCard
                    className="h-full rounded-2xl border border-border bg-card/70 p-6 shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-foreground/20 dark:border-white/10 dark:bg-zinc-950/70 dark:hover:border-white/20"
                    gradientFrom={gradient.from}
                    gradientTo={gradient.to}
                    gradientSize={200}
                    gradientOpacity={0.12}
                  >
                    <div className="flex h-full flex-col min-h-[220px]">
                      {/* Step Number + Icon Header */}
                      <div className="mb-5 flex items-center gap-3">
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white shadow-md"
                          style={{
                            background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`,
                          }}
                        >
                          {stepNumber}
                        </div>
                        {item.icon && (
                          <div
                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-muted/50 dark:border-white/10 dark:bg-white/5"
                            style={{ color: gradient.from }}
                          >
                            <SmartIcon name={item.icon as string} size={20} />
                          </div>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="mb-2 text-lg font-semibold text-foreground dark:text-white">
                        {item.title}
                      </h3>

                      {/* Description */}
                      <p className="text-muted-foreground text-sm leading-relaxed flex-1">
                        {item.description}
                      </p>
                    </div>
                  </MagicCard>
                </motion.div>
              </BlurFade>
            );
          })}
        </div>
      </div>
    </section>
  );
}
