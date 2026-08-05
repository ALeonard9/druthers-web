/** @vitest-environment happy-dom */
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
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
  it('renders Movies RankingsBoard cleanly with items', () => {
    render(<RankingsBoard placed={[mockMovieItem]} unplaced={[]} placedCount={1} />);
    expect(screen.getByText(/Test Movie/)).toBeTruthy();
  });

  it('renders TVRankingsBoard cleanly with items', () => {
    render(<TVRankingsBoard placed={[mockTVItem]} unplaced={[]} placedCount={1} />);
    expect(screen.getByText(/Test TV Show/)).toBeTruthy();
  });

  it('renders BookRankingsBoard cleanly with items', () => {
    render(<BookRankingsBoard placed={[mockBookItem]} unplaced={[]} placedCount={1} />);
    expect(screen.getByText(/Test Book/)).toBeTruthy();
  });

  it('renders GameRankingsBoard cleanly with items', () => {
    render(<GameRankingsBoard placed={[mockGameItem]} unplaced={[]} placedCount={1} />);
    expect(screen.getByText(/Test Video Game/)).toBeTruthy();
  });
});
