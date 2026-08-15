'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { playPop } from '@/lib/pop';
import { SHELVES, catalogIdFrom, duelHrefFor, isAlreadyPlaced } from '@/lib/duelShelves';
import { TrackedBadge } from './TrackedBadge';
import { useMultiAddMode } from './MultiAddMode';
import { NotRankableMessage } from './CatalogSearchResults';

const DOMAIN_PAGE = {
  movies: '/movies',
  tv: '/tv',
  games: '/games',
  books: '/books',
} as const;

function SearchActionIcon({ kind }: { kind: 'list' | 'rank' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {kind === 'list' ? (
        <rect x="4" y="4" width="16" height="16" rx="2" />
      ) : (
        <>
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <path d="m8 12 3 3 5-6" />
        </>
      )}
    </svg>
  );
}

// One-click "add to my list" for a global-search result row. Adds to the
// domain's watchlist via its existing add route. If the result is already
// tracked (server-driven, web#31), shows a badge instead - ranked items get
// no action, watchlist-only items get a promote-to-rankings shortcut.
export function AddFromSearchButton({
  domain,
  payload,
  onWatchlist = false,
  onRankings = false,
  rank = null,
  addable = true,
  rankable = true,
  watchlistHref,
}: {
  domain: 'movies' | 'tv' | 'games' | 'books';
  payload: Record<string, unknown>;
  onWatchlist?: boolean;
  onRankings?: boolean;
  rank?: number | null;
  addable?: boolean;
  rankable?: boolean;
  watchlistHref?: string;
}) {
  const router = useRouter();
  const multiAddMode = useMultiAddMode();
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
        // Straight to the duel when it's going on the rankings - the API
        // usually adds it unplaced, so the position still has to be decided.
        // Exception: the first title into an empty shelf auto-places at #1
        // (api#289), so there's nothing left to decide - go to the board.
        if (list === 'rankings' && !multiAddMode) {
          const tracker = await res.json().catch(() => null);
          if (isAlreadyPlaced(tracker)) {
            router.push(SHELVES[domain].boardHref);
          } else {
            router.push(duelHrefFor(domain, catalogIdFrom(domain, tracker)));
          }
        } else if (!multiAddMode) {
          router.push(watchlistHref ?? DOMAIN_PAGE[domain]);
        }
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
      <div className="flex w-full flex-col gap-1">
        <TrackedBadge onRankings={false} rank={null} domain={domain} />
        {rankable ? (
          <button
            onClick={() => add('rankings')}
            disabled={pending || !addable}
            className="inline-flex w-full items-center justify-center gap-1 rounded bg-brass px-2 py-1 text-xs font-medium text-ink hover:bg-brass-bright disabled:opacity-50"
          >
            <SearchActionIcon kind="rank" />
            Rank
          </button>
        ) : (
          <NotRankableMessage />
        )}
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => add('watchlist')}
        disabled={pending || !addable}
        className="inline-flex flex-1 items-center justify-center gap-1 rounded bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-500 disabled:opacity-50"
      >
        {pending ? (
          'Adding…'
        ) : state === 'error' ? (
          'Retry'
        ) : (
          <>
            <SearchActionIcon kind="list" />
            {domain === 'books' ? 'Read' : domain === 'games' ? 'Play' : 'Watch'}
          </>
        )}
      </button>
      {rankable ? (
        <button
          onClick={() => add('rankings')}
          disabled={pending || !addable}
          className="inline-flex flex-1 items-center justify-center gap-1 rounded bg-brass px-2 py-1 text-xs font-medium text-ink hover:bg-brass-bright disabled:opacity-50"
        >
          {pending ? (
            'Adding…'
          ) : state === 'error' ? (
            'Retry'
          ) : (
            <>
              <SearchActionIcon kind="rank" />
              Rank
            </>
          )}
        </button>
      ) : (
        <NotRankableMessage />
      )}
    </>
  );
}
