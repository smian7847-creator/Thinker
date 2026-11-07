/**
 * How a search query is split into terms and how a term is found in text.
 * The backend uses this to place snippets and the frontend to highlight
 * them, so both always agree on what matched.
 */

const STOPWORDS = new Set(
  'a an and are as at be but by for from has have i in is it its of on or that the this to was were will with'.split(' '),
);

/** The words a query is made of, as a person would highlight them. */
export function queryTerms(q: string): string[] {
  const words = q.toLowerCase().match(/[\p{L}\p{N}']+/gu) ?? [];
  return [...new Set(words.filter((w) => w.length > 1 && !STOPWORDS.has(w)))];
}

/**
 * A regex source matching a term and its simple inflections: "tides" finds
 * "tide" and "tided" but not "tidepool" or "tidiest".
 */
export function termPattern(term: string): string {
  const stem = term.replace(/(ing|ed|es|s)$/, '') || term;
  // "tides" stems to "tid", so the optional "e" brings back "tide".
  return `${stem.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:e|es|s|ed|d|ing)?`;
}
