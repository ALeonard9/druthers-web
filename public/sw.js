// App-shell cache so the installed PWA opens instantly instead of a blank
// screen when the network is slow or briefly unavailable. Not a full offline
// mode — API data always comes from the network.
//
// Only the shell URLs below and Next's hashed /_next/static/ build output are
// cache-first. Everything else — including client-side route transitions,
// which fetch a page's RSC payload from that same page's URL rather than
// under /api/ — must always hit the network. Caching those cache-first froze
// a page's server-rendered snapshot (e.g. /tv/schedule's watched status)
// indefinitely, since nothing here bumps the entry once cached.
const CACHE_NAME = 'druthers-shell-v3';
const SHELL_URLS = ['/', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS)),
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
          // fallback — caching an error response here would make a bad
          // deploy or a 404 the thing every future offline load falls back
          // to.
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached ?? caches.match('/'))),
    );
    return;
  }

  const cacheable =
    url.pathname.startsWith('/_next/static/') || SHELL_URLS.includes(url.pathname);
  if (!cacheable) return;

  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ??
        fetch(request).then((response) => {
          // A build's hashed filenames only exist while that build is live —
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
