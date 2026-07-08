import type { UserMovie } from './types';

const RANK_MAX = 1e9;

export function byRank(a: UserMovie, b: UserMovie): number {
  return (a.rank ?? RANK_MAX) - (b.rank ?? RANK_MAX);
}

/**
 * Split a user's tracked movies into two independent lists:
 *  - watchlist: movies flagged on_watchlist (order by title)
 *  - rankings:  movies flagged on_rankings, ordered by rank
 * A movie may appear in both. Pure — safe to unit test.
 */
export function partitionMovies(movies: UserMovie[]): {
  watchlist: UserMovie[];
  rankings: UserMovie[];
} {
  const watchlist = movies
    .filter((m) => m.on_watchlist)
    .sort((a, b) => a.movie.title.localeCompare(b.movie.title));
  const rankings = movies.filter((m) => m.on_rankings).sort(byRank);
  return { watchlist, rankings };
}
