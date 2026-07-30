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
const CACHE_NAME = 'druthers-shell-v2';
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
  if (url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
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
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        }),
    ),
  );
});
