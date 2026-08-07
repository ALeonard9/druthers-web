'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { duelHrefFor } from '@/lib/duelShelves';
import { isUnreleased, isRankable, formatReleaseDate } from '@/lib/movies';
import type { UserMovie } from '@/lib/types';
import { SwipeableRow } from './SwipeableRow';

export function WatchlistCard({ userMovie }: { userMovie: UserMovie }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { movie } = userMovie;

  const unreleased = isUnreleased(movie.release_date);
  const rankable = isRankable(movie.release_date);

  function track(body: Record<string, unknown>) {
    startTransition(async () => {
      await fetch(`/api/movies/${movie.id}/track`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      // Promoting to the rankings leaves it unplaced, so carry straight on to
      // the duel to decide where it goes; anything else just refreshes here.
      if (body.on_rankings === true) {
        router.push(duelHrefFor('movies', movie.id));
      } else {
        router.refresh();
      }
    });
  }

  return (
    <li className="block">
      <SwipeableRow
        onFullSwipeRight={() => track({ on_watchlist: false })}
        rightActionWidth={80}
        fullSwipeThreshold={120}
        className="flex h-full flex-col overflow-hidden rounded-lg border border-line bg-panel"
        rightActions={
          <div className="flex h-full w-20 flex-col items-center justify-center bg-red-600/90 text-white shadow-inner">
            <span className="text-xs font-medium">Remove</span>
          </div>
        }
      >
        <Link href={`/movies/${movie.id}`} className="aspect-[2/3] block bg-line">
          {movie.poster_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={movie.poster_url}
              alt={movie.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center p-2 text-center text-xs text-neutral-500">
              {movie.title}
            </div>
          )}
        </Link>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <Link
          href={`/movies/${movie.id}`}
          className="line-clamp-2 text-sm font-medium hover:text-brass-bright"
          title={movie.title}
        >
          {movie.title}
        </Link>
        {unreleased && (
          <span className="inline-block rounded border border-sky-800/50 bg-sky-950/60 px-2 py-0.5 font-mono text-[10px] text-sky-400">
            Release: {formatReleaseDate(movie.release_date)}
          </span>
        )}
        {userMovie.source_handle && (
          <p className="font-mono text-[10px] uppercase tracking-wider text-brass/80">From @{userMovie.source_handle}</p>
        )}
        <div className="mt-auto flex items-center justify-between pt-1">
          {rankable ? (
            <button
              onClick={() => track({ on_rankings: true })}
              disabled={pending || userMovie.on_rankings}
              className="rounded bg-brass px-2 py-1 text-xs font-medium text-ink hover:bg-brass-bright disabled:opacity-50"
              title="Add to your ranked list"
            >
              {userMovie.on_rankings ? 'In Rankings' : '→ Rankings'}
            </button>
          ) : (
            <span className="text-xs text-neutral-500 italic">Not rankable yet</span>
          )}
          <button
            onClick={() => track({ on_watchlist: false })}
            disabled={pending}
            className="rounded px-2 py-1 text-xs text-neutral-500 hover:text-red-400 disabled:opacity-50"
          >
            Remove
          </button>
        </div>
      </div>
      </SwipeableRow>
    </li>
  );
}
