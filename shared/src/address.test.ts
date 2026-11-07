import { describe, expect, it } from 'vitest';
import { normalizeAddress, parseHref, parseTyped, targetToString } from './address';

describe('normalizeAddress', () => {
  it.each([
    ['tidepool.zz', 'tidepool.zz'],
    ['  TidePool.ZZ  ', 'tidepool.zz'],
    ['zz://tidepool.zz/', 'tidepool.zz'],
    ['notes.otto.zz', 'notes.otto.zz'],
    ['old-pier.zz', 'old-pier.zz'],
  ])('%s -> %s', (raw, expected) => expect(normalizeAddress(raw)).toBe(expected));

  it.each(['tidepool', 'tidepool.com', '-pier.zz', 'pier-.zz', 'a b.zz', '.zz', 'zz', 'tide_pool.zz', ''])(
    'rejects %j',
    (raw) => expect(normalizeAddress(raw)).toBeNull(),
  );
});

describe('parseTyped', () => {
  it('goes to addresses', () => expect(parseTyped('Kelp.zz')).toEqual({ kind: 'site', address: 'kelp.zz' }));
  it('searches for everything else', () =>
    expect(parseTyped('where do tides go')).toEqual({ kind: 'about', page: 'search', params: { q: 'where do tides go' } }));
  it('knows the real internet is not here', () =>
    expect(parseTyped('https://example.com')).toMatchObject({ kind: 'nowhere', reason: 'outside' }));
  it('opens about pages', () =>
    expect(parseTyped('about:history')).toEqual({ kind: 'about', page: 'history', params: {} }));
  it('round-trips about pages with params', () => {
    const t = parseTyped('about:search?q=salt+marsh')!;
    expect(targetToString(t)).toBe('about:search?q=salt+marsh');
  });
});

describe('parseHref', () => {
  it('follows addresses', () => expect(parseHref('zz://kelp.zz')).toEqual({ kind: 'site', address: 'kelp.zz' }));
  it('does not let authors link into the browser chrome', () =>
    expect(parseHref('about:history')).toMatchObject({ kind: 'nowhere', reason: 'malformed' }));
  it('treats javascript: as nowhere', () =>
    expect(parseHref('javascript:alert(1)')).toMatchObject({ kind: 'nowhere', reason: 'malformed' }));
  it('treats the outside world as nowhere', () =>
    expect(parseHref('http://evil.example')).toMatchObject({ kind: 'nowhere', reason: 'outside' }));
});
