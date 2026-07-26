import type { WatchProvider, WatchProviders } from './types';

/** One rendered provider chip: display name, logo, and where it links. */
export interface WatchProviderChip {
  name: string;
  logoUrl: string | null;
  href: string;
}

// TMDB assigns a separate provider id to a service's plain and "channel"/
// premium tiers even though they're the same place to watch (e.g. "Peacock"
// vs "Peacock Premium"). Canonicalize the display name so they collapse into
// one chip instead of showing as duplicates (web#78).
const CANONICAL_NAME: Record<string, string> = {
  'Peacock Premium': 'Peacock',
  'Peacock Premium Plus': 'Peacock',
  'Apple TV Plus': 'Apple TV+',
  'Paramount+ with Showtime': 'Paramount+',
  'Paramount Plus Apple TV Channel': 'Paramount+',
  'Paramount+ Amazon Channel': 'Paramount+',
  'Paramount Plus Premium': 'Paramount+',
  'Paramount Plus Essential': 'Paramount+',
  'Amazon Prime Video': 'Prime Video',
  'Amazon Prime Video with Ads': 'Prime Video',
  'Max Amazon Channel': 'Max',
  'Hulu (No Ads)': 'Hulu',
  'Discovery+ Amazon Channel': 'Discovery+',
  'ESPN Plus': 'ESPN+',
  'Starz Amazon Channel': 'Starz',
  'Starz Apple TV Channel': 'Starz',
  'MGM Plus': 'MGM+',
  'MGM Plus Amazon Channel': 'MGM+',
  'AMC Plus Amazon Channel': 'AMC+',
  'AMC+ Amazon Channel': 'AMC+',
  'BET+ Amazon Channel': 'BET+',
};

// TMDB's /watch/providers response carries only one link per region (a
// JustWatch listing page, already surfaced as `providers.link`) — there's no
// per-title deep link to hand each provider chip. Absent that, a chip links
// to the service's own site; this is a small static map of the providers
// druthers actually sees, not an attempt at exhaustive coverage. Anything
// unmapped falls back to the JustWatch link rather than a dead chip.
const PROVIDER_HOME: Record<string, string> = {
  Netflix: 'https://www.netflix.com',
  'Prime Video': 'https://www.primevideo.com',
  Hulu: 'https://www.hulu.com',
  'Disney Plus': 'https://www.disneyplus.com',
  'Apple TV+': 'https://tv.apple.com',
  Max: 'https://www.max.com',
  Peacock: 'https://www.peacocktv.com',
  'Paramount+': 'https://www.paramountplus.com',
  Tubi: 'https://tubitv.com',
  'Pluto TV': 'https://pluto.tv',
  Crunchyroll: 'https://www.crunchyroll.com',
  'The Roku Channel': 'https://therokuchannel.roku.com',
  YouTube: 'https://www.youtube.com',
  'ESPN+': 'https://plus.espn.com',
  Starz: 'https://www.starz.com',
  'AMC+': 'https://www.amcplus.com',
  Showtime: 'https://www.paramountplus.com',
  'MGM+': 'https://www.mgmplus.com',
  'BET+': 'https://www.bet.plus',
  fuboTV: 'https://www.fubo.tv',
  'Discovery+': 'https://www.discoveryplus.com',
  BritBox: 'https://www.britbox.com',
  'Acorn TV': 'https://acorn.tv',
  'Criterion Channel': 'https://www.criterionchannel.com',
  'Freevee (with Ads)': 'https://www.amazon.com/adlp/freevee',
};

/**
 * The deduped list of chips for the Stream tier only (TMDB's `flatrate` +
 * `free`/`ads` buckets) — Rent and Buy are dropped from the UI entirely, and
 * a title with nothing in Stream renders nothing (see WhereToWatch). Pure —
 * safe to test.
 */
export function streamingProviders(
  providers: WatchProviders | null,
): WatchProviderChip[] {
  if (!providers) return [];
  const seen = new Map<string, WatchProvider>();
  // `stream` before `free` so a service present in both keeps its
  // subscription-tier logo/id rather than the ad-supported one.
  for (const p of [...providers.stream, ...providers.free]) {
    const name = CANONICAL_NAME[p.name] ?? p.name;
    if (!seen.has(name)) seen.set(name, p);
  }
  return [...seen.entries()].map(([name, p]) => ({
    name,
    logoUrl: p.logo_url,
    href: PROVIDER_HOME[name] ?? providers.link ?? '#',
  }));
}
