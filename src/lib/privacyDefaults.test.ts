import { describe, expect, it } from 'vitest';
import { resolveShelfTier, shelfInheritsDefault } from './privacyDefaults';
import type { Visibility } from './types';

function visibility(overrides: Partial<Visibility> = {}): Visibility {
  return {
    handle: 'adam',
    visibility_profile: 'friends',
    default_privacy: 'friends',
    visibility_movies: null,
    visibility_tv: null,
    visibility_books: null,
    visibility_games: null,
    visibility_watchlist_movies: null,
    visibility_watchlist_tv: null,
    visibility_watchlist_books: null,
    visibility_watchlist_games: null,
    ...overrides,
  };
}

describe('resolveShelfTier', () => {
  it('uses default_privacy when a shelf has no override', () => {
    expect(resolveShelfTier(visibility({ default_privacy: 'public' }), 'visibility_movies')).toBe(
      'public',
    );
  });

  it('uses a concrete shelf override instead of the account default', () => {
    const settings = visibility({ default_privacy: 'public', visibility_movies: 'private' });
    expect(resolveShelfTier(settings, 'visibility_movies')).toBe('private');
  });
});

describe('shelfInheritsDefault', () => {
  it('distinguishes a null override from an explicit tier equal to the default', () => {
    const settings = visibility({ visibility_movies: 'friends' });
    expect(shelfInheritsDefault(settings, 'visibility_tv')).toBe(true);
    expect(shelfInheritsDefault(settings, 'visibility_movies')).toBe(false);
  });
});
