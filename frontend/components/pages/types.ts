import type { Snapshot, SnapshotOf, TabEntry } from '@/lib/snapshot';
import type { Tab } from '@/hooks/useTab';

/** Every page gets the tab it is in and the entry it is showing. */
export interface PageProps {
  tab: Tab;
  entry: TabEntry;
}

/** A page that shows one kind of snapshot. */
export type SnapshotPageProps<K extends Snapshot['kind']> = PageProps & { snap: SnapshotOf<K> };
