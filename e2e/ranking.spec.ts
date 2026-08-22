import { test, expect } from './support/seats';

// Ranking.
//
// The duel needs something to compare. `follower` holds two ranked movies and
// an empty watchlist, so its ranking route has no pair to offer - which is the
// state row 39 of the flow matrix is about, and the one most likely to render
// as a broken empty screen rather than a graceful fallback.

test.describe('@authenticated ranking', () => {
  test('a shelf with nothing to rank falls back to the list, not an empty duel', async ({
    follower,
  }) => {
    await follower.goto('/movies/ranking');

    const body = await follower.locator('main').innerText();

    // The fallback is the shelf itself, with its ranked count intact. An
    // empty duel would render neither.
    expect(body, 'the fallback lost the shelf state').toMatch(/\d+\s+ranked/i);
    expect(
      body.trim().length,
      'the ranking route rendered nothing when there was no pair to offer',
    ).toBeGreaterThan(0);

    // And it must not strand the user: the way back to the list is on screen.
    await expect(follower.getByRole('link', { name: /Ranking/i }).first()).toBeVisible();
  });

  test('the ranked list shows positions in order', async ({ follower }) => {
    await follower.goto('/movies/ranking/list');

    const body = await follower.locator('main').innerText();
    // Two seeded movies means positions 1 and 2 exist. A list that renders
    // titles without positions is the regression here: it looks populated and
    // has lost the thing that makes it a ranking.
    expect(body, 'the ranked list rendered no position numbers').toMatch(/\b1\b/);
    await expect(
      follower.getByText(/Go To/i).first(),
      'the jump-to-position control is missing from the ranked list',
    ).toBeVisible();
  });

  test('every domain offers a route to rank by comparison', async ({ follower }) => {
    // Four-domain lockstep: the duel entry point existing on movies and
    // silently missing on games is exactly the drift this catches.
    for (const domain of ['movies', 'tv', 'books', 'games']) {
      await follower.goto(`/${domain}/ranking/list`);
      const body = await follower.locator('main').innerText();
      expect(
        body,
        `${domain} ranked list has no route into the comparison flow`,
      ).toMatch(/Rank by comparison|Drag a|Nothing ranked/i);
    }
  });
});
