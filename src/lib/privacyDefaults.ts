import type { Visibility, VisibilityTier } from './types';

// The 8 shelf-facing fields that may individually override default_privacy.
// visibility_profile deliberately remains separate: the API uses it as the
// floor for all resolved shelf visibility.
export const SHELF_FIELDS = [
  'visibility_movies',
  'visibility_tv',
  'visibility_books',
  'visibility_games',
  'visibility_watchlist_movies',
  'visibility_watchlist_tv',
  'visibility_watchlist_books',
  'visibility_watchlist_games',
] as const;

export type ShelfField = (typeof SHELF_FIELDS)[number];

export const NOTES_FIELDS = [
  'visibility_notes_movies',
  'visibility_notes_tv',
  'visibility_notes_books',
  'visibility_notes_games',
] as const;

export type NotesField = (typeof NOTES_FIELDS)[number];
type VisibilityField = ShelfField | NotesField;

/** Returns a shelf's effective privacy after its nullable override is resolved. */
export function resolveShelfTier(settings: Visibility, field: VisibilityField): VisibilityTier {
  return settings[field] ?? settings.default_privacy;
}

/** Whether a shelf follows the account-wide default instead of an explicit override. */
export function shelfInheritsDefault(settings: Visibility, field: VisibilityField): boolean {
  return settings[field] === null;
}
