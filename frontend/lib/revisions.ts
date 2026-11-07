import type { Revision } from '@thinker/shared';
import { api } from './api';

/** Revisions never change, so once fetched they can be kept for the life of the tab. */
const cache = new Map<string, Revision>();

export function cacheRevision(r: Revision) {
  cache.set(r.id, r);
}

export function cachedRevision(id: string): Revision | undefined {
  return cache.get(id);
}

export async function loadRevision(id: string, signal?: AbortSignal): Promise<Revision> {
  const hit = cache.get(id);
  if (hit) return hit;
  const r = await api.revision(id, signal);
  cache.set(id, r);
  return r;
}
