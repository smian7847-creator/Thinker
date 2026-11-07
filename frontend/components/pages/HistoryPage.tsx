'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Via, Visit } from '@thinker/shared';
import { api } from '@/lib/api';
import { dayOf, timeOf } from '@/lib/format';
import { Scroller } from './Scroller';
import { SiteLink } from './SiteLink';
import type { SnapshotPageProps } from './types';

const VIA_LABEL: Record<Via, string> = {
  typed: 'typed the address',
  link: 'followed a link',
  back: 'went back',
  forward: 'went forward',
  history: 'from history',
  search: 'from a search',
  reload: 'reloaded',
  publish: 'just published',
  start: 'opened',
};

/** Visits grouped by the day they happened, keeping newest-first order. */
function groupByDay(visits: Visit[]): { day: string; visits: Visit[] }[] {
  const days: { day: string; visits: Visit[] }[] = [];
  for (const v of visits) {
    const day = dayOf(v.at);
    if (days[days.length - 1]?.day !== day) days.push({ day, visits: [] });
    days[days.length - 1].visits.push(v);
  }
  return days;
}

/** about:history — everywhere this entry's person has been, loading older pages as you scroll. */
export function HistoryPage({ tab, entry, snap }: SnapshotPageProps<'history'>) {
  const [loading, setLoading] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);
  const person = tab.people.find((p) => p.id === entry.personId);
  const { patchEntry } = tab;

  const loadMore = useCallback(async () => {
    if (!snap.next || loading) return;
    setLoading(true);
    try {
      const page = await api.history(entry.personId, snap.next);
      // Loaded pages become part of the entry, so coming back shows them all.
      patchEntry(entry.key, { snapshot: { kind: 'history', items: [...snap.items, ...page.items], next: page.next } });
    } finally {
      setLoading(false);
    }
  }, [snap, loading, entry.key, entry.personId, patchEntry]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver((xs) => xs.some((x) => x.isIntersecting) && loadMore(), { rootMargin: '200px' });
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore]);

  return (
    <Scroller tab={tab} entry={entry}>
      <h1>History</h1>
      <p className="muted">
        Everywhere {person?.name ?? entry.personId} has been, newest first. Every arrival is here, including going back,
        and addresses that led nowhere.
      </p>
      {snap.items.length === 0 && <p>Nothing yet. Go somewhere.</p>}

      {groupByDay(snap.items).map(({ day, visits }) => (
        <section key={day} className="day">
          <h2>{day}</h2>
          <ul className="visits">
            {visits.map((v) => (
              <li key={v.id} className={v.revisionId ? undefined : 'gone'}>
                <time dateTime={v.at}>{timeOf(v.at)}</time>
                <SiteLink tab={tab} address={v.address} via="history">
                  <span className="t">{v.title ?? 'Nowhere'}</span>
                  <span className="a">{v.address}</span>
                </SiteLink>
                <span className="via">
                  {VIA_LABEL[v.via]}
                  {v.via === 'link' && v.from ? ` from ${v.from}` : ''}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <div ref={sentinel} className="sentinel">
        {snap.next ? (
          loading ? (
            'Loading more…'
          ) : (
            <button onClick={loadMore}>Load more</button>
          )
        ) : (
          snap.items.length > 0 && 'That’s everything.'
        )}
      </div>
    </Scroller>
  );
}
