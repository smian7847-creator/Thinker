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
  traverse,
  updateEntry,
  type Person,
  type Via,
  type VisitedAddress,
} from '@thinker/shared';
import { api, errorMessage } from '@/lib/api';
import { loadSession, newId, pushHost, readHostState, replaceHost, saveSession } from '@/lib/host-history';
import { addressOf, loadSnapshot, visitTargetOf } from '@/lib/load-snapshot';
import { Snapshot, TabEntry, TabSession, titleOf } from '@/lib/snapshot';
import { local } from '@/lib/storage';
import { useVisited } from './useVisited';

/**
 * One browser tab: its history, what is loading, and who is browsing.
 * How back and forward stay in step with the host browser is described in
 * lib/host-history.ts.
 */

const PERSON = 'person';
const FALLBACK_PERSON = 'ada';

export interface NavigateOptions {
  /** Browse as someone else from this entry on. */
  personId?: string;
  /** Replace the current entry instead of adding one (reload). */
  replace?: boolean;
}

export interface Arrival {
  key: string;
  /** What this person's history held for the address before this arrival. */
  before: VisitedAddress | null;
}

/** Who to browse as when a tab starts: the URL, then the last person picked, then anyone. */
function initialPerson(people: Person[], fromUrl: string | null): string {
  const known = (id: string | null) => (id && people.some((p) => p.id === id) ? id : null);
  return known(fromUrl) ?? known(local.get(PERSON)) ?? people[0]?.id ?? FALLBACK_PERSON;
}

export function useTab() {
  const [people, setPeople] = useState<Person[]>([]);
  const [session, setSession] = useState<TabSession | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [arrival, setArrival] = useState<Arrival | null>(null);

  const sessionRef = useRef<TabSession | null>(null);
  const inflight = useRef<AbortController | null>(null);

  const entry = session ? current(session) : null;
  const personId = entry?.personId ?? null;
  const { visited, before, add: addVisited } = useVisited(personId);

  const commit = useCallback((s: TabSession) => {
    sessionRef.current = s;
    setSession(s);
    saveSession(s);
  }, []);

  const stop = useCallback(() => {
    inflight.current?.abort();
    inflight.current = null;
    setPending(null);
  }, []);

  /** Shown, and recorded. */
  const arrive = useCallback(
    (e: TabEntry, via: Via, from: string | null) => {
      const target = visitTargetOf(e);
      setArrival({ key: e.key, before: target && before(e.personId, target.address) });
      if (!target) return;
      api
        .recordVisit(e.personId, { ...target, via, from })
        .then(addVisited)
        .catch((err) => console.warn('visit not recorded', err));
    },
    [before, addVisited],
  );

  const navigate = useCallback(
    async (target: Target, via: Via, opts: NavigateOptions = {}) => {
      const s = sessionRef.current;
      if (!s) return;
      const here = current(s);
      const personId = opts.personId ?? here.personId;
      const from = via === 'link' ? normalizeAddress(here.address) : null;
      const address = addressOf(target);

      // Typed -> Loading. A new navigation abandons any that is still loading.
      inflight.current?.abort();
      const ctl = new AbortController();
      inflight.current = ctl;
      setPending(address);
      setError(null);

      try {
        const snapshot = await loadSnapshot(target, personId, ctl.signal);
        if (ctl.signal.aborted) return;
        // Loading -> Shown (or Nowhere). Only now does the entry exist.
        const latest = sessionRef.current!;
        let next: TabSession;
        if (opts.replace) {
          next = updateEntry(latest, current(latest).key, { personId, address, snapshot });
          replaceHost(next);
        } else {
          next = push(latest, { key: newId(), personId, address, snapshot, scrollY: 0 });
          pushHost(next);
        }
        commit(next);
        arrive(current(next), via, from);
      } catch (e) {
        if (!ctl.signal.aborted) setError(errorMessage(e));
      } finally {
        if (inflight.current === ctl) {
          inflight.current = null;
          setPending(null);
        }
      }
    },
    [arrive, commit],
  );

  // Our buttons only ask the host browser to move; popstate does the rest.
  const back = useCallback(() => {
    stop();
    if (sessionRef.current && canGoBack(sessionRef.current)) window.history.back();
  }, [stop]);

  const forward = useCallback(() => {
    stop();
    if (sessionRef.current && canGoForward(sessionRef.current)) window.history.forward();
  }, [stop]);

  const reload = useCallback(() => {
    const s = sessionRef.current;
    if (s) navigate(parseTyped(current(s).address) ?? about('home'), 'reload', { replace: true });
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
    (id: string) => {
      local.set(PERSON, id);
      navigate(about('home'), 'typed', { personId: id });
    },
    [navigate],
  );

  // Boot: pick up where this tab left off, or start a new session from the URL.
  useEffect(() => {
    let cancelled = false;

    const startFresh = async (list: Person[]) => {
      const params = new URLSearchParams(window.location.search);
      const personId = initialPerson(list, params.get('as'));
      const go = params.get('go');
      const target = (go && parseTyped(go)) || about('home');
      const snapshot = await loadSnapshot(target, personId, new AbortController().signal);
      if (cancelled) return;
      const s = createSession<Snapshot>(newId(), {
        key: newId(),
        personId,
        address: addressOf(target),
        snapshot,
        scrollY: 0,
      });
      replaceHost(s);
      commit(s);
      if (go) arrive(current(s), 'typed', null);
    };

    const restore = (list: Person[]) => {
      const st = readHostState();
      const saved = loadSession();
      if (st && saved && saved.sid === st.sid && st.idx < saved.entries.length) {
        commit(traverse(saved, st.idx).session);
        return;
      }
      startFresh(list).catch((e) => setError(errorMessage(e)));
    };

    api
      .people()
      .then((list) => {
        if (cancelled) return;
        setPeople(list);
        restore(list);
      })
      .catch((e) => setError(`Can't reach the API: ${errorMessage(e)}`));

    // Back, forward, and any jump the host browser makes (its own buttons,
    // Alt+Left, a mouse's back button, its history menu) all arrive here.
    const onPopState = (ev: PopStateEvent) => {
      stop();
      setError(null);
      const st = readHostState(ev.state);
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
  }, [arrive, commit, stop]);

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
    stop,
    patchEntry,
    switchPerson,
    dismissError: () => setError(null),
  };
}

export type Tab = ReturnType<typeof useTab>;
