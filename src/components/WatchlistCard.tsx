'use client';

import Link from 'next/link';
import { movieWatchlistActionItem } from '@/lib/deck';
import { isUnreleased, formatReleaseDate } from '@/lib/movies';
import type { UserMovie } from '@/lib/types';
import { SwipeableRow } from './SwipeableRow';
import {
  WatchlistActions,
  useRemoveWatchlistItem,
  useWatchlistItemRemoved,
} from './WatchlistActions';

export function WatchlistCard({ userMovie }: { userMovie: UserMovie }) {
  const { movie } = userMovie;
  const unreleased = isUnreleased(movie.release_date);
  const actionItem = movieWatchlistActionItem(userMovie);
  const remove = useRemoveWatchlistItem();
  const removed = useWatchlistItemRemoved(movie.id);

  if (removed) return null;

  return (
    <li className="block">
      <SwipeableRow
        onFullSwipeRight={() => void remove(actionItem)}
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
          <WatchlistActions item={actionItem} />
        </div>
      </div>
      </SwipeableRow>
    </li>
  );
}
