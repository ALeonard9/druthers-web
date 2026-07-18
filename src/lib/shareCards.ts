import type { UserBook, UserMovie, UserTVShow, UserVideoGame } from './types';

/**
 * Data plumbing for the shareable Top 5 cards (see the "Top 5 Share Cards"
 * design). Pure — the canvas drawing lives in shareCardRender.ts.
 */

export type ShareCategory = 'movies' | 'tv' | 'books' | 'games';

export interface ShareEntry {
  title: string;
  year: number | null;
}

export interface ShareShelf {
  category: ShareCategory;
  /** Display label as it appears on cards ("Video Games", not "games"). */
  label: string;
  /** Top 5 by rank position, best first. */
  top: ShareEntry[];
  /** Everything ranked in this category, not just the top 5. */
  rankedCount: number;
}

export interface ShareData {
  /** Social handle rendered on cards, without the @. */
  handle: string;
  shelves: ShareShelf[];
  totalRanked: number;
}

export const CATEGORY_LABELS: Record<ShareCategory, string> = {
  movies: 'Movies',
  tv: 'TV',
  books: 'Books',
  games: 'Video Games',
};

interface RankedTracker {
  on_rankings: boolean;
  rank: number | null;
}

function rankedOnly<T extends RankedTracker>(list: T[]): T[] {
  return list
    .filter((t) => t.on_rankings && t.rank != null)
    .sort((a, b) => (a.rank as number) - (b.rank as number));
}

function shelf<T extends RankedTracker>(
  category: ShareCategory,
  list: T[],
  entry: (t: T) => ShareEntry,
): ShareShelf {
  const ranked = rankedOnly(list);
  return {
    category,
    label: CATEGORY_LABELS[category],
    top: ranked.slice(0, 5).map(entry),
    rankedCount: ranked.length,
  };
}

/** The bit before the @, lowercased — a placeholder handle until public
 *  profiles exist. */
export function handleFromEmail(email: string): string {
  const local = email.split('@')[0] ?? '';
  return local.toLowerCase() || 'me';
}

export function buildShareData(input: {
  email: string;
  movies?: UserMovie[];
  shows?: UserTVShow[];
  books?: UserBook[];
  games?: UserVideoGame[];
}): ShareData {
  const shelves: ShareShelf[] = [];
  if (input.movies)
    shelves.push(
      shelf('movies', input.movies, (t) => ({
        title: t.movie.title,
        year: t.movie.year,
      })),
    );
  if (input.shows)
    shelves.push(
      shelf('tv', input.shows, (t) => ({
        title: t.tv_show.title,
        year: t.tv_show.year,
      })),
    );
  if (input.books)
    shelves.push(
      shelf('books', input.books, (t) => ({
        title: t.book.title,
        year: t.book.year,
      })),
    );
  if (input.games)
    shelves.push(
      shelf('games', input.games, (t) => ({
        title: t.game.title,
        year: t.game.year,
      })),
    );

  return {
    handle: handleFromEmail(input.email),
    // A shelf with nothing ranked has nothing to share.
    shelves: shelves.filter((s) => s.top.length > 0),
    totalRanked: shelves.reduce((n, s) => n + s.rankedCount, 0),
  };
}
