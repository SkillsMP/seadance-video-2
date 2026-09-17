'use client';

import { useEffect } from 'react';
import { useLocale } from 'next-intl';

import { track } from '@/shared/lib/analytics/track';

export function LandingViewEvent() {
  const locale = useLocale();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    track(
      'landing_view',
      {
        locale,
        surface: 'landing',
        utm_source: params.get('utm_source') || undefined,
        utm_medium: params.get('utm_medium') || undefined,
        utm_campaign: params.get('utm_campaign') || undefined,
      },
      { oncePerSession: true }
    );
  }, [locale]);

  return null;
}
