'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { playPop } from '@/lib/pop';
import type { TVEpisode } from '@/lib/types';

// Episode list grouped by season, with per-episode watched toggles. The
// watched set comes from the server (user's marks); toggles hit the BFF and
// refresh so the server stays the source of truth.
export function EpisodeList({
  showId,
  episodes,
  watchedIds,
}: {
  showId: string;
  episodes: TVEpisode[];
  watchedIds: string[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const watched = useMemo(() => new Set(watchedIds), [watchedIds]);

  function markAllWatched(season?: number) {
    playPop();
    setError(null);
    startTransition(async () => {
      const qs = season != null ? `?season=${season}` : '';
      const res = await fetch(`/api/tv/${showId}/watch-all${qs}`, { method: 'POST' });
      if (!res.ok) {
        setError('Could not mark episodes watched — try again.');
        return;
      }
      router.refresh();
    });
  }

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
    if (!watched.has(ep.id)) playPop();
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/tv/episodes/${ep.id}/watch`, {
        method: watched.has(ep.id) ? 'DELETE' : 'POST',
      });
      if (!res.ok) {
        setError('Could not update watched state — try again.');
        return;
      }
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
      <div className="flex items-center justify-between">
        <p className="text-xs text-neutral-500">
          {totalWatched}/{episodes.length} episodes watched
        </p>
        {totalWatched < episodes.length && (
          <button
            onClick={() => markAllWatched()}
            disabled={pending}
            className="rounded bg-neutral-700 px-3 py-1 text-xs font-medium text-white hover:bg-neutral-600 disabled:opacity-50"
          >
            Mark all watched
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {seasons.map(([season, eps]) => {
        const seasonWatched = eps.filter((e) => watched.has(e.id)).length;
        const isOpen = open === season;
        return (
          <div
            key={season}
            className="rounded-lg border border-line bg-panel"
          >
            <div className="flex w-full items-center justify-between px-3 py-2 text-sm">
              <button
                onClick={() => setOpen(isOpen ? null : season)}
                className="flex-1 text-left font-medium"
              >
                Season {season}
              </button>
              <span className="flex items-center gap-2 text-xs text-neutral-500">
                {seasonWatched < eps.length && (
                  <button
                    onClick={() => markAllWatched(season)}
                    disabled={pending}
                    className="rounded bg-line px-2 py-1 font-medium text-neutral-300 hover:bg-neutral-700 hover:text-white disabled:opacity-50"
                  >
                    Mark season watched
                  </button>
                )}
                <button
                  onClick={() => setOpen(isOpen ? null : season)}
                  className="px-1"
                >
                  {seasonWatched}/{eps.length} watched {isOpen ? '▾' : '▸'}
                </button>
              </span>
            </div>
            {isOpen && (
              <ul className="border-t border-line">
                {eps.map((ep) => {
                  const isWatched = watched.has(ep.id);
                  return (
                    <li
                      key={ep.id}
                      className="flex items-center gap-3 border-b border-line/60 px-3 py-1.5 text-sm last:border-b-0"
                    >
                      <span className="w-10 shrink-0 text-xs text-neutral-500">
                        {season}.{ep.season_number ?? '?'}
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
                      <button
                        onClick={() => toggle(ep)}
                        disabled={pending}
                        title={isWatched ? 'Mark unwatched' : 'Mark watched'}
                        className={`shrink-0 rounded px-2 py-1 text-xs font-medium disabled:opacity-50 ${
                          isWatched
                            ? 'bg-moss text-ink hover:bg-moss-bright'
                            : 'bg-plum-wash text-plum hover:bg-plum hover:text-ink'
                        }`}
                      >
                        {isWatched ? '✓ Watched' : 'Unwatched'}
                      </button>
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
