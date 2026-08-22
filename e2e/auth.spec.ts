import { test, expect } from './support/seats';
import { SESSION_COOKIE, REFRESH_COOKIE, USER_COOKIE, signIn } from './support/auth';
import { CAST } from './support/cast';

// Sign-in and sign-out, from the `follower` seat.
//
// The unit tests already prove the BFF's cookie mint and its three failure
// modes (src/app/api/auth/login/route.test.ts). What only a real stack shows
// is that a real sign-in in a real browser lands on a working shelf, with
// cookies the browser will actually send back.

test.describe('@authenticated sign-in', () => {
  test('signing in leaves /login and mints httpOnly session cookies', async ({ browser }) => {
    // Deliberately not using a seat fixture: this test IS the sign-in, so it
    // needs a cold context rather than a restored one.
    const context = await browser.newContext();
    const page = await context.newPage();

    await signIn(page, CAST.follower);
    await expect(page).not.toHaveURL(/\/login/);

    const cookies = await context.cookies();
    const byName = Object.fromEntries(cookies.map((c) => [c.name, c]));

    expect(byName[SESSION_COOKIE], 'session cookie missing').toBeDefined();
    expect(byName[REFRESH_COOKIE], 'refresh cookie missing').toBeDefined();
    expect(byName[USER_COOKIE], 'user cookie missing').toBeDefined();

    // The access and refresh tokens must never be reachable from page JS.
    expect(byName[SESSION_COOKIE].httpOnly, 'session cookie is not httpOnly').toBe(true);
    expect(byName[REFRESH_COOKIE].httpOnly, 'refresh cookie is not httpOnly').toBe(true);

    const visible = await page.evaluate(() => document.cookie);
    expect(visible, 'session token is readable from document.cookie').not.toContain(
      byName[SESSION_COOKIE].value,
    );

    await context.close();
  });

  test('a signed-in seat reaches a protected route without being redirected', async ({
    follower,
  }) => {
    await follower.goto('/movies');
    await expect(follower).toHaveURL(/\/movies/);
    await expect(follower).not.toHaveURL(/\/login/);
  });

  test('a signed-out visitor is redirected off a protected route', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/movies');
    await expect(page).toHaveURL(/\/login/);
    await context.close();
  });
});
