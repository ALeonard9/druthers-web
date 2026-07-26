import { describe, it, expect } from 'vitest';
import {
  partitionMovies,
  byRank,
  filterMovies,
  lowestPlacedRank,
} from './movies';
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
      rating_tmdb: null,
      runtime: null,
      language: null,
      rated: null,
      poster_url: null,
    },
    ...partial,
  } as UserMovie;
}

describe('partitionMovies', () => {
  it('splits watchlist, placed rankings, and the to-rank bucket', () => {
    const movies = [
      um({ id: '1', on_rankings: true, rank: 1 }),
      um({ id: '2', on_watchlist: true }),
      // on both lists at once
      um({ id: '3', on_watchlist: true, on_rankings: true, rank: 2 }),
      // added to rankings but not yet positioned
      um({ id: '4', on_rankings: true, rank: null }),
    ];
    const { watchlist, rankingsPlaced, rankingsUnplaced } =
      partitionMovies(movies);
    expect(watchlist.map((m) => m.id).sort()).toEqual(['2', '3']);
    expect(rankingsPlaced.map((m) => m.id)).toEqual(['1', '3']);
    expect(rankingsUnplaced.map((m) => m.id)).toEqual(['4']);
  });

  it('orders placed rankings by rank', () => {
    const movies = [
      um({ id: 'a', on_rankings: true, rank: 3 }),
      um({ id: 'c', on_rankings: true, rank: 1 }),
      um({ id: 'b', on_rankings: true, rank: 2 }),
    ];
    const { rankingsPlaced } = partitionMovies(movies);
    expect(rankingsPlaced.map((m) => m.id)).toEqual(['c', 'b', 'a']);
  });
});

describe('filterMovies', () => {
  const movies = [
    um({ id: '1', on_watchlist: true }),
    um({ id: '2', on_watchlist: true }),
    um({ id: '3', on_watchlist: true }),
  ];
  movies[0].movie = {
    ...movies[0].movie,
    title: 'Inception',
    director: 'Christopher Nolan',
    actors: 'Leonardo DiCaprio',
    genre: 'Sci-Fi',
    year: 2010,
    rating_imdb: null,
    rating_tmdb: 8.8,
    rated: 'PG-13',
    runtime: 148,
  };
  movies[1].movie = {
    ...movies[1].movie,
    title: 'The Notebook',
    director: 'Nick Cassavetes',
    genre: 'Romance',
    year: 2004,
    rating_imdb: null,
    rating_tmdb: 7.8,
  };
  movies[2].movie = {
    ...movies[2].movie,
    title: 'Dunkirk',
    director: 'Christopher Nolan',
    genre: 'War',
    year: 2017,
    rating_imdb: null,
    rating_tmdb: 7.8,
    rated: 'R',
    runtime: 106,
  };

  it('matches text across title, director, and cast', () => {
    expect(filterMovies(movies, { q: 'nolan' }).map((m) => m.id).sort()).toEqual([
      '1',
      '3',
    ]);
    expect(filterMovies(movies, { q: 'dicaprio' }).map((m) => m.id)).toEqual(['1']);
  });

  it('filters by genre, year range, and min rating', () => {
    // Genre comes from a dropdown of real values, so it matches a whole token;
    // a partial like 'sci' deliberately no longer matches 'Sci-Fi'.
    expect(filterMovies(movies, { genre: 'Sci-Fi' }).map((m) => m.id)).toEqual(['1']);
    expect(filterMovies(movies, { genre: 'sci' })).toEqual([]);
  });

  it('filters by MPAA certificate', () => {
    expect(filterMovies(movies, { rated: 'PG-13' }).map((m) => m.id)).toEqual(['1']);
    expect(filterMovies(movies, { rated: 'pg-13' }).map((m) => m.id)).toEqual(['1']);
    expect(filterMovies(movies, { rated: 'G' })).toEqual([]);
  });

  it('filters by max runtime, excluding movies with no runtime', () => {
    expect(filterMovies(movies, { runtimeMax: 120 }).map((m) => m.id)).toEqual(['3']);
    expect(filterMovies(movies, { runtimeMax: 150 }).map((m) => m.id).sort()).toEqual([
      '1',
      '3',
    ]);
    // movies[1] has no runtime, so a runtime filter must exclude it.
    expect(
      filterMovies(movies, { runtimeMax: 9999 }).map((m) => m.id),
    ).not.toContain('2');
    expect(
      filterMovies(movies, { yearMin: 2005, yearMax: 2018 }).map((m) => m.id).sort(),
    ).toEqual(['1', '3']);
    expect(filterMovies(movies, { ratingMin: 8 }).map((m) => m.id)).toEqual(['1']);
  });
});

describe('byRank', () => {
  it('orders lower rank first, null last', () => {
    expect(byRank(um({ id: '1', rank: 1 }), um({ id: '2', rank: 2 }))).toBeLessThan(0);
    expect(byRank(um({ id: '1', rank: null }), um({ id: '2', rank: 5 }))).toBeGreaterThan(0);
  });
});

describe('lowestPlacedRank', () => {
  const at = (rank: number | null): UserMovie =>
    ({ rank, movie: { title: 't' } }) as unknown as UserMovie;

  it('returns the lowest rank present', () => {
    expect(lowestPlacedRank([at(3), at(1), at(2)])).toBe(1);
  });

  it('returns 0 when a legacy 0-based rank is present', () => {
    // The bug this guards: a hardcoded floor of 1 filtered these rows out of
    // every window and left them unreachable (druthers-api backfill_rank_base).
    expect(lowestPlacedRank([at(0), at(1), at(2)])).toBe(0);
  });

  it('ignores unplaced rows and defaults to 1 when empty', () => {
    expect(lowestPlacedRank([at(null), at(4)])).toBe(4);
    expect(lowestPlacedRank([])).toBe(1);
    expect(lowestPlacedRank([at(null)])).toBe(1);
  });
});
