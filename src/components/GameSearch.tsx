'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { GameSearchResult } from '@/lib/types';
import { TrackedBadge } from './TrackedBadge';

export function GameSearch() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<GameSearchResult[]>([]);
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
      const res = await fetch(`/api/games/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(
          res.status === 503
            ? 'Search is not configured (set TWITCH_CLIENT_ID/SECRET on the API).'
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

  async function add(g: GameSearchResult, list: 'watchlist' | 'rankings') {
    if (g.igdb == null) return;
    setAdded((s) => ({ ...s, [g.igdb!]: 'adding' }));
    const res = await fetch('/api/games/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        igdb: g.igdb,
        title: g.title,
        poster_url: g.poster_url,
        list,
      }),
    });
    setAdded((s) => ({ ...s, [g.igdb!]: res.ok ? 'done' : 'error' }));
    if (res.ok) router.push('/games');
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={onSearch} className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="e.g. Breath of the Wild"
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
        {results.map((g, i) => {
          const state = g.igdb != null ? added[g.igdb] : undefined;
          return (
            <li
              key={g.igdb ?? `${g.title}-${i}`}
              className="flex flex-col overflow-hidden rounded-lg border border-line bg-panel"
            >
              <div className="aspect-[3/4] bg-line">
                {g.poster_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={g.poster_url}
                    alt={g.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center p-2 text-center text-xs text-neutral-500">
                    {g.title}
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-2 p-3">
                <p className="line-clamp-2 text-sm font-medium">{g.title}</p>
                <p className="line-clamp-1 text-xs text-neutral-500">
                  {[g.year, g.platforms].filter(Boolean).join(' · ')}
                </p>
                <div className="mt-auto flex flex-col gap-1">
                  {state === 'done' ? (
                    <span className="rounded bg-neutral-700 px-2 py-1 text-center text-xs text-neutral-200">
                      Added ✓
                    </span>
                  ) : g.on_rankings ? (
                    <TrackedBadge onRankings rank={g.rank} />
                  ) : (
                    <>
                      {g.on_watchlist && <TrackedBadge onRankings={false} rank={null} />}
                      <button
                        onClick={() => add(g, 'watchlist')}
                        disabled={state === 'adding' || g.igdb == null || g.on_watchlist}
                        className="rounded bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-500 disabled:opacity-60"
                      >
                        {state === 'adding'
                          ? 'Adding…'
                          : g.on_watchlist
                            ? 'On Watchlist'
                            : '+ Backlog'}
                      </button>
                      <button
                        onClick={() => add(g, 'rankings')}
                        disabled={state === 'adding' || g.igdb == null}
                        className="rounded bg-brass px-2 py-1 text-xs font-medium text-ink hover:bg-brass-bright disabled:opacity-60"
                      >
                        {g.on_watchlist ? '→ Move to Rankings' : '+ Rankings'}
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
