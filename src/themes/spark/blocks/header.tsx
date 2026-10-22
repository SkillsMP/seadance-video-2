'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';
import { useLocale } from 'next-intl';

import { Link } from '@/core/i18n/navigation';
import { LocaleSelector } from '@/shared/blocks/common/locale-selector';
import { ThemeToggler } from '@/shared/blocks/common/theme-toggler';
import { SignUser } from '@/shared/blocks/sign/sign-user';
import { Button } from '@/shared/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/shared/components/ui/sheet';
import { cn } from '@/shared/lib/utils';
import type { Header as HeaderType } from '@/shared/types/blocks/landing';

import { Brand } from '../components/brand';
import styles from '../styles.module.css';

export function Header({ header }: { header: HeaderType; }) {
  const [open, setOpen] = useState(false);
  const locale = useLocale();
  const menuLabel = locale === 'zh' ? '导航菜单' : 'Navigation menu';
  // Flatten one group level for the compact header; preserve every destination.
  const items = header.nav?.items.flatMap((item) => item.children?.length ? [...(item.url ? [item] : []), ...item.children] : [item]) || [];
  return (
    <header id={header.id} className={cn('sticky top-0 z-40 border-b bg-background/90 backdrop-blur-md', header.className)}>
      <div className={cn(styles.container, 'flex h-20 items-center justify-between gap-3')}>
        <Brand brand={header.brand} />
        <nav aria-label={menuLabel} className="hidden items-center gap-6 xl:flex">
          {items.map((item, index) => item.url && <Link key={`${item.url}-${index}`} href={item.url}
            target={item.target || '_self'} rel={item.target === '_blank' ? 'noopener noreferrer' : undefined}
            className="rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring">
            {item.title}
          </Link>)}
        </nav>
        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden items-center gap-3 sm:flex">
            {header.show_locale && <LocaleSelector />}
            {header.show_theme && <ThemeToggler />}
          </div>
          {header.show_sign && <SignUser userNav={header.user_nav} signButtonSize="sm" />}
          {header.buttons?.map((button, index) => button.url && <Button key={index} asChild
            size={button.size || 'default'} variant={button.variant || 'default'}
            className={cn('hidden sm:inline-flex', (!button.variant || button.variant === 'default') && styles.ctaButton)}>
            <Link href={button.url} target={button.target || '_self'}
              rel={button.target === '_blank' ? 'noopener noreferrer' : undefined}>{button.title}</Link>
          </Button>)}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={menuLabel} className="xl:hidden"><Menu aria-hidden="true" /></Button>
            </SheetTrigger>
            <SheetContent className="gap-6">
              <SheetHeader>
                <SheetTitle>{menuLabel}</SheetTitle>
                <SheetDescription>{header.brand?.title}</SheetDescription>
              </SheetHeader>
              <nav aria-label={menuLabel} className="grid gap-1 px-6">
                {items.map((item, index) => item.url && <Link key={`${item.url}-${index}`} href={item.url}
                  onClick={() => setOpen(false)} target={item.target || '_self'}
                  rel={item.target === '_blank' ? 'noopener noreferrer' : undefined}
                  className="rounded-lg px-3 py-3 text-sm hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-ring">
                  {item.title}
                </Link>)}
                {header.buttons?.map((button, index) => button.url && <Link key={index} href={button.url}
                  onClick={() => setOpen(false)} target={button.target || '_self'}
                  rel={button.target === '_blank' ? 'noopener noreferrer' : undefined}
                  className="px-3 py-3 text-sm font-medium">{button.title}</Link>)}
              </nav>
              <div className="flex items-center gap-5 px-9">
                {header.show_locale && <LocaleSelector type="button" />}
                {header.show_theme && <ThemeToggler />}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
