import { expect, type Page } from '@playwright/test';
import type { Seat } from './cast';

/**
 * Sign in through the real UI, from a named cast seat.
 *
 * Deliberately drives the form rather than injecting cookies: the whole point
 * of the authenticated lane is that the BFF actually mints `aleonard_session`,
 * `aleonard_refresh` and `aleonard_user` against a real api. Injecting cookies
 * would skip exactly the machinery under test.
 *
 * The password form lives collapsed inside a <details> on /login and is
 * rendered whenever NEXT_PUBLIC_APP_ENV is not 'prod', so it is present in
 * both local dev and QA builds. QA's api accepts it because QA deploys with
 * DISABLE_PASSWORD_LOGIN=0 (druthers-infra `gcp/env.qa.sh`), a deliberate
 * delta from prod, which stays Google-only.
 *
 * Mind the sign-in rate limit. The api caps password attempts per IP
 * (`rate_limit_auth`, default 10 per 5 minutes) and enforces it whenever
 * ENV is dev/qa/prod - so both lanes are subject to it, and a QA run shares
 * one source IP across every worker. Sign in once per spec file and reuse the
 * storage state rather than once per test.
 */
export async function signIn(page: Page, seat: Seat): Promise<void> {
  await page.goto('/login');

  const fallback = page.getByText('Developer sign-in (local)');
  await expect(
    fallback,
    'the password form is missing - is this a prod build (NEXT_PUBLIC_APP_ENV=prod)?',
  ).toBeVisible();
  await fallback.click();

  await page.getByLabel('Email').fill(seat.email);
  await page.getByLabel('Password').fill(seat.password);
  // `exact` matters: the Google Sign-In widget renders its own button labelled
  // "Sign in with Google", and when that script wins the race there are two
  // matches and a strict-mode violation. Whether it loads in time varies run
  // to run, which made this an intermittent failure rather than an obvious
  // one. Scope to the form to be certain.
  await page
    .locator('form')
    .getByRole('button', { name: 'Sign in', exact: true })
    .click();

  // The form redirects off /login on success. Asserting the negative rather
  // than a specific landing route keeps this helper useful if onboarding or
  // the post-login destination moves.
  // Name the rate limit explicitly. It is by far the most common reason this
  // fails, and "still on /login" reads like a broken seat rather than a spent
  // per-IP budget, which sends you looking in the wrong place.
  const rateLimited = await page
    .getByText(/Too many sign-in attempts/)
    .count();
  expect(
    rateLimited,
    'the api rate-limited this sign-in (rate_limit_auth, default 10 per IP per 5 minutes). ' +
      'Specs must reuse a cached seat session rather than signing in per test; ' +
      'see contextForSeat() in e2e/support/seats.ts.',
  ).toBe(0);

  await expect(
    page,
    'still on /login after submitting - check the seat exists in this environment (local: `task seed:dev`, QA: the seed_qa_cast deploy step)',
  ).not.toHaveURL(/\/login/);
}

/** The cookies the BFF mints. Named here so specs assert on one source. */
export const SESSION_COOKIE = 'aleonard_session';
export const REFRESH_COOKIE = 'aleonard_refresh';
export const USER_COOKIE = 'aleonard_user';
export const IMPERSONATION_COOKIE = 'aleonard_impersonation';

/** Drop just the access-token cookie, leaving the refresh token in place. */
export async function expireSession(page: Page): Promise<void> {
  const context = page.context();
  const cookies = await context.cookies();
  await context.clearCookies();
  await context.addCookies(cookies.filter((c) => c.name !== SESSION_COOKIE));
}

/**
 * The signed-in user's own handle, read at runtime.
 *
 * Handles are per-clone: the target/admin seat is whatever the seed admin in
 * `env/dev.env` became, so hardcoding "you" works on exactly one machine. The
 * BFF proxies `/v1/users/me/visibility`, which carries `handle`, so a signed-in
 * page can just ask.
 */
export async function handleOf(page: Page): Promise<string> {
  const response = await page.request.get('/api/visibility');
  if (!response.ok()) {
    throw new Error(
      `could not read own handle: /api/visibility returned ${response.status()}. ` +
        'Is this page signed in?',
    );
  }
  const body = await response.json();
  const handle = body?.handle ?? body?.data?.handle;
  if (!handle) throw new Error('/api/visibility returned no handle');
  return handle as string;
}
