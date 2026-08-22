import { request as playwrightRequest } from '@playwright/test';
import type { Seat } from './cast';

/**
 * Tracker cleanup, straight against the api.
 *
 * Write specs have to leave the seat exactly as they found it, or the second
 * run of the suite is testing different data from the first. Doing that
 * through the UI is not good enough: a spec that fails halfway leaves its
 * item behind, and the *next* run then fails for a reason that has nothing to
 * do with the code.
 *
 * So cleanup goes through the api directly, from a fixture teardown that runs
 * whether the test passed or threw. It removes only the tracker row
 * (`DELETE /v1/users/me/<domain>/<tracker_id>`), never the catalog row, which
 * is shared and real.
 */
const API_BASE = process.env.E2E_API_BASE_URL ?? 'http://127.0.0.1:8000';

export type Domain = 'movies' | 'tv-shows' | 'books' | 'games';

/** The nested catalog object is named per domain: movie, tv_show, book, game. */
const CATALOG_KEY: Record<Domain, string> = {
  movies: 'movie',
  'tv-shows': 'tv_show',
  books: 'book',
  games: 'game',
};

/**
 * One token per seat per process.
 *
 * Without this, every sweep and every read mints a new one: the fixture
 * sweeps four domains before and after each test, so a five-test run spent
 * 40+ sign-ins and blew the per-IP auth budget on the second consecutive run.
 * The failure surfaced inside cleanup as a 429, which then looked like the
 * teardown was broken rather than merely thirsty.
 *
 * Tokens last far longer than a suite run, so caching costs nothing.
 */
const tokenCache = new Map<string, string>();

async function token(seat: Seat): Promise<string> {
  const cached = tokenCache.get(seat.email);
  if (cached) return cached;
  const ctx = await playwrightRequest.newContext({ baseURL: API_BASE });
  try {
    const res = await ctx.post('/v1/auth/token', {
      form: { username: seat.email, password: seat.password },
    });
    if (!res.ok()) {
      throw new Error(
        `cleanup could not authenticate as ${seat.handle}: ${res.status()}. ` +
          'If this is 429, RATE_LIMIT_AUTH is too low for this suite.',
      );
    }
    const access = (await res.json()).access_token as string;
    tokenCache.set(seat.email, access);
    return access;
  } finally {
    await ctx.dispose();
  }
}

/**
 * Remove every tracker row for `title` from this seat, if any.
 *
 * Idempotent and tolerant on purpose: it is also the sweep that clears
 * residue left by an earlier crashed run, so "nothing to remove" is a success,
 * not an error. Returns how many it removed, which lets a teardown say so.
 */
export async function removeTrackedTitle(
  seat: Seat,
  domain: Domain,
  title: string,
): Promise<number> {
  const bearer = await token(seat);
  const ctx = await playwrightRequest.newContext({
    baseURL: API_BASE,
    extraHTTPHeaders: { Authorization: `Bearer ${bearer}` },
  });
  try {
    const list = await ctx.get(`/v1/users/me/${domain}`);
    if (!list.ok()) return 0;
    const rows = (await list.json()) as Array<Record<string, unknown>>;
    const key = CATALOG_KEY[domain];

    const doomed = rows.filter((r) => {
      const catalog = r[key] as { title?: string } | undefined;
      return catalog?.title === title;
    });

    let removed = 0;
    for (const row of doomed) {
      // Keyed on the CATALOG id, not the tracker row's own id. The route is
      // `DELETE /v1/users/me/movies/{movie_id}` and it means it: passing the
      // tracker id returns a clean 404, so a teardown written the obvious way
      // reports success and deletes nothing. That is exactly the failure mode
      // a cleanup helper must not have, because the residue only surfaces as
      // a confusing failure in the NEXT run.
      const catalog = row[key] as { id?: string } | undefined;
      if (!catalog?.id) continue;
      const res = await ctx.delete(`/v1/users/me/${domain}/${catalog.id}`);
      if (res.ok()) removed += 1;
    }
    return removed;
  } finally {
    await ctx.dispose();
  }
}

/** The tracker fields an edit spec changes and must put back. */
export interface TrackerState {
  notes: string | null;
  completed_at: string | null;
}

async function authed(seat: Seat) {
  const bearer = await token(seat);
  return playwrightRequest.newContext({
    baseURL: API_BASE,
    extraHTTPHeaders: { Authorization: `Bearer ${bearer}` },
  });
}

/** Find a tracked row by title and return its catalog id plus current state. */
export async function readTracked(
  seat: Seat,
  domain: Domain,
  title: string,
): Promise<{ catalogId: string; state: TrackerState } | null> {
  const ctx = await authed(seat);
  try {
    const list = await ctx.get(`/v1/users/me/${domain}`);
    if (!list.ok()) return null;
    const key = CATALOG_KEY[domain];
    const row = ((await list.json()) as Array<Record<string, unknown>>).find(
      (r) => (r[key] as { title?: string } | undefined)?.title === title,
    );
    if (!row) return null;
    return {
      catalogId: (row[key] as { id: string }).id,
      state: {
        notes: (row.notes as string | null) ?? null,
        completed_at: (row.completed_at as string | null) ?? null,
      },
    };
  } finally {
    await ctx.dispose();
  }
}

/**
 * Write tracker fields back.
 *
 * Used by edit specs to restore what they changed. Restoring matters more
 * than it looks: these specs edit SEEDED rows rather than ones they created,
 * so a spec that fails without restoring silently changes the fixture every
 * other spec reads.
 */
export async function restoreTracked(
  seat: Seat,
  domain: Domain,
  catalogId: string,
  state: TrackerState,
): Promise<void> {
  const ctx = await authed(seat);
  try {
    await ctx.put(`/v1/users/me/${domain}/${catalogId}`, {
      data: { notes: state.notes, completed_at: state.completed_at },
    });
  } finally {
    await ctx.dispose();
  }
}
