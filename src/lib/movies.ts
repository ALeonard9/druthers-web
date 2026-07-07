import type { UserMovie } from './types';

const RANK_MAX = 1e9;

export function byRank(a: UserMovie, b: UserMovie): number {
  return (a.rank ?? RANK_MAX) - (b.rank ?? RANK_MAX);
}

/**
 * Split a user's tracked movies into watched (completed === 1) and watchlist,
 * each sorted by rank (unranked last). Pure — safe to unit test.
 */
export function partitionMovies(movies: UserMovie[]): {
  watched: UserMovie[];
  watchlist: UserMovie[];
} {
  const watched = movies.filter((m) => m.completed === 1).sort(byRank);
  const watchlist = movies.filter((m) => m.completed !== 1).sort(byRank);
  return { watched, watchlist };
}
