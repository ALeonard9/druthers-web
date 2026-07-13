'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export interface FilterValues {
  q: string;
  genre: string;
  yearMin: string;
  yearMax: string;
  ratingMin: string;
}

// Filters the lists via URL search params (server re-renders the filtered set).
export function FilterBar({
  initial,
  basePath = '/movies',
  searchLabel = 'Search (title, director, cast)',
  searchPlaceholder = 'e.g. Nolan',
}: {
  initial: FilterValues;
  basePath?: string;
  searchLabel?: string;
  searchPlaceholder?: string;
}) {
  const router = useRouter();
  const [f, setF] = useState(initial);

  function apply(next: FilterValues) {
    const params = new URLSearchParams();
    if (next.q) params.set('q', next.q);
    if (next.genre) params.set('genre', next.genre);
    if (next.yearMin) params.set('yearMin', next.yearMin);
    if (next.yearMax) params.set('yearMax', next.yearMax);
    if (next.ratingMin) params.set('ratingMin', next.ratingMin);
    const qs = params.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    apply(f);
  }

  function reset() {
    const cleared = { q: '', genre: '', yearMin: '', yearMax: '', ratingMin: '' };
    setF(cleared);
    apply(cleared);
  }

  const active =
    f.q || f.genre || f.yearMin || f.yearMax || f.ratingMin ? true : false;

  const input =
    'rounded border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm outline-none focus:border-indigo-500';

  return (
    <form
      onSubmit={submit}
      className="flex flex-wrap items-end gap-2 rounded-lg border border-neutral-800 bg-neutral-900/50 p-3"
    >
      <label className="flex flex-col gap-1 text-xs text-neutral-400">
        {searchLabel}
        <input
          value={f.q}
          onChange={(e) => setF({ ...f, q: e.target.value })}
          placeholder={searchPlaceholder}
          className={`${input} w-52`}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-neutral-400">
        Genre
        <input
          value={f.genre}
          onChange={(e) => setF({ ...f, genre: e.target.value })}
          placeholder="Sci-Fi"
          className={`${input} w-28`}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-neutral-400">
        Year from
        <input
          type="number"
          value={f.yearMin}
          onChange={(e) => setF({ ...f, yearMin: e.target.value })}
          className={`${input} w-20`}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-neutral-400">
        to
        <input
          type="number"
          value={f.yearMax}
          onChange={(e) => setF({ ...f, yearMax: e.target.value })}
          className={`${input} w-20`}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-neutral-400">
        Min rating
        <input
          type="number"
          step="0.1"
          min="0"
          max="10"
          value={f.ratingMin}
          onChange={(e) => setF({ ...f, ratingMin: e.target.value })}
          className={`${input} w-20`}
        />
      </label>
      <button
        type="submit"
        className="rounded bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
      >
        Filter
      </button>
      {active && (
        <button
          type="button"
          onClick={reset}
          className="rounded px-2 py-1.5 text-sm text-neutral-400 hover:text-neutral-200"
        >
          Clear
        </button>
      )}
    </form>
  );
}
