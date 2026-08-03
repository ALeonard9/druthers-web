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

function loadFetchHandler(
  fakeFetch: (req: Request, init?: RequestInit) => Promise<Response> = async () =>
    new Response('ok'),
  puts: { request: Request; response: Response }[] = [],
): (event: FakeEvent) => void {
  const src = readFileSync(resolve(__dirname, '../../public/sw.js'), 'utf8');
  const listeners: Record<string, (event: FakeEvent) => void> = {};

  const fakeSelf = {
    location: { origin: 'http://localhost:3000' },
    addEventListener: (name: string, handler: (event: FakeEvent) => void) => {
      listeners[name] = handler;
    },
    skipWaiting: () => {},
    clients: { claim: () => {} },
  };

  const fakeCaches = {
    open: async () => ({
      addAll: async () => {},
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

  const handler = listeners.fetch;
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
): { event: FakeEvent; responded: boolean; result: Promise<unknown> | undefined } {
  const handler = loadFetchHandler(fakeFetch, puts);
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
    const { responded } = fetchEvent('http://localhost:3000/tv/schedule', 'same-origin');
    expect(responded).toBe(false);
  });

  it('does NOT intercept API calls', () => {
    const { responded } = fetchEvent('http://localhost:3000/api/tv/some-id/track', 'same-origin');
    expect(responded).toBe(false);
  });

  it('still cache-firsts hashed Next.js static assets', () => {
    const { responded } = fetchEvent(
      'http://localhost:3000/_next/static/chunks/main.js',
      'same-origin',
    );
    expect(responded).toBe(true);
  });

  it('still cache-firsts the declared app-shell URLs', () => {
    const { responded } = fetchEvent('http://localhost:3000/manifest.webmanifest', 'same-origin');
    expect(responded).toBe(true);
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
      'http://localhost:3000/_next/static/chunks/deleted-hash.js',
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
      'http://localhost:3000/_next/static/chunks/current-hash.js',
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
    const { result } = fetchEvent('http://localhost:3000/', 'navigate', serverError, puts);
    await result;
    expect(puts).toHaveLength(0);
  });

  it('fetches navigations with cache: no-store, so no intermediate cache can hand back a stale page', async () => {
    let sawInit: RequestInit | undefined;
    const spy = async (_req: Request, init?: RequestInit) => {
      sawInit = init;
      return new Response('ok');
    };
    const { result } = fetchEvent('http://localhost:3000/', 'navigate', spy);
    await result;
    expect(sawInit?.cache).toBe('no-store');
  });
});
