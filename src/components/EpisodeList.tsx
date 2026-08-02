'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { playPop } from '@/lib/pop';
import type { TVEpisode } from '@/lib/types';

// Episode list grouped by season, with per-episode watched toggles. The
// watched set comes from the server (user's marks); toggles hit the BFF and
// refresh so the server stays the source of truth. `overrides` is a local
// optimistic layer on top of that: it flips instantly on click so the button
// doesn't wait on the round trip, then gets cleared once fresh server data
// (a new `watchedIds` prop, via router.refresh()) lands — or rolled back if
// the request fails.
export function EpisodeList({
  showId,
  episodes,
  watchedIds,
  favoritedIds,
}: {
  showId: string;
  episodes: TVEpisode[];
  watchedIds: string[];
  favoritedIds: string[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Map<string, boolean>>(new Map());
  const [favoriteOverrides, setFavoriteOverrides] = useState<Map<string, boolean>>(
    new Map(),
  );
  const watched = useMemo(() => new Set(watchedIds), [watchedIds]);
  const favorited = useMemo(() => new Set(favoritedIds), [favoritedIds]);

  // The server just resynced (a new watchedIds/favoritedIds array landed via
  // router.refresh()) — it's the source of truth again, so drop any
  // optimistic overrides instead of shadowing it. Adjusting state during
  // render (rather than in an effect) per
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes.
  const [prevWatchedIds, setPrevWatchedIds] = useState(watchedIds);
  if (watchedIds !== prevWatchedIds) {
    setPrevWatchedIds(watchedIds);
    setOverrides(new Map());
  }
  const [prevFavoritedIds, setPrevFavoritedIds] = useState(favoritedIds);
  if (favoritedIds !== prevFavoritedIds) {
    setPrevFavoritedIds(favoritedIds);
    setFavoriteOverrides(new Map());
  }

  function isWatched(id: string): boolean {
    return overrides.has(id) ? overrides.get(id)! : watched.has(id);
  }

  function setOverride(id: string, value: boolean) {
    setOverrides((prev) => {
      const next = new Map(prev);
      next.set(id, value);
      return next;
    });
  }

  function isFavorited(id: string): boolean {
    return favoriteOverrides.has(id) ? favoriteOverrides.get(id)! : favorited.has(id);
  }

  function setFavoriteOverride(id: string, value: boolean) {
    setFavoriteOverrides((prev) => {
      const next = new Map(prev);
      next.set(id, value);
      return next;
    });
  }

  const bySeasonMap = useMemo(() => {
    const bySeason = new Map<number, TVEpisode[]>();
    for (const ep of episodes) {
      const s = ep.season ?? 0;
      if (!bySeason.has(s)) bySeason.set(s, []);
      bySeason.get(s)!.push(ep);
    }
    return bySeason;
  }, [episodes]);

  const seasons = useMemo(
    () => [...bySeasonMap.entries()].sort(([a], [b]) => a - b),
    [bySeasonMap],
  );

  function markAllWatched(season?: number) {
    playPop();
    setError(null);
    const targets = season != null ? (bySeasonMap.get(season) ?? []) : episodes;
    const previous = new Map(overrides);
    setOverrides((prev) => {
      const next = new Map(prev);
      for (const ep of targets) next.set(ep.id, true);
      return next;
    });
    startTransition(async () => {
      const qs = season != null ? `?season=${season}` : '';
      const res = await fetch(`/api/tv/${showId}/watch-all${qs}`, { method: 'POST' });
      if (!res.ok) {
        setError('Could not mark episodes watched — try again.');
        setOverrides(previous);
        return;
      }
      router.refresh();
    });
  }

  // Default the open season to the first with an unwatched episode.
  const firstUnwatched = seasons.find(([, eps]) =>
    eps.some((e) => !watched.has(e.id)),
  )?.[0];
  const [open, setOpen] = useState<number | null>(firstUnwatched ?? null);

  function toggle(ep: TVEpisode) {
    const wasWatched = isWatched(ep.id);
    if (!wasWatched) playPop();
    setError(null);
    setOverride(ep.id, !wasWatched);
    startTransition(async () => {
      const res = await fetch(`/api/tv/episodes/${ep.id}/watch`, {
        method: wasWatched ? 'DELETE' : 'POST',
      });
      if (!res.ok) {
        setError('Could not update watched state — try again.');
        setOverride(ep.id, wasWatched);
        return;
      }
      router.refresh();
    });
  }

  function toggleFavorite(ep: TVEpisode) {
    const wasFavorited = isFavorited(ep.id);
    if (!wasFavorited) playPop();
    setError(null);
    setFavoriteOverride(ep.id, !wasFavorited);
    startTransition(async () => {
      const res = await fetch(`/api/tv/episodes/${ep.id}/favorite`, {
        method: wasFavorited ? 'DELETE' : 'POST',
      });
      if (!res.ok) {
        setError('Could not update favorite — try again.');
        setFavoriteOverride(ep.id, wasFavorited);
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

  const totalWatched = episodes.filter((e) => isWatched(e.id)).length;

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
        const seasonWatched = eps.filter((e) => isWatched(e.id)).length;
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
                  const epWatched = isWatched(ep.id);
                  const epFavorited = isFavorited(ep.id);
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
                          epWatched ? 'text-neutral-500' : 'text-neutral-200'
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
                        onClick={() => toggleFavorite(ep)}
                        disabled={pending}
                        title={epFavorited ? 'Unfavorite' : 'Favorite'}
                        aria-label={epFavorited ? 'Unfavorite episode' : 'Favorite episode'}
                        className={`shrink-0 rounded px-1.5 py-1 text-sm disabled:opacity-50 ${
                          epFavorited
                            ? 'text-brass hover:text-brass-bright'
                            : 'text-neutral-600 hover:text-neutral-400'
                        }`}
                      >
                        {epFavorited ? '★' : '☆'}
                      </button>
                      <button
                        onClick={() => toggle(ep)}
                        disabled={pending}
                        title={epWatched ? 'Mark unwatched' : 'Mark watched'}
                        className={`shrink-0 rounded px-2 py-1 text-xs font-medium disabled:opacity-50 ${
                          epWatched
                            ? 'bg-moss text-ink hover:bg-moss-bright'
                            : 'bg-plum-wash text-plum hover:bg-plum hover:text-ink'
                        }`}
                      >
                        {epWatched ? '✓ Watched' : 'Unwatched'}
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
