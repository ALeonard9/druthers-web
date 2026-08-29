import type { CatalogDomain } from '@/components/CatalogSearchResults';

export interface SearchFilter {
  key: string;
  value: string;
}

/**
 * Filter keys available per domain. The API (druthers-api#385) parses
 * `key:value` pairs and maps them to provider-specific filters. This list
 * drives the autocomplete suggestions and validation on the web side.
 */
const DOMAIN_FILTER_KEYS: Record<CatalogDomain, readonly string[]> = {
  movies: ['director', 'actor', 'genre', 'year', 'rating'],
  tv: ['network', 'genre', 'year', 'status'],
  books: ['author', 'subject', 'year'],
  games: ['developer', 'genre', 'platform', 'year'],
} as const;

/**
 * Filter keys available in the global "All" scope. The superset of every
 * domain's keys, deduplicated.
 */
const GLOBAL_FILTER_KEYS = [
  'director',
  'actor',
  'author',
  'network',
  'developer',
  'genre',
  'subject',
  'year',
  'rating',
  'status',
  'platform',
] as const;

export function filterKeysForDomain(domain: CatalogDomain | 'all'): readonly string[] {
  return domain === 'all' ? GLOBAL_FILTER_KEYS : DOMAIN_FILTER_KEYS[domain];
}

/**
 * Parse a search query string into structured filters and free text.
 *
 * Recognised syntax: `key:value` or `key:"quoted value"`. Unrecognised
 * keys are left in the free text so they still reach the API as a normal
 * query.
 *
 * Examples:
 *   `director:Nolan Dune`          -> filters: [{key:'director', value:'Nolan'}], text: 'Dune'
 *   `genre:sci-fi year:2021`       -> filters: [{key:'genre', value:'sci-fi'}, {key:'year', value:'2021'}], text: ''
 *   `actor:"Timothée" Dune`       -> filters: [{key:'actor', value:'Timothée'}], text: 'Dune'
 *   `foo:bar` (unrecognised key)  -> filters: [], text: 'foo:bar'
 */
export function parseSearchQuery(
  raw: string,
  domain: CatalogDomain | 'all' = 'all',
): { filters: SearchFilter[]; freeText: string } {
  const known = new Set(filterKeysForDomain(domain));
  const filters: SearchFilter[] = [];
  const textParts: string[] = [];

  // Match key:"quoted value" or key:unquoted (non-space) value
  const pattern = /(\w+):(?:"([^"]*)"|([\S]+))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(raw)) !== null) {
    const [full, key, quoted, unquoted] = match;
    const value = quoted ?? unquoted;

    if (known.has(key) && value.length > 0) {
      // Push any text before this match
      const before = raw.slice(lastIndex, match.index);
      if (before.trim()) textParts.push(before.trim());
      filters.push({ key, value });
    } else {
      // Unrecognised key or empty value: keep as free text
      textParts.push(raw.slice(lastIndex, match.index + full.length));
    }
    lastIndex = match.index + full.length;
  }

  // Remaining text after last match
  const tail = raw.slice(lastIndex);
  if (tail.trim()) textParts.push(tail.trim());

  return { filters, freeText: textParts.join(' ').trim() };
}

/**
 * Reconstruct a query string from filters and free text, ready to send to
 * the API. Quoted when the value contains spaces.
 */
export function serializeSearchQuery(filters: SearchFilter[], freeText: string): string {
  const parts = filters.map(({ key, value }) =>
    value.includes(' ') ? `${key}:"${value}"` : `${key}:${value}`,
  );
  if (freeText.trim()) parts.push(freeText.trim());
  return parts.join(' ');
}

/**
 * Suggest filter key completions for a partial key being typed.
 * Returns keys that start with the prefix (case-insensitive).
 */
export function suggestFilterKeys(
  prefix: string,
  domain: CatalogDomain | 'all' = 'all',
): string[] {
  const lower = prefix.toLowerCase();
  return filterKeysForDomain(domain).filter((k) => k.startsWith(lower));
}
