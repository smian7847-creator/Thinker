/**
 * Browser storage that never throws. Storage can be missing or refuse writes
 * (private windows, blocked site data); Thinker then simply forgets.
 */

export const STORAGE_PREFIX = 'thinker:';

function store(kind: 'local' | 'session') {
  const area = (): Storage | null => {
    try {
      return kind === 'local' ? window.localStorage : window.sessionStorage;
    } catch {
      return null;
    }
  };
  return {
    get(name: string): string | null {
      try {
        return area()?.getItem(STORAGE_PREFIX + name) ?? null;
      } catch {
        return null;
      }
    },
    set(name: string, value: string) {
      try {
        area()?.setItem(STORAGE_PREFIX + name, value);
      } catch {}
    },
    remove(name: string) {
      try {
        area()?.removeItem(STORAGE_PREFIX + name);
      } catch {}
    },
    getJson<T>(name: string): T | null {
      const raw = this.get(name);
      if (!raw) return null;
      try {
        return JSON.parse(raw) as T;
      } catch {
        return null;
      }
    },
    setJson(name: string, value: unknown) {
      this.set(name, JSON.stringify(value));
    },
  };
}

/** Kept per browser: theme, last person, edit keys. */
export const local = store('local');
/** Kept per tab, across reloads: the tab's session history. */
export const session = store('session');
