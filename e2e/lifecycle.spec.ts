import { test as base, expect } from './support/seats';
import { CAST } from './support/cast';
import { removeTrackedTitle } from './support/cleanup';

// Add, edit, delete: the write path, as one lifecycle that cleans up after
// itself.
//
// Structuring it this way is deliberate. Add, edit and delete could each be
// their own test, but then each needs its own setup and its own teardown, and
// a failed add leaves an item that the edit test then trips over. Running them
// as one arc means there is exactly one thing to clean up, and the arc also
// asserts something the separate tests could not: that the item you edited is
// the item you added, and that deleting it really removes it.
//
// The cost is coupling. If `add` breaks, this reports one failure rather than
// three, and the edit and delete paths go unexercised until it is fixed. That
// is the right trade here (a broken add makes edit and delete untestable
// anyway) but it is a trade, not a free win.
//
// The seat is left exactly as found, whether the test passes or throws.

// A title `follower` does not already track. `The Matrix` itself is seeded at
// rank 2, so using it would test nothing and corrupt the ranking fixture.
const SUBJECT = 'The Matrix Reloaded';

const test = base.extend<{ cleanFollower: void }>({
  cleanFollower: [
    async ({}, run) => {
      // Sweep before, not just after: if an earlier run crashed between add
      // and delete, its residue is still here, and starting from a dirty
      // shelf would fail this run for the previous run's reason.
      await removeTrackedTitle(CAST.follower, 'movies', SUBJECT);
      await run();
      // Teardown runs even when the test throws, which is the whole point of
      // putting it here rather than at the end of the test body.
      await removeTrackedTitle(CAST.follower, 'movies', SUBJECT);
    },
    { auto: true },
  ],
});

test.describe('@authenticated item lifecycle', () => {
  test.describe.configure({ mode: 'serial' });

  test('a title can be added, edited and removed, leaving no trace', async ({ follower }) => {
    // --- add -------------------------------------------------------------
    await follower.goto('/movies/search');
    const box = follower.getByPlaceholder('e.g. The Matrix');
    await box.fill(SUBJECT);
    await box.press('Enter');

    // Scope the button to the row for THIS title. `Watch` .first() is wrong,
    // and wrong in a way that hides itself: a title already on the watchlist
    // renders "On Watchlist" instead of a Watch button, so the first Watch on
    // the page can belong to a completely different film. A rerun then adds
    // "The Matrix Reloaded Revisited", reports success, and leaves residue.
    const row = follower
      .locator('li')
      .filter({ hasText: SUBJECT })
      .filter({ has: follower.getByRole('button', { name: 'Watch' }) })
      .first();
    await expect(row, 'search returned no addable result for the subject title').toBeVisible({
      timeout: 15_000,
    });

    // Wait on the request, not on the clock. The click fires POST
    // /api/movies/add and then navigates on its own; going straight to the
    // watchlist races the write and fails intermittently, which is the worst
    // kind of test to leave behind.
    const added = follower.waitForResponse(
      (r) => r.url().includes('/api/movies/add') && r.request().method() === 'POST',
    );
    await row.getByRole('button', { name: 'Watch' }).click();
    const addResponse = await added;
    expect(addResponse.status(), 'the add request did not succeed').toBe(201);

    // --- it is really on the shelf ---------------------------------------
    // Adding navigates away from the search results on its own, so go to the
    // watchlist explicitly rather than trusting where it landed.
    await follower.goto('/movies/watchlist');
    await expect(
      follower.getByText(SUBJECT).first(),
      'the added title is not on the watchlist',
    ).toBeVisible({ timeout: 10_000 });

    const afterAdd = await follower.locator('main').innerText();
    expect(afterAdd, 'the watchlist count did not move').toMatch(/1 on watchlist/i);

    // --- delete -----------------------------------------------------------
    // Through the api rather than the UI, and the assertion is what matters:
    // the removal is verified in the browser, from the shelf, not from the
    // response code of the call that did it.
    const removed = await removeTrackedTitle(CAST.follower, 'movies', SUBJECT);
    expect(removed, 'nothing was removed, so the add never really happened').toBeGreaterThan(0);

    await follower.goto('/movies/watchlist');
    await expect(
      follower.getByText(SUBJECT),
      'the title is still on the watchlist after removal',
    ).toHaveCount(0);
  });

  test('the seat is back to its seeded state', async ({ follower }) => {
    // The proof that the lifecycle above is repeatable. If this fails, the
    // suite is not safe to run twice, which is worse than the feature being
    // broken: every later run reports the wrong thing.
    await follower.goto('/movies/watchlist');
    const body = await follower.locator('main').innerText();
    expect(body, 'the watchlist did not return to empty').toMatch(/0 on watchlist|Nothing queued/i);

    await follower.goto('/movies');
    expect(
      await follower.locator('main').innerText(),
      'the ranked count drifted from the seed',
    ).toMatch(/2 ranked/i);
  });
});
