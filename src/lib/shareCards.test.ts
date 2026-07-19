import { describe, expect, it } from 'vitest';
import {
  buildShareData,
  handleFromEmail,
  type ShareCategory,
} from './shareCards';
import type { UserMovie, UserTVShow } from './types';

function movie(title: string, rank: number | null, opts?: Partial<UserMovie>): UserMovie {
  return {
    id: title,
    on_watchlist: false,
    on_rankings: rank != null,
    rank,
    completed: null,
    notes: null,
    completed_at: null,
    created_at: '',
    updated_at: '',
    movie: {
      id: title,
      title,
      imdb: '',
      release_date: null,
      rating_imdb: null,
      runtime: null,
      language: null,
      rated: null,
      poster_url: null,
      year: 2000,
      genre: null,
      director: null,
      actors: null,
      plot: null,
    },
    ...opts,
  };
}

function show(title: string, rank: number | null): UserTVShow {
  return {
    id: title,
    on_watchlist: false,
    on_rankings: rank != null,
    rank,
    notes: null,
    completed_at: null,
    status: null,
    freeze: null,
    created_at: '',
    updated_at: '',
    tv_show: {
      id: title,
      title,
      imdb: null,
      tvmaze: null,
      status: null,
      poster_url: null,
      year: 2010,
      genre: null,
      network: null,
      runtime: null,
      rating: null,
    },
  };
}

describe('handleFromEmail', () => {
  it('uses the lowercased local part', () => {
    expect(handleFromEmail('AdamLeonard9@gmail.com')).toBe('adamleonard9');
  });
  it('falls back when empty', () => {
    expect(handleFromEmail('@x.com')).toBe('me');
  });
});

describe('buildShareData', () => {
  it('takes the top five by rank, best first', () => {
    const movies = [
      movie('Seventh', 7),
      movie('First', 1),
      movie('Third', 3),
      movie('Second', 2),
      movie('Fifth', 5),
      movie('Fourth', 4),
      movie('Sixth', 6),
    ];
    const data = buildShareData({ email: 'a@b.c', movies });
    expect(data.shelves).toHaveLength(1);
    expect(data.shelves[0].top.map((e) => e.title)).toEqual([
      'First',
      'Second',
      'Third',
      'Fourth',
      'Fifth',
    ]);
    expect(data.shelves[0].rankedCount).toBe(7);
  });

  it('ignores unranked and watchlist-only trackers', () => {
    const movies = [
      movie('Ranked', 1),
      movie('ToRank', null, { on_rankings: true }),
      movie('Queued', null, { on_watchlist: true }),
    ];
    const data = buildShareData({ email: 'a@b.c', movies });
    expect(data.shelves[0].top.map((e) => e.title)).toEqual(['Ranked']);
  });

  it('drops shelves with nothing ranked but keeps their count at zero', () => {
    const data = buildShareData({
      email: 'a@b.c',
      movies: [movie('Only', 1)],
      shows: [show('Unranked', null)],
    });
    expect(data.shelves.map((s) => s.category)).toEqual<ShareCategory[]>([
      'movies',
    ]);
    expect(data.totalRanked).toBe(1);
  });

  it('labels games as Video Games and totals ranked across shelves', () => {
    const data = buildShareData({
      email: 'a@b.c',
      movies: [movie('M', 1), movie('M2', 2)],
      shows: [show('S', 1)],
    });
    expect(data.totalRanked).toBe(3);
  });
});
