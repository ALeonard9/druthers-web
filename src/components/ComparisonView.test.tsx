/** @vitest-environment happy-dom */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ComparisonView } from './ComparisonView';
import type { ComparisonDomain, UserComparison } from '@/lib/types';

const movieDomain: ComparisonDomain = {
  category: 'movies',
  label: 'Movies',
  rankings_visible: true,
  watchlist_visible: false,
  common_watchlist: [],
  recommendations: [
    {
      id: 'm1',
      title: 'Heat',
      year: 1995,
      poster_url: null,
      their_rank: 2,
      on_your_watchlist: false,
    },
  ],
  biggest_gaps: [
    { id: 'm2', title: 'Alien', year: 1979, poster_url: null, your_rank: 1, their_rank: 20, gap: 0.8 },
  ],
  most_aligned: [
    { id: 'm3', title: 'Jaws', year: 1975, poster_url: null, your_rank: 4, their_rank: 5, gap: 0.02 },
  ],
  shared_ranked_count: 8,
  alignment_score: 84,
  alignment_status: 'ready',
  method: 'Each gap is the absolute difference between your two rank positions. Alignment scales the average gap against the longer shelf.',
};

const hiddenDomain: ComparisonDomain = {
  ...movieDomain,
  category: 'books',
  label: 'Books',
  rankings_visible: false,
  alignment_status: 'hidden',
  recommendations: [],
  biggest_gaps: [],
  most_aligned: [],
};

const comparison: UserComparison = {
  handle: 'brandon',
  display_name: 'Brandon',
  relationship: 'friend',
  domains: [movieDomain, hiddenDomain],
};

describe('ComparisonView (web#126)', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
  });
  afterEach(cleanup);

  it('shows visible comparison data and explicit partial-visibility states', () => {
    render(<ComparisonView initial={comparison} />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('You × @brandon');
    expect(screen.getByText('84%')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'How alignment is calculated' })).toBeTruthy();
    expect(screen.getAllByText(movieDomain.method).length).toBe(2);
    expect(screen.getByText('Their Watchlist isn’t visible to you.')).toBeTruthy();
    expect(screen.getByText('@brandon hasn’t shared this shelf with you.')).toBeTruthy();
    expect(screen.getAllByText('Heat').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Alien').length).toBeGreaterThan(0);
  });

  it('saves to a list without launching a duel and records the source route', async () => {
    render(<ComparisonView initial={comparison} />);
    fireEvent.click(screen.getByRole('button', { name: '+ Watchlist' }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(
      '/api/comparison/brandon/movies/m1',
      expect.objectContaining({ body: JSON.stringify({ destination: 'watchlist' }) }),
    ));
    const watchlistButton = screen.getByRole('button', { name: '✓ Watchlist' });
    expect((watchlistButton as HTMLButtonElement).disabled).toBe(true);
    expect(watchlistButton.className).toContain('bg-moss-wash');
    expect(screen.getByRole('button', { name: '+ Rank' }).className).toContain('min-h-8');
  });

  it('filters to one domain without dropping the all-domain default', () => {
    render(<ComparisonView initial={comparison} />);
    fireEvent.click(screen.getByRole('button', { name: 'Movies' }));
    expect(screen.getByText('84%')).toBeTruthy();
    expect(screen.queryByText('@brandon hasn’t shared this shelf with you.')).toBeNull();
  });
});
