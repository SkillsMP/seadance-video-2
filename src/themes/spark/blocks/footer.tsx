import { Link } from '@/core/i18n/navigation';
import { Copyright } from '@/shared/blocks/common/copyright';
import { LocaleSelector } from '@/shared/blocks/common/locale-selector';
import { ThemeToggler } from '@/shared/blocks/common/theme-toggler';
import { cn } from '@/shared/lib/utils';
import type { Footer as FooterType } from '@/shared/types/blocks/landing';

import { Brand } from '../components/brand';
import styles from '../styles.module.css';

export function Footer({ footer }: { footer: FooterType; }) {
  return (
    <footer id={footer.id} className={cn('border-t py-12', footer.className)}>
      <div className={styles.container}>
        <div className="grid gap-10 md:grid-cols-[1.2fr_2fr]">
          <div>
            <Brand brand={footer.brand} />
            {footer.brand?.description && <p className={cn('mt-5 max-w-sm text-sm leading-relaxed text-muted-foreground', styles.richText)}
              dangerouslySetInnerHTML={{ __html: footer.brand.description }} />}
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {footer.nav?.items.map((group, index) => <div key={index}>
              <p className="mb-4 text-sm font-semibold">{group.url ? <Link href={group.url}
                target={group.target || '_self'} rel={group.target === '_blank' ? 'noopener noreferrer' : undefined}>{group.title}</Link> : group.title}</p>
              <ul className="space-y-3">
                {group.children?.map((item, childIndex) => item.url && <li key={childIndex}>
                  <Link href={item.url} target={item.target || '_self'}
                    rel={item.target === '_blank' ? 'noopener noreferrer' : undefined}
                    className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">{item.title}</Link>
                </li>)}
              </ul>
            </div>)}
          </div>
        </div>
        <div className="mt-12 flex flex-wrap items-center justify-between gap-6 border-t pt-6 text-xs text-muted-foreground">
          {footer.copyright ? <p dangerouslySetInnerHTML={{ __html: footer.copyright }} /> : footer.brand && <Copyright brand={footer.brand} />}
          <div className="flex flex-wrap items-center gap-4">
            {footer.agreement?.items.map((item, index) => item.url && <Link key={index} href={item.url}
              target={item.target || '_self'} rel={item.target === '_blank' ? 'noopener noreferrer' : undefined}
              className="underline underline-offset-4">{item.title}</Link>)}
            {footer.social?.items.map((item, index) => item.url && <a key={index} href={item.url}
              target={item.target || '_self'} rel={item.target === '_blank' ? 'noopener noreferrer' : undefined}>{item.title}</a>)}
            {footer.show_locale !== false && <LocaleSelector type="button" />}
            {footer.show_theme !== false && <ThemeToggler />}
          </div>
        </div>
      </div>
    </footer>
  );
}
