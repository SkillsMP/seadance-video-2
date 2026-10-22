import Image from 'next/image';
import { Sparkles } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import type { Brand as BrandType } from '@/shared/types/blocks/common';

export function Brand({ brand }: { brand?: BrandType; }) {
  if (!brand) return null;
  return (
    <Link href={brand.url || '/'} target={brand.target || '_self'}
      rel={brand.target === '_blank' ? 'noopener noreferrer' : undefined}
      className="flex min-w-0 items-center gap-2.5 rounded-sm focus-visible:outline-2 focus-visible:outline-ring">
      {brand.logo?.src ? (
        <Image src={brand.logo.src} alt={brand.logo.alt || ''} width={32} height={32}
          className="size-8 shrink-0 rounded-lg object-contain" />
      ) : <Sparkles aria-hidden="true" className="size-7 text-brand" />}
      <span className="truncate font-serif text-2xl leading-none">{brand.title}</span>
    </Link>
  );
}
