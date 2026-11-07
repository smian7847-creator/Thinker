import { normalizeAddress, Target, targetToString } from '@thinker/shared';
import { api } from './api';
import { cacheRevision } from './revisions';
import type { Snapshot, TabEntry } from './snapshot';

/** What the address bar shows for a target. */
export function addressOf(target: Target): string {
  return target.kind === 'site' ? target.address : targetToString(target);
}

/** Fetch what a target shows. Nothing is committed to history until this resolves. */
export async function loadSnapshot(target: Target, personId: string, signal: AbortSignal): Promise<Snapshot> {
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

/** Where a visit to this entry is recorded, if it is somewhere on the web at all. */
export function visitTargetOf(e: TabEntry): { address: string; revisionId: string | null } | null {
  const s = e.snapshot;
  if (s.kind === 'site') return { address: e.address, revisionId: s.revisionId };
  if (s.kind === 'nowhere') {
    const address = normalizeAddress(s.input);
    return address ? { address, revisionId: null } : null;
  }
  return null;
}
