'use client';

import { Highlight } from './Highlight';
import { Scroller } from './Scroller';
import { SearchBox } from './SearchBox';
import { SiteLink } from './SiteLink';
import type { SnapshotPageProps } from './types';

/** about:search — results kept on the entry, so going back to them shows the same list. */
export function SearchPage({ tab, entry, snap }: SnapshotPageProps<'search'>) {
  const { q, terms, hits } = snap.result;
  return (
    <Scroller tab={tab} entry={entry}>
      <SearchBox tab={tab} initial={q} placeholder="Search Thinker" />
      <p className="muted">
        {hits.length === 0
          ? `No page on this web mentions “${q}”.`
          : `${hits.length} ${hits.length === 1 ? 'page mentions' : 'pages mention'} “${q}”, best match first.`}
      </p>
      <ol className="results">
        {hits.map((h) => (
          <li key={h.address}>
            <SiteLink tab={tab} address={h.address} via="search">
              <Highlight text={h.title} terms={terms} />
            </SiteLink>
            <div className="addr">
              {h.address} · by {h.authorName}
            </div>
            <p className="snippet">
              <Highlight text={h.snippet} terms={terms} />
            </p>
          </li>
        ))}
      </ol>
    </Scroller>
  );
}
