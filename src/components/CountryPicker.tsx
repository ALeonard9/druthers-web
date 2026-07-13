'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Country } from '@/lib/types';

// Add-a-country flow: filter the (finite, seeded) catalog of untracked
// countries and put one on the bucket list or straight into visited.
export function CountryPicker({ untracked }: { untracked: Country[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);

  const matches = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const pool = needle
      ? untracked.filter(
          (c) =>
            c.title.toLowerCase().includes(needle) ||
            (c.region ?? '').toLowerCase().includes(needle),
        )
      : untracked;
    return pool.slice(0, 12);
  }, [q, untracked]);

  function add(country: Country, body: Record<string, unknown>) {
    startTransition(async () => {
      await fetch(`/api/countries/${country.id}/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      setQ('');
      router.refresh();
    });
  }

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between text-sm font-medium text-neutral-200"
      >
        <span>+ Add a country ({untracked.length} left)</span>
        <span className="text-xs text-neutral-500">{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="mt-3 flex flex-col gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter by name or region…"
            className="rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-indigo-500"
          />
          <ul className="flex flex-col gap-1">
            {matches.map((c) => (
              <li
                key={c.id}
                className="flex items-center gap-3 rounded px-2 py-1.5 hover:bg-neutral-800/60"
              >
                <span className="w-7 text-center text-xl leading-none">
                  {c.flag_emoji ?? '🏳️'}
                </span>
                <span className="flex-1 truncate text-sm">{c.title}</span>
                <span className="hidden text-xs text-neutral-600 sm:inline">
                  {c.region}
                </span>
                <button
                  onClick={() => add(c, { on_watchlist: true })}
                  disabled={pending}
                  className="rounded bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  + Bucket list
                </button>
                <button
                  onClick={() => add(c, { on_rankings: true })}
                  disabled={pending}
                  className="rounded bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-500 disabled:opacity-50"
                >
                  ✓ Visited
                </button>
              </li>
            ))}
            {matches.length === 0 && (
              <li className="px-2 py-1.5 text-sm text-neutral-500">No matches.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
