'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { about, parseHref, type Revision } from '@thinker/shared';
import { errorMessage } from '@/lib/api';
import { dayOf, plural, timeOf } from '@/lib/format';
import { cachedRevision, loadRevision } from '@/lib/revisions';
import { PageFrame } from '../frame/PageFrame';
import type { SnapshotPageProps } from './types';

/** A published page, at exactly the revision this entry pinned. */
export function SitePage({ tab, entry, snap }: SnapshotPageProps<'site'>) {
  const [rev, setRev] = useState<Revision | null>(() => cachedRevision(snap.revisionId) ?? null);
  const [failed, setFailed] = useState<string | null>(null);

  // After a reload of the tab the revision isn't cached yet: fetch exactly that one.
  useEffect(() => {
    if (rev?.id === snap.revisionId) return;
    const ctl = new AbortController();
    loadRevision(snap.revisionId, ctl.signal)
      .then(setRev)
      .catch((e) => !ctl.signal.aborted && setFailed(errorMessage(e)));
    return () => ctl.abort();
  }, [snap.revisionId, rev?.id]);

  const { navigate, patchEntry } = tab;
  const visited = useMemo(() => [...tab.visited.keys()], [tab.visited]);
  const onLink = useCallback(
    (href: string) => {
      const target = parseHref(href);
      if (target) navigate(target, 'link');
    },
    [navigate],
  );
  const onScroll = useCallback((y: number) => patchEntry(entry.key, { scrollY: y }), [patchEntry, entry.key]);

  if (failed) return <div className="internal-msg">Couldn&apos;t load this page: {failed}</div>;
  if (!rev || rev.id !== snap.revisionId) return <div className="internal-msg">Loading {entry.address}…</div>;

  return (
    <div className="site">
      <div className="infobar">
        <span>
          <strong>{rev.title}</strong> by {rev.authorName} · revision {rev.n} · published {dayOf(rev.createdAt)}
        </span>
        <span className="spacer" />
        <ArrivalNote tab={tab} />
        {tab.personId === rev.authorId && (
          <button onClick={() => navigate(about('publish', { address: rev.address }), 'typed')}>Edit</button>
        )}
      </div>
      <PageFrame
        key={rev.id}
        html={rev.html}
        title={rev.title}
        scrollY={entry.scrollY}
        visited={visited}
        onLink={onLink}
        onScroll={onScroll}
      />
    </div>
  );
}

/** "First visit", or how often this person had been here before arriving. */
function ArrivalNote({ tab }: { tab: SnapshotPageProps<'site'>['tab'] }) {
  if (!tab.arrival) return null;
  const { before } = tab.arrival;
  if (!before) return <span className="first">First visit</span>;
  return (
    <span className="been" title="From this person's history">
      Been here {plural(before.count, 'time', 'times')} before · last {timeOf(before.last)}
    </span>
  );
}
