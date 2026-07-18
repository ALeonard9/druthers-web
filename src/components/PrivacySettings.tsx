'use client';

import { useEffect, useState } from 'react';
import type { Visibility } from '@/lib/types';

const CATEGORIES: { flag: keyof Visibility; label: string }[] = [
  { flag: 'public_movies', label: 'Movies' },
  { flag: 'public_tv', label: 'TV' },
  { flag: 'public_books', label: 'Books' },
  { flag: 'public_games', label: 'Games' },
];

// Handle + per-category public toggles (#143). Everything is private by
// default; opening a category requires a handle, which becomes the public
// profile URL druthers.io/u/<handle>.
export function PrivacySettings() {
  const [settings, setSettings] = useState<Visibility | null>(null);
  const [handle, setHandle] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/visibility').then(async (res) => {
      if (cancelled) return;
      if (res.ok) {
        const body: Visibility = await res.json();
        setSettings(body);
        setHandle(body.handle ?? '');
      } else {
        setError('Could not load privacy settings.');
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function save(patch: Partial<Visibility>) {
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch('/api/visibility', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? 'Could not save.');
        return;
      }
      setSettings(body);
      setHandle(body.handle ?? '');
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
    } finally {
      setBusy(false);
    }
  }

  if (settings === null) {
    return <p className="text-sm text-neutral-500">{error ?? 'Loading…'}</p>;
  }

  const anyPublic = CATEGORIES.some((c) => settings[c.flag]);

  return (
    <div className="flex flex-col gap-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void save({ handle: handle.trim() || null });
        }}
        className="flex gap-2"
      >
        <div className="flex flex-1 items-center rounded border border-neutral-700 bg-panel focus-within:border-brass">
          <span className="pl-3 font-mono text-xs text-neutral-500">
            druthers.io/u/
          </span>
          <input
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="your-handle"
            maxLength={30}
            className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm outline-none placeholder:text-neutral-600"
          />
        </div>
        <button
          type="submit"
          disabled={busy || (handle.trim() || null) === settings.handle}
          className="shrink-0 rounded bg-brass px-3 py-2 text-sm font-medium text-ink hover:bg-brass-bright disabled:opacity-50"
        >
          {saved ? 'Saved' : 'Save handle'}
        </button>
      </form>

      <ul className="divide-y divide-line/60 rounded-lg border border-line bg-panel">
        {CATEGORIES.map(({ flag, label }) => {
          const isPublic = Boolean(settings[flag]);
          return (
            <li key={flag} className="flex items-center gap-3 px-4 py-2.5">
              <span className="flex-1 text-sm text-neutral-200">{label}</span>
              <span
                className={`text-xs ${
                  isPublic ? 'text-moss' : 'text-neutral-500'
                }`}
              >
                {isPublic ? 'Public' : 'Private'}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={isPublic}
                aria-label={`${label} rankings ${isPublic ? 'public' : 'private'}`}
                disabled={busy}
                onClick={() => void save({ [flag]: !isPublic })}
                className={`relative h-5 w-9 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
                  isPublic ? 'bg-moss' : 'bg-line'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-night transition-all ${
                    isPublic ? 'left-[18px]' : 'left-0.5'
                  }`}
                />
              </button>
            </li>
          );
        })}
      </ul>

      {anyPublic && settings.handle && (
        <p className="text-xs text-neutral-500">
          Public rankings live at{' '}
          <a
            href={`/u/${settings.handle}`}
            className="text-brass hover:text-brass-bright"
          >
            druthers.io/u/{settings.handle}
          </a>{' '}
          — ranked lists only; notes, watchlists, and activity stay private.
        </p>
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
