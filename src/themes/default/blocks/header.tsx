'use client';

import { useEffect, useRef, useState } from 'react';
import { Menu, X } from 'lucide-react';

import { Link, usePathname } from '@/core/i18n/navigation';
import {
  BrandLogo,
  LocaleSelector,
  SignUser,
  SmartIcon,
  ThemeToggler,
} from '@/shared/blocks/common';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/shared/components/ui/accordion';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger as RawNavigationMenuTrigger,
} from '@/shared/components/ui/navigation-menu';
import { useMedia } from '@/shared/hooks/use-media';
import { cn } from '@/shared/lib/utils';
import { NavItem } from '@/shared/types/blocks/common';
import { Header as HeaderType } from '@/shared/types/blocks/landing';

// For Next.js hydration mismatch warning, conditionally render NavigationMenuTrigger only after mount to avoid inconsistency between server/client render
function NavigationMenuTrigger(
  props: React.ComponentProps<typeof RawNavigationMenuTrigger>
) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  // Only render after client has mounted, to avoid SSR/client render id mismatch
  if (!mounted) return null;
  return <RawNavigationMenuTrigger {...props} />;
}

export function Header({ header }: { header: HeaderType }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const isScrolledRef = useRef(false);
  const scrollRafRef = useRef<number | null>(null);
  const isLarge = useMedia('(min-width: 64rem)');
  const pathname = usePathname();

  useEffect(() => {
    // Listen to scroll event to enable header styles on scroll
    const handleScroll = () => {
      if (scrollRafRef.current != null) return;
      scrollRafRef.current = window.requestAnimationFrame(() => {
        scrollRafRef.current = null;
        const next = window.scrollY > 30;
        if (next === isScrolledRef.current) return;
        isScrolledRef.current = next;
        setIsScrolled(next);
      });
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollRafRef.current != null) {
        window.cancelAnimationFrame(scrollRafRef.current);
        scrollRafRef.current = null;
      }
    };
  }, []);

  // Navigation menu for large screens
  const NavMenu = () => {
    return (
      <NavigationMenu
        viewport={false}
        className="**:data-[slot=navigation-menu-content]:top-10 max-lg:hidden"
      >
        <NavigationMenuList className="gap-0.5 xl:gap-1.5">
          {header.nav?.items?.map((item, idx) => {
            if (!item.children || item.children.length === 0) {
              return (
                <NavigationMenuLink key={idx} asChild>
                  <Link
                    href={item.url || ''}
                    target={item.target || '_self'}
                    className={cn(
                      'flex flex-row items-center gap-1.5 px-2.5 xl:px-3 py-1.5 text-xs xl:text-sm font-medium rounded-md transition-colors hover:bg-muted/60',
                      item.is_active || pathname.endsWith(item.url as string)
                        ? 'bg-muted text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {item.icon && (
                      <SmartIcon name={item.icon as string} className="h-3.5 w-3.5" />
                    )}
                    {item.title}
                  </Link>
                </NavigationMenuLink>
              );
            }

            return (
              <NavigationMenuItem key={idx}>
                <NavigationMenuTrigger className="flex flex-row items-center gap-1.5 px-2.5 xl:px-3 py-1.5 text-xs xl:text-sm font-medium text-muted-foreground hover:text-foreground data-[state=open]:text-foreground data-[state=open]:bg-muted/60">
                  {item.icon && (
                    <SmartIcon name={item.icon as string} className="h-3.5 w-3.5" />
                  )}
                  {item.title}
                </NavigationMenuTrigger>
                <NavigationMenuContent className="min-w-2xs origin-top p-1">
                  <div className="border-foreground/5 bg-card ring-foreground/5 rounded-[calc(var(--radius)-2px)] border border-transparent p-2 shadow-lg ring-1">
                    <ul className="space-y-1">
                      {item.children?.map((subItem: NavItem, index: number) => (
                        <ListItem
                          key={index}
                          href={subItem.url || ''}
                          target={subItem.target || '_self'}
                          title={subItem.title || ''}
                          description={subItem.description || ''}
                        >
                          {subItem.icon && (
                            <SmartIcon name={subItem.icon as string} className="h-4 w-4" />
                          )}
                        </ListItem>
                      ))}
                    </ul>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            );
          })}
        </NavigationMenuList>
      </NavigationMenu>
    );
  };

  // Mobile menu using Accordion, shown on small screens
  const MobileMenu = ({ closeMenu }: { closeMenu: () => void }) => {
    return (
      <nav
        role="navigation"
        className="w-full px-2"
      >
        <Accordion
          type="single"
          collapsible
          className="space-y-1 **:hover:no-underline"
        >
          {header.nav?.items?.map((item, idx) => {
            return (
              <AccordionItem
                key={idx}
                value={item.title || ''}
                className="border-b-0"
              >
                {item.children && item.children.length > 0 ? (
                  <>
                    <AccordionTrigger className="flex items-center justify-between px-3 py-2.5 text-base font-medium rounded-lg hover:bg-muted/50">
                      <div className="flex items-center gap-2">
                        {item.icon && <SmartIcon name={item.icon as string} className="h-4 w-4" />}
                        <span>{item.title}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-1 pb-3 pl-4">
                      <ul className="space-y-1 border-l-2 border-border/60 pl-3">
                        {item.children?.map((subItem: NavItem, iidx) => (
                          <li key={iidx}>
                            <Link
                              href={subItem.url || ''}
                              onClick={closeMenu}
                              className="flex flex-col gap-0.5 py-1.5 px-2 rounded-md hover:bg-muted/50"
                            >
                              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                {subItem.icon && (
                                  <SmartIcon name={subItem.icon as string} className="h-3.5 w-3.5 text-primary" />
                                )}
                                <span>{subItem.title}</span>
                              </div>
                              {subItem.description && (
                                <span className="text-xs text-muted-foreground line-clamp-1">
                                  {subItem.description}
                                </span>
                              )}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </>
                ) : (
                  <Link
                    href={item.url || ''}
                    onClick={closeMenu}
                    className="flex items-center gap-2 px-3 py-2.5 text-base font-medium rounded-lg hover:bg-muted/50"
                  >
                    {item.icon && <SmartIcon name={item.icon as string} className="h-4 w-4" />}
                    <span>{item.title}</span>
                  </Link>
                )}
              </AccordionItem>
            );
          })}
        </Accordion>
      </nav>
    );
  };

  // List item for submenus in NavigationMenu
  function ListItem({
    title,
    description,
    children,
    href,
    target,
    ...props
  }: React.ComponentPropsWithoutRef<'li'> & {
    href: string;
    title: string;
    description?: string;
    target?: string;
  }) {
    return (
      <li {...props}>
        <NavigationMenuLink asChild>
          <Link
            href={href}
            target={target || '_self'}
            className="grid grid-cols-[auto_1fr] items-center gap-3 rounded-md p-2 transition-colors hover:bg-muted/60"
          >
            <div className="bg-background ring-foreground/10 flex size-8 items-center justify-center rounded border border-transparent shadow-xs ring-1 text-primary">
              {children}
            </div>
            <div className="space-y-0.5">
              <div className="text-foreground text-xs font-semibold">{title}</div>
              {description && (
                <p className="text-muted-foreground line-clamp-1 text-[11px]">
                  {description}
                </p>
              )}
            </div>
          </Link>
        </NavigationMenuLink>
      </li>
    );
  }

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        isScrolled
          ? 'border-b border-border/40 bg-background/80 shadow-xs backdrop-blur-md'
          : 'border-b border-transparent bg-background/50 backdrop-blur-xs'
      )}
    >
      <div className="container">
        <div className="flex h-14 lg:h-18 items-center justify-between gap-3 lg:gap-6 xl:gap-8">
          {/* Left section: Logo + Desktop Navigation */}
          <div className="flex items-center gap-4 xl:gap-8 min-w-0">
            {header.brand && <BrandLogo brand={header.brand} />}
            {isLarge && <NavMenu />}
          </div>

          {/* Right section: Action buttons, Theme, Sign */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {header.buttons &&
              header.buttons.map((button, idx) => (
                <Link
                  key={idx}
                  href={button.url || ''}
                  target={button.target || '_self'}
                  className={cn(
                    'focus-visible:ring-ring hidden sm:inline-flex items-center justify-center gap-1.5 rounded-md text-xs xl:text-sm font-medium whitespace-nowrap transition-colors focus-visible:ring-1 focus-visible:outline-none',
                    'h-8 px-3',
                    button.variant === 'outline'
                      ? 'bg-background border border-border/80 hover:bg-muted/60 text-foreground shadow-xs'
                      : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm'
                  )}
                >
                  {button.icon && (
                    <SmartIcon
                      name={button.icon as string}
                      className="size-3.5"
                    />
                  )}
                  <span>{button.title}</span>
                </Link>
              ))}

            {header.show_theme ? <ThemeToggler /> : null}
            {header.show_locale ? <LocaleSelector /> : null}
            {header.show_sign ? (
              <SignUser userNav={header.user_nav} />
            ) : null}

            {/* Mobile Hamburger toggle button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? 'Close Menu' : 'Open Menu'}
              className="relative z-20 block cursor-pointer p-1.5 rounded-md text-muted-foreground hover:text-foreground lg:hidden"
            >
              {isMobileMenuOpen ? (
                <X className="size-5" />
              ) : (
                <Menu className="size-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu view */}
        {!isLarge && isMobileMenuOpen && (
          <div className="border-t border-border/40 py-3 max-h-[calc(100vh-4rem)] overflow-y-auto bg-background/95 backdrop-blur-md">
            <MobileMenu closeMenu={() => setIsMobileMenuOpen(false)} />
          </div>
        )}
      </div>
    </header>
  );
}
