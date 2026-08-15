'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { catalogIdFrom, duelHrefFor, isAlreadyPlaced } from '@/lib/duelShelves';
import { isRankable, isUnreleased, formatReleaseDate } from '@/lib/movies';
import type { MovieSearchResult } from '@/lib/types';
import { TrackedBadge } from './TrackedBadge';
import { useMultiAddMode } from './MultiAddMode';
import { VoiceSearch } from './VoiceSearch';

export function MovieSearch() {
  const router = useRouter();
  const multiAddMode = useMultiAddMode();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<MovieSearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState<Record<string, 'adding' | 'done' | 'error'>>({});

  async function search(query: string) {
    if (!query.trim()) return;
    setError(null);
    setLoading(true);
    setResults([]);
    try {
      const res = await fetch(`/api/movies/search?q=${encodeURIComponent(query)}`);
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

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    void search(q);
  }

  async function add(m: MovieSearchResult, list: 'watchlist' | 'rankings') {
    setAdded((s) => ({ ...s, [m.tmdb]: 'adding' }));
    const res = await fetch('/api/movies/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tmdb: m.tmdb,
        title: m.title,
        poster_url: m.poster_url,
        list,
      }),
    });
    setAdded((s) => ({ ...s, [m.tmdb]: res.ok ? 'done' : 'error' }));
    // Land wherever the movie just went: a new rankings entry starts unranked
    // in the "to rank" bucket on the board, which the top-25 deck won't show.
    // Adding to the rankings usually leaves the title *unplaced*, so hand
    // straight to the duel to decide where it goes - the add is only half
    // the gesture. Exception: the first movie into an empty shelf auto-places
    // at #1 (api#289), so there's nothing left to decide - go to the board.
    if (res.ok && !multiAddMode) {
      if (list === 'watchlist') {
        router.push('/movies/watchlist');
      } else {
        const tracker = await res.json().catch(() => null);
        if (isAlreadyPlaced(tracker)) {
          router.push('/movies/ranking');
        } else {
          router.push(duelHrefFor('movies', catalogIdFrom('movies', tracker)));
        }
      }
    }
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
        <VoiceSearch
          onTranscript={(transcript) => {
            setQ(transcript);
            void search(transcript);
          }}
          className="rounded border border-neutral-700 bg-panel px-2 text-neutral-300 hover:text-paper focus:outline-none focus:ring-1 focus:ring-brass"
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
          const state = added[m.tmdb];
          const unreleased = isUnreleased(m.release_date);
          const rankable = isRankable(m.release_date);
          return (
            <li
              key={m.tmdb}
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
                {unreleased && (
                  <span className="inline-block rounded border border-sky-800/50 bg-sky-950/60 px-2 py-0.5 font-mono text-[10px] text-sky-400">
                    Release: {formatReleaseDate(m.release_date)}
                  </span>
                )}
                <div className="mt-auto flex flex-col gap-1">
                  {state === 'done' ? (
                    <span className="rounded bg-neutral-700 px-2 py-1 text-center text-xs text-neutral-200">
                      Added ✓
                    </span>
                  ) : m.on_rankings ? (
                    <TrackedBadge onRankings rank={m.rank} />
                  ) : (
                    <>
                      {m.on_watchlist ? (
                        <TrackedBadge onRankings={false} rank={null} />
                      ) : (
                        <button
                          onClick={() => add(m, 'watchlist')}
                          disabled={state === 'adding'}
                          className="rounded bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-500 disabled:opacity-60"
                        >
                          {state === 'adding' ? 'Adding…' : '+ Watchlist'}
                        </button>
                      )}
                      {rankable ? (
                        <button
                          onClick={() => add(m, 'rankings')}
                          disabled={state === 'adding'}
                          className="rounded bg-brass px-2 py-1 text-xs font-medium text-ink hover:bg-brass-bright disabled:opacity-60"
                        >
                          {m.on_watchlist ? '→ Move to Rankings' : '+ Rankings'}
                        </button>
                      ) : (
                        <span className="text-center text-xs text-neutral-500 italic">Not rankable yet</span>
                      )}
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
