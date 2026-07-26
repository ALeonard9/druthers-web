/**
 * Filters shared by every domain (movies, TV, books, games).
 */
export interface CommonFilters {
  q?: string;
  genre?: string;
  yearMin?: number;
  yearMax?: number;
  ratingMin?: number;
}

/**
 * The union of every filter any domain understands. Each domain's filterX()
 * reads only the keys it supports and ignores the rest, so one parser can serve
 * all eight pages.
 */
export interface DomainFilters extends CommonFilters {
  rated?: string; // movies — MPAA certificate
  runtimeMax?: number; // movies — minutes
  status?: string; // tv — Running / Ended
  watchStatus?: string; // tv — not_started / behind / up_to_date / complete
  pagesMax?: number; // books
  platform?: string; // games
  hundred?: boolean; // games — 100%-completed only
}

/** Raw string form of every filter, for populating the form controls. */
export type FilterValues = Record<string, string>;

const NUMERIC = ['yearMin', 'yearMax', 'ratingMin', 'runtimeMax', 'pagesMax'] as const;
const TEXT = ['q', 'genre', 'rated', 'status', 'watchStatus', 'platform'] as const;
const FLAG = ['hundred'] as const;
export const FILTER_KEYS = [...TEXT, ...NUMERIC, ...FLAG];

function num(v: string | undefined): number | undefined {
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Read the filter search params once, in both shapes a domain page needs:
 * `filters` (typed, for filterX()) and `filterValues` (strings, for the form).
 * `hasFilter` drives the "(filtered)" hints and empty states. Pure — safe to test.
 */
export function parseFilterParams(sp: Record<string, string | undefined>): {
  filters: DomainFilters;
  filterValues: FilterValues;
  hasFilter: boolean;
} {
  const filters: DomainFilters = {};
  const filterValues: FilterValues = {};

  for (const k of TEXT) {
    filters[k] = sp[k] || undefined;
    filterValues[k] = sp[k] ?? '';
  }
  for (const k of NUMERIC) {
    filters[k] = num(sp[k]);
    filterValues[k] = sp[k] ?? '';
  }
  for (const k of FLAG) {
    filters[k] = sp[k] === '1' ? true : undefined;
    filterValues[k] = sp[k] ?? '';
  }

  return {
    filters,
    filterValues,
    hasFilter: Object.values(filterValues).some(Boolean),
  };
}

/**
 * Tokenise the comma-joined lists the API stores ("Drama, Science-Fiction,
 * Thriller", "PS4, PC, Switch") into counts per distinct value.
 *
 * Tokens containing no letters are dropped: Open Library's subject data mixes
 * real genres with stray values like "1856-1915" (an author's dates), which
 * are meaningless as a filter.
 */
function tally(values: (string | null | undefined)[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const v of values) {
    if (!v) continue;
    for (const part of v.split(',')) {
      const token = part.trim();
      if (!token || !/[a-zA-Z]/.test(token)) continue;
      counts.set(token, (counts.get(token) ?? 0) + 1);
    }
  }
  return counts;
}

/**
 * Distinct options for a dropdown, pulled from the library itself. Sorted
 * alphabetically so a native <select> stays type-to-jump navigable.
 */
export function optionsFrom(values: (string | null | undefined)[]): string[] {
  return [...tally(values).keys()].sort((a, b) => a.localeCompare(b));
}

/**
 * Same, but labelled with how many items carry each value — the long tail of
 * Open Library subjects is mostly one-book entries, and the count is what tells
 * you which options are worth picking.
 */
export function optionsWithCounts(
  values: (string | null | undefined)[],
): { value: string; label: string }[] {
  return [...tally(values).entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([value, n]) => ({ value, label: `${value} (${n})` }));
}

/**
 * Does a comma-joined field contain this exact token? Used for genre and
 * platform, where the value comes from a dropdown built by optionsFrom() —
 * so an exact token match is both possible and more precise than a substring
 * ("Action" must not match "Action-Adventure").
 */
export function hasToken(field: string | null | undefined, token: string): boolean {
  if (!field) return false;
  const want = token.trim().toLowerCase();
  return field
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .includes(want);
}
