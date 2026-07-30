/**
 * What the comparison ("which would you rather?") screen needs to know about
 * each shelf.
 *
 * The five ranking boards differ only in the nested media key and their copy,
 * so the duel takes a normalised `DuelEntry` and one `ShelfConfig` rather than
 * five near-identical components. Adding a shelf is a config entry plus a
 * `toDuelEntry` call on its page.
 */

import type {
  UserBook,
  UserCountry,
  UserMovie,
  UserTVShow,
  UserVideoGame,
} from '@/lib/types';

export type ShelfId = 'movies' | 'tv' | 'books' | 'games' | 'countries';

/** One contender in a duel, stripped of everything the screen doesn't show. */
export interface DuelEntry {
  /** The catalog id — what `PUT /api/{shelf}/{id}/rank` takes. */
  id: string;
  title: string;
  /** The quiet line under the title: a year, or a region for countries. */
  subtitle: string | null;
  /** Poster or cover. Null for countries, which show a flag instead. */
  imageUrl: string | null;
  /** Stands in for artwork where there is none. */
  emoji: string | null;
  rank: number | null;
}

export interface ShelfConfig {
  id: ShelfId;
  /** Plural, title-case, for headings: "Movies". */
  label: string;
  /** Singular, lower-case, for prose: "a movie", "the next movie". */
  noun: string;
  /** Where the drag-and-drop board lives — the duel always links back to it. */
  boardHref: string;
  /** This shelf's comparison screen. */
  duelHref: string;
  /**
   * Detail-page prefix, so a title links to `{itemBase}/{id}`. A string rather
   * than a builder function because the whole config is handed to a client
   * component, and functions can't cross that boundary.
   */
  itemBase: string;
  /** Where to send someone with nothing left to place. */
  addHref: string;
  addLabel: string;
}

export const SHELVES: Record<ShelfId, ShelfConfig> = {
  movies: {
    id: 'movies',
    label: 'Movies',
    noun: 'movie',
    boardHref: '/movies/ranking',
    duelHref: '/movies/ranking/duel',
    itemBase: '/movies',
    addHref: '/movies/search',
    addLabel: 'Add a movie',
  },
  tv: {
    id: 'tv',
    label: 'Shows',
    noun: 'show',
    boardHref: '/tv/ranking',
    duelHref: '/tv/ranking/duel',
    itemBase: '/tv',
    addHref: '/tv/search',
    addLabel: 'Add a show',
  },
  books: {
    id: 'books',
    label: 'Books',
    noun: 'book',
    boardHref: '/books/ranking',
    duelHref: '/books/ranking/duel',
    itemBase: '/books',
    addHref: '/books/search',
    addLabel: 'Add a book',
  },
  games: {
    id: 'games',
    label: 'Games',
    noun: 'game',
    boardHref: '/games/ranking',
    duelHref: '/games/ranking/duel',
    itemBase: '/games',
    addHref: '/games/search',
    addLabel: 'Add a game',
  },
  countries: {
    // The only shelf whose board isn't at /{domain}/ranking — countries share
    // one page with the bucket list, so the duel hangs off the root instead.
    id: 'countries',
    label: 'Countries',
    noun: 'country',
    boardHref: '/countries',
    duelHref: '/countries/duel',
    itemBase: '/countries',
    addHref: '/countries',
    addLabel: 'Track a country',
  },
};

/** The key each shelf's tracker payload nests its catalog row under. */
const CATALOG_KEY: Record<ShelfId, string> = {
  movies: 'movie',
  tv: 'tv_show',
  books: 'book',
  games: 'game',
  countries: 'country',
};

/**
 * The catalog id inside an add/track response (`{ movie: { id } }`, …), or
 * null if the shape isn't what we expected — a missing id costs the caller the
 * `?item=` hint, nothing more.
 */
export function catalogIdFrom(shelf: ShelfId, tracker: unknown): string | null {
  const nested = (tracker as Record<string, unknown> | null | undefined)?.[
    CATALOG_KEY[shelf]
  ];
  const id = (nested as Record<string, unknown> | undefined)?.id;
  return typeof id === 'string' ? id : null;
}

/**
 * Where to land after putting something on the rankings.
 *
 * The API admits a title to the rankings *unplaced*, so adding it is only half
 * the gesture — deciding where it goes is the other half, and that's the duel.
 * Same handoff the phone makes, where "+ Rank it" goes straight to the
 * comparison screen rather than dropping you on a list.
 */
export function duelHrefFor(shelf: ShelfId, catalogId?: string | null): string {
  const { duelHref } = SHELVES[shelf];
  return catalogId ? `${duelHref}?item=${catalogId}` : duelHref;
}

const year = (y: number | null) => (y ? String(y) : null);

export function movieToDuelEntry(m: UserMovie): DuelEntry {
  return {
    id: m.movie.id,
    title: m.movie.title,
    subtitle: year(m.movie.year),
    imageUrl: m.movie.poster_url,
    emoji: null,
    rank: m.rank,
  };
}

export function showToDuelEntry(s: UserTVShow): DuelEntry {
  return {
    id: s.tv_show.id,
    title: s.tv_show.title,
    subtitle: year(s.tv_show.year),
    imageUrl: s.tv_show.poster_url,
    emoji: null,
    rank: s.rank,
  };
}

export function bookToDuelEntry(b: UserBook): DuelEntry {
  return {
    id: b.book.id,
    // Authors say more than a year on a bookshelf, so they get the line.
    title: b.book.title,
    subtitle: b.book.authors ?? year(b.book.year),
    imageUrl: b.book.poster_url,
    emoji: null,
    rank: b.rank,
  };
}

export function gameToDuelEntry(g: UserVideoGame): DuelEntry {
  return {
    id: g.game.id,
    title: g.game.title,
    subtitle: year(g.game.year),
    imageUrl: g.game.poster_url,
    emoji: null,
    rank: g.rank,
  };
}

export function countryToDuelEntry(c: UserCountry): DuelEntry {
  return {
    id: c.country.id,
    title: c.country.title,
    subtitle: c.country.region,
    // Flag images are inconsistent across the catalog; the emoji always reads.
    imageUrl: null,
    emoji: c.country.flag_emoji ?? '🏳️',
    rank: c.rank,
  };
}

/**
 * Split a shelf into the two lists the duel needs: what's already placed (in
 * rank order — the duel's whole premise is that this list is already correct)
 * and what's waiting for a position.
 *
 * `focusId` is the title being placed. It's excluded from the ranked side even
 * when it already has a rank, so re-ranking something never compares it with
 * itself, and it leads the queue so a "Place it →" link lands on it first.
 */
export function duelLists(
  entries: DuelEntry[],
  focusId?: string,
): { ranked: DuelEntry[]; queue: DuelEntry[] } {
  const ranked = entries
    .filter((e) => e.rank != null && e.id !== focusId)
    .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0));

  const unplaced = entries
    .filter((e) => e.rank == null && e.id !== focusId)
    .sort((a, b) => a.title.localeCompare(b.title));

  const focus = focusId ? entries.find((e) => e.id === focusId) : undefined;
  return { ranked, queue: focus ? [focus, ...unplaced] : unplaced };
}
