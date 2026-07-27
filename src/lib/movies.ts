import type { UserMovie } from './types';
import { hasToken } from './filterParams';

const RANK_MAX = 1e9;

/**
 * How many of the top ranked titles the poster deck on /movies runs through.
 * Lives here rather than beside the component because RankedPosterDeck is a
 * client module — a server component importing a plain value out of one gets a
 * client reference back, not the number.
 */
export const DECK_SIZE = 25;

export interface MovieFilters {
  q?: string; // matches title, director, actors
  genre?: string;
  yearMin?: number;
  yearMax?: number;
  ratingMin?: number;
  rated?: string; // MPAA certificate (G, PG, PG-13, R, NC-17, NR)
  runtimeMax?: number; // minutes
}

/**
 * Filter tracked movies by text (title/director/cast), genre, year, rating,
 * MPAA certificate and runtime.
 */
export function filterMovies(
  movies: UserMovie[],
  f: MovieFilters,
): UserMovie[] {
  const q = f.q?.trim().toLowerCase();
  return movies.filter((um) => {
    const m = um.movie;
    if (q) {
      const hay = [m.title, m.director, m.actors]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (f.genre && !hasToken(m.genre, f.genre)) return false;
    if (f.yearMin != null && (m.year == null || m.year < f.yearMin)) return false;
    if (f.yearMax != null && (m.year == null || m.year > f.yearMax)) return false;
    if (
      f.ratingMin != null &&
      (m.rating_tmdb == null || m.rating_tmdb < f.ratingMin)
    )
      return false;
    if (f.rated && (m.rated ?? '').toLowerCase() !== f.rated.toLowerCase())
      return false;
    if (f.runtimeMax != null && (m.runtime == null || m.runtime > f.runtimeMax))
      return false;
    return true;
  });
}

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
