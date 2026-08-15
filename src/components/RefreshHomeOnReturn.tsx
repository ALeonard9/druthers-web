'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';

/**
 * Home (#108) is `force-dynamic`, but that only governs server rendering -
 * Next's Client Router Cache still serves a stale RSC payload on browser
 * back/forward navigation regardless (`staleTimes` explicitly excludes
 * back/forward: https://nextjs.org/docs/app/api-reference/config/next-config-js/staleTimes).
 * `router.refresh()` is the documented way to bust that cache; this has to
 * live in the root layout (never unmounted) rather than on the page itself,
 * since a Router Cache hit reuses the page's whole subtree without
 * re-running its effects.
 */
export function RefreshHomeOnReturn() {
  const pathname = usePathname();
  const router = useRouter();
  const mounted = useRef(false);

  useEffect(() => {
    if (mounted.current && pathname === '/') {
      router.refresh();
    }
    mounted.current = true;
  }, [pathname, router]);

  return null;
}
