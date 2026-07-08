'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { UserMovie } from '@/lib/types';
import { PlaceAtInput } from './PlaceAtInput';

const WINDOW = 25;

function Row({ item, placedCount }: { item: UserMovie; placedCount: number }) {
  const router = useRouter();
  const { movie } = item;

  function remove() {
    if (
      !window.confirm(
        `Remove "${movie.title}" from your ranked list? The movies below it move up.`,
      )
    )
      return;
    fetch(`/api/movies/${movie.id}/track`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ on_rankings: false }),
    }).then(() => router.refresh());
  }

  return (
    <li className="flex items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-900 p-2">
      {movie.poster_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={movie.poster_url} alt="" className="h-12 w-8 rounded object-cover" />
      ) : (
        <div className="h-12 w-8 rounded bg-neutral-800" />
      )}
      <span className="inline-flex h-7 min-w-[2.75rem] items-center justify-center rounded-full bg-neutral-700 px-2 text-sm font-semibold text-white">
        {item.rank}
      </span>
      <Link
        href={`/movies/${movie.id}`}
        className="flex-1 truncate text-sm text-indigo-300 hover:text-indigo-200 hover:underline"
      >
        {movie.title}
        {movie.year ? ` (${movie.year})` : ''}
      </Link>
      <PlaceAtInput movieId={movie.id} current={item.rank} max={placedCount} />
      <button
        onClick={remove}
        className="rounded px-2 py-1 text-xs text-neutral-500 hover:text-red-400"
      >
        Remove
      </button>
    </li>
  );
}

export function RankingsList({
  items,
  placedCount,
}: {
  items: UserMovie[];
  placedCount: number;
}) {
  // `start` is the rank the window begins at; "Go To" jumps here.
  const [start, setStart] = useState(1);
  const [goto, setGoto] = useState('');

  function submitGoto(e: React.FormEvent) {
    e.preventDefault();
    const n = parseInt(goto, 10);
    if (Number.isFinite(n) && n >= 1) {
      setStart(Math.max(1, Math.min(n, placedCount)));
    }
  }

  if (items.length === 0) {
    return <p className="text-sm text-neutral-500">No ranked movies yet.</p>;
  }

  const windowItems = items
    .filter((m) => (m.rank ?? 0) >= start)
    .slice(0, WINDOW);
  const shownFrom = windowItems[0]?.rank ?? start;
  const shownTo = windowItems[windowItems.length - 1]?.rank ?? start;

  return (
    <div className="flex flex-col gap-3">
      <form onSubmit={submitGoto} className="flex gap-2">
        <input
          type="number"
          min={1}
          max={placedCount}
          value={goto}
          onChange={(e) => setGoto(e.target.value)}
          placeholder={`Go to position (1–${placedCount})`}
          className="flex-1 rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          className="rounded bg-neutral-700 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-600"
        >
          Go To…
        </button>
      </form>

      <div className="flex items-center justify-between text-xs text-neutral-500">
        <span>
          Showing #{shownFrom}–#{shownTo} of {placedCount}
        </span>
        <span className="flex gap-2">
          <button
            onClick={() => setStart((s) => Math.max(1, s - WINDOW))}
            disabled={start <= 1}
            className="rounded px-2 py-1 hover:text-neutral-200 disabled:opacity-40"
          >
            ↑ up
          </button>
          <button
            onClick={() =>
              setStart((s) => Math.min(placedCount, s + WINDOW))
            }
            disabled={shownTo >= placedCount}
            className="rounded px-2 py-1 hover:text-neutral-200 disabled:opacity-40"
          >
            ↓ down
          </button>
        </span>
      </div>

      <ul className="flex flex-col gap-2">
        {windowItems.map((item) => (
          <Row key={item.movie.id} item={item} placedCount={placedCount} />
        ))}
      </ul>
    </div>
  );
}
