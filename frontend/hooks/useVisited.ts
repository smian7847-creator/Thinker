'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Visit, VisitedAddress } from '@thinker/shared';
import { api } from '@/lib/api';

/**
 * The addresses a person has been shown pages at: what makes links purple
 * and the "been here before" line. It belongs to whoever is browsing.
 */
export function useVisited(personId: string | null) {
  const [visited, setVisited] = useState<Map<string, VisitedAddress>>(new Map());
  const owner = useRef<string | null>(null);
  const latest = useRef(visited);
  latest.current = visited;

  useEffect(() => {
    if (!personId) return;
    owner.current = personId;
    let live = true;
    api
      .visited(personId)
      .then((rows) => live && setVisited(new Map(rows.map((r) => [r.address, r]))))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [personId]);

  /** What this person's history held for an address, before now. */
  const before = useCallback(
    (forPerson: string, address: string): VisitedAddress | null =>
      owner.current === forPerson ? (latest.current.get(address) ?? null) : null,
    [],
  );

  /** Count a visit the server just recorded. */
  const add = useCallback((v: Visit) => {
    if (!v.revisionId || owner.current !== v.personId) return;
    setVisited((m) => {
      const next = new Map(m);
      next.set(v.address, { address: v.address, count: (m.get(v.address)?.count ?? 0) + 1, last: v.at });
      return next;
    });
  }, []);

  return { visited, before, add };
}
