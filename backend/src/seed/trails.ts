import { parseHref, Via } from '@thinker/shared';

/**
 * Deterministic browsing: people wander the seeded link graph using a seeded
 * random number generator, so the same seed always produces the same hour.
 */

export interface Step {
  personId: string;
  address: string;
  via: Via;
  from: string | null;
  /** Seconds after the start of the hour. */
  t: number;
}

// mulberry32: tiny, fast, and the same everywhere.
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Outgoing links from each page that point at addresses, real or not. */
export function linkGraph(pages: Record<string, string>): Record<string, string[]> {
  const graph: Record<string, string[]> = {};
  for (const [address, html] of Object.entries(pages)) {
    const out = new Set<string>();
    for (const m of html.matchAll(/href="([^"]*)"/g)) {
      const t = parseHref(m[1]);
      if (t?.kind === 'site' && t.address !== address) out.add(t.address);
    }
    graph[address] = [...out].sort();
  }
  return graph;
}

interface WalkOptions {
  personId: string;
  start: string;
  startVia?: Via;
  steps: number;
  /** Seconds after the hour began. */
  at: number;
  pBack: number;
  /** Prefer links not followed yet: the person who goes everywhere. */
  explore?: boolean;
}

export function walk(graph: Record<string, string[]>, random: () => number, o: WalkOptions): Step[] {
  const steps: Step[] = [];
  const stack: string[] = [];
  const seen = new Set<string>();
  let t = o.at;
  const emit = (address: string, via: Via, from: string | null) => {
    steps.push({ personId: o.personId, address, via, from, t: Math.round(t) });
    seen.add(address);
    t += 25 + random() * 95;
  };

  emit(o.start, o.startVia ?? 'typed', null);
  stack.push(o.start);
  while (steps.length < o.steps) {
    const here = stack[stack.length - 1];
    const links = graph[here];
    const deadEnd = !links || links.length === 0;
    if (stack.length > 1 && (deadEnd || random() < o.pBack)) {
      stack.pop();
      emit(stack[stack.length - 1], 'back', null);
      continue;
    }
    if (deadEnd) break;
    const fresh = o.explore ? links.filter((l) => !seen.has(l)) : [];
    const pool = fresh.length ? fresh : links;
    const next = pool[Math.floor(random() * pool.length)];
    emit(next, 'link', here);
    stack.push(next);
  }
  return steps;
}
