'use client';

import { useEffect, useState } from 'react';
import type { SiteSummary } from '@thinker/shared';
import { api } from '@/lib/api';
import { Scroller } from './Scroller';
import { SearchBox } from './SearchBox';
import { SiteLink } from './SiteLink';
import type { PageProps } from './types';

/** about:home — the directory of every site, always live. */
export function HomePage({ tab, entry }: PageProps) {
  const [sites, setSites] = useState<SiteSummary[] | null>(null);

  useEffect(() => {
    api.sites().then(setSites, () => setSites([]));
  }, []);

  const person = tab.people.find((p) => p.id === tab.personId);
  const blurb = person && person.blurb.charAt(0).toLowerCase() + person.blurb.slice(1);

  return (
    <Scroller tab={tab} entry={entry} ready={sites !== null}>
      <h1 className="hello">Thinker</h1>
      <p className="lede">
        {sites ? `${sites.length} sites, written by hand by strangers.` : 'Loading…'} You&apos;re browsing as{' '}
        <strong>{person?.name ?? tab.personId}</strong>
        {blurb ? <>: {blurb}</> : '.'}
      </p>
      <SearchBox tab={tab} placeholder="Search every page by what's written in it" />
      <ul className="directory">
        {sites?.map((s) => (
          <li key={s.address}>
            <SiteLink tab={tab} address={s.address} via="typed">
              <span className="t">{s.title}</span>
              <span className="a">{s.address}</span>
            </SiteLink>
            <span className="by">by {s.authorName}</span>
          </li>
        ))}
      </ul>
    </Scroller>
  );
}
