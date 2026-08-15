/** @vitest-environment happy-dom */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OnboardingWizard } from './OnboardingWizard';
import type { Summary } from '@/lib/types';

const navigation = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));

vi.mock('next/navigation', () => ({ useRouter: () => navigation }));
vi.mock('@/lib/pop', () => ({ playPop: vi.fn() }));
vi.mock('@/components/GoodreadsImport', () => ({ GoodreadsImport: () => null }));
vi.mock('@/components/VoiceSearch', () => ({ VoiceSearch: () => null }));
vi.mock('@/components/DuelShareButton', () => ({ DuelShareButton: () => null }));

const summary: Summary = {
  handle: 'new-reader',
  display_name: null,
  profile_public: false,
  shelves: [],
  total_ranked: 1,
  total_items: 1,
  onboarding_completed: false,
  needs_onboarding: true,
};

describe('Onboarding second-title duel return (web#280)', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/onboarding');
    navigation.push.mockReset();
    navigation.refresh.mockReset();
    navigation.refresh.mockImplementation(() => {
      // Mirrors the live regression: refreshing the server-owned onboarding
      // route re-evaluated its redirect and replaced the onboarding screen.
      window.history.replaceState({}, '', '/');
    });

    class ResizeObserverStub {
      observe() {}
      disconnect() {}
    }
    vi.stubGlobal('ResizeObserver', ResizeObserverStub);

    vi.stubGlobal(
      'fetch',
      vi.fn((input: string | URL | Request) => {
        const url = input.toString();
        if (url === '/api/user/movies') {
          return Promise.resolve(
            new Response(
              JSON.stringify([
                {
                  id: 'tracker-1',
                  on_watchlist: false,
                  on_rankings: true,
                  rank: 1,
                  movie: {
                    id: 'movie-1',
                    title: 'Arrival',
                    year: 2016,
                    poster_url: '/arrival.jpg',
                  },
                },
              ]),
            ),
          );
        }
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
                id: 'tracker-2',
                on_watchlist: false,
                on_rankings: true,
                rank: null,
                movie: {
                  id: 'movie-2',
                  title: 'Dune',
                  year: 2021,
                  poster_url: '/dune.jpg',
                },
              }),
            ),
          );
        }
        return Promise.resolve(new Response(JSON.stringify({})));
      }),
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('returns to retained onboarding search after ranking the second title', async () => {
    render(<OnboardingWizard summary={summary} />);

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    await screen.findByText('Pick 5 Movies');

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Dune' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    fireEvent.click(
      await screen.findByRole('button', { name: 'Add Dune to Ranked List' }),
    );

    await screen.findByText('Which would you rather?');
    const candidate = screen
      .getAllByRole('button')
      .find((button) =>
        !button.getAttribute('aria-label') && button.textContent?.includes('Dune'),
      );
    fireEvent.click(candidate!);
    fireEvent.click(
      await screen.findByRole('button', { name: 'Continue adding Movies' }),
    );

    await waitFor(() =>
      expect(screen.getByRole('searchbox')).toHaveProperty('value', 'Dune'),
    );
    expect(window.location.pathname).toBe('/onboarding');
    expect(navigation.refresh).not.toHaveBeenCalled();
    expect(navigation.push).not.toHaveBeenCalled();
    expect(screen.getByRole('img', { name: 'Dune' })).toBeTruthy();
    expect(screen.getByText('✓ Ranked')).toBeTruthy();
    expect(screen.getByText('Pick 5 Movies')).toBeTruthy();
  });

  it('returns to retained onboarding search after removing the second title', async () => {
    render(<OnboardingWizard summary={summary} />);

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    await screen.findByText('Pick 5 Movies');

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Dune' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    fireEvent.click(
      await screen.findByRole('button', { name: 'Add Dune to Ranked List' }),
    );

    await screen.findByText('Which would you rather?');
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Remove Dune from rankings and watchlist',
      }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Remove from both' }));
    fireEvent.click(
      await screen.findByRole('button', { name: 'Continue adding Movies' }),
    );

    await waitFor(() =>
      expect(screen.getByRole('searchbox')).toHaveProperty('value', 'Dune'),
    );
    expect(window.location.pathname).toBe('/onboarding');
    expect(navigation.refresh).not.toHaveBeenCalled();
    expect(navigation.push).not.toHaveBeenCalled();
    expect(screen.getByRole('img', { name: 'Dune' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Add Dune to Ranked List' })).toBeTruthy();
    expect(screen.queryByText('✓ Ranked')).toBeNull();
    expect(screen.getByText('Pick 5 Movies').parentElement?.parentElement?.textContent).toContain(
      '1 / 5',
    );
    expect(fetch).toHaveBeenCalledWith('/api/movies/movie-2/track', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ on_rankings: false, on_watchlist: false }),
    });
  });
});
