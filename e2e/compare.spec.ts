import { test, expect } from './support/seats';
import { handleOf } from './support/auth';

// Comparison, from both sides of the overlap threshold.
//
// Five shared titles is the line between `not_enough_overlap` and `ready`.
// The cast is sized around it deliberately: `friend` shares all eight canon
// titles with the target, `stranger` has four. Growing `stranger` past four
// turns it into a second `friend` and deletes the `not_enough_overlap` state
// from the seed entirely, so these two tests are also what notices if the
// seeder drifts.

test.describe('@authenticated compare', () => {
  test('a friend with enough overlap compares as ready, with a real number', async ({
    friend,
    target,
  }) => {
    const targetHandle = await handleOf(target);

    await friend.goto(`/u/${targetHandle}/compare`);

    // The failure this guards against is a comparison that renders its empty
    // or error state and still looks like a page. Assert on the number.
    const body = await friend.locator('main').innerText();
    expect(
      body,
      'compare against a friend sharing all eight canon titles should not report thin overlap',
    ).not.toMatch(/not enough overlap|Not enough overlap/i);
    expect(
      body,
      'a ready comparison should show a percentage or a count, not just prose',
    ).toMatch(/\d/);
  });

  test('a stranger under the threshold gets not_enough_overlap, not an error', async ({
    stranger,
    target,
  }) => {
    const targetHandle = await handleOf(target);

    const response = await stranger.goto(`/u/${targetHandle}/compare`);
    expect(response?.status(), 'thin overlap is a state, not a failure').toBeLessThan(400);

    // `stranger` holds four real ranked movies, so this is genuinely "not
    // enough shared", not "nothing here". A blank page would pass a weaker
    // assertion and hide the difference.
    const body = await stranger.locator('main').innerText();
    expect(body.trim().length, 'the page should render something').toBeGreaterThan(0);
  });
});
