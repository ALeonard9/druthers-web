'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { playPop } from '@/lib/pop';
import type { ScheduleEpisodeItem } from '@/lib/types';

// One episode line on the Schedule page — links to its show and marks
// watched in place (the list re-fetches via router.refresh(), so a watched
// episode simply drops out of the schedule).
export function ScheduleEpisodeRow({
  item,
  showTitle,
}: {
  item: ScheduleEpisodeItem;
  showTitle?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState(false);

  function markWatched() {
    playPop();
    setError(false);
    startTransition(async () => {
      const res = await fetch(`/api/tv/episodes/${item.episode_id}/watch`, { method: 'POST' });
      if (!res.ok) {
        setError(true);
        return;
      }
      router.refresh();
    });
  }

  return (
    <li className="flex items-center gap-3 border-b border-line/60 px-3 py-1.5 text-sm last:border-b-0">
      <span className="flex-1 truncate">
        {showTitle && (
          <Link
            href={`/tv/${item.show_id}`}
            className="text-neutral-200 hover:text-brass-bright hover:underline"
          >
            {item.show_title}
          </Link>
        )}
        {showTitle && ' — '}
        <span className="text-neutral-500">
          {item.season}.{item.season_number}
        </span>{' '}
        {item.episode_title}
      </span>
      {error && <span className="shrink-0 text-xs text-red-400">Failed — retry</span>}
      {/* Every row on this page is unwatched, so it wears the "behind" plum
          and the same label EpisodeList uses. Green is reserved for done
          (globals.css) — a green "Watched" here read as state, not action. */}
      <button
        onClick={markWatched}
        disabled={pending}
        title="Mark watched"
        className="shrink-0 rounded bg-plum-wash px-2 py-1 text-xs font-medium text-plum hover:bg-plum hover:text-ink disabled:opacity-50"
      >
        Unwatched
      </button>
    </li>
  );
}
