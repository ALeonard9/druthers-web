/** @vitest-environment happy-dom */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DomainCatalogSearch } from './DomainCatalogSearch';
import { MultiAddMode } from './MultiAddMode';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

const cases = [
  {
    name: 'movies',
    component: <DomainCatalogSearch domain="movies" />,
    placeholder: 'e.g. The Matrix',
    addLabel: '+ Watchlist',
    destination: '/movies/watchlist',
    result: {
      tmdb: 603,
      imdb: null,
      title: 'The Matrix',
      year: '1999',
      release_date: '1999-03-30',
      poster_url: null,
      type: 'movie',
      popularity: 10,
      on_watchlist: false,
      on_rankings: false,
      rank: null,
    },
  },
  {
    name: 'tv',
    component: <DomainCatalogSearch domain="tv" />,
    placeholder: 'e.g. Severance',
    addLabel: '+ Watchlist',
    destination: '/tv/watchlist',
    result: {
      tvmaze: 1,
      imdb: 'tt1',
      title: 'Severance',
      year: '2022',
      network: 'Apple TV+',
      status: 'Running',
      poster_url: null,
      on_watchlist: false,
      on_rankings: false,
      rank: null,
    },
  },
  {
    name: 'books',
    component: <DomainCatalogSearch domain="books" />,
    placeholder: 'e.g. Project Hail Mary',
    addLabel: '+ Read List',
    destination: '/books/to-read',
    result: {
      isbn: '9780593135204',
      title: 'Project Hail Mary',
      authors: 'Andy Weir',
      year: '2021',
      poster_url: null,
      on_watchlist: false,
      on_rankings: false,
      rank: null,
    },
  },
  {
    name: 'games',
    component: <DomainCatalogSearch domain="games" />,
    placeholder: 'e.g. Breath of the Wild',
    addLabel: '+ Play List',
    destination: '/games/backlog',
    result: {
      igdb: 1,
      title: 'Breath of the Wild',
      year: '2017',
      platforms: 'Switch',
      poster_url: null,
      on_watchlist: false,
      on_rankings: false,
      rank: null,
    },
  },
] as const;

describe('Shelf search multi-add mode (web#168)', () => {
  beforeEach(() => push.mockReset());
  afterEach(cleanup);

  it.each(cases)('keeps $name search results open after adding', async ({ component, placeholder, addLabel, result }) => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [result] })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'tracker-1' }) });

    render(<MultiAddMode>{component}</MultiAddMode>);

    fireEvent.change(screen.getByPlaceholderText(placeholder), {
      target: { value: result.title },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    await screen.findByRole('button', { name: addLabel });

    fireEvent.click(screen.getByRole('switch'));
    fireEvent.click(screen.getByRole('button', { name: addLabel }));

    await waitFor(() => expect(screen.getByText('✓ On your list')).toBeTruthy());
    expect(push).not.toHaveBeenCalled();
  });

  it.each(cases)(
    'routes $name unranked-list adds to $destination when keep-adding is off',
    async ({ component, placeholder, addLabel, destination, result }) => {
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({ ok: true, json: async () => [result] })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'tracker-1' }) });

      render(<MultiAddMode>{component}</MultiAddMode>);

      fireEvent.change(screen.getByPlaceholderText(placeholder), {
        target: { value: result.title },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Search' }));
      fireEvent.click(await screen.findByRole('button', { name: addLabel }));

      await waitFor(() => expect(push).toHaveBeenCalledWith(destination));
    },
  );
});
