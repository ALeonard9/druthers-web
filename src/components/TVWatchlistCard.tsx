'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { playPop } from '@/lib/pop';
import type { UserTVShow } from '@/lib/types';
import { ShowStatusBadge } from './ShowStatusBadge';

export function TVWatchlistCard({ userShow }: { userShow: UserTVShow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { tv_show: show } = userShow;

  function track(body: Record<string, unknown>) {
    startTransition(async () => {
      await fetch(`/api/tv/${show.id}/track`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      router.refresh();
    });
  }

  return (
    <li className="flex flex-col overflow-hidden rounded-lg border border-line bg-panel">
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
        <div className="flex items-center gap-2">
          <ShowStatusBadge show={userShow} />
          {show.status && (
            <p className="text-xs text-neutral-500">{show.status}</p>
          )}
        </div>
        <div className="mt-auto flex items-center justify-between pt-1">
          <button
            onClick={() => {
              playPop();
              track({ on_rankings: true });
            }}
            disabled={pending || userShow.on_rankings}
            className="rounded bg-moss px-2 py-1 text-xs font-medium text-ink hover:bg-moss-bright disabled:opacity-50"
            title="Add to your ranked list"
          >
            {userShow.on_rankings ? 'In Rankings' : '→ Rankings'}
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
