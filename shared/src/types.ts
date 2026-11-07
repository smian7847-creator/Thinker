/** How someone arrived at an address. Recorded on every visit. */
export type Via =
  | 'typed'
  | 'link'
  | 'back'
  | 'forward'
  | 'history'
  | 'search'
  | 'reload'
  | 'publish'
  | 'start';

export const VIAS: Via[] = ['typed', 'link', 'back', 'forward', 'history', 'search', 'reload', 'publish', 'start'];

export interface Person {
  id: string;
  name: string;
  blurb: string;
}

export interface SiteSummary {
  address: string;
  title: string;
  authorId: string;
  authorName: string;
  revision: number;
  updatedAt: string;
}

/** One immutable published version of a site. Edits add revisions. */
export interface Revision {
  id: string;
  address: string;
  n: number;
  title: string;
  /** Sanitized HTML, ready to be placed in the sandboxed frame. */
  html: string;
  authorId: string;
  authorName: string;
  createdAt: string;
}

export interface Visit {
  id: string;
  personId: string;
  address: string;
  /** Null when the address led nowhere. */
  revisionId: string | null;
  title: string | null;
  via: Via;
  from: string | null;
  at: string;
}

export interface VisitPage {
  items: Visit[];
  next: string | null;
}

export interface VisitedAddress {
  address: string;
  count: number;
  last: string;
}

export interface SearchHit {
  address: string;
  title: string;
  authorName: string;
  snippet: string;
  score: number;
}

export interface SearchResult {
  q: string;
  terms: string[];
  hits: SearchHit[];
}
