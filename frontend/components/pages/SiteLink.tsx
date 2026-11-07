'use client';

import type { ReactNode } from 'react';
import type { Via } from '@thinker/shared';
import type { Tab } from '@/hooks/useTab';

/**
 * A link from one of our own pages to a site. It has a real href, so it can
 * be copied, but clicking it navigates inside the tab and records how.
 */
export function SiteLink({
  tab,
  address,
  via,
  children,
}: {
  tab: Tab;
  address: string;
  via: Via;
  children: ReactNode;
}) {
  return (
    <a
      href={`/?go=${encodeURIComponent(address)}`}
      className={tab.visited.has(address) ? 'visited' : undefined}
      onClick={(e) => {
        e.preventDefault();
        tab.navigate({ kind: 'site', address }, via);
      }}
    >
      {children}
    </a>
  );
}
