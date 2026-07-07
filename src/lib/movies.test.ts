import { describe, it, expect } from 'vitest';
import { partitionMovies, byRank } from './movies';
import type { UserMovie } from './types';

function um(partial: Partial<UserMovie> & { id: string }): UserMovie {
  return {
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
  it('splits watched vs watchlist by completed flag', () => {
    const movies = [
      um({ id: '1', completed: 1 }),
      um({ id: '2', completed: 0 }),
      um({ id: '3', completed: null }),
    ];
    const { watched, watchlist } = partitionMovies(movies);
    expect(watched.map((m) => m.id)).toEqual(['1']);
    expect(watchlist.map((m) => m.id).sort()).toEqual(['2', '3']);
  });

  it('sorts each group by rank with unranked last', () => {
    const movies = [
      um({ id: 'a', completed: 0, rank: 3 }),
      um({ id: 'b', completed: 0, rank: null }),
      um({ id: 'c', completed: 0, rank: 1 }),
    ];
    const { watchlist } = partitionMovies(movies);
    expect(watchlist.map((m) => m.id)).toEqual(['c', 'a', 'b']);
  });
});

describe('byRank', () => {
  it('orders lower rank first, null last', () => {
    expect(byRank(um({ id: '1', rank: 1 }), um({ id: '2', rank: 2 }))).toBeLessThan(0);
    expect(byRank(um({ id: '1', rank: null }), um({ id: '2', rank: 5 }))).toBeGreaterThan(0);
  });
});
