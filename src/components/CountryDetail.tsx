'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Country, UserCountry } from '@/lib/types';

function Field({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-neutral-500">{label}</dt>
      <dd className="text-sm text-neutral-200">{value}</dd>
    </div>
  );
}

export function CountryDetail({
  country,
  tracker,
}: {
  country: Country;
  tracker: UserCountry | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [notes, setNotes] = useState(tracker?.notes ?? '');
  const [savedNote, setSavedNote] = useState(tracker?.notes ?? '');
  const [firstVisited, setFirstVisited] = useState(
    tracker?.first_visited?.slice(0, 10) ?? '',
  );

  const onBucket = tracker?.on_watchlist ?? false;
  const visited = tracker?.on_rankings ?? false;

  function track(body: Record<string, unknown>) {
    startTransition(async () => {
      await fetch(`/api/countries/${country.id}/track`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      router.refresh();
    });
  }

  function mark(body: Record<string, unknown>) {
    startTransition(async () => {
      await fetch(`/api/countries/${country.id}/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      router.refresh();
    });
  }

  function saveNotes() {
    if (notes === savedNote) return;
    setSavedNote(notes);
    track({ notes });
  }

  function saveFirstVisited(value: string) {
    setFirstVisited(value);
    // An emptied input clears the date server-side too.
    track({ first_visited: value ? `${value}T00:00:00` : null });
  }

  return (
    <div className="flex flex-col gap-6 md:flex-row">
      <div className="w-full max-w-[240px] shrink-0">
        {country.flag_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={country.flag_url}
            alt={`Flag of ${country.title}`}
            className="w-full rounded-lg border border-neutral-800"
          />
        ) : (
          <div className="flex aspect-[3/2] items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900 text-6xl">
            {country.flag_emoji ?? '🏳️'}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-5">
        <div>
          <h1 className="text-2xl font-semibold">
            {country.flag_emoji && (
              <span className="mr-2">{country.flag_emoji}</span>
            )}
            {country.title}
          </h1>
          <p className="mt-1 flex flex-wrap gap-x-3 text-sm text-neutral-400">
            {country.region && <span>{country.region}</span>}
            {country.subregion && <span>{country.subregion}</span>}
          </p>
        </div>

        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Capital" value={country.capital} />
          <Field label="Code" value={country.country_code.toUpperCase()} />
          {country.population != null && (
            <Field
              label="Population"
              value={country.population.toLocaleString()}
            />
          )}
        </dl>

        {/* Lists */}
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-900 p-3">
          <button
            onClick={() =>
              onBucket
                ? track({ on_watchlist: false })
                : mark({ on_watchlist: true })
            }
            disabled={pending}
            className={`rounded px-3 py-1.5 text-sm font-medium disabled:opacity-50 ${
              onBucket
                ? 'bg-neutral-700 text-neutral-200'
                : 'bg-indigo-600 text-white hover:bg-indigo-500'
            }`}
          >
            {onBucket ? 'On bucket list ✓' : '+ Bucket list'}
          </button>

          {visited ? (
            <span className="text-sm text-neutral-300">
              {tracker?.rank
                ? `Visited — ranked #${tracker.rank}`
                : 'Visited — in “to rank” on the Countries page'}
            </span>
          ) : (
            <button
              onClick={() => mark({ on_rankings: true })}
              disabled={pending}
              className="rounded bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-500 disabled:opacity-50"
            >
              ✓ Mark visited
            </button>
          )}

          {visited && (
            <label className="flex items-center gap-2 text-xs text-neutral-400">
              First visited
              <input
                type="date"
                value={firstVisited}
                onChange={(e) => saveFirstVisited(e.target.value)}
                disabled={pending}
                className="rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-sm text-neutral-200 outline-none focus:border-indigo-500 disabled:opacity-50"
              />
            </label>
          )}
        </div>

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
                : 'Add this country to a list to save notes.'
            }
            disabled={!tracker || pending}
            className="w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-indigo-500 disabled:opacity-50"
          />
          {notes !== savedNote && (
            <button
              onClick={saveNotes}
              className="mt-2 rounded bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
            >
              Save notes
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
