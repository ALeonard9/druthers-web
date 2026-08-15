/** @vitest-environment happy-dom */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AddFromSearchButton } from './AddFromSearchButton';
import {
  CatalogSearchResults,
  type CatalogDomain,
  type CatalogSearchResult,
} from './CatalogSearchResults';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const cases: Array<{
  domain: CatalogDomain;
  result: CatalogSearchResult;
  metadata: string;
  sourceUrl: string;
  watchlistLabel: string;
}> = [
  {
    domain: 'movies',
    result: {
      tmdb: 603,
      imdb: 'tt0133093',
      title: 'The Matrix',
      year: '1999',
      release_date: '1999-03-30',
      poster_url: '/matrix.jpg',
      type: 'movie',
      popularity: 10,
      on_watchlist: false,
      on_rankings: false,
      rank: null,
    },
    metadata: '1999',
    sourceUrl: 'https://www.imdb.com/title/tt0133093/',
    watchlistLabel: 'Watch',
  },
  {
    domain: 'tv',
    result: {
      tvmaze: 1,
      imdb: 'tt11280740',
      title: 'Severance',
      year: '2022',
      network: 'Apple TV+',
      status: 'Running',
      poster_url: '/severance.jpg',
      on_watchlist: false,
      on_rankings: false,
      rank: null,
    },
    metadata: '2022 · Apple TV+ · Running',
    sourceUrl: 'https://www.imdb.com/title/tt11280740/',
    watchlistLabel: 'Watch',
  },
  {
    domain: 'books',
    result: {
      isbn: '9780593135204',
      title: 'Project Hail Mary',
      authors: 'Andy Weir',
      year: '2021',
      poster_url: '/hail-mary.jpg',
      on_watchlist: false,
      on_rankings: false,
      rank: null,
    },
    metadata: 'Andy Weir · 2021',
    sourceUrl: 'https://openlibrary.org/isbn/9780593135204',
    watchlistLabel: 'Read',
  },
  {
    domain: 'games',
    result: {
      igdb: 7346,
      title: 'Breath of the Wild',
      slug: 'the-legend-of-zelda-breath-of-the-wild',
      year: '2017',
      platforms: 'Switch',
      poster_url: '/botw.jpg',
      on_watchlist: false,
      on_rankings: false,
      rank: null,
    },
    metadata: '2017 · Switch',
    sourceUrl: 'https://www.igdb.com/games/the-legend-of-zelda-breath-of-the-wild',
    watchlistLabel: 'Play',
  },
];

describe('CatalogSearchResults shared contract (web#280)', () => {
  afterEach(cleanup);

  it.each(cases)(
    'renders the full $domain card with domain metadata and both list destinations',
    ({ domain, result, metadata, sourceUrl, watchlistLabel }) => {
      render(
        <CatalogSearchResults
          domain={domain}
          results={[result]}
          actionFor={(normalized) => (
            <AddFromSearchButton
              domain={domain}
              payload={normalized.payload}
              addable={normalized.addable}
              rankable={normalized.rankable}
            />
          )}
        />,
      );

      const artwork = screen.getByRole('img', { name: result.title });
      expect(artwork.parentElement?.className).toContain('aspect-[2/3]');
      expect(screen.getByText(metadata)).toBeTruthy();
      const source = screen.getByRole('link', { name: result.title });
      expect(source.getAttribute('href')).toBe(sourceUrl);
      expect(source.getAttribute('target')).toBe('_blank');
      expect(screen.getByRole('button', { name: watchlistLabel }).querySelector('svg')).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Rank' }).querySelector('svg')).toBeTruthy();
    },
  );
});
