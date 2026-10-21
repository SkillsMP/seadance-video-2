'use client';

import { HelpCircle } from 'lucide-react';

import { BlurFade } from '@/shared/components/magicui/blur-fade';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/shared/components/ui/accordion';
import { cn } from '@/shared/lib/utils';
import { Section } from '@/shared/types/blocks/landing';

export function Faq({
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
      {/* Background soft ambient gradient */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      </div>

      <div className="container mx-auto max-w-3xl px-4 md:px-6">
        {/* Section Header */}
        <BlurFade inView>
          <div className="mb-14 text-center">
            {section.label && (
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-medium text-primary">
                <HelpCircle className="h-3.5 w-3.5" />
                <span>{section.label}</span>
              </div>
            )}
            <h2 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl md:text-5xl">
              {section.title}
            </h2>
            {section.description && (
              <p className="text-muted-foreground mx-auto mt-4 max-w-xl text-base md:text-lg text-pretty">
                {section.description}
              </p>
            )}
          </div>
        </BlurFade>

        {/* FAQ Accordion List with Numbered Badges */}
        <BlurFade delay={0.12} inView>
          <Accordion type="single" collapsible className="space-y-3.5">
            {items.map((item, index) => {
              const question = item.question || item.title || '';
              const answer = item.answer || item.description || '';
              const numberStr = String(index + 1).padStart(2, '0');

              return (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="rounded-2xl border border-border bg-card/60 px-6 backdrop-blur-xl transition-all duration-200 hover:border-foreground/20 data-[state=open]:border-primary/40 data-[state=open]:bg-muted/80 data-[state=open]:shadow-xl dark:border-white/10 dark:bg-zinc-950/60 dark:hover:border-white/20 dark:data-[state=open]:border-primary/40 dark:data-[state=open]:bg-zinc-900/80"
                >
                  <AccordionTrigger className="cursor-pointer py-5 text-left text-base font-medium hover:no-underline text-foreground dark:text-white">
                    <span className="flex items-center gap-3.5">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-xs font-semibold text-primary">
                        {numberStr}
                      </span>
                      <span>{question}</span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pl-10 text-sm leading-relaxed text-muted-foreground dark:text-zinc-300">
                    <div
                      className="rich-text"
                      dangerouslySetInnerHTML={{ __html: answer }}
                    />
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </BlurFade>

        {/* Bottom Tip Note */}
        {section.tip && (
          <BlurFade delay={0.24} inView>
            <div className="mt-10 rounded-2xl border border-primary/20 bg-primary/10 p-5 text-center text-xs text-muted-foreground backdrop-blur-md dark:text-zinc-300">
              <p dangerouslySetInnerHTML={{ __html: section.tip }} />
            </div>
          </BlurFade>
        )}
      </div>
    </section>
  );
}
