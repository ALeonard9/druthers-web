/** @vitest-environment happy-dom */
import {
  isValidElement,
  type ComponentType,
  type ReactElement,
  type ReactNode,
} from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { GlobalSearch } from '@/lib/types';
import { SearchForm } from '@/components/SearchForm';
import SearchPage from './page';
import {
  BestMatch,
  CatalogDomainSection,
  PeopleSection,
  type CatalogSearchTask,
} from './searchSections';

const { ApiError } = vi.hoisted(() => ({
  ApiError: class ApiError extends Error {
    constructor(public status: number, message = 'API error') {
      super(message);
    }
  },
}));

const mocks = vi.hoisted(() => ({
  apiFetch: vi.fn(),
  getSessionUser: vi.fn(),
  redirect: vi.fn(),
}));

const EMPTY_CATALOG_RESULTS: GlobalSearch = {
  query: 'ada',
  corrected: null,
  movies: [],
  tv_shows: [],
  games: [],
  books: [],
};

let enabledShelves: string[];
let shelfOrder: string[];
let catalogResults: GlobalSearch;
let peopleResults: { id: string; display_name: string; handle: string | null }[];

vi.mock('@/lib/api', () => ({ ApiError, apiFetch: mocks.apiFetch }));
vi.mock('@/lib/session', () => ({ getSessionUser: mocks.getSessionUser }));
vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  redirect: mocks.redirect,
}));

vi.mock('@/components/MultiAddMode', () => ({
  MultiAddMode: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('@/components/AddFromSearchButton', () => ({
  AddFromSearchButton: () => null,
}));

function elementsOfType<P>(node: ReactNode, type: ComponentType<P>): ReactElement<P>[] {
  const found: ReactElement<P>[] = [];

  function visit(value: ReactNode) {
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (!isValidElement(value)) return;
    if (value.type === type) found.push(value as ReactElement<P>);
    visit((value.props as { children?: ReactNode }).children);
  }

  visit(node);
  return found;
}

function catalogSections(page: ReactNode) {
  return elementsOfType<Parameters<typeof CatalogDomainSection>[0]>(
    page,
    CatalogDomainSection,
  );
}

async function renderCatalog(page: ReactNode, domains: CatalogSearchTask['domain'][]) {
  const sections = catalogSections(page).filter(({ props }) => domains.includes(props.domain));
  const resolved = await Promise.all(sections.map(({ props }) => CatalogDomainSection(props)));
  render(<>{resolved}</>);
}

describe('global search page', () => {
  beforeEach(() => {
    mocks.getSessionUser.mockResolvedValue({
      user_id: 'viewer',
      email: 'viewer@example.com',
      user_group: 'user',
    });
    mocks.apiFetch.mockReset();
    mocks.redirect.mockReset();
    mocks.redirect.mockImplementation(() => {
      throw new Error('NEXT_REDIRECT');
    });
    enabledShelves = ['movies', 'tv', 'games', 'books'];
    shelfOrder = ['movies', 'tv', 'games', 'books'];
    catalogResults = EMPTY_CATALOG_RESULTS;
    peopleResults = [];
    mocks.apiFetch.mockImplementation((path: string) => {
      if (path === '/v1/users/me/preferences') {
        return Promise.resolve({
          shelf_order: shelfOrder,
          enabled_shelves: enabledShelves,
        });
      }
      if (path.startsWith('/v1/movies/search')) return Promise.resolve(catalogResults.movies);
      if (path.startsWith('/v1/tv-shows/search')) return Promise.resolve(catalogResults.tv_shows);
      if (path.startsWith('/v1/games/search')) return Promise.resolve(catalogResults.games);
      if (path.startsWith('/v1/books/search')) return Promise.resolve(catalogResults.books);
      if (path.startsWith('/v1/search/users')) {
        return Promise.resolve({ query: 'ada', corrected: null, users: peopleResults });
      }
      throw new Error(`Unexpected API path: ${path}`);
    });
  });

  afterEach(cleanup);

  it('uses only the protected people endpoint for the Users scope and shows its empty state', async () => {
    const page = await SearchPage({
      searchParams: Promise.resolve({ q: 'private', scope: 'users' }),
    });
    const people = elementsOfType<Parameters<typeof PeopleSection>[0]>(page, PeopleSection);

    render(await PeopleSection(people[0].props));

    expect(mocks.apiFetch).toHaveBeenCalledTimes(2);
    expect(mocks.apiFetch).toHaveBeenCalledWith('/v1/users/me/preferences');
    expect(mocks.apiFetch).toHaveBeenCalledWith('/v1/search/users?q=private');
    expect(screen.getByRole('heading', { name: /People 0/ })).toBeTruthy();
    expect(screen.getByText('No people found.')).toBeTruthy();
    expect(catalogSections(page)).toHaveLength(0);
  });

  it('combines catalog and people results for All, linking people to their profiles', async () => {
    peopleResults = [{ id: 'user-1', display_name: 'Ada Lovelace', handle: 'ada' }];

    const page = await SearchPage({
      searchParams: Promise.resolve({ q: 'ada', scope: 'all' }),
    });
    const people = elementsOfType<Parameters<typeof PeopleSection>[0]>(page, PeopleSection);
    render(await PeopleSection(people[0].props));

    expect(mocks.apiFetch).toHaveBeenCalledWith('/v1/users/me/preferences');
    expect(mocks.apiFetch).toHaveBeenCalledWith('/v1/movies/search?q=ada');
    expect(mocks.apiFetch).toHaveBeenCalledWith('/v1/tv-shows/search?q=ada');
    expect(mocks.apiFetch).toHaveBeenCalledWith('/v1/games/search?q=ada');
    expect(mocks.apiFetch).toHaveBeenCalledWith('/v1/books/search?q=ada');
    expect(mocks.apiFetch).toHaveBeenCalledWith('/v1/search/users?q=ada');
    expect(screen.getByRole('link', { name: 'Ada Lovelace' }).getAttribute('href')).toBe(
      '/u/ada',
    );
  });

  it('keeps a scoped search to one streamed slot with no cross-domain strip', async () => {
    const page = await SearchPage({
      searchParams: Promise.resolve({ q: 'ada', scope: 'books' }),
    });
    const sections = catalogSections(page);

    await renderCatalog(page, ['books']);

    expect(sections.map(({ props }) => props.domain)).toEqual(['books']);
    expect(elementsOfType(page, BestMatch)).toHaveLength(0);
    expect(mocks.apiFetch).toHaveBeenCalledWith('/v1/books/search?q=ada');
    expect(mocks.apiFetch).not.toHaveBeenCalledWith('/v1/movies/search?q=ada');
    expect(mocks.apiFetch).not.toHaveBeenCalledWith('/v1/tv-shows/search?q=ada');
    expect(mocks.apiFetch).not.toHaveBeenCalledWith('/v1/games/search?q=ada');
    expect(mocks.apiFetch).not.toHaveBeenCalledWith('/v1/search/users?q=ada');
    expect(screen.getByRole('heading', { name: /Books 0/ })).toBeTruthy();
    expect(screen.getByText('No books found.')).toBeTruthy();
  });

  it('queries and renders only enabled shelves', async () => {
    enabledShelves = ['books'];
    const page = await SearchPage({
      searchParams: Promise.resolve({ q: 'ada', scope: 'all' }),
    });

    await renderCatalog(page, ['books']);

    expect(catalogSections(page).map(({ props }) => props.domain)).toEqual(['books']);
    expect(mocks.apiFetch).toHaveBeenCalledWith('/v1/books/search?q=ada');
    expect(mocks.apiFetch).not.toHaveBeenCalledWith('/v1/movies/search?q=ada');
    expect(mocks.apiFetch).not.toHaveBeenCalledWith('/v1/tv-shows/search?q=ada');
    expect(mocks.apiFetch).not.toHaveBeenCalledWith('/v1/games/search?q=ada');
    expect(screen.getByText('No books found.')).toBeTruthy();
  });

  it('keeps catalog slots in shelf preference order', async () => {
    shelfOrder = ['games', 'books', 'movies', 'tv'];

    const page = await SearchPage({
      searchParams: Promise.resolve({ q: 'ada', scope: 'all' }),
    });

    expect(catalogSections(page).map(({ props }) => props.domain)).toEqual([
      'games',
      'books',
      'movies',
      'tv',
    ]);
  });

  it('returns the heading and search form before any provider settles', async () => {
    mocks.apiFetch.mockImplementation((path: string) => {
      if (path === '/v1/users/me/preferences') {
        return Promise.resolve({ shelf_order: shelfOrder, enabled_shelves: enabledShelves });
      }
      return new Promise(() => {});
    });

    const page = await Promise.race([
      SearchPage({ searchParams: Promise.resolve({ q: 'waiting', scope: 'all' }) }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('search shell waited for providers')), 50),
      ),
    ]);
    const root = page as ReactElement<{ children: ReactNode[] }>;
    render(
      <>
        {root.props.children[0]}
        {root.props.children[1]}
      </>,
    );

    expect(screen.getByRole('heading', { name: 'Search' })).toBeTruthy();
    expect(screen.getByRole('searchbox').getAttribute('value')).toBe('waiting');
  });

  it('links valid movie and TV IMDb IDs to canonical title pages in new tabs', async () => {
    catalogResults = {
      query: 'arrival',
      corrected: null,
      movies: [
        {
          tmdb: 329865,
          imdb: 'tt2543164',
          title: 'Arrival',
          year: '2016',
          release_date: '2016-11-11',
          poster_url: null,
          type: 'movie',
          popularity: 50,
          on_watchlist: false,
          on_rankings: false,
          rank: null,
        },
      ],
      tv_shows: [
        {
          tvmaze: 61812,
          imdb: 'tt20869502',
          title: 'Arrival Point',
          year: '2024',
          status: 'Running',
          network: 'Example',
          poster_url: null,
          on_watchlist: false,
          on_rankings: false,
          rank: null,
        },
      ],
      games: [],
      books: [],
    };

    const page = await SearchPage({
      searchParams: Promise.resolve({ q: 'arrival', scope: 'all' }),
    });
    await renderCatalog(page, ['movies', 'tv']);

    for (const [name, href] of [
      ['Arrival', 'https://www.imdb.com/title/tt2543164/'],
      ['Arrival Point', 'https://www.imdb.com/title/tt20869502/'],
    ]) {
      const link = screen.getByRole('link', { name });
      expect(link.getAttribute('href')).toBe(href);
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    }
  });

  it('hides invalid movie IMDb links and falls TV results back to TVMaze', async () => {
    catalogResults = {
      query: 'broken',
      corrected: null,
      movies: [
        {
          tmdb: 1,
          imdb: null,
          title: 'Missing Movie ID',
          year: null,
          release_date: null,
          poster_url: null,
          type: null,
          popularity: null,
          on_watchlist: false,
          on_rankings: false,
          rank: null,
        },
        {
          tmdb: 2,
          imdb: 'not-an-imdb-id',
          title: 'Malformed Movie ID',
          year: null,
          release_date: null,
          poster_url: null,
          type: null,
          popularity: null,
          on_watchlist: false,
          on_rankings: false,
          rank: null,
        },
      ],
      tv_shows: [
        {
          tvmaze: 99,
          imdb: 'ttbad',
          title: 'TVMaze Fallback',
          year: null,
          status: null,
          network: null,
          poster_url: null,
          on_watchlist: false,
          on_rankings: false,
          rank: null,
        },
      ],
      games: [],
      books: [],
    };

    const page = await SearchPage({
      searchParams: Promise.resolve({ q: 'broken', scope: 'all' }),
    });
    await renderCatalog(page, ['movies', 'tv']);

    expect(screen.queryByRole('link', { name: 'Missing Movie ID' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Malformed Movie ID' })).toBeNull();
    const fallback = screen.getByRole('link', { name: 'TVMaze Fallback' });
    expect(fallback.getAttribute('href')).toBe('https://www.tvmaze.com/shows/99');
    expect(fallback.getAttribute('target')).toBe('_blank');
  });

  it('renders movie results alongside a books-unavailable notice when books rejects', async () => {
    catalogResults = {
      ...EMPTY_CATALOG_RESULTS,
      movies: [
        {
          tmdb: 1,
          imdb: null,
          title: 'Ada Movie',
          year: null,
          release_date: null,
          poster_url: null,
          type: null,
          popularity: null,
          on_watchlist: false,
          on_rankings: false,
          rank: null,
        },
      ],
    };
    mocks.apiFetch.mockImplementation((path: string) => {
      if (path === '/v1/users/me/preferences') {
        return Promise.resolve({ shelf_order: shelfOrder, enabled_shelves: enabledShelves });
      }
      if (path.startsWith('/v1/books/search')) return Promise.reject(new Error('Open Library down'));
      if (path.startsWith('/v1/movies/search')) return Promise.resolve(catalogResults.movies);
      if (path.startsWith('/v1/tv-shows/search')) return Promise.resolve([]);
      if (path.startsWith('/v1/games/search')) return Promise.resolve([]);
      if (path.startsWith('/v1/search/users')) {
        return Promise.resolve({ query: 'ada', corrected: null, users: [] });
      }
      throw new Error(`Unexpected API path: ${path}`);
    });

    const page = await SearchPage({
      searchParams: Promise.resolve({ q: 'ada', scope: 'all' }),
    });
    await renderCatalog(page, ['movies', 'books']);

    expect(screen.getAllByText('Ada Movie')).toHaveLength(2);
    expect(screen.getByRole('alert').textContent).toBe(
      'Books search is unavailable right now.',
    );
  });

  it('returns the shell and renders movies without waiting for slow books', async () => {
    catalogResults = {
      ...EMPTY_CATALOG_RESULTS,
      movies: [
        {
          tmdb: 2,
          imdb: null,
          title: 'Fast Movie',
          year: null,
          release_date: null,
          poster_url: null,
          type: null,
          popularity: null,
          on_watchlist: false,
          on_rankings: false,
          rank: null,
        },
      ],
    };
    mocks.apiFetch.mockImplementation((path: string) => {
      if (path === '/v1/users/me/preferences') {
        return Promise.resolve({ shelf_order: shelfOrder, enabled_shelves: enabledShelves });
      }
      if (path.startsWith('/v1/books/search')) return new Promise(() => {});
      if (path.startsWith('/v1/movies/search')) return Promise.resolve(catalogResults.movies);
      if (path.startsWith('/v1/tv-shows/search') || path.startsWith('/v1/games/search')) {
        return Promise.resolve([]);
      }
      if (path.startsWith('/v1/search/users')) {
        return Promise.resolve({ query: 'fast', corrected: null, users: [] });
      }
      throw new Error(`Unexpected API path: ${path}`);
    });

    const page = await Promise.race([
      SearchPage({ searchParams: Promise.resolve({ q: 'fast', scope: 'all' }) }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('search shell waited for books')), 50),
      ),
    ]);

    expect(elementsOfType(page, SearchForm)).toHaveLength(1);
    await renderCatalog(page, ['movies']);
    expect(screen.getAllByText('Fast Movie')).toHaveLength(2);
  });

  it('renders a mid-stream 401 as a sign-in prompt without redirecting', async () => {
    mocks.apiFetch.mockImplementation((path: string) => {
      if (path === '/v1/users/me/preferences') {
        return Promise.resolve({ shelf_order: shelfOrder, enabled_shelves: enabledShelves });
      }
      if (path.startsWith('/v1/books/search')) {
        return Promise.reject(new ApiError(401, 'expired'));
      }
      throw new Error(`Unexpected API path: ${path}`);
    });

    const page = await SearchPage({
      searchParams: Promise.resolve({ q: 'dune', scope: 'books' }),
    });
    await renderCatalog(page, ['books']);

    expect(screen.getByRole('alert').textContent).toContain('Your session expired.');
    expect(screen.getByRole('link', { name: 'Sign in again' }).getAttribute('href')).toBe(
      '/login',
    );
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it('chooses the best fulfilled candidate when another domain fails', async () => {
    const movie = {
      tmdb: 3,
      imdb: null,
      title: 'Dune',
      year: '2021',
      release_date: '2021-10-22',
      poster_url: null,
      type: 'movie',
      popularity: null,
      on_watchlist: false,
      on_rankings: false,
      rank: null,
    };
    const tasks: CatalogSearchTask[] = [
      {
        domain: 'books',
        resultsPromise: Promise.reject(new Error('books failed')),
        belowMinQuery: false,
      },
      { domain: 'movies', resultsPromise: Promise.resolve([movie]), belowMinQuery: false },
    ];

    render(await BestMatch({ query: 'Dune', tasks }));

    expect(screen.getByRole('heading', { name: 'Best match' })).toBeTruthy();
    expect(screen.getByText('Dune')).toBeTruthy();
    expect(screen.getByText(/Movie · 2021/)).toBeTruthy();
  });

  it('omits Best match when a failed domain leaves no fulfilled strong candidate', async () => {
    const weakMovie = {
      tmdb: 4,
      imdb: null,
      title: 'Arrival',
      year: '2016',
      release_date: '2016-11-11',
      poster_url: null,
      type: 'movie',
      popularity: null,
      on_watchlist: false,
      on_rankings: false,
      rank: null,
    };
    const tasks: CatalogSearchTask[] = [
      {
        domain: 'books',
        resultsPromise: Promise.reject(new Error('best domain failed')),
        belowMinQuery: false,
      },
      {
        domain: 'movies',
        resultsPromise: Promise.resolve([weakMovie]),
        belowMinQuery: false,
      },
    ];

    expect(await BestMatch({ query: 'Dune', tasks })).toBeNull();
  });

  it('redirects signed-out users before starting API work', async () => {
    mocks.getSessionUser.mockResolvedValue(null);

    await expect(
      SearchPage({ searchParams: Promise.resolve({ q: 'ada', scope: 'all' }) }),
    ).rejects.toThrow('NEXT_REDIRECT');

    expect(mocks.redirect).toHaveBeenCalledWith('/login');
    expect(mocks.apiFetch).not.toHaveBeenCalled();
  });
});
