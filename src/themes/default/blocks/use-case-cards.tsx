'use client';

import { Features } from './features';

/** Fallback when JSON uses `use-case-cards` but active theme is `default`. */
export function UseCaseCards(props: Parameters<typeof Features>[0]) {
  return <Features {...props} />;
}
