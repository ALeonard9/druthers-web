import type { UserBook } from './types';
import { hasToken } from './filterParams';

const RANK_MAX = 1e9;

export interface BookFilters {
  q?: string; // matches title, authors
  genre?: string;
  yearMin?: number;
  yearMax?: number;
  ratingMin?: number; // Open Library ratings are 0-5
  pagesMax?: number;
}

/**
 * Filter tracked books by text (title/authors), genre, year, rating and length.
 */
export function filterBooks(books: UserBook[], f: BookFilters): UserBook[] {
  const q = f.q?.trim().toLowerCase();
  return books.filter((ub) => {
    const b = ub.book;
    if (q) {
      const hay = [b.title, b.authors].filter(Boolean).join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (f.genre && !hasToken(b.genre, f.genre)) return false;
    if (f.yearMin != null && (b.year == null || b.year < f.yearMin)) return false;
    if (f.yearMax != null && (b.year == null || b.year > f.yearMax)) return false;
    if (f.ratingMin != null && (b.rating == null || b.rating < f.ratingMin))
      return false;
    if (
      f.pagesMax != null &&
      (b.page_count == null || b.page_count > f.pagesMax)
    )
      return false;
    return true;
  });
}

export function byRank(a: UserBook, b: UserBook): number {
  return (a.rank ?? RANK_MAX) - (b.rank ?? RANK_MAX);
}

/**
 * Split a user's tracked books into the lists the UI renders:
 *  - watchlist:      on_watchlist (to-read), by title
 *  - rankingsPlaced: on_rankings with a rank position, ordered by rank
 *  - rankingsUnplaced: on_rankings but not yet positioned ("to rank" bucket)
 * A book may appear in the watchlist and the rankings. Pure - safe to test.
 */
export function partitionBooks(books: UserBook[]): {
  watchlist: UserBook[];
  rankingsPlaced: UserBook[];
  rankingsUnplaced: UserBook[];
} {
  const watchlist = [...books].sort((a, b) => a.book.title.localeCompare(b.book.title));
  const ranked = books;
  const rankingsPlaced = ranked.filter((b) => b.rank != null).sort(byRank);
  const rankingsUnplaced = ranked
    .filter((b) => b.rank == null)
    .sort((a, b) => a.book.title.localeCompare(b.book.title));
  return { watchlist, rankingsPlaced, rankingsUnplaced };
}
