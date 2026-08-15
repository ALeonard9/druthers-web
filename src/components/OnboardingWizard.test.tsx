/** @vitest-environment happy-dom */
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OnboardingWizard } from './OnboardingWizard';
import type { Summary } from '@/lib/types';

const navigation = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));

vi.mock('next/navigation', () => ({ useRouter: () => navigation }));
vi.mock('@/components/GoodreadsImport', () => ({
  GoodreadsImport: () => <div>Goodreads importer</div>,
}));
vi.mock('@/components/VoiceSearch', () => ({
  VoiceSearch: ({ onTranscript }: { onTranscript: (transcript: string) => void }) => (
    <button type="button" aria-label="Start voice search" onClick={() => onTranscript('Dune')}>
      Voice
    </button>
  ),
}));
vi.mock('@/components/RankingDuel', () => ({
  RankingDuel: ({
    queue,
    onQueueEmpty,
  }: {
    queue: Array<Record<string, unknown>>;
    onQueueEmpty: (result: {
      ranked: Array<Record<string, unknown>>;
      skipped: Array<Record<string, unknown>>;
    }) => void;
  }) => (
    <button
      type="button"
      onClick={() =>
        onQueueEmpty({
          ranked: queue.map((item, index) => ({ ...item, rank: index + 1 })),
          skipped: [],
        })
      }
    >
      Finish duel
    </button>
  ),
}));

const summary: Summary = {
  handle: 'new-reader',
  display_name: null,
  profile_public: false,
  shelves: [],
  total_ranked: 0,
  total_items: 0,
  onboarding_completed: false,
  needs_onboarding: true,
};

describe('OnboardingWizard shelf setup', () => {
  beforeEach(() => {
    navigation.push.mockReset();
    navigation.refresh.mockReset();
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) =>
        Promise.resolve(
          new Response(url.startsWith('/api/user/') ? JSON.stringify([]) : JSON.stringify({})),
        ),
      ),
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('starts with every shelf on in the movies, TV, games, books order', () => {
    render(<OnboardingWizard summary={summary} />);

    const shelfList = screen.getByRole('list', { name: 'Shelf order' });
    expect(within(shelfList).getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      expect.stringContaining('Movies'),
      expect.stringContaining('TV'),
      expect.stringContaining('Games'),
      expect.stringContaining('Books'),
    ]);
    expect(screen.getByText('4 on')).toBeTruthy();
    expect(screen.getAllByRole('checkbox', { checked: true })).toHaveLength(4);
  });

  it('offers Goodreads import while the Books shelf is enabled', () => {
    render(<OnboardingWizard summary={summary} />);

    expect(screen.getByText('Goodreads importer')).toBeTruthy();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Turn Books off' }));
    expect(screen.queryByText('Goodreads importer')).toBeNull();
  });

  it('saves shelf choices through preferences and skips an off shelf during ranking', async () => {
    render(<OnboardingWizard summary={summary} />);

    fireEvent.click(screen.getByRole('checkbox', { name: 'Turn TV off' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    await screen.findByText('Pick 5 Movies');
    expect(fetch).toHaveBeenCalledWith('/api/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shelf_order: ['movies', 'tv', 'games', 'books'],
        enabled_shelves: ['movies', 'games', 'books'],
      }),
    });

    fireEvent.click(screen.getByRole('button', { name: 'Skip the rest of Movies' }));
    await waitFor(() => expect(screen.getByText('Pick 5 Games')).toBeTruthy());
  });

  it('keeps the four default shelves when the first-five ranking is skipped', async () => {
    const localStorageSet = vi.spyOn(Storage.prototype, 'setItem');
    render(<OnboardingWizard summary={summary} />);

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    await screen.findByText('Pick 5 Movies');
    for (const shelf of ['Movies', 'TV', 'Games', 'Books']) {
      fireEvent.click(screen.getByRole('button', { name: `Skip the rest of ${shelf}` }));
      if (shelf !== 'Books') await screen.findByText(`Pick 5 ${shelf === 'Movies' ? 'TV' : shelf === 'TV' ? 'Games' : 'Books'}`);
    }

    expect(fetch).toHaveBeenCalledWith('/api/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shelf_order: ['movies', 'tv', 'games', 'books'],
        enabled_shelves: ['movies', 'tv', 'games', 'books'],
      }),
    });
    await waitFor(() => expect(navigation.push).toHaveBeenCalledWith('/'));
    expect(screen.queryByText('Finishing up…')).toBeNull();
    expect(localStorageSet).not.toHaveBeenCalled();
  });

  it('finishes a single-shelf setup without leaving the blocking overlay up', async () => {
    vi.mocked(fetch).mockImplementation((input: string | URL | Request) => {
      const url = input.toString();
      return Promise.resolve(
        new Response(
          JSON.stringify(
            url === '/api/user/games'
              ? Array.from({ length: 5 }, (_, index) => ({
                  on_rankings: true,
                  rank: index + 1,
                  game: { id: `game-${index}`, title: `Game ${index}`, year: 2020, poster_url: null },
                }))
              : {},
          ),
        ),
      );
    });

    render(<OnboardingWizard summary={{ ...summary, needs_onboarding: false }} shelfToSetUp="games" />);

    await screen.findByText("You've ranked 5 games.");
    fireEvent.click(screen.getByRole('button', { name: 'Next Step' }));

    await waitFor(() => expect(navigation.push).toHaveBeenCalledWith('/games'));
    expect(screen.queryByText('Finishing up…')).toBeNull();
  });

  it('dismisses the blocking overlay and shows an error when completion fails', async () => {
    vi.mocked(fetch).mockImplementation((input: string | URL | Request) => {
      const url = input.toString();
      return Promise.resolve(
        new Response(
          JSON.stringify(
            url === '/api/user/games'
              ? Array.from({ length: 5 }, (_, index) => ({
                  on_rankings: true,
                  rank: index + 1,
                  game: { id: `game-${index}`, title: `Game ${index}`, year: 2020, poster_url: null },
                }))
              : { error: 'Preferences could not be saved.' },
          ),
          { status: url === '/api/preferences' ? 500 : 200 },
        ),
      );
    });

    render(<OnboardingWizard summary={{ ...summary, needs_onboarding: false }} shelfToSetUp="games" />);

    await screen.findByText("You've ranked 5 games.");
    fireEvent.click(screen.getByRole('button', { name: 'Next Step' }));

    expect((await screen.findByRole('alert')).textContent).toContain('Preferences could not be saved.');
    expect(screen.queryByText('Finishing up…')).toBeNull();
    expect(navigation.push).not.toHaveBeenCalled();
  });

  it('uses the full search view and retains its query and results after adding and ranking', async () => {
    vi.mocked(fetch).mockImplementation((input: string | URL | Request) => {
      const url = input.toString();
      if (url === '/api/user/movies') return Promise.resolve(new Response(JSON.stringify([])));
      if (url === '/api/search?q=Dune') {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              query: 'Dune',
              corrected: null,
              movies: [
                {
                  tmdb: 438631,
                  imdb: 'tt1160419',
                  title: 'Dune',
                  year: '2021',
                  release_date: '2021-10-22',
                  poster_url: '/dune.jpg',
                  type: 'movie',
                  popularity: 50,
                  on_watchlist: false,
                  on_rankings: false,
                  rank: null,
                },
              ],
              tv_shows: [],
              books: [],
              games: [],
            }),
          ),
        );
      }
      if (url === '/api/movies/add') {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              id: 'tracker-1',
              on_watchlist: false,
              on_rankings: true,
              rank: null,
              movie: {
                id: 'movie-1',
                title: 'Dune',
                year: 2021,
                poster_url: '/dune.jpg',
              },
            }),
          ),
        );
      }
      return Promise.resolve(new Response(JSON.stringify({})));
    });

    render(
      <OnboardingWizard
        summary={{ ...summary, needs_onboarding: false }}
        shelfToSetUp="movies"
      />,
    );

    const search = await screen.findByRole('searchbox');
    expect(screen.getByRole('button', { name: 'Start voice search' })).toBeTruthy();
    fireEvent.change(search, { target: { value: 'Dune' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));

    const artwork = await screen.findByRole('img', { name: 'Dune' });
    expect(artwork.parentElement?.className).toContain('aspect-[2/3]');
    fireEvent.click(screen.getByRole('button', { name: 'Add Dune to Ranked List' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Finish duel' }));

    await waitFor(() => expect(screen.getByRole('searchbox')).toHaveProperty('value', 'Dune'));
    expect(screen.getByRole('img', { name: 'Dune' })).toBeTruthy();
    expect(screen.getByText('✓ Ranked')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Watchlist|Read List|Play List/ })).toBeNull();
  });

  it('explains when an onboarding result is not rankable yet', async () => {
    vi.mocked(fetch).mockImplementation((input: string | URL | Request) => {
      const url = input.toString();
      if (url === '/api/user/movies') return Promise.resolve(new Response(JSON.stringify([])));
      if (url === '/api/search?q=Doomsday') {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              query: 'Doomsday',
              corrected: null,
              movies: [
                {
                  tmdb: 100,
                  imdb: null,
                  title: 'Avengers: Doomsday',
                  year: '2099',
                  release_date: '2099-12-16',
                  poster_url: '/doomsday.jpg',
                  type: 'movie',
                  popularity: 50,
                  on_watchlist: false,
                  on_rankings: false,
                  rank: null,
                },
              ],
              tv_shows: [],
              books: [],
              games: [],
            }),
          ),
        );
      }
      return Promise.resolve(new Response(JSON.stringify({})));
    });

    render(
      <OnboardingWizard
        summary={{ ...summary, needs_onboarding: false }}
        shelfToSetUp="movies"
      />,
    );

    fireEvent.change(await screen.findByRole('searchbox'), {
      target: { value: 'Doomsday' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));

    expect(await screen.findByText('Not rankable yet')).toBeTruthy();
    expect(
      screen.queryByRole('button', { name: 'Add Avengers: Doomsday to Ranked List' }),
    ).toBeNull();
  });
});
