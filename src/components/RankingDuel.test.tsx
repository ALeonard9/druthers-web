/** @vitest-environment happy-dom */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RankingDuel } from './RankingDuel';
import { RankingDuelPage } from './RankingDuelPage';
import { SHELVES, type DuelEntry } from '@/lib/duelShelves';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
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
    const shareButton = screen.getByRole('button', { name: 'Share this duel' });
    expect(shareButton.className).toContain('min-h-11');
    expect(
      shareButton.parentElement?.parentElement?.parentElement?.className,
    ).toContain('grid-cols-');

    const skipBtn = screen.getAllByRole('button', { name: 'Skip for now' })[0];
    fireEvent.click(skipBtn);
    expect(skipBtn).toBeTruthy();
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
