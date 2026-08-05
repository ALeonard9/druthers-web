import type { Visibility, VisibilityTier } from './types';

// The 8 shelf-facing tiers a "Default Sharing" bulk-apply is allowed to
// touch — deliberately excludes visibility_profile, which the caller raises
// separately via the existing floor-check flow.
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

/**
 * The most common tier among the 8 shelf fields — what the "Default
 * Sharing" control shows as selected. Ties break toward the less-open tier
 * (private, then friends, then public) so the control never overstates how
 * open things already are.
 */
export function impliedDefaultTier(settings: Visibility): VisibilityTier {
  const counts: Record<VisibilityTier, number> = { private: 0, friends: 0, public: 0 };
  for (const field of SHELF_FIELDS) {
    counts[settings[field]] += 1;
  }
  let best: VisibilityTier = 'private';
  for (const tier of ['friends', 'public'] as const) {
    if (counts[tier] > counts[best]) {
      best = tier;
    }
  }
  return best;
}

/**
 * The subset of shelf fields currently equal to `impliedDefault` — the set
 * a bulk-apply of a new default is allowed to touch. A field the owner has
 * already set away from the shared value is left alone.
 */
export function fieldsFollowingDefault(
  settings: Visibility,
  impliedDefault: VisibilityTier
): ShelfField[] {
  return SHELF_FIELDS.filter((field) => settings[field] === impliedDefault);
}
