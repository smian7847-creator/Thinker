'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { parseTyped } from '@thinker/shared';
import type { Tab } from '@/hooks/useTab';

const BADGE = {
  site: { className: 'web', label: 'zz' },
  nowhere: { className: 'nowhere', label: '∅' },
  internal: { className: 'internal', label: '⌂' },
} as const;

/**
 * Shows where the tab is (or is going). Typing replaces that until you press
 * Enter or Escape; anything that isn't an address becomes a search.
 */
export function AddressBar({ tab }: { tab: Tab }) {
  const { entry, pending } = tab;
  const [draft, setDraft] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  // A new entry (or a traversal) replaces whatever was being typed.
  useEffect(() => setDraft(null), [entry?.key]);

  // Ctrl/Cmd+L focuses the address bar, as everywhere else.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        input.current?.focus();
        input.current?.select();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const target = parseTyped(draft ?? '');
    if (!target) return;
    setDraft(null);
    input.current?.blur();
    tab.navigate(target, 'typed');
  };

  const kind = entry?.snapshot.kind;
  const badge = kind === 'site' ? BADGE.site : kind === 'nowhere' ? BADGE.nowhere : BADGE.internal;

  return (
    <form className="address" onSubmit={submit}>
      <span className={`scheme ${badge.className}`}>{badge.label}</span>
      <input
        ref={input}
        value={draft ?? pending ?? entry?.address ?? ''}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={(e) => e.target.select()}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setDraft(null);
            e.currentTarget.blur();
          }
        }}
        placeholder="Type an address like tidepool.zz, or search"
        spellCheck={false}
        autoComplete="off"
        aria-label="Address"
      />
    </form>
  );
}
