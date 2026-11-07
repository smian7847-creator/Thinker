import { describe, expect, it } from 'vitest';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { editKeyMatches, hashEditKey, newEditKey } from './editkeys';
import { rateLimit } from './ratelimit';

describe('edit keys', () => {
  it('are long, random, and only ever stored hashed', () => {
    const a = newEditKey();
    const b = newEditKey();
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThanOrEqual(32);
    expect(hashEditKey(a)).not.toContain(a);
  });

  it('match only the key they were made from', () => {
    const key = newEditKey();
    const hash = hashEditKey(key);
    expect(editKeyMatches(key, hash)).toBe(true);
    expect(editKeyMatches(newEditKey(), hash)).toBe(false);
  });

  it.each([undefined, null, '', 42, { $ne: null }, ['x']])('reject %j', (bad) =>
    expect(editKeyMatches(bad, hashEditKey('anything'))).toBe(false),
  );

  it('reject everything when the site has no hash', () => expect(editKeyMatches('k', undefined)).toBe(false));
});

describe('rateLimit', () => {
  const call = (mw: ReturnType<typeof rateLimit>, ip: string, method = 'POST') => {
    let status = 200;
    const res = { setHeader() {}, end() {}, set statusCode(s: number) { status = s; } } as unknown as ServerResponse;
    const req = { method, headers: {}, socket: { remoteAddress: ip } } as unknown as IncomingMessage;
    let passed = false;
    mw(req, res, () => (passed = true));
    return passed ? 200 : status;
  };

  it('lets the limit through, then refuses with 429', () => {
    const mw = rateLimit('tests', 3, 60_000);
    expect([1, 2, 3, 4].map(() => call(mw, '10.0.0.1'))).toEqual([200, 200, 200, 429]);
  });

  it('counts each client separately and never limits reads', () => {
    const mw = rateLimit('tests', 1, 60_000);
    expect(call(mw, '10.0.0.1')).toBe(200);
    expect(call(mw, '10.0.0.2')).toBe(200);
    expect(call(mw, '10.0.0.1')).toBe(429);
    expect(call(mw, '10.0.0.1', 'GET')).toBe(200);
  });
});
