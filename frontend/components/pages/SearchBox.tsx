'use client';

import { useState } from 'react';
import { about } from '@thinker/shared';
import type { Tab } from '@/hooks/useTab';

/** A search field that opens about:search, used on the start and results pages. */
export function SearchBox({ tab, initial = '', placeholder }: { tab: Tab; initial?: string; placeholder: string }) {
  const [q, setQ] = useState(initial);
  return (
    <form
      className="searchbox"
      onSubmit={(e) => {
        e.preventDefault();
        if (q.trim()) tab.navigate(about('search', { q: q.trim() }), 'typed');
      }}
    >
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} aria-label="Search" />
      <button className="primary">Search</button>
    </form>
  );
}
