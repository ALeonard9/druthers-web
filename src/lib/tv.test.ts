import { describe, it, expect } from 'vitest';
import { partitionShows, byRank, filterShows } from './tv';
import type { UserTVShow } from './types';

function us(partial: Partial<UserTVShow> & { id: string }): UserTVShow {
  return {
    on_watchlist: false,
    on_rankings: false,
    rank: null,
    notes: null,
    status: null,
    freeze: 0,
    created_at: '2020-01-01T00:00:00',
    updated_at: '2020-01-01T00:00:00',
    tv_show: {
      id: `show-${partial.id}`,
      title: `Show ${partial.id}`,
      imdb: null,
      tvmaze: null,
      status: null,
      poster_url: null,
      year: null,
      genre: null,
      network: null,
      runtime: null,
      rating: null,
    },
    ...partial,
  } as UserTVShow;
}

describe('partitionShows', () => {


  it('orders placed rankings by rank', () => {
    const shows = [
      us({ id: 'a', on_rankings: true, rank: 3 }),
      us({ id: 'c', on_rankings: true, rank: 1 }),
      us({ id: 'b', on_rankings: true, rank: 2 }),
    ];
    const { rankingsPlaced } = partitionShows(shows);
    expect(rankingsPlaced.map((s) => s.id)).toEqual(['c', 'b', 'a']);
  });
});

describe('filterShows', () => {
  const shows = [
    us({ id: '1', on_watchlist: true }),
    us({ id: '2', on_watchlist: true }),
    us({ id: '3', on_watchlist: true }),
  ];
  shows[0].tv_show = {
    ...shows[0].tv_show,
    title: 'Severance',
    network: 'Apple TV+',
    genre: 'Drama, Science-Fiction',
    year: 2022,
    rating: 8.7,
  };
  shows[1].tv_show = {
    ...shows[1].tv_show,
    title: 'Bluey',
    network: 'ABC',
    genre: 'Children',
    year: 2018,
    rating: 8.6,
  };
  shows[2].tv_show = {
    ...shows[2].tv_show,
    title: 'Andor',
    network: 'Disney+',
    genre: 'Action, Adventure, Science-Fiction',
    year: 2022,
    rating: 8.4,
  };

  it('matches text across title and network', () => {
    expect(filterShows(shows, { q: 'sever' }).map((s) => s.id)).toEqual(['1']);
    expect(filterShows(shows, { q: 'disney' }).map((s) => s.id)).toEqual(['3']);
  });

  it('filters by genre, year range, and min rating', () => {
    expect(
      // Whole-token match: 'Science-Fiction' hits, the partial 'science' does not.
      filterShows(shows, { genre: 'Science-Fiction' }).map((s) => s.id).sort(),
    ).toEqual(['1', '3']);
    expect(
      filterShows(shows, { yearMin: 2020, yearMax: 2023 }).map((s) => s.id).sort(),
    ).toEqual(['1', '3']);
    expect(filterShows(shows, { ratingMin: 8.5 }).map((s) => s.id).sort()).toEqual([
      '1',
      '2',
    ]);
  });
});

describe('byRank', () => {
  it('orders lower rank first, null last', () => {
    expect(byRank(us({ id: '1', rank: 1 }), us({ id: '2', rank: 2 }))).toBeLessThan(0);
    expect(
      byRank(us({ id: '1', rank: null }), us({ id: '2', rank: 5 })),
    ).toBeGreaterThan(0);
  });
});

describe('filterShows — TV-specific fields', () => {
  const shows = [
    us({
      id: '1',
      on_watchlist: true,
      watch_status: 'behind',
      tv_show: {
        id: 's1', title: 'Running Behind', imdb: null, tvmaze: null,
        status: 'Running', poster_url: null, year: 2020,
        genre: 'Drama', network: 'HBO', runtime: 60, rating: 8,
      },
    }),
    us({
      id: '2',
      on_watchlist: true,
      watch_status: 'complete',
      tv_show: {
        id: 's2', title: 'Ended Complete', imdb: null, tvmaze: null,
        status: 'Ended', poster_url: null, year: 2015,
        genre: 'Comedy', network: 'NBC', runtime: 22, rating: 7,
      },
    }),
  ];

  it('filters by the show’s run status', () => {
    expect(filterShows(shows, { status: 'Ended' }).map((s) => s.id)).toEqual(['2']);
    expect(filterShows(shows, { status: 'running' }).map((s) => s.id)).toEqual(['1']);
  });

  it('filters by the viewer’s own progress', () => {
    expect(filterShows(shows, { watchStatus: 'behind' }).map((s) => s.id)).toEqual(['1']);
    expect(filterShows(shows, { watchStatus: 'not_started' })).toEqual([]);
  });

  it('combines run status with progress', () => {
    expect(
      filterShows(shows, { status: 'Running', watchStatus: 'complete' }),
    ).toEqual([]);
  });
});
