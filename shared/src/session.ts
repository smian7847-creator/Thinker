/**
 * The joint session history of one browser tab: an ordered list of entries
 * and a pointer into it. This is the whole model of back and forward.
 *
 * - Navigating somewhere new appends an entry after the current one and
 *   throws away everything that was ahead of it (forward is lost).
 * - Back and forward only move the pointer. Entries are never re-created,
 *   so an entry gone back to is exactly the entry that was left: the same
 *   revision of the page, the same scroll position.
 *
 * Every function is pure; the browser keeps this in sessionStorage and
 * mirrors the pointer into window.history so the host browser's own back
 * button and ours walk the same list.
 */

export interface Entry<S = unknown> {
  /** Unique per entry; never reused, even for the same address. */
  key: string;
  /** Who was browsing when this entry was created. */
  personId: string;
  /** What the address bar shows for this entry. */
  address: string;
  /** Everything needed to show the entry again without asking the server. */
  snapshot: S;
  scrollY: number;
}

export interface Session<S = unknown> {
  sid: string;
  entries: Entry<S>[];
  index: number;
}

export function createSession<S>(sid: string, first: Entry<S>): Session<S> {
  return { sid, entries: [first], index: 0 };
}

export function current<S>(s: Session<S>): Entry<S> {
  return s.entries[s.index];
}

export function canGoBack(s: Session): boolean {
  return s.index > 0;
}

export function canGoForward(s: Session): boolean {
  return s.index < s.entries.length - 1;
}

/** A new navigation: drop the forward entries and append. */
export function push<S>(s: Session<S>, entry: Entry<S>): Session<S> {
  const entries = s.entries.slice(0, s.index + 1);
  entries.push(entry);
  return { ...s, entries, index: entries.length - 1 };
}

export type Direction = 'back' | 'forward' | 'none';

/** Move the pointer to an existing entry (back, forward, or a jump). */
export function traverse<S>(s: Session<S>, index: number): { session: Session<S>; direction: Direction } {
  if (!Number.isInteger(index) || index < 0 || index >= s.entries.length) {
    throw new RangeError(`no entry ${index} in a session of ${s.entries.length}`);
  }
  const direction: Direction = index < s.index ? 'back' : index > s.index ? 'forward' : 'none';
  return { session: { ...s, index }, direction };
}

/** Update an entry by key, wherever it is; a no-op if it's gone. */
export function updateEntry<S>(s: Session<S>, key: string, patch: Partial<Omit<Entry<S>, 'key'>>): Session<S> {
  const i = s.entries.findIndex((e) => e.key === key);
  if (i < 0) return s;
  const entries = s.entries.slice();
  entries[i] = { ...entries[i], ...patch };
  return { ...s, entries };
}
