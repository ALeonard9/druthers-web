'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { UserCountry } from '@/lib/types';

// The travel bucket list — simple rows with a "been there" promotion action.
export function CountryBucketList({ items }: { items: UserCountry[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function track(countryId: string, body: Record<string, unknown>) {
    startTransition(async () => {
      await fetch(`/api/countries/${countryId}/track`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      router.refresh();
    });
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-neutral-500">
        Nothing on the bucket list yet — add a country below.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {items.map((c) => (
        <li
          key={c.id}
          className="flex items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-900 p-2"
        >
          <span className="w-8 text-center text-2xl leading-none">
            {c.country.flag_emoji ?? '🏳️'}
          </span>
          <Link
            href={`/countries/${c.country.id}`}
            className="flex-1 truncate text-sm text-indigo-300 hover:text-indigo-200 hover:underline"
          >
            {c.country.title}
          </Link>
          <button
            onClick={() =>
              track(c.country.id, { on_watchlist: false, on_rankings: true })
            }
            disabled={pending}
            className="rounded bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-500 disabled:opacity-50"
            title="Move to your visited ranking"
          >
            ✓ Visited
          </button>
          <button
            onClick={() => track(c.country.id, { on_watchlist: false })}
            disabled={pending}
            className="rounded px-2 py-1 text-xs text-neutral-500 hover:text-red-400 disabled:opacity-50"
          >
            Remove
          </button>
        </li>
      ))}
    </ul>
  );
}
