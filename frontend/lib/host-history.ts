import { current } from '@thinker/shared';
import type { TabEntry, TabSession } from './snapshot';
import { session } from './storage';

/**
 * The tab's history lives in two places that must agree: ours (a Session,
 * see shared/src/session.ts) and the host browser's window.history, because
 * people use both back buttons.
 *
 * The host is the authority on where we are. Every entry we create is also a
 * pushState carrying { sid, idx }; our back and forward buttons just call
 * history.back() and history.forward(); and the pointer only ever moves when
 * popstate hands us back an idx. So the two lists cannot drift: forward is
 * lost in both at the same moment, by the same push.
 *
 * Our side keeps what the host can't: each entry's snapshot and scroll
 * position, saved per tab so they survive a reload.
 */

export interface HostState {
  sid: string;
  idx: number;
}

const STATE_KEY = 'thinker';
const SESSION_NAME = 'tab';

/** The real URL for an entry, so reloads and shared links land in the same place. */
function hostUrl(e: TabEntry): string {
  const p = new URLSearchParams({ as: e.personId });
  if (e.address !== 'about:home') p.set('go', e.address);
  return `/?${p}`;
}

function stateFor(s: TabSession) {
  return { [STATE_KEY]: { sid: s.sid, idx: s.index } satisfies HostState };
}

export function pushHost(s: TabSession) {
  window.history.pushState(stateFor(s), '', hostUrl(current(s)));
}

export function replaceHost(s: TabSession) {
  window.history.replaceState(stateFor(s), '', hostUrl(current(s)));
}

/** Our part of a history.state value, if it is one of ours. */
export function readHostState(state: unknown = window.history.state): HostState | null {
  const st = (state as Record<string, unknown> | null)?.[STATE_KEY] as HostState | undefined;
  return st && typeof st.sid === 'string' && typeof st.idx === 'number' ? st : null;
}

export function saveSession(s: TabSession) {
  session.setJson(SESSION_NAME, s);
}

export function loadSession(): TabSession | null {
  return session.getJson<TabSession>(SESSION_NAME);
}

export function newId(): string {
  return crypto.randomUUID().slice(0, 8);
}
