'use client';

import { memo, useEffect, useMemo, useRef, useState } from 'react';

/**
 * Layer two of containment, and the one that holds: published HTML is put in
 * an iframe that is a different, opaque origin with almost no powers.
 *
 *   sandbox="allow-scripts"   (and nothing else)
 *     - no allow-same-origin: the frame's origin is "null". It cannot read or
 *       touch this document, our cookies, our storage, or call our API as us.
 *     - no allow-top-navigation: it cannot move the tab anywhere.
 *     - no allow-forms, allow-popups, allow-modals: no posting, no windows,
 *       no alert() boxes drawn over our chrome.
 *
 *   Content-Security-Policy, first thing in the frame's <head>:
 *     default-src 'none'         nothing is ever fetched: no images, fonts,
 *                                stylesheets, beacons, or :visited sniffing
 *                                that phones home.
 *     script-src 'nonce-…'       the only script that runs is ours, below.
 *                                Author <script> and on* handlers do not,
 *                                even if one slipped past the sanitizer.
 *     style-src 'unsafe-inline'  authors may style their own page.
 *     base-uri / form-action 'none'
 *
 * Why allow-scripts at all: to follow links without letting the frame
 * navigate itself. Our script catches every click on an <a>, cancels it, and
 * posts the raw href up; the parent decides what it means (parseHref). It
 * also reports scroll so "back" can put you where you were. A frame that
 * navigated itself would also add entries to the tab's joint history behind
 * our back, which is why even #fragment links are handled in-script.
 *
 * What it costs authors: no JavaScript, no forms, no images or web fonts, no
 * embeds. They keep HTML, inline CSS, and links to addresses.
 */

const FRAME_CSS = `
html { color-scheme: light; }
body { margin: 8px; font-family: Georgia, 'Times New Roman', serif; line-height: 1.5; }
:where(a) { color: #1a4fd6; cursor: pointer; }
:where(a.zz-visited) { color: #6b2fa3; }
`;

// Runs inside the frame. Kept small and dependency-free; it is a string.
function frameScript(token: string, scrollY: number, visited: string[]): string {
  return `(function () {
  var TOKEN = ${JSON.stringify(token)};
  var VISITED = ${JSON.stringify(visited)};
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
  // Report scroll position: at most every 400ms while scrolling, and always
  // once it settles, so the last position is never lost.
  var timer = null, lastSent = 0;
  function report() { lastSent = Date.now(); post({ type: 'scroll', y: Math.round(window.scrollY) }); }
  window.addEventListener('scroll', function () {
    clearTimeout(timer);
    timer = setTimeout(report, 120);
    if (Date.now() - lastSent > 400) report();
  }, { passive: true });

  // Restore the position we were left at. The frame is its own process and
  // learns its size after it loads, so early on there is nothing to scroll;
  // keep trying until the page is tall enough, unless the reader moves first.
  var TARGET = ${Math.max(0, Math.round(scrollY))}, tries = 0, done = TARGET === 0;
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

function buildDocument(html: string, token: string, nonce: string, scrollY: number, visited: string[], title: string) {
  const csp = [
    "default-src 'none'",
    `script-src 'nonce-${nonce}'`,
    "style-src 'unsafe-inline'",
    'img-src data:',
    "base-uri 'none'",
    "form-action 'none'",
  ].join('; ');
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
  return `<!doctype html><html><head><meta http-equiv="Content-Security-Policy" content="${csp}"><meta charset="utf-8"><title>${esc(title)}</title><style>${FRAME_CSS}</style><script nonce="${nonce}">${frameScript(token, scrollY, visited)}</script></head><body>${html}</body></html>`;
}

function randomToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('');
}

export interface PageFrameProps {
  html: string;
  title: string;
  /** Scroll position to restore when the frame loads. Read once, on mount. */
  scrollY?: number;
  visited?: string[];
  onLink?: (href: string) => void;
  onScroll?: (y: number) => void;
}

function PageFrameImpl({ html, title, scrollY = 0, visited = [], onLink, onScroll }: PageFrameProps) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [generation, setGeneration] = useState(0);
  const loads = useRef(0);
  const handlers = useRef({ onLink, onScroll });
  handlers.current = { onLink, onScroll };

  // Built once per mount (and per reset): later changes to scroll or visited
  // must not rebuild the document, or it would reload under the reader.
  const initial = useRef({ scrollY, visited });
  const { token, srcDoc } = useMemo(() => {
    const token = randomToken();
    const nonce = randomToken();
    return { token, srcDoc: buildDocument(html, token, nonce, initial.current.scrollY, initial.current.visited, title) };
  }, [html, title, generation]);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      // Only our frame, only our script (the token was never visible to author code).
      if (e.source !== ref.current?.contentWindow) return;
      const m = e.data;
      if (!m || typeof m !== 'object' || m.token !== token) return;
      if (m.type === 'link' && typeof m.href === 'string') handlers.current.onLink?.(m.href);
      if (m.type === 'scroll' && typeof m.y === 'number') handlers.current.onScroll?.(m.y);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [token]);

  useEffect(() => {
    loads.current = 0;
  }, [srcDoc]);

  return (
    <iframe
      // A fresh element per page: changing srcdoc on a live iframe would add
      // an entry to the tab's joint session history.
      key={`${token}`}
      ref={ref}
      className="page-frame"
      title={title}
      sandbox="allow-scripts"
      referrerPolicy="no-referrer"
      srcDoc={srcDoc}
      onLoad={() => {
        // The document we wrote loads once. A second load means the frame
        // navigated itself somewhere; put the page back.
        loads.current += 1;
        if (loads.current > 1) setGeneration((g) => g + 1);
      }}
    />
  );
}

export const PageFrame = memo(PageFrameImpl);
