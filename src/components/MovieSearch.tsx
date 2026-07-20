'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { MovieSearchResult } from '@/lib/types';
import { TrackedBadge } from './TrackedBadge';

export function MovieSearch() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<MovieSearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState<Record<string, 'adding' | 'done' | 'error'>>({});

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setError(null);
    setLoading(true);
    setResults([]);
    try {
      const res = await fetch(`/api/movies/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(
          res.status === 503
            ? 'Search is not configured (set OMDB_API_KEY on the API).'
            : data.error ?? 'Search failed',
        );
        return;
      }
      setResults(data);
      if (data.length === 0) setError('No results.');
    } finally {
      setLoading(false);
    }
  }

  async function add(m: MovieSearchResult, list: 'watchlist' | 'rankings') {
    setAdded((s) => ({ ...s, [m.imdb]: 'adding' }));
    const res = await fetch('/api/movies/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imdb: m.imdb,
        title: m.title,
        poster_url: m.poster_url,
        list,
      }),
    });
    setAdded((s) => ({ ...s, [m.imdb]: res.ok ? 'done' : 'error' }));
    if (res.ok) router.push('/movies');
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={onSearch} className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="e.g. The Matrix"
          className="flex-1 rounded border border-neutral-700 bg-panel px-3 py-2 outline-none focus:border-brass"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-brass px-4 py-2 font-medium text-ink hover:bg-brass-bright disabled:opacity-50"
        >
          {loading ? 'Searching…' : 'Search'}
        </button>
      </form>

      {error && <p className="text-sm text-amber-400">{error}</p>}

      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {results.map((m) => {
          const state = added[m.imdb];
          return (
            <li
              key={m.imdb}
              className="flex flex-col overflow-hidden rounded-lg border border-line bg-panel"
            >
              <div className="aspect-[2/3] bg-line">
                {m.poster_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.poster_url}
                    alt={m.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center p-2 text-center text-xs text-neutral-500">
                    {m.title}
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-2 p-3">
                <p className="line-clamp-2 text-sm font-medium">{m.title}</p>
                <p className="text-xs text-neutral-500">{m.year}</p>
                <div className="mt-auto flex flex-col gap-1">
                  {state === 'done' ? (
                    <span className="rounded bg-neutral-700 px-2 py-1 text-center text-xs text-neutral-200">
                      Added ✓
                    </span>
                  ) : m.on_rankings ? (
                    <TrackedBadge onRankings rank={m.rank} />
                  ) : (
                    <>
                      {m.on_watchlist && <TrackedBadge onRankings={false} rank={null} />}
                      <button
                        onClick={() => add(m, 'watchlist')}
                        disabled={state === 'adding' || m.on_watchlist}
                        className="rounded bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-500 disabled:opacity-60"
                      >
                        {state === 'adding'
                          ? 'Adding…'
                          : m.on_watchlist
                            ? 'On Watchlist'
                            : '+ Watchlist'}
                      </button>
                      <button
                        onClick={() => add(m, 'rankings')}
                        disabled={state === 'adding'}
                        className="rounded bg-brass px-2 py-1 text-xs font-medium text-ink hover:bg-brass-bright disabled:opacity-60"
                      >
                        {m.on_watchlist ? '→ Move to Rankings' : '+ Rankings'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
