'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { UserMovie } from '@/lib/types';
import { PlaceAtInput } from './PlaceAtInput';

// The "to rank" bucket: movies added to Rankings but not yet positioned.
export function ToRankList({
  items,
  placedCount,
}: {
  items: UserMovie[];
  placedCount: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function removeFromRankings(movieId: string) {
    startTransition(async () => {
      await fetch(`/api/movies/${movieId}/track`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ on_rankings: false }),
      });
      router.refresh();
    });
  }

  if (items.length === 0) return null;

  return (
    <div className="mb-6 rounded-lg border border-dashed border-neutral-700 bg-neutral-900/50 p-3">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-neutral-400">
        To rank ({items.length}) — enter where each belongs
      </p>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-3">
            {item.movie.poster_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.movie.poster_url}
                alt=""
                className="h-12 w-8 rounded object-cover"
              />
            ) : (
              <div className="h-12 w-8 rounded bg-neutral-800" />
            )}
            <span className="flex-1 truncate text-sm">{item.movie.title}</span>
            <PlaceAtInput movieId={item.movie.id} max={placedCount + 1} />
            <button
              onClick={() => removeFromRankings(item.movie.id)}
              disabled={pending}
              className="rounded px-2 py-1 text-xs text-neutral-500 hover:text-red-400"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
