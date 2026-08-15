'use client';

import { useState } from 'react';
import type {
  BookSearchResult,
  GameSearchResult,
  MovieSearchResult,
  TVShowSearchResult,
} from '@/lib/types';
import { AddFromSearchButton } from './AddFromSearchButton';
import { CatalogSearchForm } from './CatalogSearchForm';
import {
  CatalogSearchResults,
  type CatalogDomain,
  type CatalogSearchResult,
} from './CatalogSearchResults';

const DOMAIN_SEARCH = {
  movies: {
    placeholder: 'e.g. The Matrix',
    unavailable: 'Search is not configured (set OMDB_API_KEY on the API).',
  },
  tv: { placeholder: 'e.g. Severance', unavailable: 'Search is not configured.' },
  books: { placeholder: 'e.g. Project Hail Mary', unavailable: 'Search is not configured.' },
  games: {
    placeholder: 'e.g. Breath of the Wild',
    unavailable: 'Search is not configured (set TWITCH_CLIENT_ID/SECRET on the API).',
  },
} as const;

type ResultsByDomain = {
  movies: MovieSearchResult[];
  tv: TVShowSearchResult[];
  books: BookSearchResult[];
  games: GameSearchResult[];
};

export function DomainCatalogSearch({ domain }: { domain: CatalogDomain }) {
  const config = DOMAIN_SEARCH[domain];
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ResultsByDomain[CatalogDomain]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function search(nextQuery: string) {
    if (!nextQuery.trim()) return;
    setError(null);
    setLoading(true);
    setResults([]);
    try {
      const response = await fetch(`/api/${domain}/search?q=${encodeURIComponent(nextQuery)}`);
      const data = await response.json();
      if (!response.ok) {
        setError(response.status === 503 ? config.unavailable : data.error ?? 'Search failed');
        return;
      }
      setResults(data);
      if (data.length === 0) setError('No results.');
    } catch {
      setError('Search failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <CatalogSearchForm
        query={query}
        onQueryChange={setQuery}
        onSearch={(nextQuery) => void search(nextQuery)}
        placeholder={config.placeholder}
        loading={loading}
      />
      {error && <p className="text-sm text-amber-400">{error}</p>}
      <CatalogSearchResults
        domain={domain}
        results={results as CatalogSearchResult[]}
        actionFor={(result) => (
          <AddFromSearchButton
            domain={domain}
            payload={result.payload}
            onWatchlist={result.onWatchlist}
            onRankings={result.onRankings}
            rank={result.rank}
            addable={result.addable}
            rankable={result.rankable}
          />
        )}
      />
    </div>
  );
}
