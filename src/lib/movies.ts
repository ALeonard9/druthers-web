import type { UserMovie } from './types';

const RANK_MAX = 1e9;

export function byRank(a: UserMovie, b: UserMovie): number {
  return (a.rank ?? RANK_MAX) - (b.rank ?? RANK_MAX);
}

/**
 * Split a user's tracked movies into the lists the UI renders:
 *  - watchlist:      on_watchlist, by title
 *  - rankingsPlaced: on_rankings with a rank position, ordered by rank
 *  - rankingsUnplaced: on_rankings but not yet positioned ("to rank" bucket)
 * A movie may appear in the watchlist and the rankings. Pure — safe to test.
 */
export function partitionMovies(movies: UserMovie[]): {
  watchlist: UserMovie[];
  rankingsPlaced: UserMovie[];
  rankingsUnplaced: UserMovie[];
} {
  const watchlist = movies
    .filter((m) => m.on_watchlist)
    .sort((a, b) => a.movie.title.localeCompare(b.movie.title));
  const ranked = movies.filter((m) => m.on_rankings);
  const rankingsPlaced = ranked.filter((m) => m.rank != null).sort(byRank);
  const rankingsUnplaced = ranked
    .filter((m) => m.rank == null)
    .sort((a, b) => a.movie.title.localeCompare(b.movie.title));
  return { watchlist, rankingsPlaced, rankingsUnplaced };
}
