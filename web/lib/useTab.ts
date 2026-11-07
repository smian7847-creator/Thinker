'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  about,
  canGoBack,
  canGoForward,
  createSession,
  current,
  normalizeAddress,
  parseTyped,
  push,
  Target,
  targetToString,
  traverse,
  updateEntry,
  Via,
  VisitedAddress,
  type Person,
} from '@smallweb/shared';
import { api, cacheRevision } from './api';
import { Snapshot, TabEntry, TabSession, titleOf } from './snapshot';

/**
 * One browser tab.
 *
 * The tab's history is a Session (shared/src/session.ts): a list of entries
 * and an index. Two things have to agree about it, ours and the host
 * browser's, because people use both back buttons. We make the host
 * browser's history the authority on *where we are*: every new entry is a
 * history.pushState carrying { sid, idx }, and our back and forward buttons
 * just call history.back() and history.forward(). The only place the index
 * ever moves on a traversal is the popstate handler, which reads idx off the
 * state the host browser hands back. So the two lists can't drift: forward
 * is lost in both at the same moment, by the same push.
 *
 * Our side keeps what the host can't: each entry's snapshot (which revision,
 * which results) and scroll position, saved in sessionStorage so they survive
 * a reload of the tab.
 */

const STORAGE_KEY = 'smallweb:tab';
const PERSON_KEY = 'smallweb:person';

interface HostState {
  sid: string;
  idx: number;
}

function newId(): string {
  return crypto.randomUUID().slice(0, 8);
}

function hostUrl(e: TabEntry): string {
  const p = new URLSearchParams({ as: e.personId });
  if (e.address !== 'about:home') p.set('go', e.address);
  return `/?${p}`;
}

function hostState(): HostState | null {
  const sw = window.history.state?.sw;
  return sw && typeof sw.sid === 'string' && typeof sw.idx === 'number' ? sw : null;
}

function save(s: TabSession) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {}
}

function load(): TabSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TabSession) : null;
  } catch {
    return null;
  }
}

/** Fetch what a target shows. Nothing is committed to history until this resolves. */
async function snapshotFor(target: Target, personId: string, signal: AbortSignal): Promise<Snapshot> {
  switch (target.kind) {
    case 'site': {
      const rev = await api.resolve(target.address, signal);
      if (!rev) return { kind: 'nowhere', input: target.address, reason: 'missing' };
      cacheRevision(rev);
      return { kind: 'site', revisionId: rev.id, title: rev.title };
    }
    case 'nowhere':
      return { kind: 'nowhere', input: target.input, reason: target.reason };
    case 'about':
      switch (target.page) {
        case 'home':
          return { kind: 'home' };
        case 'search':
          return { kind: 'search', result: await api.search(target.params.q ?? '', signal) };
        case 'history': {
          const page = await api.history(personId, null, signal);
          return { kind: 'history', items: page.items, next: page.next };
        }
        case 'publish':
          return {
            kind: 'publish',
            draft: { authorId: personId, address: target.params.address ?? '', title: '', html: '' },
          };
      }
  }
}

/** The address a visit is recorded against, if this entry is somewhere on the web at all. */
function visitAddress(e: TabEntry): { address: string; revisionId: string | null } | null {
  const s = e.snapshot;
  if (s.kind === 'site') return { address: e.address, revisionId: s.revisionId };
  if (s.kind === 'nowhere') {
    const address = normalizeAddress(s.input);
    return address ? { address, revisionId: null } : null;
  }
  return null;
}

export interface NavigateOptions {
  personId?: string;
  /** Replace the current entry instead of adding one (reload). */
  replace?: boolean;
}

export interface Arrival {
  key: string;
  /** What this person's history held for the address before this arrival. */
  before: VisitedAddress | null;
}

export function useTab() {
  const [people, setPeople] = useState<Person[]>([]);
  const [session, setSession] = useState<TabSession | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [visited, setVisited] = useState<Map<string, VisitedAddress>>(new Map());
  const [arrival, setArrival] = useState<Arrival | null>(null);

  const sessionRef = useRef<TabSession | null>(null);
  const inflight = useRef<AbortController | null>(null);
  const visitedRef = useRef(visited);
  visitedRef.current = visited;
  const visitedFor = useRef<string | null>(null);

  const commit = useCallback((s: TabSession) => {
    sessionRef.current = s;
    setSession(s);
    save(s);
  }, []);

  const cancel = useCallback(() => {
    inflight.current?.abort();
    inflight.current = null;
    setPending(null);
  }, []);

  /** Shown, and recorded. */
  const arrive = useCallback((e: TabEntry, via: Via, from: string | null) => {
    const target = visitAddress(e);
    const before = target && visitedFor.current === e.personId ? (visitedRef.current.get(target.address) ?? null) : null;
    setArrival({ key: e.key, before });
    if (!target) return;
    api
      .recordVisit(e.personId, { ...target, via, from })
      .then((v) => {
        if (!v.revisionId || visitedFor.current !== e.personId) return;
        setVisited((m) => {
          const next = new Map(m);
          const prev = m.get(v.address);
          next.set(v.address, { address: v.address, count: (prev?.count ?? 0) + 1, last: v.at });
          return next;
        });
      })
      .catch((err) => console.warn('visit not recorded', err));
  }, []);

  const navigate = useCallback(
    async (target: Target, via: Via, opts: NavigateOptions = {}) => {
      const s = sessionRef.current;
      if (!s) return;
      const here = current(s);
      const personId = opts.personId ?? here.personId;
      const from = via === 'link' ? normalizeAddress(here.address) : null;

      // Typed -> Loading. A new navigation abandons any that is still loading.
      inflight.current?.abort();
      const ctl = new AbortController();
      inflight.current = ctl;
      setPending(target.kind === 'site' ? target.address : targetToString(target));
      setError(null);

      try {
        const snapshot = await snapshotFor(target, personId, ctl.signal);
        if (ctl.signal.aborted) return;
        // Loading -> Shown (or Nowhere). Only now does the entry exist.
        const latest = sessionRef.current!;
        const address = target.kind === 'site' ? target.address : targetToString(target);
        let next: TabSession;
        if (opts.replace) {
          next = updateEntry(latest, current(latest).key, { personId, address, snapshot });
          window.history.replaceState({ sw: { sid: next.sid, idx: next.index } }, '', hostUrl(current(next)));
        } else {
          next = push(latest, { key: newId(), personId, address, snapshot, scrollY: 0 });
          window.history.pushState({ sw: { sid: next.sid, idx: next.index } }, '', hostUrl(current(next)));
        }
        commit(next);
        arrive(current(next), via, from);
      } catch (e) {
        if (ctl.signal.aborted) return;
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (inflight.current === ctl) {
          inflight.current = null;
          setPending(null);
        }
      }
    },
    [arrive, commit],
  );

  const back = useCallback(() => {
    cancel();
    if (sessionRef.current && canGoBack(sessionRef.current)) window.history.back();
  }, [cancel]);

  const forward = useCallback(() => {
    cancel();
    if (sessionRef.current && canGoForward(sessionRef.current)) window.history.forward();
  }, [cancel]);

  const reload = useCallback(() => {
    const s = sessionRef.current;
    if (!s) return;
    const e = current(s);
    const target = parseTyped(e.address) ?? about('home');
    navigate(target, 'reload', { replace: true });
  }, [navigate]);

  /** Change something about an entry without making a new one: scroll, more results, a draft. */
  const patchEntry = useCallback(
    (key: string, patch: Partial<Omit<TabEntry, 'key'>>) => {
      const s = sessionRef.current;
      if (s) commit(updateEntry(s, key, patch));
    },
    [commit],
  );

  const switchPerson = useCallback(
    (personId: string) => {
      try {
        localStorage.setItem(PERSON_KEY, personId);
      } catch {}
      navigate(about('home'), 'typed', { personId });
    },
    [navigate],
  );

  // Boot: pick up where this tab left off, or start a new session from the URL.
  useEffect(() => {
    let cancelled = false;

    const startFresh = async (list: Person[]) => {
      const params = new URLSearchParams(window.location.search);
      let personId = params.get('as');
      if (!personId || !list.some((p) => p.id === personId)) {
        let remembered: string | null = null;
        try {
          remembered = localStorage.getItem(PERSON_KEY);
        } catch {}
        personId = list.find((p) => p.id === remembered)?.id ?? list[0]?.id ?? 'ada';
      }
      const go = params.get('go');
      const target = (go && parseTyped(go)) || about('home');
      const ctl = new AbortController();
      const snapshot = await snapshotFor(target, personId, ctl.signal);
      if (cancelled) return;
      const address = target.kind === 'site' ? target.address : targetToString(target);
      const s = createSession<Snapshot>(newId(), { key: newId(), personId, address, snapshot, scrollY: 0 });
      window.history.replaceState({ sw: { sid: s.sid, idx: 0 } }, '', hostUrl(current(s)));
      commit(s);
      if (go) arrive(current(s), 'typed', null);
    };

    const restore = (list: Person[]) => {
      const st = hostState();
      const saved = load();
      if (st && saved && saved.sid === st.sid && st.idx < saved.entries.length) {
        commit(traverse(saved, st.idx).session);
        return;
      }
      startFresh(list).catch((e) => setError(e instanceof Error ? e.message : String(e)));
    };

    api
      .people()
      .then((list) => {
        if (cancelled) return;
        setPeople(list);
        restore(list);
      })
      .catch((e) => setError(`Can't reach the API: ${e instanceof Error ? e.message : e}`));

    // Back, forward, and any jump the host browser makes (its own buttons,
    // Alt+Left, a mouse's back button, its history menu) all arrive here.
    const onPopState = (ev: PopStateEvent) => {
      inflight.current?.abort();
      inflight.current = null;
      setPending(null);
      setError(null);
      const st = (ev.state?.sw ?? null) as HostState | null;
      const s = sessionRef.current;
      if (!st || !s || st.sid !== s.sid || st.idx >= s.entries.length) {
        // An entry from some other life of this tab. Start again from its URL.
        api.people().then(restore);
        return;
      }
      const { session: next, direction } = traverse(s, st.idx);
      commit(next);
      if (direction !== 'none') arrive(current(next), direction, null);
    };
    window.addEventListener('popstate', onPopState);
    return () => {
      cancelled = true;
      window.removeEventListener('popstate', onPopState);
    };
  }, [arrive, commit]);

  const entry = session ? current(session) : null;
  const personId = entry?.personId ?? null;

  // The visited set belongs to whoever is browsing the current entry.
  useEffect(() => {
    if (!personId) return;
    visitedFor.current = personId;
    let live = true;
    api
      .visited(personId)
      .then((rows) => live && setVisited(new Map(rows.map((r) => [r.address, r]))))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [personId]);

  useEffect(() => {
    if (entry) document.title = `${titleOf(entry)} · Thinker`;
  }, [entry]);

  return {
    people,
    session,
    entry,
    personId,
    pending,
    error,
    visited,
    arrival: arrival && entry && arrival.key === entry.key ? arrival : null,
    canGoBack: !!session && canGoBack(session),
    canGoForward: !!session && canGoForward(session),
    navigate,
    back,
    forward,
    reload,
    stop: cancel,
    patchEntry,
    switchPerson,
    dismissError: () => setError(null),
  };
}

export type Tab = ReturnType<typeof useTab>;
