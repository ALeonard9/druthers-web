import { describe, it, expect } from 'vitest';
import { partitionCountries, untrackedCountries } from './countries';
import type { Country, UserCountry } from './types';

function country(id: string, title = `Country ${id}`): Country {
  return {
    id: `country-${id}`,
    title,
    country_code: id,
    region: null,
    subregion: null,
    capital: null,
    population: null,
    flag_emoji: null,
    flag_url: null,
  };
}

function uc(partial: Partial<UserCountry> & { id: string }): UserCountry {
  return {
    on_watchlist: false,
    on_rankings: false,
    rank: null,
    completed: 0,
    notes: null,
    first_visited: null,
    created_at: '2020-01-01T00:00:00',
    updated_at: '2020-01-01T00:00:00',
    country: country(partial.id),
    ...partial,
  } as UserCountry;
}

describe('partitionCountries', () => {
  it('splits bucket list, placed visited, and the to-rank bucket', () => {
    const countries = [
      uc({ id: 'jp', on_rankings: true, rank: 1 }),
      uc({ id: 'is', on_watchlist: true }),
      uc({ id: 'nl', on_rankings: true, rank: null }),
    ];
    const { bucketList, visitedPlaced, visitedUnplaced } =
      partitionCountries(countries);
    expect(bucketList.map((c) => c.id)).toEqual(['is']);
    expect(visitedPlaced.map((c) => c.id)).toEqual(['jp']);
    expect(visitedUnplaced.map((c) => c.id)).toEqual(['nl']);
  });

  it('orders placed visited countries by rank', () => {
    const countries = [
      uc({ id: 'a', on_rankings: true, rank: 3 }),
      uc({ id: 'c', on_rankings: true, rank: 1 }),
      uc({ id: 'b', on_rankings: true, rank: 2 }),
    ];
    const { visitedPlaced } = partitionCountries(countries);
    expect(visitedPlaced.map((c) => c.id)).toEqual(['c', 'b', 'a']);
  });
});

describe('untrackedCountries', () => {
  it('returns catalog countries not on either list, sorted by title', () => {
    const catalog = [
      country('jp', 'Japan'),
      country('is', 'Iceland'),
      country('nl', 'Netherlands'),
    ];
    const tracked = [uc({ id: 'jp' })];
    tracked[0].country = catalog[0];
    const out = untrackedCountries(catalog, tracked);
    expect(out.map((c) => c.title)).toEqual(['Iceland', 'Netherlands']);
  });
});
