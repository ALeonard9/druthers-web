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

function loadFetchHandler(): (event: FakeEvent) => void {
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
      put: async () => {},
    }),
    match: async () => undefined,
    keys: async () => [],
    delete: async () => true,
  };

  const context = vm.createContext({
    self: fakeSelf,
    caches: fakeCaches,
    fetch: async () => new Response('ok'),
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

function fetchEvent(url: string, mode: string): { event: FakeEvent; responded: boolean } {
  const handler = loadFetchHandler();
  const request = new Request(url, { method: 'GET', mode: mode as RequestMode });
  let responded = false;
  const event: FakeEvent = {
    request,
    respondWith: () => {
      responded = true;
    },
    waitUntil: () => {},
  };
  handler(event);
  return { event, responded };
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
