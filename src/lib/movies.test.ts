import { describe, it, expect } from 'vitest';
import { partitionMovies, byRank, filterMovies } from './movies';
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
    rating_imdb: 8.8,
  };
  movies[1].movie = {
    ...movies[1].movie,
    title: 'The Notebook',
    director: 'Nick Cassavetes',
    genre: 'Romance',
    year: 2004,
    rating_imdb: 7.8,
  };
  movies[2].movie = {
    ...movies[2].movie,
    title: 'Dunkirk',
    director: 'Christopher Nolan',
    genre: 'War',
    year: 2017,
    rating_imdb: 7.8,
  };

  it('matches text across title, director, and cast', () => {
    expect(filterMovies(movies, { q: 'nolan' }).map((m) => m.id).sort()).toEqual([
      '1',
      '3',
    ]);
    expect(filterMovies(movies, { q: 'dicaprio' }).map((m) => m.id)).toEqual(['1']);
  });

  it('filters by genre, year range, and min rating', () => {
    expect(filterMovies(movies, { genre: 'sci' }).map((m) => m.id)).toEqual(['1']);
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
