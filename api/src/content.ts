import sanitizeHtml from 'sanitize-html';

/**
 * Layer one of containment: an allowlist applied when a page is published.
 *
 * Authors keep structure, prose, links, tables and their own CSS. They lose
 * scripts, event handlers, forms, embeds, frames, images, <meta>, <base> and
 * any href that isn't an address or an ordinary web URL. Losing the outside
 * web costs nothing here: the browser shows such links as leading nowhere.
 *
 * This layer is not what keeps the page in its box; the sandboxed, CSP-locked
 * frame in web/components/PageFrame.tsx is. This layer means the stored HTML
 * only ever contains things we have decided to render.
 */
const ALLOWED_TAGS = [
  'style',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr', 'div', 'span',
  'section', 'article', 'header', 'footer', 'nav', 'main', 'aside',
  'a', 'em', 'strong', 'b', 'i', 'u', 's', 'small', 'sub', 'sup', 'mark',
  'abbr', 'cite', 'q', 'time', 'code', 'kbd', 'samp', 'var', 'pre', 'blockquote',
  'ul', 'ol', 'li', 'dl', 'dt', 'dd',
  'table', 'caption', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'colgroup', 'col',
  'figure', 'figcaption', 'details', 'summary', 'center', 'font',
];

const SANITIZE: sanitizeHtml.IOptions = {
  allowedTags: ALLOWED_TAGS,
  allowedAttributes: {
    '*': ['class', 'id', 'title', 'lang', 'dir', 'style', 'align'],
    a: ['href', 'name'],
    ol: ['start', 'reversed', 'type'],
    td: ['colspan', 'rowspan'],
    th: ['colspan', 'rowspan', 'scope'],
    col: ['span'],
    time: ['datetime'],
    details: ['open'],
    font: ['color', 'face', 'size'],
  },
  // zz: is ours; http(s) survive only so the browser can say they lead nowhere.
  allowedSchemes: ['zz', 'http', 'https'],
  allowedSchemesByTag: {},
  allowProtocolRelative: false,
  // <style> is "vulnerable" for a page rendered in-line with the app. Ours is
  // rendered in an opaque-origin frame whose CSP forbids every fetch, so CSS
  // can restyle the author's own page and nothing else.
  allowVulnerableTags: true,
  disallowedTagsMode: 'discard',
};

export const MAX_SOURCE_BYTES = 200_000;

export function sanitize(source: string): string {
  return sanitizeHtml(source, SANITIZE).trim();
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", nbsp: ' ', apos: "'" };

/** Plain text of a page, for search and snippets. */
export function extractText(html: string): string {
  const spaced = html.replace(/<\/?(p|div|h\d|li|dt|dd|br|tr|td|th|section|article|blockquote|pre|header|footer|nav|aside)\b[^>]*>/gi, ' $&');
  const stripped = sanitizeHtml(spaced, {
    allowedTags: [],
    allowedAttributes: {},
    nonTextTags: ['style', 'script', 'textarea', 'option', 'noscript', 'title'],
  });
  return stripped
    .replace(/&(#?\w+);/g, (m, e: string) => ENTITIES[e] ?? m)
    .replace(/\s+/g, ' ')
    .trim();
}

const STOPWORDS = new Set(
  'a an and are as at be but by for from has have i in is it its of on or that the this to was were will with'.split(' '),
);

/** The words a query is made of, as a person would highlight them. */
export function queryTerms(q: string): string[] {
  const words = q.toLowerCase().match(/[\p{L}\p{N}']+/gu) ?? [];
  return [...new Set(words.filter((w) => w.length > 1 && !STOPWORDS.has(w)))];
}

// Rough stemming so a search for "tides" highlights "tide" and "tidal" does not.
function stem(term: string): string {
  return term.replace(/(ing|ed|es|s)$/, '') || term;
}

/** A window of text around the first place the query terms occur. */
export function snippet(text: string, terms: string[], width = 200): string {
  if (!text) return '';
  let at = -1;
  for (const t of terms) {
    const re = new RegExp(`\\b${stem(t).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:s|es|d|ed|ing)?\\b`, 'i');
    const m = re.exec(text);
    if (m && (at < 0 || m.index < at)) at = m.index;
  }
  if (at < 0) at = 0;
  let start = Math.max(0, at - Math.floor(width / 3));
  if (start > 0) {
    const space = text.indexOf(' ', start);
    if (space >= 0 && space < at) start = space + 1;
  }
  let end = Math.min(text.length, start + width);
  if (end < text.length) {
    const space = text.lastIndexOf(' ', end);
    if (space > at) end = space;
  }
  return `${start > 0 ? '… ' : ''}${text.slice(start, end)}${end < text.length ? ' …' : ''}`;
}
