'use client';

import Link from 'next/link';
import { bookWatchlistActionItem } from '@/lib/deck';
import type { UserBook } from '@/lib/types';
import { SwipeableRow } from './SwipeableRow';
import {
  WatchlistActions,
  useRemoveWatchlistItem,
  useWatchlistItemRemoved,
} from './WatchlistActions';

export function BookWatchlistCard({ userBook }: { userBook: UserBook }) {
  const { book } = userBook;
  const actionItem = bookWatchlistActionItem(userBook);
  const remove = useRemoveWatchlistItem();
  const removed = useWatchlistItemRemoved(book.id);

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
        <Link href={`/books/${book.id}`} className="aspect-[2/3] block bg-line">
          {book.poster_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={book.poster_url}
              alt={book.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center p-2 text-center text-xs text-neutral-500">
              {book.title}
            </div>
          )}
        </Link>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <Link
          href={`/books/${book.id}`}
          className="line-clamp-2 text-sm font-medium hover:text-brass-bright"
          title={book.title}
        >
          {book.title}
        </Link>
        {userBook.source_handle && (
          <p className="font-mono text-[10px] uppercase tracking-wider text-brass/80">From @{userBook.source_handle}</p>
        )}
        {book.authors && (
          <p className="line-clamp-1 text-xs text-neutral-500">{book.authors}</p>
        )}
        <div className="mt-auto flex items-center justify-between pt-1">
          <WatchlistActions item={actionItem} />
        </div>
      </div>
      </SwipeableRow>
    </li>
  );
}
