import { describe, it, expect } from 'vitest';
import { partitionGames, byRank, filterGames } from './games';
import type { UserVideoGame } from './types';

function ug(partial: Partial<UserVideoGame> & { id: string }): UserVideoGame {
  return {
    on_watchlist: false,
    on_rankings: false,
    rank: null,
    completed: 0,
    notes: null,
    is_100_percent: false,
    created_at: '2020-01-01T00:00:00',
    updated_at: '2020-01-01T00:00:00',
    game: {
      id: `game-${partial.id}`,
      title: `Game ${partial.id}`,
      igdb: null,
      poster_url: null,
      rating: null,
      time_to_beat: null,
      slug: null,
      year: null,
      genre: null,
      platforms: null,
    },
    ...partial,
  } as UserVideoGame;
}

describe('partitionGames', () => {
  it('splits the backlog, placed rankings, and the to-rank bucket', () => {
    const games = [
      ug({ id: '1', on_rankings: true, rank: 1 }),
      ug({ id: '2', on_watchlist: true }),
      ug({ id: '3', on_watchlist: true, on_rankings: true, rank: 2 }),
      ug({ id: '4', on_rankings: true, rank: null }),
    ];
    const { watchlist, rankingsPlaced, rankingsUnplaced } = partitionGames(games);
    expect(watchlist.map((g) => g.id).sort()).toEqual(['2', '3']);
    expect(rankingsPlaced.map((g) => g.id)).toEqual(['1', '3']);
    expect(rankingsUnplaced.map((g) => g.id)).toEqual(['4']);
  });

  it('orders placed rankings by rank', () => {
    const games = [
      ug({ id: 'a', on_rankings: true, rank: 3 }),
      ug({ id: 'c', on_rankings: true, rank: 1 }),
      ug({ id: 'b', on_rankings: true, rank: 2 }),
    ];
    const { rankingsPlaced } = partitionGames(games);
    expect(rankingsPlaced.map((g) => g.id)).toEqual(['c', 'b', 'a']);
  });
});

describe('filterGames', () => {
  const games = [
    ug({ id: '1', on_watchlist: true }),
    ug({ id: '2', on_watchlist: true }),
  ];
  games[0].game = {
    ...games[0].game,
    title: 'Breath of the Wild',
    platforms: 'Switch, WiiU',
    genre: 'Adventure, RPG',
    year: 2017,
    rating: 92.5,
  };
  games[1].game = {
    ...games[1].game,
    title: 'Hades',
    platforms: 'PC, Switch',
    genre: 'Roguelike',
    year: 2020,
    rating: 88.1,
  };

  it('matches text across title and platforms', () => {
    expect(filterGames(games, { q: 'wild' }).map((g) => g.id)).toEqual(['1']);
    expect(filterGames(games, { q: 'pc' }).map((g) => g.id)).toEqual(['2']);
    expect(filterGames(games, { q: 'switch' })).toHaveLength(2);
  });

  it('filters by genre, year range, and min rating (0-100 scale)', () => {
    expect(filterGames(games, { genre: 'rogue' }).map((g) => g.id)).toEqual(['2']);
    expect(filterGames(games, { yearMin: 2018 }).map((g) => g.id)).toEqual(['2']);
    expect(filterGames(games, { ratingMin: 90 }).map((g) => g.id)).toEqual(['1']);
  });
});

describe('byRank', () => {
  it('orders lower rank first, null last', () => {
    expect(byRank(ug({ id: '1', rank: 1 }), ug({ id: '2', rank: 2 }))).toBeLessThan(0);
    expect(
      byRank(ug({ id: '1', rank: null }), ug({ id: '2', rank: 5 })),
    ).toBeGreaterThan(0);
  });
});
