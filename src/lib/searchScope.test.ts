import { describe, expect, it } from 'vitest';
import { includesCatalogScope, includesPeopleScope, searchScope } from './searchScope';

describe('search scopes', () => {
  it('preserves every supported scope and defaults malformed URLs to all', () => {
    expect(searchScope('movies')).toBe('movies');
    expect(searchScope('tv')).toBe('tv');
    expect(searchScope('books')).toBe('books');
    expect(searchScope('games')).toBe('games');
    expect(searchScope('users')).toBe('users');
    expect(searchScope('not-a-scope')).toBe('all');
    expect(searchScope(undefined)).toBe('all');
  });

  it('uses the people endpoint only for All and Users', () => {
    expect(includesPeopleScope('all')).toBe(true);
    expect(includesPeopleScope('users')).toBe(true);
    expect(includesPeopleScope('movies')).toBe(false);
  });

  it('does not request catalog results for the Users scope', () => {
    expect(includesCatalogScope('users')).toBe(false);
    expect(includesCatalogScope('all')).toBe(true);
    expect(includesCatalogScope('books')).toBe(true);
  });
});
