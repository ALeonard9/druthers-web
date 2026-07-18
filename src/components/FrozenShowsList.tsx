'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ScheduleFrozenShow } from '@/lib/types';

// Shows the user has paused tracking on — schedule/catch-up ignore them
// until unfrozen here.
export function FrozenShowsList({ shows }: { shows: ScheduleFrozenShow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function unfreeze(showId: string) {
    startTransition(async () => {
      await fetch(`/api/tv/${showId}/track`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ freeze: 0 }),
      });
      router.refresh();
    });
  }

  if (shows.length === 0) return null;

  return (
    <section>
      <h2 className="mb-2 text-lg font-medium text-neutral-200">Frozen Shows</h2>
      <ul className="divide-y divide-line rounded-lg border border-line bg-panel">
        {shows.map((s) => (
          <li
            key={s.show_id}
            className="flex items-center justify-between px-3 py-2 text-sm"
          >
            <Link
              href={`/tv/${s.show_id}`}
              className="text-neutral-200 hover:text-brass-bright hover:underline"
            >
              {s.show_title}
            </Link>
            <button
              onClick={() => unfreeze(s.show_id)}
              disabled={pending}
              className="rounded bg-neutral-700 px-2 py-1 text-xs font-medium text-white hover:bg-neutral-600 disabled:opacity-50"
            >
              Unfreeze
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
