'use client';

import { ReactNode, useEffect, useLayoutEffect, useRef } from 'react';
import type { PageProps } from './types';

const SAVE_DELAY_MS = 150;

/**
 * A scrolling page of our own whose position is kept on its entry, so going
 * back to it lands where it was left.
 */
export function Scroller({
  tab,
  entry,
  ready = true,
  className,
  children,
}: PageProps & {
  /** False while content is still loading; the position is restored once it is true. */
  ready?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const restored = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useLayoutEffect(() => {
    if (!ready || restored.current || !ref.current) return;
    restored.current = true;
    ref.current.scrollTop = entry.scrollY;
  }, [ready, entry.scrollY]);

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <div
      ref={ref}
      className="scroller"
      onScroll={(e) => {
        const y = Math.round(e.currentTarget.scrollTop);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => tab.patchEntry(entry.key, { scrollY: y }), SAVE_DELAY_MS);
      }}
    >
      <div className={className ? `internal ${className}` : 'internal'}>{children}</div>
    </div>
  );
}
