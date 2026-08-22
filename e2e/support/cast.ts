/**
 * The dev cast, as Playwright sees it.
 *
 * The canonical reference is `druthers-api/docs/dev-cast.md` - who each seat
 * is, what rule it exists to demonstrate, and why the shelf sizes are what
 * they are. This file is only the machine-readable half: emails and the
 * relationships a spec needs to pick a seat. Keep the two in step; a third
 * copy of these facts would drift.
 *
 * The same cast is seeded into local dev (`task seed:dev`) and into QA (the
 * api's `seed_qa_cast` step in deploy_qa), which is what lets one spec file
 * run against either without a per-environment fixture.
 *
 * Driving every spec as the admin seat is the single most common way a broken
 * visibility or comparison rule still passes: `you` is public, friendly with
 * everyone, and holds the whole catalog. Pick the seat the rule applies to.
 */

/** Shared by every cast account in every environment it is seeded into. */
export const CAST_PASSWORD = process.env.E2E_CAST_PASSWORD ?? 'change-me';

export interface Seat {
  email: string;
  password: string;
  handle: string;
  /** What this seat, and only this seat, can demonstrate. */
  proves: string;
}

const seat = (handle: string, email: string, proves: string): Seat => ({
  email,
  password: CAST_PASSWORD,
  handle,
  proves,
});

export const CAST = {
  friend: seat(
    'friend',
    'friend@example.com',
    'friends-only shelves render, and comparison reaches `ready` (shares all eight canon titles)',
  ),
  follower: seat(
    'follower',
    'follower@example.com',
    'the asymmetric follow: they are in your followers, you are not in theirs',
  ),
  followee: seat(
    'followee',
    'followee@example.com',
    'a visible profile with one shelf still hidden behind a friends-only tier',
  ),
  publicUser: seat(
    'public-user',
    'public@example.com',
    'a stranger whose shelves are readable anyway',
  ),
  privateUser: seat(
    'private-user',
    'private@example.com',
    'a profile that 404s, with a stocked shelf behind it so the 404 is the tier and not emptiness',
  ),
  stranger: seat(
    'stranger',
    'stranger@example.com',
    '`not_enough_overlap`: a real shelf, still under the five shared titles alignment needs',
  ),
  adminTwo: seat(
    'admin-two',
    'admin-two@gmail.com',
    'an admin acting on another admin, which must be refused (#341)',
  ),
} as const;

/**
 * The target user the whole cast is anchored to - "you".
 *
 * Per-clone and per-environment, so it is read from the environment and never
 * hardcoded: locally it is the seed admin from `druthers-api/env/dev.env`, and
 * on QA it is the dedicated e2e target user, deliberately NOT Adam's real
 * Google account (whose data QA inherits from the prod branch).
 */
export function targetSeat(): Seat {
  const email = process.env.E2E_TARGET_EMAIL;
  const password = process.env.E2E_TARGET_PASSWORD;
  if (!email || !password) {
    throw new Error(
      'E2E_TARGET_EMAIL and E2E_TARGET_PASSWORD must be set to run a spec from ' +
        'the target seat. Locally these are ADMIN_EMAIL / ADMIN_PASSWORD from ' +
        'druthers-api/env/dev.env; see taskfile.yaml `e2e:local`.',
    );
  }
  return {
    email,
    password,
    handle: process.env.E2E_TARGET_HANDLE ?? 'you',
    proves: 'the admin/target seat: public, friendly with everyone, holds the whole catalog',
  };
}
