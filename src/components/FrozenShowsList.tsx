'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ScheduleFrozenShow } from '@/lib/types';

// Shows hidden from the schedule (the API field is still `freeze` — legacy
// name). Unhiding here puts their episodes back on the schedule/catch-up.
export function FrozenShowsList({ shows }: { shows: ScheduleFrozenShow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function unhide(showId: string) {
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
      <h2 className="mb-1 text-lg font-medium text-neutral-200">
        Hidden from Schedule
      </h2>
      <p className="mb-2 text-xs text-neutral-500">
        These shows&apos; episodes don&apos;t appear above until you unhide
        them.
      </p>
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
              onClick={() => unhide(s.show_id)}
              disabled={pending}
              title="Put this show's episodes back on the Schedule"
              className="rounded bg-neutral-700 px-2 py-1 text-xs font-medium text-white hover:bg-neutral-600 disabled:opacity-50"
            >
              Unhide
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
