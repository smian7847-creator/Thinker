import { describe, expect, it } from 'vitest';
import { canGoBack, canGoForward, createSession, current, Entry, push, traverse, updateEntry } from './session';

let n = 0;
const entry = (address: string, scrollY = 0): Entry<string> => ({
  key: `k${++n}`,
  personId: 'ada',
  address,
  snapshot: `${address}@1`,
  scrollY,
});

const walk = (...addresses: string[]) =>
  addresses.slice(1).reduce((s, a) => push(s, entry(a)), createSession('s', entry(addresses[0])));

describe('session history', () => {
  it('starts with nowhere to go', () => {
    const s = createSession('s', entry('a.zz'));
    expect(canGoBack(s)).toBe(false);
    expect(canGoForward(s)).toBe(false);
  });

  it('walks a trail four deep, back to the start and forward again', () => {
    let s = walk('a.zz', 'b.zz', 'c.zz', 'd.zz');
    expect(current(s).address).toBe('d.zz');
    for (const expected of ['c.zz', 'b.zz', 'a.zz']) {
      const r = traverse(s, s.index - 1);
      expect(r.direction).toBe('back');
      s = r.session;
      expect(current(s).address).toBe(expected);
    }
    expect(canGoBack(s)).toBe(false);
    expect(canGoForward(s)).toBe(true);
    for (const expected of ['b.zz', 'c.zz', 'd.zz']) {
      const r = traverse(s, s.index + 1);
      expect(r.direction).toBe('forward');
      s = r.session;
      expect(current(s).address).toBe(expected);
    }
    expect(canGoForward(s)).toBe(false);
  });

  it('loses forward when you navigate somewhere new from the middle', () => {
    let s = walk('a.zz', 'b.zz', 'c.zz', 'd.zz');
    s = traverse(s, 1).session;
    s = push(s, entry('x.zz'));
    expect(s.entries.map((e) => e.address)).toEqual(['a.zz', 'b.zz', 'x.zz']);
    expect(canGoForward(s)).toBe(false);
  });

  it('returns the very entry that was left, not a fresh one', () => {
    let s = walk('a.zz', 'b.zz');
    const left = current(s);
    s = updateEntry(s, left.key, { scrollY: 420 });
    s = push(s, entry('c.zz'));
    s = traverse(s, 1).session;
    expect(current(s).key).toBe(left.key);
    expect(current(s).scrollY).toBe(420);
    expect(current(s).snapshot).toBe('b.zz@1');
  });

  it('keeps separate entries for repeat visits to the same address', () => {
    const s = walk('a.zz', 'b.zz', 'a.zz');
    expect(new Set(s.entries.map((e) => e.key)).size).toBe(3);
  });

  it('refuses to traverse outside the list', () => {
    const s = walk('a.zz', 'b.zz');
    expect(() => traverse(s, 2)).toThrow(RangeError);
    expect(() => traverse(s, -1)).toThrow(RangeError);
  });

  it('does not mutate the session it was given', () => {
    const s = walk('a.zz', 'b.zz', 'c.zz');
    const before = JSON.stringify(s);
    push(traverse(s, 0).session, entry('z.zz'));
    expect(JSON.stringify(s)).toBe(before);
  });
});
