import type {
  UserMovie,
  UserTVShow,
  UserBook,
  UserVideoGame,
  PublicShelf,
} from './types';
import { duelHrefFor, type ShelfId } from './duelShelves';
import { isRankable } from './movies';

/**
 * How many of the top ranked titles a domain's poster deck runs through.
 * Lives here rather than beside the component because RankedPosterDeck is a
 * client module - a server component importing a plain value out of one gets a
 * client reference back, not the number.
 */
export const DECK_SIZE = 25;

export interface WatchlistActionItem {
  id: string;
  title: string;
  onRankings: boolean;
  rankable: boolean;
  trackHref: string;
  rankHref: string;
}

/**
 * What the deck needs to draw one poster, flattened out of whichever tracker
 * row it came from. Keeping the component on this shape is what lets a single
 * deck serve movies, TV, books and games.
 */
export interface DeckItem {
  id: string;
  rank: number;
  title: string;
  /** Second line under the deck, e.g. "1997 · Adventure". */
  subtitle: string;
  posterUrl: string | null;
  /** Detail page the front poster opens. */
  href: string;
  /** First visible profile that inspired this tracker row. */
  sourceHandle?: string | null;
  /** Mutation details for the signed-in user's watchlist views. */
  watchlistActions?: WatchlistActionItem;
  /** True for the 6th "See All" card on public profile carousels. */
  isSeeAll?: boolean;
}

/** First entry of a comma-separated list ("Action, Crime" → "Action"). */
function first(list: string | null | undefined): string | null {
  return list?.split(',')[0]?.trim() || null;
}

function subtitle(year: number | null, detail: string | null): string {
  return [year, detail].filter(Boolean).join(' · ');
}

/**
 * Rows arrive ranked and pre-sliced; anything without a rank is filtered out so
 * the plate always has a number to show.
 */
function build<T>(
  rows: T[],
  to: (row: T) => Omit<DeckItem, 'rank'> & { rank: number | null },
): DeckItem[] {
  return rows
    .map(to)
    .filter((d): d is DeckItem => d.rank != null);
}

export function movieDeckItems(rows: UserMovie[]): DeckItem[] {
  return build(rows, (r) => ({
    id: r.movie.id,
    rank: r.rank,
    title: r.movie.title,
    subtitle: subtitle(r.movie.year, first(r.movie.genre)),
    posterUrl: r.movie.poster_url,
    href: `/movies/${r.movie.id}`,
  }));
}

export function tvDeckItems(rows: UserTVShow[]): DeckItem[] {
  return build(rows, (r) => ({
    id: r.tv_show.id,
    rank: r.rank,
    title: r.tv_show.title,
    subtitle: subtitle(r.tv_show.year, first(r.tv_show.genre)),
    posterUrl: r.tv_show.poster_url,
    href: `/tv/${r.tv_show.id}`,
  }));
}

export function bookDeckItems(rows: UserBook[]): DeckItem[] {
  // Author beats genre as the second line for a book.
  return build(rows, (r) => ({
    id: r.book.id,
    rank: r.rank,
    title: r.book.title,
    subtitle: subtitle(r.book.year, first(r.book.authors)),
    posterUrl: r.book.poster_url,
    href: `/books/${r.book.id}`,
  }));
}

export function gameDeckItems(rows: UserVideoGame[]): DeckItem[] {
  return build(rows, (r) => ({
    id: r.game.id,
    rank: r.rank,
    title: r.game.title,
    subtitle: subtitle(r.game.year, first(r.game.genre)),
    posterUrl: r.game.poster_url,
    href: `/games/${r.game.id}`,
  }));
}

/**
 * A public profile's shelf, read-only: rows carry no id and no detail
 * route reaches an anonymous visitor, so `href` is unused (render with
 * `interactive={false}`).
 */
export function publicDeckItems(shelf: PublicShelf): DeckItem[] {
  return build(shelf.items, (item) => ({
    id: `${shelf.category}-${item.rank}`,
    rank: item.rank,
    title: item.title,
    subtitle: subtitle(item.year, null),
    posterUrl: item.poster_url,
    href: '',
  }));
}

/**
 * Watchlist rows have no rank to anchor a deck plate against, so `rank` here
 * is just the row's position (list order) - callers render these with
 * `showRank={false}` on RankedPosterDeck rather than trusting the number.
 */
function buildUnranked<T>(rows: T[], to: (row: T) => Omit<DeckItem, 'rank'>): DeckItem[] {
  return rows.map((row, i) => ({ ...to(row), rank: i + 1 }));
}

function watchlistActionItem(
  shelf: ShelfId,
  id: string,
  title: string,
  onRankings: boolean,
  options: Pick<WatchlistActionItem, 'rankable'> = { rankable: true },
): WatchlistActionItem {
  return {
    id,
    title,
    onRankings,
    trackHref: `/api/${shelf}/${id}/track`,
    rankHref: duelHrefFor(shelf, id),
    ...options,
  };
}

export function movieWatchlistActionItem(row: UserMovie): WatchlistActionItem {
  return watchlistActionItem(
    'movies',
    row.movie.id,
    row.movie.title,
    row.on_rankings,
    { rankable: isRankable(row.movie.release_date) },
  );
}

export function tvWatchlistActionItem(row: UserTVShow): WatchlistActionItem {
  return watchlistActionItem('tv', row.tv_show.id, row.tv_show.title, row.on_rankings);
}

export function bookWatchlistActionItem(row: UserBook): WatchlistActionItem {
  return watchlistActionItem('books', row.book.id, row.book.title, row.on_rankings);
}

export function gameWatchlistActionItem(row: UserVideoGame): WatchlistActionItem {
  return watchlistActionItem('games', row.game.id, row.game.title, row.on_rankings);
}

export function movieWatchlistDeckItems(rows: UserMovie[]): DeckItem[] {
  return buildUnranked(rows, (r) => ({
    id: r.movie.id,
    title: r.movie.title,
    subtitle: subtitle(r.movie.year, first(r.movie.genre)),
    posterUrl: r.movie.poster_url,
    href: `/movies/${r.movie.id}`,
    sourceHandle: r.source_handle,
    watchlistActions: movieWatchlistActionItem(r),
  }));
}

export function tvWatchlistDeckItems(rows: UserTVShow[]): DeckItem[] {
  return buildUnranked(rows, (r) => ({
    id: r.tv_show.id,
    title: r.tv_show.title,
    subtitle: subtitle(r.tv_show.year, first(r.tv_show.genre)),
    posterUrl: r.tv_show.poster_url,
    href: `/tv/${r.tv_show.id}`,
    sourceHandle: r.source_handle,
    watchlistActions: tvWatchlistActionItem(r),
  }));
}

export function bookWatchlistDeckItems(rows: UserBook[]): DeckItem[] {
  return buildUnranked(rows, (r) => ({
    id: r.book.id,
    title: r.book.title,
    subtitle: subtitle(r.book.year, first(r.book.authors)),
    posterUrl: r.book.poster_url,
    href: `/books/${r.book.id}`,
    sourceHandle: r.source_handle,
    watchlistActions: bookWatchlistActionItem(r),
  }));
}

export function gameWatchlistDeckItems(rows: UserVideoGame[]): DeckItem[] {
  return buildUnranked(rows, (r) => ({
    id: r.game.id,
    title: r.game.title,
    subtitle: subtitle(r.game.year, first(r.game.genre)),
    posterUrl: r.game.poster_url,
    href: `/games/${r.game.id}`,
    sourceHandle: r.source_handle,
    watchlistActions: gameWatchlistActionItem(r),
  }));
}
