'use client';

import { HistoryPage } from './HistoryPage';
import { HomePage } from './HomePage';
import { NowherePage } from './NowherePage';
import { PublishPage } from './PublishPage';
import { SearchPage } from './SearchPage';
import { SitePage } from './SitePage';
import type { PageProps } from './types';

/** Picks the page for whatever the current entry holds. */
export function Page({ tab, entry }: PageProps) {
  const snap = entry.snapshot;
  switch (snap.kind) {
    case 'site':
      return <SitePage tab={tab} entry={entry} snap={snap} />;
    case 'nowhere':
      return <NowherePage tab={tab} entry={entry} snap={snap} />;
    case 'home':
      return <HomePage tab={tab} entry={entry} />;
    case 'search':
      return <SearchPage tab={tab} entry={entry} snap={snap} />;
    case 'history':
      return <HistoryPage tab={tab} entry={entry} snap={snap} />;
    case 'publish':
      return <PublishPage tab={tab} entry={entry} snap={snap} />;
  }
}
