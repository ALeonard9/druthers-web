import type { UserTVShow } from './types';

const RANK_MAX = 1e9;

export interface TVFilters {
  q?: string; // matches title, network
  genre?: string;
  yearMin?: number;
  yearMax?: number;
  ratingMin?: number;
}

/** Filter tracked shows by text (title/network), genre, year, rating. */
export function filterShows(shows: UserTVShow[], f: TVFilters): UserTVShow[] {
  const q = f.q?.trim().toLowerCase();
  const genre = f.genre?.trim().toLowerCase();
  return shows.filter((us) => {
    const s = us.tv_show;
    if (q) {
      const hay = [s.title, s.network].filter(Boolean).join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (genre && !(s.genre ?? '').toLowerCase().includes(genre)) return false;
    if (f.yearMin != null && (s.year == null || s.year < f.yearMin)) return false;
    if (f.yearMax != null && (s.year == null || s.year > f.yearMax)) return false;
    if (f.ratingMin != null && (s.rating == null || s.rating < f.ratingMin))
      return false;
    return true;
  });
}

export function byRank(a: UserTVShow, b: UserTVShow): number {
  return (a.rank ?? RANK_MAX) - (b.rank ?? RANK_MAX);
}

/**
 * Split a user's tracked shows into the lists the UI renders:
 *  - watchlist:      on_watchlist, by title
 *  - rankingsPlaced: on_rankings with a rank position, ordered by rank
 *  - rankingsUnplaced: on_rankings but not yet positioned ("to rank" bucket)
 * A show may appear in the watchlist and the rankings. Pure — safe to test.
 */
export function partitionShows(shows: UserTVShow[]): {
  watchlist: UserTVShow[];
  rankingsPlaced: UserTVShow[];
  rankingsUnplaced: UserTVShow[];
} {
  const watchlist = shows
    .filter((s) => s.on_watchlist)
    .sort((a, b) => a.tv_show.title.localeCompare(b.tv_show.title));
  const ranked = shows.filter((s) => s.on_rankings);
  const rankingsPlaced = ranked.filter((s) => s.rank != null).sort(byRank);
  const rankingsUnplaced = ranked
    .filter((s) => s.rank == null)
    .sort((a, b) => a.tv_show.title.localeCompare(b.tv_show.title));
  return { watchlist, rankingsPlaced, rankingsUnplaced };
}
