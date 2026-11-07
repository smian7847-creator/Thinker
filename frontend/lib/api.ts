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
} from '@thinker/shared';

/** The frontend reaches the backend through the same origin; next.config.mjs proxies /api. */
const BASE = '/api';
const HISTORY_PAGE_SIZE = 40;

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
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

export interface PublishRequest {
  address: string;
  title: string;
  html: string;
  authorId: string;
  editKey?: string;
}

export interface VisitRequest {
  address: string;
  revisionId: string | null;
  via: Via;
  from: string | null;
}

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

  publish: (body: PublishRequest) => call<Published>('/sites', { method: 'POST', body: JSON.stringify(body) }),

  search: (q: string, signal?: AbortSignal) => call<SearchResult>(`/search?q=${enc(q)}`, { signal }),

  history: (personId: string, before?: string | null, signal?: AbortSignal) =>
    call<VisitPage>(
      `/people/${enc(personId)}/visits?limit=${HISTORY_PAGE_SIZE}${before ? `&before=${enc(before)}` : ''}`,
      { signal },
    ),

  visited: (personId: string) => call<VisitedAddress[]>(`/people/${enc(personId)}/visited`),

  recordVisit: (personId: string, body: VisitRequest) =>
    call<Visit>(`/people/${enc(personId)}/visits`, { method: 'POST', body: JSON.stringify(body) }),
};

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
