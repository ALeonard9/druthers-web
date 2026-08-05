import { describe, it, expect } from 'vitest';
import { impliedDefaultTier, fieldsFollowingDefault } from './privacyDefaults';
import type { Visibility } from './types';

function visibility(overrides: Partial<Visibility> = {}): Visibility {
  return {
    handle: 'adam',
    visibility_profile: 'friends',
    visibility_movies: 'friends',
    visibility_tv: 'friends',
    visibility_books: 'friends',
    visibility_games: 'friends',
    visibility_watchlist_movies: 'friends',
    visibility_watchlist_tv: 'friends',
    visibility_watchlist_books: 'friends',
    visibility_watchlist_games: 'friends',
    ...overrides,
  };
}

describe('impliedDefaultTier', () => {
  it('reads a uniform set of shelves as that tier', () => {
    expect(impliedDefaultTier(visibility())).toBe('friends');
  });

  it('picks the majority tier when shelves are mixed', () => {
    const settings = visibility({
      visibility_movies: 'public',
      visibility_tv: 'public',
      visibility_books: 'public',
      // visibility_games and the four watchlist fields stay 'friends' (5 of 8).
    });
    expect(impliedDefaultTier(settings)).toBe('friends');
  });

  it('breaks a count tie toward the less-open tier', () => {
    const settings = visibility({
      visibility_movies: 'public',
      visibility_tv: 'public',
      visibility_books: 'public',
      visibility_games: 'public',
      // The other four watchlist fields stay 'friends' — 4 friends / 4 public.
    });
    expect(impliedDefaultTier(settings)).toBe('friends');
  });

  it('never reports a tier no shelf actually has', () => {
    const settings = visibility({
      visibility_movies: 'private',
      visibility_tv: 'private',
      visibility_books: 'private',
      visibility_games: 'private',
      visibility_watchlist_movies: 'private',
      // 5 private / 3 friends.
    });
    expect(impliedDefaultTier(settings)).toBe('private');
  });
});

describe('fieldsFollowingDefault', () => {
  it('includes every shelf when nothing has been customized', () => {
    const settings = visibility();
    expect(fieldsFollowingDefault(settings, 'friends')).toHaveLength(8);
  });

  it('excludes a shelf the owner already customized away from the default', () => {
    const settings = visibility({ visibility_games: 'public' });
    const fields = fieldsFollowingDefault(settings, 'friends');
    expect(fields).not.toContain('visibility_games');
    expect(fields).toHaveLength(7);
  });

  it('never includes visibility_profile, which is raised separately', () => {
    const settings = visibility({ visibility_profile: 'public' });
    // visibility_profile isn't in ShelfField at all, so it can't appear
    // regardless of whether it matches the implied default.
    const fields = fieldsFollowingDefault(settings, 'friends');
    expect(fields).not.toContain('visibility_profile');
  });
});
