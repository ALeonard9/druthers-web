import { describe, it, expect } from 'vitest';
import { partitionMovies, byRank } from './movies';
import type { UserMovie } from './types';

function um(partial: Partial<UserMovie> & { id: string }): UserMovie {
  return {
    on_watchlist: false,
    on_rankings: false,
    rank: null,
    completed: 0,
    notes: null,
    created_at: '2020-01-01T00:00:00',
    updated_at: '2020-01-01T00:00:00',
    movie: {
      id: `movie-${partial.id}`,
      title: `Movie ${partial.id}`,
      imdb: `tt${partial.id}`,
      release_date: null,
      rating_imdb: null,
      runtime: null,
      language: null,
      rated: null,
      poster_url: null,
    },
    ...partial,
  } as UserMovie;
}

describe('partitionMovies', () => {
  it('splits into independent watchlist and rankings lists', () => {
    const movies = [
      um({ id: '1', on_rankings: true, rank: 1 }),
      um({ id: '2', on_watchlist: true }),
      // on both lists at once
      um({ id: '3', on_watchlist: true, on_rankings: true, rank: 2 }),
    ];
    const { watchlist, rankings } = partitionMovies(movies);
    expect(watchlist.map((m) => m.id).sort()).toEqual(['2', '3']);
    expect(rankings.map((m) => m.id)).toEqual(['1', '3']);
  });

  it('orders rankings by rank, unranked last', () => {
    const movies = [
      um({ id: 'a', on_rankings: true, rank: 3 }),
      um({ id: 'b', on_rankings: true, rank: null }),
      um({ id: 'c', on_rankings: true, rank: 1 }),
    ];
    const { rankings } = partitionMovies(movies);
    expect(rankings.map((m) => m.id)).toEqual(['c', 'a', 'b']);
  });
});

describe('byRank', () => {
  it('orders lower rank first, null last', () => {
    expect(byRank(um({ id: '1', rank: 1 }), um({ id: '2', rank: 2 }))).toBeLessThan(0);
    expect(byRank(um({ id: '1', rank: null }), um({ id: '2', rank: 5 }))).toBeGreaterThan(0);
  });
});
