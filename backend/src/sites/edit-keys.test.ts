import { describe, expect, it } from 'vitest';
import { editKeyMatches, hashEditKey, newEditKey } from './edit-keys';

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
