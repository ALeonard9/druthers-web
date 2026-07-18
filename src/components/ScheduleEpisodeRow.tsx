'use client';

import { useTransition } from 'react';
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

  function markWatched() {
    playPop();
    startTransition(async () => {
      await fetch(`/api/tv/episodes/${item.episode_id}/watch`, { method: 'POST' });
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
      <button
        onClick={markWatched}
        disabled={pending}
        className="shrink-0 rounded bg-moss-wash px-2 py-1 text-xs font-medium text-moss hover:bg-moss hover:text-ink disabled:opacity-50"
      >
        Watched
      </button>
    </li>
  );
}
