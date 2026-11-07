import type { Entry, SearchResult, Session, Visit } from '@thinker/shared';

/**
 * What an entry looked like when it was shown, kept so that going back to it
 * shows the page that was left rather than whatever is there now.
 *
 * A site entry pins the revision id, not the address: if the author edits
 * the page after you leave, back still brings you the version you read.
 * Search and history entries keep their results for the same reason.
 */
export type Snapshot =
  | { kind: 'site'; revisionId: string; title: string }
  | { kind: 'nowhere'; input: string; reason: 'missing' | 'outside' | 'malformed' }
  | { kind: 'home' }
  | { kind: 'search'; result: SearchResult }
  | { kind: 'history'; items: Visit[]; next: string | null }
  | { kind: 'publish'; draft: Draft };

/** The snapshot of one kind, e.g. SnapshotOf<'site'>. */
export type SnapshotOf<K extends Snapshot['kind']> = Extract<Snapshot, { kind: K }>;

export interface Draft {
  authorId: string;
  address: string;
  title: string;
  html: string;
}

export type TabEntry = Entry<Snapshot>;
export type TabSession = Session<Snapshot>;

export function titleOf(e: TabEntry): string {
  const s = e.snapshot;
  switch (s.kind) {
    case 'site':
      return s.title;
    case 'nowhere':
      return 'Nowhere';
    case 'home':
      return 'Start';
    case 'search':
      return `${s.result.q} - Search`;
    case 'history':
      return 'History';
    case 'publish':
      return 'Publish';
  }
}
