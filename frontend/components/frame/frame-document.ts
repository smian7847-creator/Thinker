/**
 * The document a published page is shown in. See PageFrame.tsx for why the
 * frame is shaped this way; this file is what goes inside it.
 */

/** Messages our in-frame script sends up to the browser. */
export type FrameMessage =
  | { type: 'link'; href: string; token: string }
  | { type: 'scroll'; y: number; token: string };

/** Nothing may be fetched, and only the script carrying this render's nonce may run. */
function contentSecurityPolicy(nonce: string): string {
  return [
    "default-src 'none'",
    `script-src 'nonce-${nonce}'`,
    "style-src 'unsafe-inline'",
    'img-src data:',
    "base-uri 'none'",
    "form-action 'none'",
  ].join('; ');
}

/** Defaults under the author's CSS: :where() has no specificity, so any author rule wins. */
const FRAME_CSS = `
html { color-scheme: light; }
body { margin: 8px; font-family: Georgia, 'Times New Roman', serif; line-height: 1.5; }
:where(a) { color: #1a4fd6; cursor: pointer; }
:where(a.zz-visited) { color: #6b2fa3; }
`;

/**
 * Runs inside the frame. It is a string, so it stays small and plain ES5.
 *
 * - Every click on a link is cancelled and its raw href posted up; the
 *   browser decides what it means. #fragment links scroll in place, because
 *   a frame that navigates itself adds entries to the tab's history.
 * - Scroll position is reported, at most every 400ms and always once it
 *   settles, so back can return to it.
 * - The saved position is restored. The frame learns its size after it
 *   loads, so it keeps trying until the page is tall enough, unless the
 *   reader moves first.
 * - Links to addresses this person has visited are marked.
 */
function frameScript(token: string, scrollY: number, visited: string[]): string {
  return `(function () {
  var TOKEN = ${JSON.stringify(token)};
  var VISITED = ${JSON.stringify(visited)};
  var TARGET = ${Math.max(0, Math.round(scrollY))};

  function post(m) { m.token = TOKEN; parent.postMessage(m, '*'); }
  function norm(h) {
    h = (h || '').trim().toLowerCase();
    if (h.indexOf('zz://') === 0) h = h.slice(5);
    return h.replace(/\\/+$/, '');
  }

  function onClick(e) {
    var a = e.target && e.target.closest ? e.target.closest('a') : null;
    if (!a) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.type !== 'click' && e.button !== 1) return;
    var href = a.getAttribute('href');
    if (href == null) return;
    if (href.charAt(0) === '#') {
      var id = decodeURIComponent(href.slice(1));
      var el = id ? (document.getElementById(id) || document.getElementsByName(id)[0]) : document.body;
      if (el) el.scrollIntoView();
      return;
    }
    post({ type: 'link', href: href });
  }
  document.addEventListener('click', onClick, true);
  document.addEventListener('auxclick', onClick, true);

  var timer = null, lastSent = 0;
  function report() { lastSent = Date.now(); post({ type: 'scroll', y: Math.round(window.scrollY) }); }
  window.addEventListener('scroll', function () {
    clearTimeout(timer);
    timer = setTimeout(report, 120);
    if (Date.now() - lastSent > 400) report();
  }, { passive: true });

  var tries = 0, done = TARGET === 0;
  function stop() { done = true; }
  ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(function (t) { window.addEventListener(t, stop, { passive: true }); });
  function restore() {
    if (done) return;
    window.scrollTo(0, TARGET);
    if (Math.abs(window.scrollY - TARGET) <= 1 || ++tries > 100) done = true;
    else setTimeout(restore, 20);
  }
  window.addEventListener('resize', restore);
  window.addEventListener('load', restore);

  function ready() {
    var seen = {};
    for (var i = 0; i < VISITED.length; i++) seen[VISITED[i]] = true;
    var links = document.querySelectorAll('a[href]');
    for (var j = 0; j < links.length; j++) {
      if (seen[norm(links[j].getAttribute('href'))]) links[j].classList.add('zz-visited');
    }
    restore();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready); else ready();
})();`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
}

export function randomToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('');
}

export interface FrameDocumentOptions {
  html: string;
  title: string;
  /** Proves a message came from our script; author code never sees it. */
  token: string;
  nonce: string;
  scrollY: number;
  visited: string[];
}

/** The CSP comes first in <head>, so it is in force before any author markup is parsed. */
export function buildFrameDocument(o: FrameDocumentOptions): string {
  return (
    '<!doctype html><html><head>' +
    `<meta http-equiv="Content-Security-Policy" content="${contentSecurityPolicy(o.nonce)}">` +
    '<meta charset="utf-8">' +
    `<title>${escapeHtml(o.title)}</title>` +
    `<style>${FRAME_CSS}</style>` +
    `<script nonce="${o.nonce}">${frameScript(o.token, o.scrollY, o.visited)}</script>` +
    `</head><body>${o.html}</body></html>`
  );
}
