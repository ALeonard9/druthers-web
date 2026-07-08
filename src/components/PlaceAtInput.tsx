'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

// A compact "#___ Place" control that jumps a movie to an exact rank position.
export function PlaceAtInput({
  movieId,
  current,
  max,
}: {
  movieId: string;
  current?: number | null;
  max?: number;
}) {
  const router = useRouter();
  const [value, setValue] = useState(current != null ? String(current) : '');
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = parseInt(value, 10);
    if (!Number.isFinite(n) || n < 1) return;
    startTransition(async () => {
      await fetch(`/api/movies/${movieId}/rank`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position: n }),
      });
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-1">
      <span className="text-neutral-500">#</span>
      <input
        type="number"
        min={1}
        max={max}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="place"
        className="w-16 rounded border border-neutral-700 bg-neutral-950 px-1.5 py-1 text-xs outline-none focus:border-indigo-500"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
      >
        {pending ? '…' : 'Place'}
      </button>
    </form>
  );
}
