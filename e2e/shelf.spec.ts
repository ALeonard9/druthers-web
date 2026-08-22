import { test, expect } from './support/seats';

// Shelves, across all four domains.
//
// The four-domain rule in AGENTS.md exists because these drift: a change lands
// on movies and the other three are found months later. Parametrising holds
// them together, so a shelf that stops rendering in one domain fails here
// rather than in a bug report.
//
// The per-domain differences below are real product vocabulary, not an
// inconsistency to normalise away. Movies and TV queue into a "Watchlist";
// books have a "Reading List" at /books/to-read; games have a "Play List" at
// /games/backlog. A test that assumed /<domain>/watchlist for all four passed
// on movies and TV and failed on the other two, which is exactly the drift
// this file is here to catch.

const SHELVES = [
  { path: 'movies', queue: 'movies/watchlist', queueLabel: /on watchlist|Nothing queued/i },
  { path: 'tv', queue: 'tv/watchlist', queueLabel: /on watchlist|Nothing queued/i },
  { path: 'books', queue: 'books/to-read', queueLabel: /Reading List/i },
  { path: 'games', queue: 'games/backlog', queueLabel: /Play List/i },
] as const;

test.describe('@authenticated shelves', () => {
  for (const shelf of SHELVES) {
    test(`${shelf.path}: the shelf renders with a ranked count`, async ({ follower }) => {
      await follower.goto(`/${shelf.path}`);
      const body = await follower.locator('main').innerText();

      // "N ranked" is load-bearing: it is the shelf reporting real state. A
      // shelf that renders its chrome and no count is the failure this
      // catches, and it looks perfectly fine in a screenshot.
      expect(body, `${shelf.path} shelf did not report a ranked count`).toMatch(/\d+\s+ranked/i);
    });

    test(`${shelf.path}: the queue renders with its own vocabulary`, async ({ follower }) => {
      await follower.goto(`/${shelf.queue}`);
      const body = await follower.locator('main').innerText();
      expect(body, `${shelf.queue} did not render its queue`).toMatch(shelf.queueLabel);
    });

    test(`${shelf.path}: the ranked list view renders`, async ({ follower }) => {
      await follower.goto(`/${shelf.path}/ranking/list`);
      const body = await follower.locator('main').innerText();
      expect(body.trim().length, 'ranked list rendered nothing').toBeGreaterThan(0);
      await expect(follower.getByRole('link', { name: /Ranking/i }).first()).toBeVisible();
    });
  }

  test('the shelf view preference persists across a reload', async ({ follower }) => {
    // Server-rendered, so this only passes if the choice round-trips to the
    // API rather than living in component state. The controls are radios, not
    // buttons: they carry an explicit role="radio", so getByRole('button')
    // does not match them even though they are <button> elements.
    await follower.goto('/movies');

    const carousel = follower.getByRole('radio', { name: 'Carousel' });
    await expect(carousel).toBeVisible();
    await carousel.click();
    await expect(carousel).toBeChecked();

    await follower.reload();
    await expect(
      follower.getByRole('radio', { name: 'Carousel' }),
      'the view preference did not survive a reload',
    ).toBeChecked();

    // Leave the seat as it was found: these specs share cached sessions and a
    // run must not depend on the order they happened to execute in.
    await follower.getByRole('radio', { name: 'List' }).click();
    await expect(follower.getByRole('radio', { name: 'List' })).toBeChecked();
  });
});
