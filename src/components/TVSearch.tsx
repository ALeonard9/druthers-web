'use client';

import { useState } from 'react';
import type { TVShowSearchResult } from '@/lib/types';

export function TVSearch() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<TVShowSearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState<Record<number, 'adding' | 'done' | 'error'>>({});

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setError(null);
    setLoading(true);
    setResults([]);
    try {
      const res = await fetch(`/api/tv/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Search failed');
        return;
      }
      setResults(data);
      if (data.length === 0) setError('No results.');
    } finally {
      setLoading(false);
    }
  }

  async function add(s: TVShowSearchResult, list: 'watchlist' | 'rankings') {
    if (s.tvmaze == null) return;
    setAdded((prev) => ({ ...prev, [s.tvmaze!]: 'adding' }));
    const res = await fetch('/api/tv/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tvmaze: s.tvmaze,
        imdb: s.imdb,
        title: s.title,
        poster_url: s.poster_url,
        list,
      }),
    });
    setAdded((prev) => ({ ...prev, [s.tvmaze!]: res.ok ? 'done' : 'error' }));
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={onSearch} className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="e.g. Severance"
          className="flex-1 rounded border border-neutral-700 bg-neutral-900 px-3 py-2 outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {loading ? 'Searching…' : 'Search'}
        </button>
      </form>

      {error && <p className="text-sm text-amber-400">{error}</p>}

      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {results.map((s) => {
          const state = s.tvmaze != null ? added[s.tvmaze] : undefined;
          return (
            <li
              key={s.tvmaze ?? s.title}
              className="flex flex-col overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900"
            >
              <div className="aspect-[2/3] bg-neutral-800">
                {s.poster_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={s.poster_url}
                    alt={s.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center p-2 text-center text-xs text-neutral-500">
                    {s.title}
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-2 p-3">
                <p className="line-clamp-2 text-sm font-medium">{s.title}</p>
                <p className="text-xs text-neutral-500">
                  {[s.year, s.network, s.status].filter(Boolean).join(' · ')}
                </p>
                <div className="mt-auto flex flex-col gap-1">
                  {state === 'done' ? (
                    <span className="rounded bg-neutral-700 px-2 py-1 text-center text-xs text-neutral-200">
                      Added ✓
                    </span>
                  ) : (
                    <>
                      <button
                        onClick={() => add(s, 'watchlist')}
                        disabled={state === 'adding' || s.tvmaze == null}
                        className="rounded bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-500 disabled:opacity-60"
                      >
                        {state === 'adding' ? 'Adding…' : '+ Watchlist'}
                      </button>
                      <button
                        onClick={() => add(s, 'rankings')}
                        disabled={state === 'adding' || s.tvmaze == null}
                        className="rounded bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
                      >
                        + Rankings
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
