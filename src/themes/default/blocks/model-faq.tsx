import { cn } from '@/shared/lib/utils';
import type { FAQ } from '@/shared/types/blocks/landing';

/** Native disclosure renders every answer in HTML, without changing the shared FAQ. */
export function ModelFaq({ section }: { section: FAQ }) {
  return (
    <section
      id={section.id}
      className={cn('py-16 md:py-20', section.className)}
    >
      <div className="container max-w-3xl">
        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
          {section.title}
        </h2>
        <p className="text-muted-foreground mt-4 leading-relaxed">
          {section.description}
        </p>
        <div className="mt-8 divide-y border-y">
          {section.items?.map((item) => (
            <details key={item.question} className="py-5">
              <summary className="focus-visible:outline-ring cursor-pointer rounded-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-4">
                {item.question}
              </summary>
              <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
