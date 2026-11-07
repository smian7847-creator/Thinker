import type {
  Person,
  Published,
  Revision,
  SearchResult,
  SiteSummary,
  Via,
  Visit,
  VisitedAddress,
  VisitPage,
} from '@smallweb/shared';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...init?.headers },
  });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = Array.isArray(body.message) ? body.message.join(', ') : (body.message ?? message);
    } catch {}
    throw new ApiError(res.status, message);
  }
  return res.json();
}

const enc = encodeURIComponent;

export const api = {
  people: () => call<Person[]>('/people'),
  sites: () => call<SiteSummary[]>('/sites'),

  /** The current revision at an address, or null if nothing lives there. */
  async resolve(address: string, signal?: AbortSignal): Promise<Revision | null> {
    try {
      return await call<Revision>(`/sites/${enc(address)}`, { signal });
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return null;
      throw e;
    }
  },

  revision: (id: string, signal?: AbortSignal) => call<Revision>(`/revisions/${enc(id)}`, { signal }),
  source: (id: string) => call<{ id: string; source: string }>(`/revisions/${enc(id)}/source`),

  publish: (body: { address: string; title: string; html: string; authorId: string; editKey?: string }) =>
    call<Published>('/sites', { method: 'POST', body: JSON.stringify(body) }),

  search: (q: string, signal?: AbortSignal) => call<SearchResult>(`/search?q=${enc(q)}`, { signal }),

  history: (personId: string, before?: string | null, signal?: AbortSignal) =>
    call<VisitPage>(`/people/${enc(personId)}/visits?limit=40${before ? `&before=${enc(before)}` : ''}`, { signal }),

  visited: (personId: string) => call<VisitedAddress[]>(`/people/${enc(personId)}/visited`),

  recordVisit: (
    personId: string,
    body: { address: string; revisionId: string | null; via: Via; from: string | null },
  ) => call<Visit>(`/people/${enc(personId)}/visits`, { method: 'POST', body: JSON.stringify(body) }),
};

/**
 * Edit keys for sites claimed from this browser. Our origin never runs code
 * that people published (that lives in opaque-origin frames), so it is safe
 * to keep them here. They are deliberately not kept in tab history.
 */
const EDIT_KEYS = 'smallweb:edit-keys';

function editKeys(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(EDIT_KEYS) ?? '{}');
  } catch {
    return {};
  }
}

export function getEditKey(address: string): string | undefined {
  return editKeys()[address];
}

export function saveEditKey(address: string, key: string) {
  try {
    localStorage.setItem(EDIT_KEYS, JSON.stringify({ ...editKeys(), [address]: key }));
  } catch {}
}

/** Revisions never change, so once fetched they can be kept for the life of the tab. */
const revisions = new Map<string, Revision>();

export function cacheRevision(r: Revision) {
  revisions.set(r.id, r);
}

export function cachedRevision(id: string): Revision | undefined {
  return revisions.get(id);
}

export async function loadRevision(id: string, signal?: AbortSignal): Promise<Revision> {
  const hit = revisions.get(id);
  if (hit) return hit;
  const r = await api.revision(id, signal);
  revisions.set(id, r);
  return r;
}
