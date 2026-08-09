'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    if (process.env.NODE_ENV === 'development') {
      // A production worker left behind on localhost can cache Next's hashed
      // chunks across branch/build changes. Mixing those runtimes produces
      // misleading React.lazy errors before the affected component renders.
      Promise.all([
        navigator.serviceWorker
          .getRegistrations()
          .then((registrations) =>
            Promise.all(registrations.map((registration) => registration.unregister())),
          ),
        'caches' in window
          ? caches
              .keys()
              .then((keys) =>
                Promise.all(
                  keys
                    .filter((key) => key.startsWith('druthers-shell-'))
                    .map((key) => caches.delete(key)),
                ),
              )
          : Promise.resolve([]),
      ]).catch((err) => {
        console.error('Development service worker cleanup failed', err);
      });
      return;
    }

    navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }).catch((err) => {
      console.error('Service worker registration failed', err);
    });
  }, []);

  return null;
}
