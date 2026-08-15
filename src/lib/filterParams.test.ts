import { describe, it, expect } from 'vitest';
import { parseFilterParams, optionsFrom, optionsWithCounts, hasToken } from './filterParams';

describe('parseFilterParams', () => {
  it('reports no filter for empty params', () => {
    const { filters, filterValues, hasFilter } = parseFilterParams({});
    expect(hasFilter).toBe(false);
    expect(filters.q).toBeUndefined();
    expect(filters.yearMin).toBeUndefined();
    expect(filterValues.q).toBe('');
    expect(filterValues.genre).toBe('');
  });

  it('coerces numeric params and passes text through', () => {
    const { filters } = parseFilterParams({
      q: 'Nolan',
      genre: 'Sci-Fi',
      yearMin: '2010',
      yearMax: '2013',
      ratingMin: '7.5',
    });
    expect(filters).toMatchObject({
      q: 'Nolan',
      genre: 'Sci-Fi',
      yearMin: 2010,
      yearMax: 2013,
      ratingMin: 7.5,
    });
  });

  it('parses the domain-specific fields', () => {
    const { filters } = parseFilterParams({
      rated: 'PG-13',
      runtimeMax: '90',
      status: 'Ended',
      watchStatus: 'behind',
      pagesMax: '300',
      platform: 'Switch',
      hundred: '1',
    });
    expect(filters).toMatchObject({
      rated: 'PG-13',
      runtimeMax: 90,
      status: 'Ended',
      watchStatus: 'behind',
      pagesMax: 300,
      platform: 'Switch',
      hundred: true,
    });
  });

  it('treats the 100% flag as set only for "1"', () => {
    expect(parseFilterParams({ hundred: '1' }).filters.hundred).toBe(true);
    expect(parseFilterParams({ hundred: '0' }).filters.hundred).toBeUndefined();
    expect(parseFilterParams({}).filters.hundred).toBeUndefined();
  });

  it('drops non-numeric numeric params rather than passing NaN to the filter', () => {
    const { filters } = parseFilterParams({ yearMin: 'abc', runtimeMax: '' });
    expect(filters.yearMin).toBeUndefined();
    expect(filters.runtimeMax).toBeUndefined();
  });

  it('flags hasFilter for any single field, shared or domain-specific', () => {
    expect(parseFilterParams({ genre: 'Drama' }).hasFilter).toBe(true);
    expect(parseFilterParams({ pagesMax: '300' }).hasFilter).toBe(true);
    expect(parseFilterParams({ hundred: '1' }).hasFilter).toBe(true);
  });

  it('keeps the raw strings for the form even when numerically invalid', () => {
    // The form should show back what the user typed, so they can correct it.
    expect(parseFilterParams({ yearMin: 'abc' }).filterValues.yearMin).toBe('abc');
  });
});

describe('optionsFrom', () => {
  it('splits comma-joined values into distinct sorted tokens', () => {
    expect(
      optionsFrom(['Drama, Crime', 'Crime, Thriller', null, '', 'Drama']),
    ).toEqual(['Crime', 'Drama', 'Thriller']);
  });

  it('trims whitespace around tokens', () => {
    expect(optionsFrom(['  PS4 ,PC  ', 'PC'])).toEqual(['PC', 'PS4']);
  });

  it('returns an empty list when nothing is populated', () => {
    expect(optionsFrom([null, undefined, ''])).toEqual([]);
  });
});

describe('hasToken', () => {
  it('matches a whole token, case-insensitively', () => {
    expect(hasToken('Drama, Science-Fiction, Thriller', 'Science-Fiction')).toBe(true);
    expect(hasToken('Drama, Science-Fiction', 'science-fiction')).toBe(true);
  });

  it('does not match a partial token', () => {
    // "Action" must not match "Action-Adventure" - the reason this replaced
    // the old substring filter.
    expect(hasToken('Action-Adventure, Indie', 'Action')).toBe(false);
  });

  it('is false for missing fields', () => {
    expect(hasToken(null, 'Drama')).toBe(false);
    expect(hasToken('', 'Drama')).toBe(false);
  });
});

describe('optionsWithCounts', () => {
  it('labels each option with how many items carry it, sorted alphabetically', () => {
    expect(
      optionsWithCounts(['Drama, Crime', 'Crime, Thriller', 'Crime']),
    ).toEqual([
      { value: 'Crime', label: 'Crime (3)' },
      { value: 'Drama', label: 'Drama (1)' },
      { value: 'Thriller', label: 'Thriller (1)' },
    ]);
  });

  it('drops tokens with no letters', () => {
    // Open Library mixes author life-dates into its subject list; "1856-1915"
    // is not a genre and must not reach the dropdown.
    expect(
      optionsWithCounts(['Fiction, 1856-1915', '1920-1990']).map((o) => o.value),
    ).toEqual(['Fiction']);
    expect(optionsFrom(['Fiction, 1856-1915'])).toEqual(['Fiction']);
  });
});
