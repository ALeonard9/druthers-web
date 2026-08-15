'use client';

import { useCallback, useRef, useState } from 'react';

const BATCH = 100;

/**
 * Incrementally reveals more of an already-in-memory list as an
 * IntersectionObserver sentinel scrolls into view (#122's "All" length).
 * Mounting 2000 draggable rows at once is what actually hurts responsiveness
 * - the data is already local, so this only paces the DOM.
 *
 * `resetKey` starts the count over (e.g. switching length or domain) by
 * adjusting state during render rather than in an effect - the pattern React
 * itself recommends for "reset state when a prop changes" without the extra
 * render + effect round trip.
 *
 * `sentinelRef` is a callback ref, not a ref object: the sentinel `<div>`
 * only exists in the DOM once there's more to reveal, so it mounts well
 * after this hook's first render. A plain `useRef` + effect with a
 * `[total, batch]` dependency array would set up the observer once on that
 * first render - while the element is still null - and never again, since
 * neither dependency changes when the div later appears. A callback ref
 * fires exactly when the node itself mounts or unmounts, whatever the
 * reason, which is the signal that's actually needed here.
 */
export function useIncrementalReveal(total: number, resetKey: unknown, batch = BATCH) {
  const [state, setState] = useState({ resetKey, count: Math.min(batch, total) });
  if (state.resetKey !== resetKey) {
    setState({ resetKey, count: Math.min(batch, total) });
  }

  const observerRef = useRef<IntersectionObserver | null>(null);

  const sentinelRef = useCallback(
    (el: HTMLDivElement | null) => {
      observerRef.current?.disconnect();
      observerRef.current = null;
      if (!el) return;
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            setState((s) => ({ ...s, count: Math.min(s.count + batch, total) }));
          }
        },
        { rootMargin: '400px' },
      );
      observerRef.current.observe(el);
    },
    [total, batch],
  );

  return { count: Math.min(state.count, total), sentinelRef };
}
