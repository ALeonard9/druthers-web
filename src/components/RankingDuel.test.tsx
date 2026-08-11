/** @vitest-environment happy-dom */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RankingDuel } from './RankingDuel';
import { RankingDuelPage } from './RankingDuelPage';
import { SHELVES, duelLists, type DuelEntry } from '@/lib/duelShelves';

const push = vi.fn();
const replace = vi.fn();
const refresh = vi.fn();

// Two things about this mock are deliberate.
//
// It is hoisted with vi.hoisted because vi.mock is itself hoisted above these
// declarations: useRouter gets away with a plain const since its body only
// runs when a test calls it, but redirect is read as the factory evaluates,
// where a plain const is still in the temporal dead zone.
//
// And it records rather than throws. The real next/navigation redirect throws
// to unwind the render, and mimicking that is tempting, but the throw escapes
// as an unhandled error that vitest then reports against whichever test is
// running — including the negative control that never redirects. Asserting the
// call is what the behaviour actually is: the guard decided to redirect, and
// where to.
const { redirect } = vi.hoisted(() => ({ redirect: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace, refresh }),
  redirect,
}));

global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({}),
});

const mockShelf = SHELVES.movies;

const mockEntry: DuelEntry = {
  id: 'item-1',
  title: 'Test Movie Title',
  subtitle: '2022',
  imageUrl: 'https://example.com/poster.jpg',
  emoji: '🎞️',
  rank: null,
};

const mockOpponents: DuelEntry[] = [
  { id: 'opp-1', title: 'Opponent One', subtitle: '2021', imageUrl: 'https://example.com/1.jpg', emoji: '🎞️', rank: 1 },
  { id: 'opp-2', title: 'Opponent Two', subtitle: '2020', imageUrl: 'https://example.com/2.jpg', emoji: '🎞️', rank: 2 },
];

describe('RankingDuel Component (web#136)', () => {
  it('renders FirstOneIn empty state when no opponents exist and handles placement', () => {
    render(
      <RankingDuel
        shelf={mockShelf}
        queue={[mockEntry]}
        ranked={[]}
      />
    );

    expect(screen.getByText('Nothing to compare against yet.')).toBeTruthy();
    expect(screen.getAllByText('Test Movie Title')[0]).toBeTruthy();

    const placeBtn = screen.getByRole('button', { name: 'Make it #1' });
    fireEvent.click(placeBtn);
    expect(global.fetch).toHaveBeenCalled();
  });

  it('renders duel comparison pair and responds to skip action', () => {
    render(
      <RankingDuel
        shelf={mockShelf}
        queue={[mockEntry]}
        ranked={mockOpponents}
      />
    );

    expect(screen.getAllByText('Test Movie Title')[0]).toBeTruthy();
    const removeButton = screen.getByRole('button', {
      name: 'Remove Test Movie Title from rankings and watchlist',
    });
    expect(removeButton).toBeTruthy();
    expect(removeButton.parentElement?.className).toContain('min-h-0');
    expect(removeButton.parentElement?.className).toContain('overflow-hidden');
    expect(
      screen.queryByRole('button', {
        name: 'Remove Opponent One from rankings and watchlist',
      }),
    ).toBeNull();
    const shareButton = screen.getByRole('button', { name: 'Share this duel' });
    expect(shareButton.className).toContain('min-h-11');
    expect(
      shareButton.parentElement?.parentElement?.parentElement?.className,
    ).toContain('grid-cols-');

    const skipBtn = screen.getAllByRole('button', { name: 'Skip for now' })[0];
    fireEvent.click(skipBtn);
    expect(skipBtn).toBeTruthy();
  });

  it('removes the current item from both rankings and watchlist', async () => {
    render(
      <RankingDuel
        shelf={mockShelf}
        queue={[mockEntry]}
        ranked={mockOpponents}
      />
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Remove Test Movie Title from rankings and watchlist',
      }),
    );

    expect(screen.getByRole('heading', { name: 'Remove “Test Movie Title”?' })).toBeTruthy();
    expect(
      screen.getByText('This removes it from both your rankings and watchlist.'),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Remove from both' }));

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith('/api/movies/item-1/track', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ on_rankings: false, on_watchlist: false }),
      }),
    );
  });

  it('presents the board return as a prominent touch target', () => {
    render(
      <RankingDuelPage
        shelf={mockShelf}
        entries={[...mockOpponents, mockEntry]}
      />,
    );

    const boardLink = screen.getByRole('link', { name: 'Back to Movies board' });
    expect(boardLink.className).toContain('min-h-11');
    expect(boardLink.className).toContain('bg-brass-wash');
    expect(boardLink.textContent).toContain('Back to Movies');
    expect(boardLink.textContent).toContain('Use the board');
  });
});

// RankingDuelPage is a synchronous server component whose guard runs before it
// returns any JSX, so these call it as a plain function rather than rendering
// it. That keeps the assertion on the guard itself and out of React's render
// and error handling.
describe('RankingDuelPage default to the list when nothing is left to rank (web#212)', () => {
  beforeEach(() => redirect.mockClear());

  it('redirects every fully-ranked shelf to its own board', () => {
    // Two ranked entries, nothing queued — a matchup is impossible, so the
    // duel must hand off to the board instead of showing an empty duel.
    // Parametrised over all four shelves so a config typo can't strand one.
    const cases = [
      ['movies', '/movies/ranking/list'],
      ['tv', '/tv/ranking/list'],
      ['books', '/books/ranking/list'],
      ['games', '/games/ranking/list'],
    ] as const;
    for (const [id, href] of cases) {
      redirect.mockClear();
      RankingDuelPage({ shelf: SHELVES[id], entries: mockOpponents });
      expect(redirect).toHaveBeenCalledWith(href);
    }
  });

  it('redirects a fully empty shelf to the board, which owns the empty state', () => {
    // Zero entries is the same queue-empty case; the board already renders
    // its "nothing ranked yet" empty list, so that behavior stays intact.
    RankingDuelPage({ shelf: mockShelf, entries: [] });
    expect(redirect).toHaveBeenCalledWith('/movies/ranking/list');
  });

  it('does not redirect when a title is still waiting to be placed', () => {
    // The negative control: one unplaced title is a duel the page can hold.
    expect(duelLists([...mockOpponents, mockEntry], undefined).queue).toHaveLength(1);
    RankingDuelPage({ shelf: mockShelf, entries: [...mockOpponents, mockEntry] });
    expect(redirect).not.toHaveBeenCalled();
  });
});
