import type { PublicProfile, Summary, Visibility, VisibilityTier } from './types';
import { resolveShelfTier } from './privacyDefaults';

/**
 * Data plumbing for the shareable Top 5 cards (see the "Top 5 Share Cards"
 * design). Pure - the canvas drawing lives in shareCardRender.ts.
 */

export type ShareCategory = 'movies' | 'tv' | 'books' | 'games';

export interface ShareEntry {
  title: string;
  year: number | null;
  posterUrl?: string | null;
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
   * profile that actually resolves gets a path - otherwise this is the bare
   * site, because a card advertising a 404 is worse than one advertising the
   * front door.
   */
  url: string;
  /** Whether `url` points at the owner's profile rather than the site root. */
  profilePublic: boolean;
  shelves: ShareShelf[];
  totalRanked: number;
}

export interface ShareDestination {
  /** Absolute production/dev URL used by server-rendered cards. */
  url: string;
  /** What the recipient is being sent to, for menu copy. */
  label: string;
  visibility: VisibilityTier;
  /** A warning shown before a restricted link is copied or posted. */
  warning: string | null;
  /** Restricted content can always point here so its owner can open it up. */
  settingsHref: string | null;
}

export const CATEGORY_LABELS: Record<ShareCategory, string> = {
  movies: 'Movies',
  tv: 'TV',
  books: 'Books',
  games: 'Video Games',
};

export const PUBLIC_SITE_URL = 'https://www.druthers.io';

export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  if (process.env.NEXT_PUBLIC_APP_ENV === 'dev') {
    return 'http://localhost:3000';
  }
  return PUBLIC_SITE_URL;
}

export function getBaseDomain(): string {
  const urlStr = getSiteUrl();
  try {
    const parsed = new URL(urlStr);
    return parsed.host;
  } catch {
    return 'www.druthers.io';
  }
}

export const BASE_DOMAIN = getBaseDomain();
export const SITE_URL = getSiteUrl();

/** A social share must never leak an unopenable localhost URL. */
export function publicShareUrl(url: string): string {
  const parsed = new URL(url, PUBLIC_SITE_URL);
  return `${PUBLIC_SITE_URL}${parsed.pathname}${parsed.search}${parsed.hash}`;
}

/**
 * Public profile URL for a handle. The path is `/u/<handle>` - the canonical
 * form the API documents on DbUser.handle and the only one the web serves.
 */
export function profileUrl(handle: string): string {
  return `${getSiteUrl()}/u/${handle}`;
}

export function contentUrl(
  handle: string,
  category?: ShareCategory,
  kind: 'ranked' | 'watchlist' = 'ranked',
): string {
  const shelf = category ? `/${category}` : '';
  const list = category && kind === 'watchlist' ? '/watchlist' : '';
  return `${profileUrl(handle)}${shelf}${list}`;
}

/**
 * One privacy-aware destination rule for every share surface (#123).
 * Public and friends content keeps its most-specific canonical URL; private
 * content falls back to the front door rather than copying an owner-only URL.
 */
export function buildShareDestination({
  handle,
  visibility,
  category,
  kind = 'ranked',
}: {
  handle: string | null;
  visibility: VisibilityTier;
  category?: ShareCategory;
  kind?: 'ranked' | 'watchlist';
}): ShareDestination {
  if (!handle || visibility === 'private') {
    return {
      url: getSiteUrl(),
      label: getBaseDomain(),
      visibility: 'private',
      warning: handle
        ? 'Only you can see this. Shared links will open druthers.io until you make it visible.'
        : 'Claim a handle and choose who can see this before sharing its page.',
      settingsHref: '/settings#sharing',
    };
  }

  const label = category
    ? `your ${CATEGORY_LABELS[category]} ${kind === 'watchlist' ? 'list' : 'rankings'}`
    : 'your profile';
  return {
    url: contentUrl(handle, category, kind),
    label,
    visibility,
    warning:
      visibility === 'friends'
        ? 'Only signed-in friends you’ve accepted can open this link.'
        : null,
    settingsHref: visibility === 'friends' ? '/settings#sharing' : null,
  };
}

export function shareVisibility(
  visibility: Visibility,
  category: ShareCategory,
  kind: 'ranked' | 'watchlist',
): VisibilityTier {
  const field =
    kind === 'watchlist'
      ? (`visibility_watchlist_${category}` as const)
      : (`visibility_${category}` as const);
  return resolveShelfTier(visibility, field);
}

export function buildShareData(summary: Summary): ShareData {
  const shelves: ShareShelf[] = summary.shelves.map((s) => ({
    category: s.category,
    label: CATEGORY_LABELS[s.category] ?? s.label,
    top: s.top.map((e) => ({
      title: e.title,
      year: e.year,
      posterUrl: e.poster_url,
    })),
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

export function buildPublicShareData(profile: PublicProfile): ShareData {
  const shelves: ShareShelf[] = profile.shelves
    .map((shelf) => ({
      category: shelf.slug as ShareCategory,
      label: shelf.category,
      rankedCount: shelf.ranked_count,
      top: shelf.items.slice(0, 5).map((item) => ({
        title: item.title,
        year: item.year,
        posterUrl: item.poster_url,
      })),
    }))
    .filter((shelf) => shelf.top.length > 0);
  return {
    handle: profile.handle,
    url: profileUrl(profile.handle),
    profilePublic: true,
    shelves,
    totalRanked: profile.total_ranked,
  };
}
