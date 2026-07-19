'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CompletedDateField } from './CompletedDateField';
import type { Movie, UserMovie } from '@/lib/types';

function Field({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-neutral-500">{label}</dt>
      <dd className="text-sm text-neutral-200">{value}</dd>
    </div>
  );
}

export function MovieDetail({
  movie,
  tracker,
}: {
  movie: Movie;
  tracker: UserMovie | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [notes, setNotes] = useState(tracker?.notes ?? '');
  const [savedNote, setSavedNote] = useState(tracker?.notes ?? '');
  const [confirmRemove, setConfirmRemove] = useState(false);

  const onWatchlist = tracker?.on_watchlist ?? false;
  const onRankings = tracker?.on_rankings ?? false;

  function track(body: Record<string, unknown>) {
    startTransition(async () => {
      await fetch(`/api/movies/${movie.id}/track`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      router.refresh();
    });
  }

  function mark(body: Record<string, unknown>) {
    startTransition(async () => {
      await fetch(`/api/movies/${movie.id}/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      router.refresh();
    });
  }

  function removeFromRankings() {
    setConfirmRemove(false);
    track({ on_rankings: false });
  }

  function saveNotes() {
    if (notes === savedNote) return;
    setSavedNote(notes);
    track({ notes });
  }

  return (
    <div className="flex flex-col gap-6 md:flex-row">
      <div className="w-full max-w-[240px] shrink-0">
        {movie.poster_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={movie.poster_url}
            alt={movie.title}
            className="w-full rounded-lg border border-line"
          />
        ) : (
          <div className="flex aspect-[2/3] items-center justify-center rounded-lg border border-line bg-panel text-neutral-500">
            No poster
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-5">
        <div>
          <h1 className="text-2xl font-semibold">
            {movie.title}
            {movie.year ? (
              <span className="ml-2 font-normal text-neutral-400">
                ({movie.year})
              </span>
            ) : null}
          </h1>
          <p className="mt-1 flex flex-wrap gap-x-3 text-sm text-neutral-400">
            {movie.rated && <span>{movie.rated}</span>}
            {movie.runtime && <span>{movie.runtime} min</span>}
            {movie.rating_imdb != null && <span>★ {movie.rating_imdb} IMDb</span>}
            {movie.genre && <span>{movie.genre}</span>}
          </p>
        </div>

        {movie.plot && <p className="text-sm leading-relaxed">{movie.plot}</p>}

        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Director" value={movie.director} />
          <Field label="Cast" value={movie.actors} />
          <Field label="Language" value={movie.language} />
          {movie.imdb && (
            <div>
              <dt className="text-xs uppercase tracking-wide text-neutral-500">
                IMDb
              </dt>
              <dd className="text-sm">
                <a
                  href={`https://www.imdb.com/title/${movie.imdb}/`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-brass hover:text-brass-bright"
                >
                  {movie.imdb}
                </a>
              </dd>
            </div>
          )}
        </dl>

        {/* Lists */}
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-line bg-panel p-3">
          <button
            onClick={() =>
              onWatchlist
                ? track({ on_watchlist: false })
                : mark({ on_watchlist: true })
            }
            disabled={pending}
            className={`rounded px-3 py-1.5 text-sm font-medium disabled:opacity-50 ${
              onWatchlist
                ? 'bg-neutral-700 text-neutral-200'
                : 'bg-green-600 text-white hover:bg-green-500'
            }`}
          >
            {onWatchlist ? 'On watchlist ✓' : '+ Watchlist'}
          </button>

          {onRankings ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-neutral-300">
                {tracker?.rank
                  ? `Ranked #${tracker.rank}`
                  : 'In “to rank” — drag it into place on the Rankings page'}
              </span>
              {confirmRemove ? (
                <span className="flex items-center gap-2 rounded bg-red-950/70 px-2 py-1 text-xs text-red-200 ring-1 ring-red-800">
                  Remove from rankings? Movies below move up.
                  <button
                    onClick={() => setConfirmRemove(false)}
                    className="rounded px-2 py-0.5 text-neutral-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={removeFromRankings}
                    disabled={pending}
                    className="rounded bg-red-600 px-2 py-0.5 font-medium text-white hover:bg-red-500 disabled:opacity-50"
                  >
                    Remove
                  </button>
                </span>
              ) : (
                <button
                  onClick={() => setConfirmRemove(true)}
                  disabled={pending}
                  className="rounded px-2 py-1 text-sm text-neutral-500 hover:text-red-400"
                >
                  Remove
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => mark({ on_rankings: true })}
              disabled={pending}
              className="rounded bg-brass px-3 py-1.5 text-sm font-medium text-ink hover:bg-brass-bright disabled:opacity-50"
            >
              + Rankings
            </button>
          )}
        </div>

        {onRankings && (
          <CompletedDateField
            value={tracker?.completed_at ?? null}
            disabled={!tracker || pending}
            onSave={(d) => track({ completed_at: d })}
          />
        )}

        {/* Notes */}
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-neutral-500">
            My notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={saveNotes}
            rows={4}
            placeholder={
              tracker
                ? 'Write your notes…'
                : 'Add this movie to a list to save notes.'
            }
            disabled={!tracker || pending}
            className="w-full rounded border border-neutral-700 bg-night px-3 py-2 text-sm outline-none focus:border-brass disabled:opacity-50"
          />
          {notes !== savedNote && (
            <button
              onClick={saveNotes}
              className="mt-2 rounded bg-brass px-3 py-1.5 text-sm font-medium text-ink hover:bg-brass-bright"
            >
              Save notes
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
