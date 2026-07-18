'use client';

import { useState, useTransition } from 'react';
import { playPop } from '@/lib/pop';

// One-click "add to my list" for a global-search result row. Adds to the
// domain's watchlist via its existing add route.
export function AddFromSearchButton({
  domain,
  payload,
}: {
  domain: 'movies' | 'tv' | 'games' | 'books';
  payload: Record<string, unknown>;
}) {
  const [state, setState] = useState<'idle' | 'added' | 'error'>('idle');
  const [pending, startTransition] = useTransition();

  function add() {
    startTransition(async () => {
      const res = await fetch(`/api/${domain}/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, list: 'watchlist' }),
      });
      if (res.ok) {
        playPop();
        setState('added');
      } else {
        setState('error');
      }
    });
  }

  if (state === 'added') {
    return (
      <span className="shrink-0 rounded bg-moss-wash px-2 py-1 text-xs font-medium text-moss">
        ✓ On your list
      </span>
    );
  }
  return (
    <button
      onClick={add}
      disabled={pending}
      className="shrink-0 rounded bg-brass px-2 py-1 text-xs font-medium text-ink hover:bg-brass-bright disabled:opacity-50"
    >
      {state === 'error' ? 'Retry' : '+ Add'}
    </button>
  );
}
