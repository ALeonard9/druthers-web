import type { UserMovie } from './types';
import { hasToken } from './filterParams';

const RANK_MAX = 1e9;

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
 * The lowest rank actually present in a placed list — the floor the rankings
 * pager may scroll to.
 *
 * The API's contract is 1-based, but legacy rows imported from the old site
 * can carry a 0-based rank (see druthers-api backfill_rank_base). The board
 * windows by rank, so anchoring that window on a hardcoded 1 filtered those
 * rows out of every page *and* left them unreachable — invisible, but still
 * counted in the total, so the pager read "Showing #1–#25 of 340" while
 * rendering 24 rows. Anchoring on the data instead degrades gracefully
 * whatever the ranks turn out to be. Pure — safe to test.
 */
export function lowestPlacedRank(placed: UserMovie[]): number {
  const ranks = placed.map((m) => m.rank).filter((r): r is number => r != null);
  return ranks.length ? Math.min(...ranks) : 1;
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
