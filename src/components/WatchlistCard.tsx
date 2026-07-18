'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { UserMovie } from '@/lib/types';

export function WatchlistCard({ userMovie }: { userMovie: UserMovie }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { movie } = userMovie;

  function track(body: Record<string, unknown>) {
    startTransition(async () => {
      await fetch(`/api/movies/${movie.id}/track`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      router.refresh();
    });
  }

  return (
    <li className="flex flex-col overflow-hidden rounded-lg border border-line bg-panel">
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
        <div className="mt-auto flex items-center justify-between pt-1">
          <button
            onClick={() => track({ on_rankings: true })}
            disabled={pending || userMovie.on_rankings}
            className="rounded bg-brass px-2 py-1 text-xs font-medium text-ink hover:bg-brass-bright disabled:opacity-50"
            title="Add to your ranked list"
          >
            {userMovie.on_rankings ? 'In Rankings' : '→ Rankings'}
          </button>
          <button
            onClick={() => track({ on_watchlist: false })}
            disabled={pending}
            className="rounded px-2 py-1 text-xs text-neutral-500 hover:text-red-400 disabled:opacity-50"
          >
            Remove
          </button>
        </div>
      </div>
    </li>
  );
}
