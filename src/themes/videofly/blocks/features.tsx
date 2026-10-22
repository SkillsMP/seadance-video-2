'use client';

import { motion } from 'framer-motion';
import { Layers } from 'lucide-react';

import { SmartIcon } from '@/shared/blocks/common/smart-icon';
import { BlurFade } from '@/shared/components/magicui/blur-fade';
import { MagicCard } from '@/shared/components/magicui/magic-card';
import { cn } from '@/shared/lib/utils';
import { Section } from '@/shared/types/blocks/landing';

const gradientList = [
  { from: '#3B82F6', to: '#8B5CF6' },
  { from: '#8B5CF6', to: '#EC4899' },
  { from: '#06B6D4', to: '#3B82F6' },
  { from: '#F59E0B', to: '#EF4444' },
  { from: '#10B981', to: '#06B6D4' },
  { from: '#6366F1', to: '#A855F7' },
];

export function Features({
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
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      </div>

      <div className="container mx-auto px-4">
        {/* Section Header */}
        <BlurFade inView>
          <div className="mx-auto mb-16 max-w-3xl text-center">
            {section.label && (
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-medium text-primary">
                <Layers className="h-3.5 w-3.5" />
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

        {/* Bento Grid */}
        <div
          className={cn(
            'grid grid-cols-1 gap-6 sm:grid-cols-2',
            items.length >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'
          )}
        >
          {items.map((item, index) => {
            const gradient = gradientList[index % gradientList.length];

            return (
              <BlurFade key={index} delay={index * 0.08} inView>
                <motion.div
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  <MagicCard
                    className="h-full rounded-2xl border border-border bg-card/80 p-6 shadow-sm shadow-black/[0.04] backdrop-blur-xl transition-shadow duration-300 hover:border-primary/25 hover:shadow-md hover:shadow-black/[0.06] dark:border-white/10 dark:bg-zinc-950/70 dark:shadow-lg dark:shadow-black/30 dark:hover:border-white/20 dark:hover:shadow-xl"
                    gradientFrom={gradient.from}
                    gradientTo={gradient.to}
                    gradientColor={gradient.from}
                    gradientSize={240}
                    gradientOpacity={0.14}
                  >
                    <div className="flex h-full flex-col min-h-[220px]">
                      {/* Icon */}
                      <div className="mb-5 flex items-center justify-between">
                        <div
                          className="flex h-12 w-12 items-center justify-center rounded-xl shadow-md transition-transform duration-300 group-hover:scale-110"
                          style={{
                            background: `linear-gradient(135deg, ${gradient.from}25, ${gradient.to}25)`,
                            border: `1px solid ${gradient.from}40`,
                          }}
                        >
                          {item.icon ? (
                            <SmartIcon
                              name={item.icon as string}
                              size={22}
                              style={{ color: gradient.from }}
                            />
                          ) : (
                            <Layers
                              className="h-5 w-5"
                              style={{ color: gradient.from }}
                            />
                          )}
                        </div>
                        {item.badge && (
                          <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
                            {item.badge}
                          </span>
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
