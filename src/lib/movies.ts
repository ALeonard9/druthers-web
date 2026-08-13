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
  const watchlist = [...movies].sort((a, b) => a.movie.title.localeCompare(b.movie.title));
  const ranked = movies;
  const rankingsPlaced = ranked.filter((m) => m.rank != null).sort(byRank);
  const rankingsUnplaced = ranked
    .filter((m) => m.rank == null)
    .sort((a, b) => a.movie.title.localeCompare(b.movie.title));
  return { watchlist, rankingsPlaced, rankingsUnplaced };
}

export const RELEASE_WINDOW_DAYS = 7;

export function getReleaseDate(releaseDateStr?: string | null): Date | null {
  if (!releaseDateStr) return null;
  // Parse date string (e.g. YYYY-MM-DD) carefully to avoid UTC offset shifting the day
  const parts = releaseDateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      return new Date(year, month, day);
    }
  }
  const d = new Date(releaseDateStr);
  return isNaN(d.getTime()) ? null : d;
}

export function isUnreleased(releaseDateStr?: string | null, now = new Date()): boolean {
  const d = getReleaseDate(releaseDateStr);
  if (!d) return false;
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return d.getTime() > startOfToday.getTime();
}

export function isRankable(releaseDateStr?: string | null, now = new Date()): boolean {
  const d = getReleaseDate(releaseDateStr);
  if (!d) return true;
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (d.getTime() <= startOfToday.getTime()) return true;
  const windowStart = new Date(d);
  windowStart.setDate(windowStart.getDate() - RELEASE_WINDOW_DAYS);
  return startOfToday.getTime() >= windowStart.getTime();
}

export function formatReleaseDate(releaseDateStr?: string | null): string {
  const d = getReleaseDate(releaseDateStr);
  if (!d) return 'Unreleased';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
