/**
 * Addresses are the only thing typed into the address bar and the only thing
 * a site author can point at. Both halves of the app use these functions so
 * that the browser and the server never disagree about what an address is.
 */

export const SCHEME = 'zz://';

// One or more dot-separated labels ending in ".zz", e.g. "tidepool.zz" or
// "notes.otto.zz". Lowercase letters, digits and inner hyphens only.
const ADDRESS_RE = /^(?=.{4,63}$)(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+zz$/;

/** Canonical form of an address, or null if the input isn't one. */
export function normalizeAddress(raw: string): string | null {
  let s = raw.trim().toLowerCase();
  if (s.startsWith(SCHEME)) s = s.slice(SCHEME.length);
  s = s.replace(/\/+$/, '');
  return ADDRESS_RE.test(s) ? s : null;
}

export type AboutPage = 'home' | 'history' | 'search' | 'publish';
const ABOUT_PAGES: AboutPage[] = ['home', 'history', 'search', 'publish'];

export type Target =
  | { kind: 'site'; address: string }
  | { kind: 'about'; page: AboutPage; params: Record<string, string> }
  | { kind: 'nowhere'; input: string; reason: 'outside' | 'malformed' };

/** The string shown in the address bar for a target. */
export function targetToString(t: Target): string {
  switch (t.kind) {
    case 'site':
      return t.address;
    case 'about': {
      const qs = new URLSearchParams(t.params).toString();
      return `about:${t.page}${qs ? `?${qs}` : ''}`;
    }
    case 'nowhere':
      return t.input;
  }
}

export function about(page: AboutPage, params: Record<string, string> = {}): Target {
  return { kind: 'about', page, params };
}

function parseAbout(s: string): Target {
  const rest = s.slice('about:'.length);
  const [name, query = ''] = rest.split('?', 2);
  const page = name.toLowerCase() as AboutPage;
  if (!ABOUT_PAGES.includes(page)) return { kind: 'nowhere', input: s, reason: 'malformed' };
  const params: Record<string, string> = {};
  new URLSearchParams(query).forEach((v, k) => (params[k] = v));
  return { kind: 'about', page, params };
}

const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:/i;
// Something shaped like a hostname on the real internet: "example.com".
const OUTSIDE_HOST = /^[^\s/]+\.[a-z]{2,}(?:[/?#]\S*)?$/i;

/**
 * Interpret what someone typed into the address bar. Like every browser,
 * things that aren't addresses become searches.
 */
export function parseTyped(input: string): Target | null {
  const s = input.trim();
  if (!s) return null;
  if (/^about:/i.test(s)) return parseAbout(s);
  const address = normalizeAddress(s);
  if (address) return { kind: 'site', address };
  if (HAS_SCHEME.test(s) || OUTSIDE_HOST.test(s)) return { kind: 'nowhere', input: s, reason: 'outside' };
  return about('search', { q: s });
}

/**
 * Interpret an href found inside a page somebody published. Authors can point
 * at addresses and nothing else: not at the browser's own about: pages, and
 * not at the real internet, which this web doesn't have.
 */
export function parseHref(href: string): Target | null {
  const s = href.trim();
  if (!s) return null;
  const address = normalizeAddress(s);
  if (address) return { kind: 'site', address };
  if (/^(https?:|\/\/)/i.test(s)) return { kind: 'nowhere', input: s, reason: 'outside' };
  return { kind: 'nowhere', input: s, reason: 'malformed' };
}
