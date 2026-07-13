import type { UserMovie } from './types';

const RANK_MAX = 1e9;

export interface MovieFilters {
  q?: string; // matches title, director, actors
  genre?: string;
  yearMin?: number;
  yearMax?: number;
  ratingMin?: number;
}

/** Filter tracked movies by text (title/director/cast), genre, year, rating. */
export function filterMovies(
  movies: UserMovie[],
  f: MovieFilters,
): UserMovie[] {
  const q = f.q?.trim().toLowerCase();
  const genre = f.genre?.trim().toLowerCase();
  return movies.filter((um) => {
    const m = um.movie;
    if (q) {
      const hay = [m.title, m.director, m.actors]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (genre && !(m.genre ?? '').toLowerCase().includes(genre)) return false;
    if (f.yearMin != null && (m.year == null || m.year < f.yearMin)) return false;
    if (f.yearMax != null && (m.year == null || m.year > f.yearMax)) return false;
    if (
      f.ratingMin != null &&
      (m.rating_imdb == null || m.rating_imdb < f.ratingMin)
    )
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
