import type { UserVideoGame } from './types';

const RANK_MAX = 1e9;

export interface GameFilters {
  q?: string; // matches title, platforms
  genre?: string;
  yearMin?: number;
  yearMax?: number;
  ratingMin?: number; // IGDB ratings are 0-100
}

/** Filter tracked games by text (title/platforms), genre, year, rating. */
export function filterGames(games: UserVideoGame[], f: GameFilters): UserVideoGame[] {
  const q = f.q?.trim().toLowerCase();
  const genre = f.genre?.trim().toLowerCase();
  return games.filter((ug) => {
    const g = ug.game;
    if (q) {
      const hay = [g.title, g.platforms].filter(Boolean).join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (genre && !(g.genre ?? '').toLowerCase().includes(genre)) return false;
    if (f.yearMin != null && (g.year == null || g.year < f.yearMin)) return false;
    if (f.yearMax != null && (g.year == null || g.year > f.yearMax)) return false;
    if (f.ratingMin != null && (g.rating == null || g.rating < f.ratingMin))
      return false;
    return true;
  });
}

export function byRank(a: UserVideoGame, b: UserVideoGame): number {
  return (a.rank ?? RANK_MAX) - (b.rank ?? RANK_MAX);
}

/**
 * Split a user's tracked games into the lists the UI renders:
 *  - watchlist:      on_watchlist (backlog), by title
 *  - rankingsPlaced: on_rankings with a rank position, ordered by rank
 *  - rankingsUnplaced: on_rankings but not yet positioned ("to rank" bucket)
 * A game may appear in the backlog and the rankings. Pure — safe to test.
 */
export function partitionGames(games: UserVideoGame[]): {
  watchlist: UserVideoGame[];
  rankingsPlaced: UserVideoGame[];
  rankingsUnplaced: UserVideoGame[];
} {
  const watchlist = games
    .filter((g) => g.on_watchlist)
    .sort((a, b) => a.game.title.localeCompare(b.game.title));
  const ranked = games.filter((g) => g.on_rankings);
  const rankingsPlaced = ranked.filter((g) => g.rank != null).sort(byRank);
  const rankingsUnplaced = ranked
    .filter((g) => g.rank == null)
    .sort((a, b) => a.game.title.localeCompare(b.game.title));
  return { watchlist, rankingsPlaced, rankingsUnplaced };
}
