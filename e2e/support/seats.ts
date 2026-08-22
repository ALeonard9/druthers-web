import { test as base, type Browser, type BrowserContext, type Page } from '@playwright/test';
import { CAST, targetSeat, type Seat } from './cast';
import { signIn } from './auth';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Seat fixtures that sign in once and reuse the session.
 *
 * The api caps password sign-ins at `rate_limit_auth` (default 10) per IP per
 * five minutes, and enforces it whenever ENV is dev/qa/prod - so both the
 * local and the QA lane are subject to it. A suite that signs in per test
 * would spend that budget inside the first spec file and then fail the rest
 * with 429s that look like broken assertions.
 *
 * So each seat signs in at most once per run, and its storage state is cached
 * on disk. A full suite across six seats costs six sign-ins regardless of how
 * many tests use them.
 *
 * The cache is per-run, not per-machine: `.auth/` is gitignored and cleared by
 * the setup project, because a stale token in it would fail in a way that
 * looks like a broken session rather than a stale file.
 */
const AUTH_DIR = path.join(process.cwd(), '.auth');

function statePath(seat: Seat) {
  return path.join(AUTH_DIR, `${seat.handle}.json`);
}

/** Sign the seat in once and cache its cookies; reuse the cache afterwards. */
export async function contextForSeat(
  browser: Browser,
  seat: Seat,
): Promise<BrowserContext> {
  const file = statePath(seat);
  if (fs.existsSync(file)) {
    return browser.newContext({ storageState: file });
  }
  fs.mkdirSync(AUTH_DIR, { recursive: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  await signIn(page, seat);
  await context.storageState({ path: file });
  await page.close();
  return context;
}

type SeatFixtures = {
  /** Signed in as `follower`: the everyday seat for shelf and ranking work. */
  follower: Page;
  /** Signed in as `friend`: shares all eight canon titles, so compare is `ready`. */
  friend: Page;
  /** Signed in as `stranger`: no relationship, under the overlap threshold. */
  stranger: Page;
  /** Signed in as `publicUser`: a stranger whose own shelves are readable. */
  publicUser: Page;
  /** Signed in as the admin/target seat. Use only for admin rules. */
  target: Page;
};

function seatFixture(seat: Seat) {
  return async (
    { browser }: { browser: Browser },
    run: (p: Page) => Promise<void>,
  ) => {
    const context = await contextForSeat(browser, seat);
    const page = await context.newPage();
    await run(page);
    await context.close();
  };
}

export const test = base.extend<SeatFixtures>({
  follower: seatFixture(CAST.follower),
  friend: seatFixture(CAST.friend),
  stranger: seatFixture(CAST.stranger),
  publicUser: seatFixture(CAST.publicUser),
  target: async ({ browser }, run) => {
    const context = await contextForSeat(browser, targetSeat());
    const page = await context.newPage();
    await run(page);
    await context.close();
  },
});

export { expect } from '@playwright/test';
export { CAST, targetSeat };
