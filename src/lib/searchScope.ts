export const SEARCH_SCOPES = ['all', 'movies', 'tv', 'books', 'games', 'users'] as const;

export type SearchScope = (typeof SEARCH_SCOPES)[number];

export const SEARCH_SCOPE_LABELS: Record<SearchScope, string> = {
  all: 'All',
  movies: 'Movies',
  tv: 'TV',
  books: 'Books',
  games: 'Games',
  users: 'Users',
};

export function searchScope(value: string | undefined): SearchScope {
  return SEARCH_SCOPES.includes(value as SearchScope)
    ? (value as SearchScope)
    : 'all';
}

export function includesCatalogScope(scope: SearchScope): boolean {
  return scope !== 'users';
}

export function includesPeopleScope(scope: SearchScope): boolean {
  return scope === 'all' || scope === 'users';
}
