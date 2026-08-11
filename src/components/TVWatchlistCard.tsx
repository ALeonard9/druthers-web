'use client';

import Link from 'next/link';
import { tvWatchlistActionItem } from '@/lib/deck';
import type { UserTVShow } from '@/lib/types';
import { ShowStatusBadge } from './ShowStatusBadge';
import { SwipeableRow } from './SwipeableRow';
import {
  WatchlistActions,
  useRemoveWatchlistItem,
  useWatchlistItemRemoved,
} from './WatchlistActions';

export function TVWatchlistCard({ userShow }: { userShow: UserTVShow }) {
  const { tv_show: show } = userShow;
  const actionItem = tvWatchlistActionItem(userShow);
  const remove = useRemoveWatchlistItem();
  const removed = useWatchlistItemRemoved(show.id);

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
        <Link href={`/tv/${show.id}`} className="aspect-[2/3] block bg-line">
          {show.poster_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={show.poster_url}
              alt={show.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center p-2 text-center text-xs text-neutral-500">
              {show.title}
            </div>
          )}
        </Link>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <Link
          href={`/tv/${show.id}`}
          className="line-clamp-2 text-sm font-medium hover:text-brass-bright"
          title={show.title}
        >
          {show.title}
        </Link>
        {userShow.source_handle && (
          <p className="font-mono text-[10px] uppercase tracking-wider text-brass/80">From @{userShow.source_handle}</p>
        )}
        <div className="flex items-center gap-2">
          <ShowStatusBadge show={userShow} />
          {show.status && (
            <p className="text-xs text-neutral-500">{show.status}</p>
          )}
        </div>
        <div className="mt-auto flex items-center justify-between pt-1">
          <WatchlistActions item={actionItem} />
        </div>
      </div>
      </SwipeableRow>
    </li>
  );
}
