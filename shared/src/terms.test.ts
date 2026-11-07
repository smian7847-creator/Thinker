import { describe, expect, it } from 'vitest';
import { queryTerms, termPattern } from './terms';

describe('queryTerms', () => {
  it('drops stopwords and repeats', () => expect(queryTerms('The tides of the bay, the tides')).toEqual(['tides', 'bay']));
});

describe('termPattern', () => {
  const finds = (term: string, word: string) => new RegExp(`^${termPattern(term)}$`, 'i').test(word);

  it.each(['tide', 'tides', 'tided', 'Tides'])('"tides" finds %s', (w) => expect(finds('tides', w)).toBe(true));
  it.each(['tidepool', 'tidiest', 'tidal'])('"tides" does not find %s', (w) => expect(finds('tides', w)).toBe(false));
  it('escapes regex characters', () => expect(finds('c++', 'c++')).toBe(true));
});
