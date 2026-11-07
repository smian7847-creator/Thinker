import { describe, expect, it } from 'vitest';
import { snippet } from './snippet';

describe('snippet', () => {
  it('cuts around the first match, not around a longer word that starts the same', () => {
    const text = 'The keeper was tidy. ' + 'filler '.repeat(60) + 'Spring tides open the pools.';
    const s = snippet(text, ['tides'], 80);
    expect(s).toContain('Spring tides');
    expect(s.startsWith('…')).toBe(true);
  });

  it('starts at the beginning when nothing matches', () => {
    expect(snippet('Short and sweet.', ['absent'])).toBe('Short and sweet.');
  });
});
