import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';

// Regression test for druthers-web#91 ("Fix broken Hide from Schedule
// toggle"). The bug wasn't in the freeze flag's persistence or in
// get_schedule()'s filtering (both already worked) — it was in the
// installed PWA's service worker (public/sw.js), which cache-firsted any
// same-origin GET that wasn't a navigation and wasn't under /api/. Next.js's
// client-side route transitions fetch a page's RSC payload from that page's
// own URL in exactly that shape, so the first in-app visit to /tv/schedule
// got cached indefinitely — later visits (e.g. right after toggling
// "Hide from Schedule") kept serving that frozen snapshot instead of hitting
// the network. Fixed by scoping cache-first down to the declared shell URLs
// and Next's hashed /_next/static/ output (see sw.js's SHELL_URLS + cacheable
// check). This test loads the real sw.js source into a sandboxed fake
// ServiceWorkerGlobalScope and asserts that shape holds, so a future edit
// can't quietly widen the cache-first net back over page routes.

interface FakeEvent {
  request: Request;
  respondWith: (p: unknown) => void;
  waitUntil: (p: unknown) => void;
}

function loadSw(
  fakeFetch: (req: Request, init?: RequestInit) => Promise<Response> = async () =>
    new Response('ok'),
  puts: { request: Request; response: Response }[] = [],
  origin = 'https://www.druthers.io',
  precached: string[][] = [],
): Record<string, (event: FakeEvent) => void> {
  const src = readFileSync(resolve(__dirname, '../../public/sw.js'), 'utf8');
  const listeners: Record<string, (event: FakeEvent) => void> = {};

  const fakeSelf = {
    location: { origin },
    addEventListener: (name: string, handler: (event: FakeEvent) => void) => {
      listeners[name] = handler;
    },
    skipWaiting: () => {},
    clients: { claim: () => {} },
  };

  const fakeCaches = {
    open: async () => ({
      addAll: async (urls: string[]) => {
        precached.push(urls);
      },
      put: async (request: Request, response: Response) => {
        puts.push({ request, response });
      },
    }),
    match: async () => undefined,
    keys: async () => [],
    delete: async () => true,
  };

  const context = vm.createContext({
    self: fakeSelf,
    caches: fakeCaches,
    fetch: fakeFetch,
    URL,
    Request,
    Response,
    console,
  });
  vm.runInContext(src, context, { filename: 'sw.js' });
  return listeners;
}

/**
 * Keeping '/' out of the cache-first list is what stops the home page's RSC
 * payload freezing, but '/' still has to be *precached* or a cold PWA start
 * with no network has nothing to fall back to. sw.js keeps those two lists
 * separate precisely so they can differ, so pin the fallback down here.
 */
async function precachedUrls(): Promise<string[]> {
  const precached: string[][] = [];
  const install = loadSw(undefined, undefined, undefined, precached).install;
  if (!install) throw new Error('sw.js never registered an install listener');
  let waited: unknown;
  install({ waitUntil: (p: unknown) => (waited = p) } as unknown as FakeEvent);
  await waited;
  return precached.flat();
}

function loadFetchHandler(
  fakeFetch?: (req: Request, init?: RequestInit) => Promise<Response>,
  puts?: { request: Request; response: Response }[],
  origin?: string,
): (event: FakeEvent) => void {
  const handler = loadSw(fakeFetch, puts, origin).fetch;
  if (!handler) throw new Error('sw.js never registered a fetch listener');
  return handler;
}

// The real `Request` constructor rejects `mode: 'navigate'` — browsers
// reserve it for actual navigations, never settable from script. sw.js only
// reads `.method`/`.url`/`.mode` off the request it's handed, so a plain
// object stands in fine for a navigation event.
function fakeNavigateRequest(url: string): Request {
  return { method: 'GET', url, mode: 'navigate' } as Request;
}

function fetchEvent(
  url: string,
  mode: string,
  fakeFetch?: (req: Request, init?: RequestInit) => Promise<Response>,
  puts?: { request: Request; response: Response }[],
  origin?: string,
): { event: FakeEvent; responded: boolean; result: Promise<unknown> | undefined } {
  const handler = loadFetchHandler(fakeFetch, puts, origin);
  const request =
    mode === 'navigate'
      ? fakeNavigateRequest(url)
      : new Request(url, { method: 'GET', mode: mode as RequestMode });
  let responded = false;
  let result: Promise<unknown> | undefined;
  const event: FakeEvent = {
    request,
    respondWith: (p) => {
      responded = true;
      result = p as Promise<unknown>;
    },
    waitUntil: () => {},
  };
  handler(event);
  return { event, responded, result };
}

describe('sw.js fetch strategy (druthers-web#91 regression)', () => {
  it('does NOT cache-first a same-origin page route fetched as a client-side transition', () => {
    // This is the exact request shape Next.js issues for a soft navigation:
    // a GET to the page's own URL, mode "same-origin" (not "navigate").
    const { responded } = fetchEvent('https://www.druthers.io/tv/schedule', 'same-origin');
    expect(responded).toBe(false);
  });

  it('does NOT cache-first the home page fetched as a client-side transition', () => {
    // '/' is in the shell list as the offline fallback for a cold PWA start,
    // but it is also a page route, so it needs the same exemption
    // /tv/schedule got above. A soft navigation home — and the
    // router.refresh() behind RefreshHomeOnReturn — fetches the home page's
    // RSC payload from '/' with an `?_rsc=` cache-buster that leaves the
    // pathname alone, so a shell-list check on pathname alone matches it.
    // Cache-firsting that froze the Top 5: a deleted item kept its rank and
    // cover on the home page indefinitely.
    const { responded } = fetchEvent('https://www.druthers.io/?_rsc=1t9kq', 'same-origin');
    expect(responded).toBe(false);
  });

  it('does NOT intercept API calls', () => {
    const { responded } = fetchEvent('https://www.druthers.io/api/tv/some-id/track', 'same-origin');
    expect(responded).toBe(false);
  });

  it('still cache-firsts hashed Next.js static assets', () => {
    const { responded } = fetchEvent(
      'https://www.druthers.io/_next/static/chunks/main.js',
      'same-origin',
    );
    expect(responded).toBe(true);
  });

  it('still cache-firsts the declared app-shell URLs', () => {
    const { responded } = fetchEvent('https://www.druthers.io/manifest.webmanifest', 'same-origin');
    expect(responded).toBe(true);
  });

  it('still precaches the home page as the offline fallback', async () => {
    expect(await precachedUrls()).toContain('/');
  });

  it('does NOT intercept Next.js assets on localhost', () => {
    const { responded } = fetchEvent(
      'http://localhost:3000/_next/static/chunks/main.js',
      'same-origin',
      undefined,
      undefined,
      'http://localhost:3000',
    );
    expect(responded).toBe(false);
  });
});

describe('sw.js does not pin a bad response into the cache (PWA-in-prod regression)', () => {
  // A stale PWA session referencing a deploy's since-deleted hashed asset,
  // or a brief server error during a deploy, must not get permanently
  // cached — that would make the broken state outlive the deploy that
  // caused it, since a cache-first URL is never retried once something is
  // stored under it.

  it('does not cache a 404 for a hashed static asset', async () => {
    const puts: { request: Request; response: Response }[] = [];
    const notFound = async () => new Response('not found', { status: 404 });
    const { result } = fetchEvent(
      'https://www.druthers.io/_next/static/chunks/deleted-hash.js',
      'same-origin',
      notFound,
      puts,
    );
    await result;
    expect(puts).toHaveLength(0);
  });

  it('still caches a successful hashed static asset response', async () => {
    const puts: { request: Request; response: Response }[] = [];
    const ok = async () => new Response('ok');
    const { result } = fetchEvent(
      'https://www.druthers.io/_next/static/chunks/current-hash.js',
      'same-origin',
      ok,
      puts,
    );
    await result;
    expect(puts).toHaveLength(1);
  });

  it('does not cache a failed navigation as the offline fallback', async () => {
    const puts: { request: Request; response: Response }[] = [];
    const serverError = async () => new Response('error', { status: 500 });
    const { result } = fetchEvent('https://www.druthers.io/', 'navigate', serverError, puts);
    await result;
    expect(puts).toHaveLength(0);
  });

  it('fetches navigations with cache: no-store, so no intermediate cache can hand back a stale page', async () => {
    let sawInit: RequestInit | undefined;
    const spy = async (_req: Request, init?: RequestInit) => {
      sawInit = init;
      return new Response('ok');
    };
    const { result } = fetchEvent('https://www.druthers.io/', 'navigate', spy);
    await result;
    expect(sawInit?.cache).toBe('no-store');
  });
});
