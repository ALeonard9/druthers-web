import type { Summary } from './types';

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
  /** Social handle rendered on cards, without the @. Null until claimed. */
  handle: string | null;
  /**
   * Absolute URL printed on the card and offered by "Copy link". Only a
   * profile that actually resolves gets a path — otherwise this is the bare
   * site, because a card advertising a 404 is worse than one advertising the
   * front door.
   */
  url: string;
  /** Whether `url` points at the owner's profile rather than the site root. */
  profilePublic: boolean;
  shelves: ShareShelf[];
  totalRanked: number;
}

export const CATEGORY_LABELS: Record<ShareCategory, string> = {
  movies: 'Movies',
  tv: 'TV',
  books: 'Books',
  games: 'Video Games',
};

export const SITE_URL = 'https://www.druthers.io';

/**
 * Public profile URL for a handle. The path is `/u/<handle>` — the canonical
 * form the API documents on DbUser.handle and the only one the web serves.
 */
export function profileUrl(handle: string): string {
  return `${SITE_URL}/u/${handle}`;
}

export function buildShareData(summary: Summary): ShareData {
  const shelves: ShareShelf[] = summary.shelves.map((s) => ({
    category: s.category,
    label: CATEGORY_LABELS[s.category] ?? s.label,
    top: s.top.map((e) => ({ title: e.title, year: e.year })),
    rankedCount: s.ranked_count,
  }));

  const profilePublic = summary.profile_public && !!summary.handle;

  return {
    handle: summary.handle,
    url: profilePublic ? profileUrl(summary.handle as string) : SITE_URL,
    profilePublic,
    // A shelf with nothing ranked has nothing to share.
    shelves: shelves.filter((s) => s.top.length > 0),
    totalRanked: shelves.reduce((n, s) => n + s.rankedCount, 0),
  };
}
