/** @vitest-environment happy-dom */
import { cleanup, render, screen, fireEvent, waitFor } from '@testing-library/react';
import { afterEach, describe, it, expect, vi, beforeEach } from 'vitest';
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
// running - including the negative control that never redirects. Asserting the
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

afterEach(cleanup);

describe('RankingDuel Component (web#136)', () => {
  beforeEach(() => {
    refresh.mockClear();
    vi.mocked(global.fetch).mockClear();
  });

  it('renders FirstOneIn empty state when no opponents exist and refreshes its standalone page after placement', async () => {
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
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(refresh).toHaveBeenCalledOnce();
  });

  it('does not refresh a parent-managed flow after placement', async () => {
    const onQueueEmpty = vi.fn();
    render(
      <RankingDuel
        shelf={mockShelf}
        queue={[mockEntry]}
        ranked={mockOpponents.slice(0, 1)}
        onQueueEmpty={onQueueEmpty}
      />,
    );

    const candidate = screen
      .getAllByRole('button')
      .find((button) =>
        !button.getAttribute('aria-label') && button.textContent?.includes('Test Movie Title'),
      );
    fireEvent.click(candidate!);

    await screen.findByRole('button', { name: 'Continue adding Movies' });
    expect(refresh).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Continue adding Movies' }));
    expect(onQueueEmpty).toHaveBeenCalledWith({
      ranked: [
        expect.objectContaining({ id: 'item-1', rank: 1 }),
        expect.objectContaining({ id: 'opp-1', rank: 2 }),
      ],
      skipped: [],
    });
  });

  it('renders a standalone duel and keeps its existing local skip behavior', async () => {
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
    expect(await screen.findByText('Nothing waiting to be placed.')).toBeTruthy();
    expect(refresh).not.toHaveBeenCalled();
  });

  it('removes the current item and refreshes its standalone page', async () => {
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
    expect(refresh).toHaveBeenCalledOnce();
  });

  it('returns a removed queue to its parent without refreshing', async () => {
    const onQueueEmpty = vi.fn();
    render(
      <RankingDuel
        shelf={mockShelf}
        queue={[mockEntry]}
        ranked={mockOpponents.slice(0, 1)}
        onQueueEmpty={onQueueEmpty}
      />,
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Remove Test Movie Title from rankings and watchlist',
      }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Remove from both' }));

    await screen.findByRole('button', { name: 'Continue adding Movies' });
    expect(refresh).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Continue adding Movies' }));
    expect(onQueueEmpty).toHaveBeenCalledWith({
      ranked: [expect.objectContaining({ id: 'opp-1', rank: 1 })],
      skipped: [],
    });
  });

  it('returns skipped entries separately to its parent without refreshing', async () => {
    const onQueueEmpty = vi.fn();
    render(
      <RankingDuel
        shelf={mockShelf}
        queue={[mockEntry]}
        ranked={mockOpponents.slice(0, 1)}
        onQueueEmpty={onQueueEmpty}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Skip for now' }));
    fireEvent.click(
      await screen.findByRole('button', { name: 'Continue adding Movies' }),
    );

    expect(refresh).not.toHaveBeenCalled();
    expect(onQueueEmpty).toHaveBeenCalledWith({
      ranked: [expect.objectContaining({ id: 'opp-1', rank: 1 })],
      skipped: [expect.objectContaining({ id: 'item-1', rank: null })],
    });
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
describe('RankingDuelPage returns to the shelf icons when nothing is left to rank (web#296)', () => {
  beforeEach(() => redirect.mockClear());

  it('redirects every fully-ranked shelf to its own icon view', () => {
    // Two ranked entries, nothing queued - a matchup is impossible, so the
    // duel must hand off to shelf browsing instead of another ranking screen.
    // Parametrised over all four shelves so a config typo can't strand one.
    const cases = [
      ['movies', '/movies?view=icons'],
      ['tv', '/tv?view=icons'],
      ['books', '/books?view=icons'],
      ['games', '/games?view=icons'],
    ] as const;
    for (const [id, href] of cases) {
      redirect.mockClear();
      RankingDuelPage({ shelf: SHELVES[id], entries: mockOpponents });
      expect(redirect).toHaveBeenCalledWith(href);
    }
  });

  it('redirects a fully empty shelf to the shelf icon view', () => {
    // Zero entries is the same queue-empty case; the shelf owns that empty
    // state too, so the ranking route still never renders an empty duel.
    RankingDuelPage({ shelf: mockShelf, entries: [] });
    expect(redirect).toHaveBeenCalledWith('/movies?view=icons');
  });

  it('does not redirect when a title is still waiting to be placed', () => {
    // The negative control: one unplaced title is a duel the page can hold.
    expect(duelLists([...mockOpponents, mockEntry], undefined).queue).toHaveLength(1);
    RankingDuelPage({ shelf: mockShelf, entries: [...mockOpponents, mockEntry] });
    expect(redirect).not.toHaveBeenCalled();
  });
});
