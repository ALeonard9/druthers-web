// App-shell cache so the installed PWA opens instantly instead of a blank
// screen when the network is slow or briefly unavailable. Not a full offline
// mode - API data always comes from the network.
//
// Only static assets and Next's hashed /_next/static/ build output are
// cache-first. A *page* URL must never be. Client-side route transitions
// fetch a page's RSC payload from that same page's URL rather than under
// /api/, and with a `?_rsc=` cache-buster that leaves the pathname alone, so
// a pathname match cannot tell live page data from a static asset. Caching
// those cache-first froze a page's server-rendered snapshot indefinitely,
// since nothing here bumps the entry once cached (#98: /tv/schedule's
// watched status; and again on the home page, where a deleted item kept its
// rank and cover in the Top 5).
//
// '/' is precached as the offline fallback for a cold PWA start, but it is a
// page route, so it is served network-first through the navigate branch and
// is deliberately absent from CACHE_FIRST_URLS.
const CACHE_NAME = 'druthers-shell-v4';
const OFFLINE_FALLBACK_URL = '/';
const CACHE_FIRST_URLS = [
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];
const PRECACHE_URLS = [OFFLINE_FALLBACK_URL, ...CACHE_FIRST_URLS];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Never let an installed production PWA worker cache a local Next.js dev
  // runtime. Dev chunk names are reused while their contents change, so a
  // cache-first response can combine incompatible React/Next client modules.
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return;
  if (url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then((response) => {
          // Only a genuinely fresh page is worth keeping as the offline
          // fallback - caching an error response here would make a bad
          // deploy or a 404 the thing every future offline load falls back
          // to.
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached ?? caches.match(OFFLINE_FALLBACK_URL)),
        ),
    );
    return;
  }

  // Belt and braces alongside keeping page routes out of CACHE_FIRST_URLS:
  // an RSC payload is live page data whatever URL it is served from, so it
  // can never be answered from the shell cache.
  if (request.headers.has('RSC') || url.searchParams.has('_rsc')) return;

  const cacheable =
    url.pathname.startsWith('/_next/static/') || CACHE_FIRST_URLS.includes(url.pathname);
  if (!cacheable) return;

  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ??
        fetch(request).then((response) => {
          // A build's hashed filenames only exist while that build is live -
          // caching a 404 for one (e.g. a stale page still referencing a
          // hash from a since-replaced deploy) would pin that failure in
          // place forever, since a cache-first URL is never retried once
          // something is stored under it.
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        }),
    ),
  );
});
