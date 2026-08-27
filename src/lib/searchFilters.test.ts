import { describe, expect, it } from 'vitest';
import {
  filterKeysForDomain,
  parseSearchQuery,
  serializeSearchQuery,
  suggestFilterKeys,
} from './searchFilters';

describe('parseSearchQuery', () => {
  it('returns empty filters and trimmed text for a plain query', () => {
    const result = parseSearchQuery('Dune');
    expect(result.filters).toEqual([]);
    expect(result.freeText).toBe('Dune');
  });

  it('extracts a single key:value filter', () => {
    const result = parseSearchQuery('director:Nolan');
    expect(result.filters).toEqual([{ key: 'director', value: 'Nolan' }]);
    expect(result.freeText).toBe('');
  });

  it('extracts multiple key:value filters', () => {
    const result = parseSearchQuery('director:Nolan genre:sci-fi');
    expect(result.filters).toEqual([
      { key: 'director', value: 'Nolan' },
      { key: 'genre', value: 'sci-fi' },
    ]);
    expect(result.freeText).toBe('');
  });

  it('handles quoted values with spaces', () => {
    const result = parseSearchQuery('director:"Christopher Nolan"');
    expect(result.filters).toEqual([{ key: 'director', value: 'Christopher Nolan' }]);
    expect(result.freeText).toBe('');
  });

  it('mixes filters with free text', () => {
    const result = parseSearchQuery('director:Nolan Dune');
    expect(result.filters).toEqual([{ key: 'director', value: 'Nolan' }]);
    expect(result.freeText).toBe('Dune');
  });

  it('mixes multiple filters with free text', () => {
    const result = parseSearchQuery('director:Nolan genre:sci-fi Dune 2021');
    expect(result.filters).toEqual([
      { key: 'director', value: 'Nolan' },
      { key: 'genre', value: 'sci-fi' }],
    );
    expect(result.freeText).toBe('Dune 2021');
  });

  it('rejects unrecognised keys as free text', () => {
    const result = parseSearchQuery('foo:bar Dune', 'movies');
    expect(result.filters).toEqual([]);
    expect(result.freeText).toContain('foo:bar');
    expect(result.freeText).toContain('Dune');
  });

  it('rejects keys with empty values as free text', () => {
    const result = parseSearchQuery('director: Dune');
    expect(result.filters).toEqual([]);
    expect(result.freeText).toContain('director:');
  });

  it('is case-sensitive on keys', () => {
    const result = parseSearchQuery('Director:Nolan', 'movies');
    expect(result.filters).toEqual([]);
    expect(result.freeText).toBe('Director:Nolan');
  });

  it('filters by domain scope', () => {
    // 'network' is a tv-only key, not in movies
    const movieResult = parseSearchQuery('network:HBO', 'movies');
    expect(movieResult.filters).toEqual([]);
    expect(movieResult.freeText).toBe('network:HBO');

    const tvResult = parseSearchQuery('network:HBO', 'tv');
    expect(tvResult.filters).toEqual([{ key: 'network', value: 'HBO' }]);
    expect(tvResult.freeText).toBe('');
  });

  it('handles the "all" scope with the global key set', () => {
    const result = parseSearchQuery('director:Nolan actor:Hammer', 'all');
    expect(result.filters).toEqual([
      { key: 'director', value: 'Nolan' },
      { key: 'actor', value: 'Hammer' },
    ]);
    expect(result.freeText).toBe('');
  });

  it('handles empty input', () => {
    const result = parseSearchQuery('');
    expect(result.filters).toEqual([]);
    expect(result.freeText).toBe('');
  });

  it('handles input that is only whitespace', () => {
    const result = parseSearchQuery('   ');
    expect(result.filters).toEqual([]);
    expect(result.freeText).toBe('');
  });

  it('handles a colon in free text without a valid key pattern', () => {
    // A bare colon not preceded by a word character should not parse as a filter
    const result = parseSearchQuery(':value');
    expect(result.filters).toEqual([]);
    expect(result.freeText).toBe(':value');
  });
});

describe('serializeSearchQuery', () => {
  it('returns just free text when no filters', () => {
    expect(serializeSearchQuery([], 'Dune')).toBe('Dune');
  });

  it('serializes a single filter', () => {
    expect(serializeSearchQuery([{ key: 'director', value: 'Nolan' }], '')).toBe('director:Nolan');
  });

  it('quotes values containing spaces', () => {
    expect(
      serializeSearchQuery([{ key: 'director', value: 'Christopher Nolan' }], ''),
    ).toBe('director:"Christopher Nolan"');
  });

  it('combines filters and free text', () => {
    expect(
      serializeSearchQuery(
        [{ key: 'director', value: 'Nolan' }],
        'Dune',
      ),
    ).toBe('director:Nolan Dune');
  });

  it('round-trips through parseSearchQuery', () => {
    const input = 'director:Nolan genre:sci-fi Dune';
    const parsed = parseSearchQuery(input, 'all');
    const serialized = serializeSearchQuery(parsed.filters, parsed.freeText);
    expect(serialized).toBe(input);
  });
});

describe('filterKeysForDomain', () => {
  it('returns movie-specific keys for movies', () => {
    const keys = filterKeysForDomain('movies');
    expect(keys).toContain('director');
    expect(keys).toContain('actor');
    expect(keys).toContain('genre');
    expect(keys).toContain('year');
    expect(keys).toContain('rating');
  });

  it('returns tv-specific keys for tv', () => {
    const keys = filterKeysForDomain('tv');
    expect(keys).toContain('network');
    expect(keys).toContain('genre');
    expect(keys).toContain('status');
  });

  it('returns book-specific keys for books', () => {
    const keys = filterKeysForDomain('books');
    expect(keys).toContain('author');
    expect(keys).toContain('subject');
  });

  it('returns game-specific keys for games', () => {
    const keys = filterKeysForDomain('games');
    expect(keys).toContain('developer');
    expect(keys).toContain('platform');
  });

  it('returns the superset for "all"', () => {
    const keys = filterKeysForDomain('all');
    expect(keys).toContain('director');
    expect(keys).toContain('network');
    expect(keys).toContain('author');
    expect(keys).toContain('developer');
  });
});

describe('suggestFilterKeys', () => {
  it('returns all keys matching a prefix', () => {
    const suggestions = suggestFilterKeys('d', 'movies');
    expect(suggestions).toContain('director');
  });

  it('returns empty array when nothing matches', () => {
    const suggestions = suggestFilterKeys('zzz', 'movies');
    expect(suggestions).toEqual([]);
  });

  it('matches case-insensitively', () => {
    const suggestions = suggestFilterKeys('D', 'movies');
    expect(suggestions).toContain('director');
  });

  it('returns full key when prefix matches exactly', () => {
    const suggestions = suggestFilterKeys('director', 'movies');
    expect(suggestions).toEqual(['director']);
  });

  it('returns multiple matches for ambiguous prefix', () => {
    const suggestions = suggestFilterKeys('g', 'movies');
    expect(suggestions).toEqual(['genre']);
    // 'year' does not start with 'g'
    expect(suggestions).not.toContain('year');
  });

  it('uses global keys for "all" scope', () => {
    const suggestions = suggestFilterKeys('n', 'all');
    expect(suggestions).toContain('network');
  });
});
