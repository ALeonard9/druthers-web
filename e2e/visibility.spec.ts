import { test, expect } from './support/seats';

// Visibility, driven from the seat each rule applies to.
//
// These are the specs the dev cast exists for. Every one of them passes from
// the admin/target seat while broken: that seat is public, friendly with
// everyone, and holds the whole catalog, so a tier check that never runs still
// looks correct from there.
//
// Note on the contract these assert: a hidden profile is a *soft* 404. The
// page answers 200 and renders "keeps this close" with a friend-request
// prompt, rather than a hard 404. That is deliberate (a hard 404 would make a
// shared link look broken), so these tests assert on what is rendered rather
// than on the status code. Asserting the status would pass on a page that
// answers 404 while still leaking the shelf, which is exactly backwards.

const HIDDEN_COPY = /keeps this close|Profile unavailable/i;

// A cold server render of a profile route can take well over the default
// expect timeout on the first hit of a run. Observed failing at 11.9s once
// across three consecutive runs, which is a flake, not a regression - and a
// flaky visibility test is worse than none, because it trains you to rerun.
const SLOW_RENDER = { timeout: 20_000 };

test.describe('@authenticated visibility', () => {
  test('a private profile shows the unavailable page and leaks no shelf', async ({ stranger }) => {
    // `private-user` has six seeded movies behind this. If the shelf ever
    // renders here, the tier check has been lost.
    await stranger.goto('/u/private-user');

    await expect(stranger.getByText(HIDDEN_COPY).first()).toBeVisible(SLOW_RENDER);
    await expect(
      stranger.getByText(/Top 5/),
      'a private profile must not render its ranked shelf',
    ).toHaveCount(0);
    await expect(
      stranger.getByText(/ranked across/),
      'a private profile must not disclose how much it holds',
    ).toHaveCount(0);
  });

  test('a friends-only profile is hidden from a non-friend', async ({ stranger }) => {
    // `friend` is friends-tier with the target; `stranger` has no
    // relationship with anyone. This is that boundary seen from outside it.
    await stranger.goto('/u/friend');

    await expect(stranger.getByText(HIDDEN_COPY).first()).toBeVisible(SLOW_RENDER);
    await expect(stranger.getByText(/Top 5/)).toHaveCount(0);
  });

  test('a public profile is readable by a stranger with no relationship', async ({ stranger }) => {
    await stranger.goto('/u/public-user');

    await expect(stranger.getByText(/Top 5/).first()).toBeVisible(SLOW_RENDER);
    await expect(
      stranger.getByText(HIDDEN_COPY),
      'a public profile must not render the hidden-profile page',
    ).toHaveCount(0);
    // The seed gives public-user three ranked movies, so the shelf is
    // genuinely populated and "readable" means more than "not blocked".
    await expect(stranger.getByText(/ranked across/).first()).toBeVisible();
  });

  test('a hidden profile is indistinguishable from a handle that does not exist', async ({
    stranger,
  }) => {
    // Non-enumeration. If a private profile said "private" and an unknown
    // handle said "not found", probing /u/<guess> would be a membership
    // oracle: anyone could confirm an account exists without being able to
    // see it. Both must give the same answer.
    // Scoped to <main>, not <body>: the surrounding nav carries a
    // time-of-day greeting that can change between two loads, which is
    // unrelated to what the profile discloses.
    await stranger.goto('/u/private-user');
    const hidden = (await stranger.locator('main').innerText())
      .replace(/private-user/g, 'HANDLE');

    await stranger.goto('/u/no-such-user-there-is-no-chance-this-exists');
    const missing = (await stranger.locator('main').innerText())
      .replace(/no-such-user-there-is-no-chance-this-exists/g, 'HANDLE');

    expect(
      missing,
      'a nonexistent handle renders differently from a hidden one, which turns /u/<guess> into a membership oracle',
    ).toBe(hidden);
  });

  test('an unknown handle renders the hidden-profile page, not an error', async ({
    stranger,
  }) => {
    // Lives in the authenticated lane, NOT the smoke lane, because rendering
    // /u/<handle> at all requires the api: the page has to ask who this is
    // and whether the viewer may see them. It was briefly a smoke test and
    // failed in PR CI with a 500, which is correct behaviour for a backendless
    // environment and the wrong thing to assert there.
    //
    // Deliberately NOT a 404: a nonexistent handle answers 200 with the same
    // "keeps this close" page a private profile shows, which is what stops
    // /u/<guess> being a membership oracle.
    const response = await stranger.goto('/u/no-such-handle-anywhere');
    expect(response?.status()).toBe(200);
    await expect(stranger.getByText(HIDDEN_COPY).first()).toBeVisible(SLOW_RENDER);
  });

  test('a followee profile renders for a follower', async ({ follower }) => {
    // The asymmetric case: `follower` follows, is not followed back, and can
    // still read a public profile. Pairs with the hidden cases above to show
    // the difference is the tier and not a blanket denial.
    await follower.goto('/u/followee');
    await expect(follower.getByText(HIDDEN_COPY)).toHaveCount(0);
  });
});
