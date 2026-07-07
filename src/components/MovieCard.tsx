'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { UserMovie } from '@/lib/types';

export function MovieCard({ userMovie }: { userMovie: UserMovie }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [watched, setWatched] = useState(userMovie.completed === 1);
  const [notes, setNotes] = useState(userMovie.notes ?? '');
  const [editing, setEditing] = useState(false);
  const movieId = userMovie.movie.id;

  function patch(body: Record<string, unknown>) {
    return fetch(`/api/movies/${movieId}/track`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  function toggleWatched() {
    const next = !watched;
    setWatched(next);
    startTransition(async () => {
      await patch({ completed: next ? 1 : 0 });
      router.refresh();
    });
  }

  function saveNotes() {
    setEditing(false);
    startTransition(async () => {
      await patch({ notes });
      router.refresh();
    });
  }

  function remove() {
    startTransition(async () => {
      await fetch(`/api/movies/${movieId}/track`, { method: 'DELETE' });
      router.refresh();
    });
  }

  const { movie } = userMovie;
  return (
    <li className="flex flex-col overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900">
      <div className="relative aspect-[2/3] bg-neutral-800">
        {movie.poster_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={movie.poster_url}
            alt={movie.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-2 text-center text-xs text-neutral-500">
            {movie.title}
          </div>
        )}
        {watched && (
          <span className="absolute right-1 top-1 rounded bg-green-600/90 px-1.5 py-0.5 text-[10px] font-medium text-white">
            Watched
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <p className="line-clamp-2 text-sm font-medium" title={movie.title}>
          {movie.title}
        </p>
        {editing ? (
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={saveNotes}
            rows={2}
            autoFocus
            className="rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-xs outline-none focus:border-indigo-500"
          />
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="text-left text-xs text-neutral-400 hover:text-neutral-200"
          >
            {notes ? notes : '+ Add notes'}
          </button>
        )}
        <div className="mt-auto flex items-center justify-between pt-1">
          <button
            onClick={toggleWatched}
            disabled={pending}
            className={`rounded px-2 py-1 text-xs font-medium disabled:opacity-50 ${
              watched
                ? 'bg-neutral-700 text-neutral-200'
                : 'bg-green-600 text-white hover:bg-green-500'
            }`}
          >
            {watched ? 'Watched ✓' : 'Mark watched'}
          </button>
          <button
            onClick={remove}
            disabled={pending}
            title="Remove from list"
            className="rounded px-2 py-1 text-xs text-neutral-500 hover:text-red-400 disabled:opacity-50"
          >
            Remove
          </button>
        </div>
      </div>
    </li>
  );
}
