import { Collection, Db, MongoClient, ObjectId } from 'mongodb';
import type { Via } from '@thinker/shared';
import { config } from '../config';

export interface PersonDoc {
  _id: string;
  name: string;
  blurb: string;
}

/**
 * A site is an address someone owns and a pointer to its current revision.
 * The current revision's title and text are copied here so that search only
 * ever looks at what is published now.
 */
export interface SiteDoc {
  _id: string; // the address
  authorId: string;
  title: string;
  text: string;
  currentRevisionId: string;
  revisionCount: number;
  /** sha256 of the site's edit key; see sites/edit-keys.ts. */
  editKeyHash: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Revisions are immutable: an edit adds one, it never rewrites one. */
export interface RevisionDoc {
  _id: string; // `${address}@${n}`
  address: string;
  n: number;
  title: string;
  /** What the author submitted, kept so the sanitizer can be re-run later. */
  source: string;
  /** What browsers are given. */
  html: string;
  text: string;
  authorId: string;
  createdAt: Date;
}

export interface VisitDoc {
  _id: ObjectId;
  personId: string;
  address: string;
  revisionId: string | null;
  title: string | null;
  via: Via;
  from: string | null;
  at: Date;
}

export interface Collections {
  people: Collection<PersonDoc>;
  sites: Collection<SiteDoc>;
  revisions: Collection<RevisionDoc>;
  visits: Collection<VisitDoc>;
}

export function collections(db: Db): Collections {
  return {
    people: db.collection<PersonDoc>('people'),
    sites: db.collection<SiteDoc>('sites'),
    revisions: db.collection<RevisionDoc>('revisions'),
    visits: db.collection<VisitDoc>('visits'),
  };
}

export async function ensureIndexes(c: Collections): Promise<void> {
  await Promise.all([
    c.sites.createIndex(
      { title: 'text', text: 'text' },
      { name: 'site_text', weights: { title: 5, text: 1 }, default_language: 'english' },
    ),
    c.sites.createIndex({ authorId: 1 }),
    c.revisions.createIndex({ address: 1, n: -1 }, { unique: true }),
    c.visits.createIndex({ personId: 1, at: -1, _id: -1 }),
    c.visits.createIndex({ personId: 1, address: 1 }),
  ]);
}

export async function connect(url = config.mongoUrl): Promise<{ client: MongoClient; db: Db }> {
  const client = new MongoClient(url, { serverSelectionTimeoutMS: 5000 });
  await client.connect();
  return { client, db: client.db() };
}
