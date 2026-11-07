'use client';

import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { buildFrameDocument, FrameMessage, randomToken } from './frame-document';

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
 *     script-src 'nonce-…'       the only script that runs is ours.
 *                                Author <script> and on* handlers do not,
 *                                even if one slipped past the sanitizer.
 *     style-src 'unsafe-inline'  authors may style their own page.
 *     base-uri / form-action 'none'
 *
 * Why allow-scripts at all: to follow links without letting the frame
 * navigate itself, and to report scroll so back can return to it. See
 * frame-document.ts for that script.
 *
 * What it costs authors: no JavaScript, no forms, no images or web fonts, no
 * embeds. They keep HTML, inline CSS, and links to addresses.
 */

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
    const srcDoc = buildFrameDocument({ html, title, token, nonce: randomToken(), ...initial.current });
    return { token, srcDoc };
    // generation forces a rebuild after a reset.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [html, title, generation]);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      // Only our frame, only our script (the token was never visible to author code).
      if (e.source !== ref.current?.contentWindow) return;
      const m = e.data as FrameMessage | null;
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
      // A fresh element per document: changing srcdoc on a live iframe would
      // add an entry to the tab's joint session history.
      key={token}
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
