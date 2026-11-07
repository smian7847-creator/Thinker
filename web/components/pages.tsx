'use client';

import { FormEvent, ReactNode, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { about, normalizeAddress, parseHref, type Revision, type SiteSummary, type Visit } from '@smallweb/shared';
import { api, ApiError, cachedRevision, loadRevision } from '@/lib/api';
import type { Draft, Snapshot, TabEntry } from '@/lib/snapshot';
import type { Tab } from '@/lib/useTab';
import { PageFrame } from './PageFrame';

type Of<K extends Snapshot['kind']> = Extract<Snapshot, { kind: K }>;

interface PageProps {
  tab: Tab;
  entry: TabEntry;
}

export function Page({ tab, entry }: PageProps) {
  const s = entry.snapshot;
  switch (s.kind) {
    case 'site':
      return <SitePage tab={tab} entry={entry} snap={s} />;
    case 'nowhere':
      return <NowherePage tab={tab} snap={s} />;
    case 'home':
      return <HomePage tab={tab} entry={entry} />;
    case 'search':
      return <SearchPage tab={tab} entry={entry} snap={s} />;
    case 'history':
      return <HistoryPage tab={tab} entry={entry} snap={s} />;
    case 'publish':
      return <PublishPage tab={tab} entry={entry} snap={s} />;
  }
}

/** A scrolling page of our own whose position is kept on its entry. */
function Scroller({ tab, entry, ready = true, children }: PageProps & { ready?: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const restored = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useLayoutEffect(() => {
    if (!ready || restored.current || !ref.current) return;
    restored.current = true;
    ref.current.scrollTop = entry.scrollY;
  }, [ready, entry.scrollY]);
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <div
      ref={ref}
      className="scroller"
      onScroll={(e) => {
        const y = Math.round(e.currentTarget.scrollTop);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => tab.patchEntry(entry.key, { scrollY: y }), 150);
      }}
    >
      <div className="internal">{children}</div>
    </div>
  );
}

function timeOf(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function dayOf(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

// ---------------------------------------------------------------- site

function SitePage({ tab, entry, snap }: PageProps & { snap: Of<'site'> }) {
  const [rev, setRev] = useState<Revision | null>(() => cachedRevision(snap.revisionId) ?? null);
  const [failed, setFailed] = useState<string | null>(null);

  useEffect(() => {
    if (rev?.id === snap.revisionId) return;
    const ctl = new AbortController();
    loadRevision(snap.revisionId, ctl.signal)
      .then(setRev)
      .catch((e) => !ctl.signal.aborted && setFailed(e instanceof Error ? e.message : String(e)));
    return () => ctl.abort();
  }, [snap.revisionId, rev?.id]);

  const visited = useMemo(() => [...tab.visited.keys()], [tab.visited]);
  const onLink = useCallback(
    (href: string) => {
      const t = parseHref(href);
      if (t) tab.navigate(t, 'link');
    },
    [tab.navigate],
  );
  const onScroll = useCallback((y: number) => tab.patchEntry(entry.key, { scrollY: y }), [tab.patchEntry, entry.key]);

  if (failed) return <div className="internal-msg">Couldn&apos;t load this page: {failed}</div>;
  if (!rev || rev.id !== snap.revisionId) return <div className="internal-msg loading">Loading {entry.address}…</div>;

  const before = tab.arrival?.before;
  return (
    <div className="site">
      <div className="infobar">
        <span>
          <strong>{rev.title}</strong> by {rev.authorName} · revision {rev.n} · published {dayOf(rev.createdAt)}
        </span>
        <span className="spacer" />
        {tab.arrival &&
          (before ? (
            <span className="been" title="From this person's history">
              Been here {before.count} {before.count === 1 ? 'time' : 'times'} before · last {timeOf(before.last)}
            </span>
          ) : (
            <span className="first">First visit</span>
          ))}
        {tab.personId === rev.authorId && (
          <button onClick={() => tab.navigate(about('publish', { address: rev.address }), 'typed')}>Edit</button>
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

// ---------------------------------------------------------------- nowhere

function NowherePage({ tab, snap }: { tab: Tab; snap: Of<'nowhere'> }) {
  const address = normalizeAddress(snap.input);
  return (
    <div className="scroller">
      <div className="internal nowhere">
        <div className="big">∅</div>
        {snap.reason === 'missing' && (
          <>
            <h1>Nothing lives at {snap.input}</h1>
            <p>
              Nobody has ever published a page at this address, or nobody has yet. Links can point anywhere, including
              at places that never existed.
            </p>
            <p>
              <button className="primary" onClick={() => tab.navigate(about('publish', { address: address! }), 'typed')}>
                Publish something at {snap.input}
              </button>
            </p>
          </>
        )}
        {snap.reason === 'outside' && (
          <>
            <h1>This web has no outside</h1>
            <p>
              <code>{snap.input}</code> is an address on the real internet. This browser only reaches the small web:
              addresses that end in <code>.zz</code>.
            </p>
          </>
        )}
        {snap.reason === 'malformed' && (
          <>
            <h1>That isn&apos;t an address</h1>
            <p>
              <code>{snap.input}</code> doesn&apos;t lead anywhere. Addresses look like <code>tidepool.zz</code>: letters,
              digits and hyphens, ending in <code>.zz</code>.
            </p>
          </>
        )}
        <p>
          <button onClick={tab.back} disabled={!tab.canGoBack}>
            ← Go back
          </button>
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- home

function HomePage({ tab, entry }: PageProps) {
  const [sites, setSites] = useState<SiteSummary[] | null>(null);
  const [q, setQ] = useState('');
  useEffect(() => {
    api.sites().then(setSites, () => setSites([]));
  }, []);
  const person = tab.people.find((p) => p.id === tab.personId);
  return (
    <Scroller tab={tab} entry={entry} ready={sites !== null}>
      <h1 className="hello">The small web</h1>
      <p className="lede">
        {sites ? `${sites.length} sites, written by hand by strangers.` : 'Loading…'} You&apos;re browsing as{' '}
        <strong>{person?.name ?? tab.personId}</strong>
        {person ? <>: {person.blurb.charAt(0).toLowerCase() + person.blurb.slice(1)}</> : '.'}
      </p>
      <form
        className="searchbox"
        onSubmit={(e) => {
          e.preventDefault();
          if (q.trim()) tab.navigate(about('search', { q: q.trim() }), 'typed');
        }}
      >
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search every page by what's written in it" />
        <button className="primary">Search</button>
      </form>
      <ul className="directory">
        {sites?.map((s) => (
          <li key={s.address}>
            <a
              href={`/?go=${s.address}`}
              className={tab.visited.has(s.address) ? 'visited' : ''}
              onClick={(e) => {
                e.preventDefault();
                tab.navigate({ kind: 'site', address: s.address }, 'typed');
              }}
            >
              <span className="t">{s.title}</span>
              <span className="a">{s.address}</span>
            </a>
            <span className="by">by {s.authorName}</span>
          </li>
        ))}
      </ul>
    </Scroller>
  );
}

// ---------------------------------------------------------------- search

function stems(terms: string[]) {
  return terms.map((t) => (t.replace(/(ing|ed|es|s)$/, '') || t).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
}

function Highlight({ text, terms }: { text: string; terms: string[] }) {
  if (!terms.length) return <>{text}</>;
  const re = new RegExp(`\\b((?:${stems(terms).join('|')})(?:s|es|d|ed|ing)?)\\b`, 'giu');
  const parts = text.split(re);
  return <>{parts.map((p, i) => (i % 2 ? <mark key={i}>{p}</mark> : p))}</>;
}

function SearchPage({ tab, entry, snap }: PageProps & { snap: Of<'search'> }) {
  const { result } = snap;
  const [q, setQ] = useState(result.q);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (q.trim()) tab.navigate(about('search', { q: q.trim() }), 'typed');
  };
  return (
    <Scroller tab={tab} entry={entry}>
      <form className="searchbox" onSubmit={submit}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the small web" />
        <button className="primary">Search</button>
      </form>
      <p className="muted">
        {result.hits.length === 0
          ? `No page on this web mentions “${result.q}”.`
          : `${result.hits.length} ${result.hits.length === 1 ? 'page mentions' : 'pages mention'} “${result.q}”, best match first.`}
      </p>
      <ol className="results">
        {result.hits.map((h) => (
          <li key={h.address}>
            <a
              href={`/?go=${h.address}`}
              className={tab.visited.has(h.address) ? 'visited' : ''}
              onClick={(e) => {
                e.preventDefault();
                tab.navigate({ kind: 'site', address: h.address }, 'search');
              }}
            >
              <Highlight text={h.title} terms={result.terms} />
            </a>
            <div className="addr">
              {h.address} · by {h.authorName}
            </div>
            <p className="snippet">
              <Highlight text={h.snippet} terms={result.terms} />
            </p>
          </li>
        ))}
      </ol>
    </Scroller>
  );
}

// ---------------------------------------------------------------- history

const VIA_LABEL: Record<Visit['via'], string> = {
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

function HistoryPage({ tab, entry, snap }: PageProps & { snap: Of<'history'> }) {
  const [loading, setLoading] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);
  const person = tab.people.find((p) => p.id === entry.personId);

  const more = useCallback(async () => {
    if (!snap.next || loading) return;
    setLoading(true);
    try {
      const page = await api.history(entry.personId, snap.next);
      // Loaded pages become part of the entry, so coming back shows them all.
      tab.patchEntry(entry.key, { snapshot: { kind: 'history', items: [...snap.items, ...page.items], next: page.next } });
    } finally {
      setLoading(false);
    }
  }, [snap, loading, entry.key, entry.personId, tab.patchEntry]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver((xs) => xs.some((x) => x.isIntersecting) && more(), { rootMargin: '200px' });
    io.observe(el);
    return () => io.disconnect();
  }, [more]);

  const days: { day: string; items: Visit[] }[] = [];
  for (const v of snap.items) {
    const day = dayOf(v.at);
    if (days[days.length - 1]?.day !== day) days.push({ day, items: [] });
    days[days.length - 1].items.push(v);
  }

  return (
    <Scroller tab={tab} entry={entry}>
      <h1>History</h1>
      <p className="muted">
        Everywhere {person?.name ?? entry.personId} has been, newest first. Every arrival is here, including going back,
        and addresses that led nowhere.
      </p>
      {snap.items.length === 0 && <p>Nothing yet. Go somewhere.</p>}
      {days.map((d) => (
        <section key={d.day} className="day">
          <h2>{d.day}</h2>
          <ul className="visits">
            {d.items.map((v) => (
              <li key={v.id} className={v.revisionId ? '' : 'gone'}>
                <time dateTime={v.at}>{timeOf(v.at)}</time>
                <a
                  href={`/?go=${v.address}`}
                  onClick={(e) => {
                    e.preventDefault();
                    tab.navigate({ kind: 'site', address: v.address }, 'history');
                  }}
                >
                  <span className="t">{v.title ?? 'Nowhere'}</span>
                  <span className="a">{v.address}</span>
                </a>
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
        {snap.next ? (loading ? 'Loading more…' : <button onClick={more}>Load more</button>) : snap.items.length > 0 && 'That’s everything.'}
      </div>
    </Scroller>
  );
}

// ---------------------------------------------------------------- publish

const STARTER = `<h1>My page</h1>
<p>Write anything. Link to other sites by address, like <a href="tidepool.zz">tidepool.zz</a>.</p>`;

function PublishPage({ tab, entry, snap }: PageProps & { snap: Of<'publish'> }) {
  const [draft, setDraft] = useState<Draft>(snap.draft);
  const [preview, setPreview] = useState(snap.draft.html);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const save = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Keep the draft on the entry, so leaving and coming back finds it as it was.
  const update = (patch: Partial<Draft>) => {
    const next = { ...draft, ...patch };
    setDraft(next);
    clearTimeout(save.current);
    save.current = setTimeout(() => {
      tab.patchEntry(entry.key, { snapshot: { kind: 'publish', draft: next } });
      setPreview(next.html);
    }, 300);
  };
  useEffect(() => () => clearTimeout(save.current), []);

  // Arriving with an address: tell the publisher whose it is, and load it for editing if it's theirs.
  const address = normalizeAddress(draft.address);
  useEffect(() => {
    if (!address) return setStatus(null);
    let live = true;
    const t = setTimeout(async () => {
      const rev = await api.resolve(address).catch(() => null);
      if (!live) return;
      if (!rev) return setStatus(`${address} is free. Publishing claims it for ${who(draft.authorId)}.`);
      if (rev.authorId !== draft.authorId)
        return setStatus(`${address} belongs to ${rev.authorName}. Only they can publish there.`);
      setStatus(`Editing ${address}. Publishing adds revision ${rev.n + 1}; anyone with revision ${rev.n} in their back history keeps it.`);
      if (!draft.html && !draft.title) {
        const { source } = await api.source(rev.id);
        if (live) {
          const next = { ...draft, title: rev.title, html: source };
          setDraft(next);
          setPreview(source);
          tab.patchEntry(entry.key, { snapshot: { kind: 'publish', draft: next } });
        }
      }
    }, 250);
    return () => {
      live = false;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, draft.authorId]);

  function who(id: string) {
    return tab.people.find((p) => p.id === id)?.name ?? id;
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      clearTimeout(save.current);
      tab.patchEntry(entry.key, { snapshot: { kind: 'publish', draft } });
      const rev = await api.publish({ ...draft, html: draft.html || STARTER });
      await tab.navigate({ kind: 'site', address: rev.address }, 'publish');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Scroller tab={tab} entry={entry}>
      <h1>Publish a site</h1>
      <p className="muted">
        An address and a page of HTML. Scripts, forms, embeds and images are removed when you publish; your CSS stays.
        The preview runs in the same sandbox readers will see it in.
      </p>
      <form className="publish" onSubmit={submit}>
        <label>
          Publishing as
          <select value={draft.authorId} onChange={(e) => update({ authorId: e.target.value })}>
            {tab.people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Address
          <input
            value={draft.address}
            onChange={(e) => update({ address: e.target.value })}
            placeholder="yourname.zz"
            spellCheck={false}
            required
          />
        </label>
        {draft.address && !address && <p className="warn">Addresses look like name.zz: letters, digits and hyphens.</p>}
        {status && <p className="note">{status}</p>}
        <label>
          Title
          <input value={draft.title} onChange={(e) => update({ title: e.target.value })} maxLength={120} required />
        </label>
        <label>
          HTML
          <textarea
            value={draft.html}
            onChange={(e) => update({ html: e.target.value })}
            placeholder={STARTER}
            rows={14}
            spellCheck={false}
          />
        </label>
        {error && <p className="warn">{error}</p>}
        <div className="row">
          <button className="primary" disabled={busy || !address}>
            {busy ? 'Publishing…' : 'Publish'}
          </button>
        </div>
      </form>
      <h2>Preview</h2>
      <div className="preview">
        <PageFrame key={preview} html={preview || STARTER} title={draft.title || 'Preview'} />
      </div>
    </Scroller>
  );
}
