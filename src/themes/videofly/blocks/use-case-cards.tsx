'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

import { SmartIcon } from '@/shared/blocks/common/smart-icon';
import { BlurFade } from '@/shared/components/magicui/blur-fade';
import { MagicCard } from '@/shared/components/magicui/magic-card';
import { cn } from '@/shared/lib/utils';
import type { Section, SectionItem } from '@/shared/types/blocks/landing';

const gradientList = [
  { from: '#3B82F6', to: '#8B5CF6' },
  { from: '#8B5CF6', to: '#EC4899' },
  { from: '#06B6D4', to: '#3B82F6' },
  { from: '#F59E0B', to: '#EF4444' },
];

type UseCaseItem = SectionItem & {
  tags?: string[];
};

export function UseCaseCards({
  section,
  className,
}: {
  section: Section;
  className?: string;
}) {
  const items = (section.items ?? []) as UseCaseItem[];

  return (
    <section
      id={section.id || section.name}
      className={cn(
        'relative overflow-hidden py-16 md:py-20',
        section.className,
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      </div>

      <div className="container mx-auto px-4">
        <BlurFade inView>
          <div className="mx-auto mb-10 max-w-3xl text-center md:mb-12">
            {section.label && (
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-medium text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                <span>{section.label}</span>
              </div>
            )}
            <h2 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
              {section.title}
            </h2>
            {section.description && (
              <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-base md:text-lg text-pretty">
                {section.description}
              </p>
            )}
          </div>
        </BlurFade>

        <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => {
            const gradient = gradientList[index % gradientList.length];

            return (
              <BlurFade key={item.title || index} delay={index * 0.08} inView>
                <motion.div
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  <MagicCard
                    className="h-full rounded-2xl border border-border bg-card/80 p-5 shadow-sm shadow-black/[0.04] backdrop-blur-xl transition-shadow duration-300 hover:border-primary/25 hover:shadow-md hover:shadow-black/[0.06] md:p-6 dark:border-white/10 dark:bg-zinc-950/70 dark:shadow-lg dark:shadow-black/30 dark:hover:border-white/20 dark:hover:shadow-xl"
                    gradientFrom={gradient.from}
                    gradientTo={gradient.to}
                    gradientColor={gradient.from}
                    gradientSize={220}
                    gradientOpacity={0.14}
                  >
                    <div className="flex h-full min-h-[180px] flex-col lg:min-h-[192px]">
                      {typeof item.icon === 'string' && (
                        <div
                          className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg shadow-sm"
                          style={{
                            background: `linear-gradient(135deg, ${gradient.from}25, ${gradient.to}25)`,
                            border: `1px solid ${gradient.from}40`,
                          }}
                        >
                          <SmartIcon
                            name={item.icon}
                            size={20}
                            style={{ color: gradient.from }}
                          />
                        </div>
                      )}

                      <h3 className="mb-2 text-base font-semibold text-foreground md:text-lg dark:text-white">
                        {item.title}
                      </h3>

                      {item.description && (
                        <p
                          className="text-muted-foreground flex-1 text-sm leading-relaxed md:text-[0.9375rem]"
                          dangerouslySetInnerHTML={{ __html: item.description }}
                        />
                      )}

                      {item.tags && item.tags.length > 0 && (
                        <ul className="mt-4 flex flex-wrap gap-1.5 border-t border-border/60 pt-4 dark:border-white/10">
                          {item.tags.map((tag) => (
                            <li
                              key={tag}
                              className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary md:text-xs"
                            >
                              {tag}
                            </li>
                          ))}
                        </ul>
                      )}
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
