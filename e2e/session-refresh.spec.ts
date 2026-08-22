import { test, expect } from './support/seats';
import {
  SESSION_COOKIE,
  REFRESH_COOKIE,
  expireSession,
} from './support/auth';
import { CAST } from './support/cast';
import { signIn } from './support/auth';

// proxy.ts, in a real browser against a real api.
//
// src/proxy.test.ts already covers every branch of this with a mocked fetch.
// What it cannot show is that the whole chain works: the browser holds a
// refresh cookie the middleware can read, the api accepts it, the rotated
// token is written back in a form the browser keeps, and the page that
// triggered the refresh renders signed-in rather than one render late.

// Serial, and each test signs in for itself. Both are load-bearing.
//
// A refresh token ROTATES when it is spent: the api hands back a new one and
// treats a second presentation of the old one as a replay (outside a short
// REFRESH_TOKEN_REUSE_LEEWAY_SECONDS window). So these tests cannot share a
// cached session the way the rest of the suite does - the first test to
// refresh would invalidate the token the others are holding, and they would
// fail as "rejected refresh" no matter what proxy.ts did.
//
// That costs three sign-ins against the per-IP auth budget
// (`rate_limit_auth`, default 10 per 5 minutes). A full local run therefore
// wants RATE_LIMITS_ENABLED=false in druthers-api/env/dev.env; without it,
// back-to-back runs inside five minutes will 429 and the failures will look
// like broken assertions.
test.describe.configure({ mode: 'serial' });

test.describe('@authenticated session refresh', () => {
  test('an expired access token is renewed silently, without a trip to /login', async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await signIn(page, CAST.follower);

    const before = (await context.cookies()).find((c) => c.name === SESSION_COOKIE);
    expect(before).toBeDefined();

    // The session cookie is sized to the access token, so its absence is
    // exactly the signal proxy.ts refreshes on. Dropping it is a faithful
    // stand-in for expiry and does not require waiting one out.
    await expireSession(page);
    expect(
      (await context.cookies()).find((c) => c.name === SESSION_COOKIE),
      'session cookie should be gone before the reload',
    ).toBeUndefined();
    expect(
      (await context.cookies()).find((c) => c.name === REFRESH_COOKIE),
      'refresh cookie must survive, it is what gets spent',
    ).toBeDefined();

    await page.goto('/movies');

    // The user never sees a sign-in screen.
    await expect(page).not.toHaveURL(/\/login/);

    const after = (await context.cookies()).find((c) => c.name === SESSION_COOKIE);
    expect(after, 'a fresh session cookie should have been minted').toBeDefined();
    expect(after!.value).not.toBe('');

    await context.close();
  });

  test('the render that triggered the refresh is already signed in', async ({ browser }) => {
    // The two-write subtlety in proxy.ts: without writing the rotated token
    // back onto the REQUEST cookies, this page would render signed-out and
    // only the next one would be correct.
    const context = await browser.newContext();
    const page = await context.newPage();
    await signIn(page, CAST.follower);
    await expireSession(page);

    await page.goto('/movies');
    await expect(page).toHaveURL(/\/movies/);
    await expect(
      page.getByText('Developer sign-in (local)'),
      'the signed-out login form should not be on this page',
    ).toHaveCount(0);

    await context.close();
  });

  test('a rejected refresh token drops to signed-out with no redirect loop', async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await signIn(page, CAST.follower);

    // Corrupt the refresh token rather than deleting it: an absent token is
    // the signed-out path, which is a different branch. A present-but-invalid
    // one is what a revoked or replayed token looks like.
    const cookies = await context.cookies();
    await context.clearCookies();
    await context.addCookies(
      cookies
        .filter((c) => c.name !== SESSION_COOKIE)
        .map((c) => (c.name === REFRESH_COOKIE ? { ...c, value: 'not-a-real-refresh-token' } : c)),
    );

    const response = await page.goto('/');
    expect(response?.status(), 'a rejected refresh must not 5xx').toBeLessThan(500);

    // Cleared, not left dangling: a stale cookie promising a dead session is
    // what causes the loop this test exists to rule out.
    const left = await context.cookies();
    expect(left.find((c) => c.name === SESSION_COOKIE)).toBeUndefined();

    await context.close();
  });
});
