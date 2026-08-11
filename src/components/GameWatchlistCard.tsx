'use client';

import Link from 'next/link';
import { gameWatchlistActionItem } from '@/lib/deck';
import type { UserVideoGame } from '@/lib/types';
import { SwipeableRow } from './SwipeableRow';
import {
  WatchlistActions,
  useRemoveWatchlistItem,
  useWatchlistItemRemoved,
} from './WatchlistActions';

export function GameWatchlistCard({ userGame }: { userGame: UserVideoGame }) {
  const { game } = userGame;
  const actionItem = gameWatchlistActionItem(userGame);
  const remove = useRemoveWatchlistItem();
  const removed = useWatchlistItemRemoved(game.id);

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
        <Link href={`/games/${game.id}`} className="aspect-[3/4] block bg-line">
          {game.poster_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={game.poster_url}
              alt={game.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center p-2 text-center text-xs text-neutral-500">
              {game.title}
            </div>
          )}
        </Link>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <Link
          href={`/games/${game.id}`}
          className="line-clamp-2 text-sm font-medium hover:text-brass-bright"
          title={game.title}
        >
          {game.title}
        </Link>
        {userGame.source_handle && (
          <p className="font-mono text-[10px] uppercase tracking-wider text-brass/80">From @{userGame.source_handle}</p>
        )}
        {game.platforms && (
          <p className="line-clamp-1 text-xs text-neutral-500">{game.platforms}</p>
        )}
        <div className="mt-auto flex items-center justify-between pt-1">
          <WatchlistActions item={actionItem} />
        </div>
      </div>
      </SwipeableRow>
    </li>
  );
}
