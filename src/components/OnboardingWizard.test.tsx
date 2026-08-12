/** @vitest-environment happy-dom */
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OnboardingWizard } from './OnboardingWizard';
import type { Summary } from '@/lib/types';

const navigation = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));

vi.mock('next/navigation', () => ({ useRouter: () => navigation }));

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
});
