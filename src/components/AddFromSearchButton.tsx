'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { playPop } from '@/lib/pop';
import { TrackedBadge } from './TrackedBadge';

const DOMAIN_PAGE = {
  movies: '/movies',
  tv: '/tv',
  games: '/games',
  books: '/books',
} as const;

// One-click "add to my list" for a global-search result row. Adds to the
// domain's watchlist via its existing add route. If the result is already
// tracked (server-driven, web#31), shows a badge instead — ranked items get
// no action, watchlist-only items get a promote-to-rankings shortcut.
export function AddFromSearchButton({
  domain,
  payload,
  onWatchlist = false,
  onRankings = false,
  rank = null,
}: {
  domain: 'movies' | 'tv' | 'games' | 'books';
  payload: Record<string, unknown>;
  onWatchlist?: boolean;
  onRankings?: boolean;
  rank?: number | null;
}) {
  const router = useRouter();
  const [state, setState] = useState<'idle' | 'added' | 'error'>('idle');
  const [pending, startTransition] = useTransition();

  function add(list: 'watchlist' | 'rankings') {
    startTransition(async () => {
      const res = await fetch(`/api/${domain}/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, list }),
      });
      if (res.ok) {
        playPop();
        setState('added');
        router.push(DOMAIN_PAGE[domain]);
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
  if (onRankings) {
    return <TrackedBadge onRankings rank={rank} />;
  }
  if (onWatchlist) {
    return (
      <div className="flex shrink-0 items-center gap-1.5">
        <TrackedBadge onRankings={false} rank={null} />
        <button
          onClick={() => add('rankings')}
          disabled={pending}
          className="shrink-0 rounded bg-brass px-2 py-1 text-xs font-medium text-ink hover:bg-brass-bright disabled:opacity-50"
        >
          → Rank
        </button>
      </div>
    );
  }
  return (
    <button
      onClick={() => add('watchlist')}
      disabled={pending}
      className="shrink-0 rounded bg-brass px-2 py-1 text-xs font-medium text-ink hover:bg-brass-bright disabled:opacity-50"
    >
      {state === 'error' ? 'Retry' : '+ Add'}
    </button>
  );
}
