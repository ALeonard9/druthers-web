import type { Country, UserCountry } from './types';

const RANK_MAX = 1e9;

export function byRank(a: UserCountry, b: UserCountry): number {
  return (a.rank ?? RANK_MAX) - (b.rank ?? RANK_MAX);
}

/**
 * Split a user's tracked countries into the lists the UI renders:
 *  - bucketList:     on_watchlist (want to visit), by title
 *  - visitedPlaced:  on_rankings with a rank position, ordered by rank
 *  - visitedUnplaced: on_rankings but not yet positioned ("to rank" bucket)
 * Pure — safe to test.
 */
export function partitionCountries(countries: UserCountry[]): {
  bucketList: UserCountry[];
  visitedPlaced: UserCountry[];
  visitedUnplaced: UserCountry[];
} {
  const bucketList = countries
    .filter((c) => c.on_watchlist)
    .sort((a, b) => a.country.title.localeCompare(b.country.title));
  const visited = countries.filter((c) => c.on_rankings);
  const visitedPlaced = visited.filter((c) => c.rank != null).sort(byRank);
  const visitedUnplaced = visited
    .filter((c) => c.rank == null)
    .sort((a, b) => a.country.title.localeCompare(b.country.title));
  return { bucketList, visitedPlaced, visitedUnplaced };
}

/** Catalog countries not yet on either of the user's lists, by title. */
export function untrackedCountries(
  catalog: Country[],
  tracked: UserCountry[],
): Country[] {
  const trackedIds = new Set(tracked.map((t) => t.country.id));
  return catalog
    .filter((c) => !trackedIds.has(c.id))
    .sort((a, b) => a.title.localeCompare(b.title));
}
