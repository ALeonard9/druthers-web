/** @vitest-environment happy-dom */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { RankingsBoard } from './RankingsBoard';
import { TVRankingsBoard } from './TVRankingsBoard';
import { BookRankingsBoard } from './BookRankingsBoard';
import { GameRankingsBoard } from './GameRankingsBoard';
import type { UserMovie, UserTVShow, UserBook, UserVideoGame } from '@/lib/types';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({}),
});

afterEach(cleanup);

const mockMovieItem: UserMovie = {
  id: 'um-1',
  on_watchlist: false,
  on_rankings: true,
  rank: 1,
  completed: null,
  notes: null,
  completed_at: null,
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
  movie: {
    id: 'movie-1',
    title: 'Test Movie',
    year: 2022,
    poster_url: 'https://example.com/poster.jpg',
    tmdb: 1,
    imdb: 'tt1',
    release_date: null,
    rating_imdb: null,
    rating_tmdb: null,
    runtime: null,
    language: null,
    rated: null,
    genre: null,
    director: null,
    actors: null,
    plot: null,
  },
};

const mockTVItem: UserTVShow = {
  id: 'utv-1',
  on_watchlist: false,
  on_rankings: true,
  rank: 1,
  status: null,
  notes: null,
  completed_at: null,
  freeze: null,
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
  tv_show: {
    id: 'tv-1',
    title: 'Test TV Show',
    year: 2021,
    poster_url: 'https://example.com/poster.jpg',
    tvmaze: 1,
    imdb: null,
    status: null,
    premiered: null,
    network: null,
    rating: null,
    summary: null,
    genre: null,
    runtime: null,
  },
};

const mockBookItem: UserBook = {
  id: 'ub-1',
  on_watchlist: false,
  on_rankings: true,
  rank: 1,
  completed: null,
  notes: null,
  completed_at: null,
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
  book: {
    id: 'book-1',
    title: 'Test Book',
    authors: 'Author Name',
    isbn: '123',
    poster_url: 'https://example.com/poster.jpg',
    year: 2020,
    genre: null,
    description: null,
    page_count: null,
    rating: null,
  },
};

const mockGameItem: UserVideoGame = {
  id: 'ug-1',
  on_watchlist: false,
  on_rankings: true,
  rank: 1,
  completed: null,
  notes: null,
  completed_at: null,
  is_100_percent: null,
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
  game: {
    id: 'game-1',
    title: 'Test Video Game',
    year: 2023,
    poster_url: 'https://example.com/poster.jpg',
    igdb: 1,
    summary: null,
    genre: null,
    platforms: null,
    rating: null,
    time_to_beat: null,
    slug: null,
  },
};

describe('Drag-and-Drop Rankings Boards (web#137)', () => {
  function expectExplicitActions(removeLabel: string, listLabel: string) {
    expect(screen.getByRole('link', { name: 'Rank by comparison →' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Rank #1' })).toBeTruthy();
    expect(screen.getByRole('button', { name: listLabel })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Rerank' })).toBeTruthy();
    expect(screen.getByRole('button', { name: removeLabel })).toBeTruthy();
    expect(screen.queryByText('Place it →')).toBeNull();
  }

  it('renders explicit right-side movie actions without swipe-only controls', () => {
    const ready = {
      ...mockMovieItem,
      id: 'um-2',
      rank: null,
      movie: { ...mockMovieItem.movie, id: 'movie-2', title: 'Ready Movie' },
    };
    render(<RankingsBoard placed={[mockMovieItem]} unplaced={[ready]} placedCount={1} />);
    expect(screen.getByText(/Test Movie/)).toBeTruthy();
    expectExplicitActions('Remove Test Movie from rankings', 'Watchlist');
  });

  it('renders explicit right-side TV actions without swipe-only controls', () => {
    const ready = {
      ...mockTVItem,
      id: 'utv-2',
      rank: null,
      tv_show: { ...mockTVItem.tv_show, id: 'tv-2', title: 'Ready TV Show' },
    };
    render(<TVRankingsBoard placed={[mockTVItem]} unplaced={[ready]} placedCount={1} />);
    expect(screen.getByText(/Test TV Show/)).toBeTruthy();
    expectExplicitActions('Remove Test TV Show from rankings', 'Watchlist');
  });

  it('renders explicit right-side book actions without swipe-only controls', () => {
    const ready = {
      ...mockBookItem,
      id: 'ub-2',
      rank: null,
      book: { ...mockBookItem.book, id: 'book-2', title: 'Ready Book' },
    };
    render(<BookRankingsBoard placed={[mockBookItem]} unplaced={[ready]} placedCount={1} />);
    expect(screen.getByText(/Test Book/)).toBeTruthy();
    expectExplicitActions('Remove Test Book from rankings', 'Read List');
  });

  it('renders explicit right-side game actions without swipe-only controls', () => {
    const ready = {
      ...mockGameItem,
      id: 'ug-2',
      rank: null,
      game: { ...mockGameItem.game, id: 'game-2', title: 'Ready Video Game' },
    };
    render(<GameRankingsBoard placed={[mockGameItem]} unplaced={[ready]} placedCount={1} />);
    expect(screen.getByText(/Test Video Game/)).toBeTruthy();
    expectExplicitActions('Remove Test Video Game from rankings', 'Watchlist');
  });
});
