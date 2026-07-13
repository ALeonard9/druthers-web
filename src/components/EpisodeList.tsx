'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { TVEpisode } from '@/lib/types';

// Episode list grouped by season, with per-episode watched toggles. The
// watched set comes from the server (user's marks); toggles hit the BFF and
// refresh so the server stays the source of truth.
export function EpisodeList({
  episodes,
  watchedIds,
}: {
  episodes: TVEpisode[];
  watchedIds: string[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const watched = useMemo(() => new Set(watchedIds), [watchedIds]);

  const seasons = useMemo(() => {
    const bySeason = new Map<number, TVEpisode[]>();
    for (const ep of episodes) {
      const s = ep.season ?? 0;
      if (!bySeason.has(s)) bySeason.set(s, []);
      bySeason.get(s)!.push(ep);
    }
    return [...bySeason.entries()].sort(([a], [b]) => a - b);
  }, [episodes]);

  // Default the open season to the first with an unwatched episode.
  const firstUnwatched = seasons.find(([, eps]) =>
    eps.some((e) => !watched.has(e.id)),
  )?.[0];
  const [open, setOpen] = useState<number | null>(firstUnwatched ?? null);

  function toggle(ep: TVEpisode) {
    startTransition(async () => {
      await fetch(`/api/tv/episodes/${ep.id}/watch`, {
        method: watched.has(ep.id) ? 'DELETE' : 'POST',
      });
      router.refresh();
    });
  }

  if (episodes.length === 0) {
    return (
      <p className="text-sm text-neutral-500">
        No episodes yet — they sync from TVMaze when the show is opened.
      </p>
    );
  }

  const totalWatched = episodes.filter((e) => watched.has(e.id)).length;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-neutral-500">
        {totalWatched}/{episodes.length} episodes watched
      </p>
      {seasons.map(([season, eps]) => {
        const seasonWatched = eps.filter((e) => watched.has(e.id)).length;
        const isOpen = open === season;
        return (
          <div
            key={season}
            className="rounded-lg border border-neutral-800 bg-neutral-900"
          >
            <button
              onClick={() => setOpen(isOpen ? null : season)}
              className="flex w-full items-center justify-between px-3 py-2 text-sm"
            >
              <span className="font-medium">Season {season}</span>
              <span className="text-xs text-neutral-500">
                {seasonWatched}/{eps.length} watched {isOpen ? '▾' : '▸'}
              </span>
            </button>
            {isOpen && (
              <ul className="border-t border-neutral-800">
                {eps.map((ep) => {
                  const isWatched = watched.has(ep.id);
                  return (
                    <li
                      key={ep.id}
                      className="flex items-center gap-3 border-b border-neutral-800/60 px-3 py-1.5 text-sm last:border-b-0"
                    >
                      <button
                        onClick={() => toggle(ep)}
                        disabled={pending}
                        aria-label={
                          isWatched ? 'Mark unwatched' : 'Mark watched'
                        }
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs disabled:opacity-50 ${
                          isWatched
                            ? 'border-green-600 bg-green-600 text-white'
                            : 'border-neutral-600 text-transparent hover:border-green-500'
                        }`}
                      >
                        ✓
                      </button>
                      <span className="w-10 shrink-0 text-xs text-neutral-500">
                        E{ep.season_number ?? '?'}
                      </span>
                      <span
                        className={`flex-1 truncate ${
                          isWatched ? 'text-neutral-500' : 'text-neutral-200'
                        }`}
                      >
                        {ep.title}
                      </span>
                      {ep.airdate && (
                        <span className="hidden text-xs text-neutral-600 sm:inline">
                          {ep.airdate.slice(0, 10)}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
