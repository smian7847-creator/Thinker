'use client';

import type { Tab } from '@/hooks/useTab';

/**
 * Who is browsing. There are no accounts: picking a name decides whose
 * history the visits go into. Switching hands the tab to someone else.
 */
export function PersonPicker({ tab }: { tab: Tab }) {
  return (
    <label className="person" title="Who is browsing">
      <span aria-hidden>●</span>
      <select value={tab.personId ?? ''} onChange={(e) => tab.switchPerson(e.target.value)} aria-label="Browsing as">
        {tab.people.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    </label>
  );
}
