import { ArrowUpRight } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';
import type { Button as Action } from '@/shared/types/blocks/common';

import styles from '../styles.module.css';

export function Actions({ buttons, className }: { buttons?: Action[]; className?: string; }) {
  if (!buttons?.length) return null;
  return (
    <div className={cn('flex flex-wrap items-center justify-center gap-4', className)}>
      {buttons.map((button, index) => button.url && (
        <Button key={`${button.url}-${index}`} asChild
          size={button.size || 'lg'} variant={button.variant || 'default'}
          className={cn('min-h-11 rounded-full px-6',
            (!button.variant || button.variant === 'default') && styles.ctaButton)}>
          <Link href={button.url} target={button.target || '_self'}
            rel={button.target === '_blank' ? 'noopener noreferrer' : undefined}>
            {button.title}<ArrowUpRight aria-hidden="true" className="size-4" />
          </Link>
        </Button>
      ))}
    </div>
  );
}
