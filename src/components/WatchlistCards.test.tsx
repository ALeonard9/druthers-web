/** @vitest-environment happy-dom */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { UserBook, UserMovie, UserTVShow, UserVideoGame } from '@/lib/types';
import { BookWatchlistCard } from './BookWatchlistCard';
import { GameWatchlistCard } from './GameWatchlistCard';
import { TVWatchlistCard } from './TVWatchlistCard';
import { WatchlistActionProvider } from './WatchlistActions';
import { WatchlistCard } from './WatchlistCard';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

const movie = {
  id: 'user-movie-1',
  on_watchlist: true,
  on_rankings: false,
  movie: {
    id: 'movie-1',
    title: 'Test Movie',
    release_date: null,
    poster_url: null,
  },
} as UserMovie;

const show = {
  id: 'user-show-1',
  on_watchlist: true,
  on_rankings: false,
  status: null,
  tv_show: {
    id: 'show-1',
    title: 'Test Show',
    poster_url: null,
    status: null,
  },
} as UserTVShow;

const book = {
  id: 'user-book-1',
  on_watchlist: true,
  on_rankings: false,
  book: {
    id: 'book-1',
    title: 'Test Book',
    poster_url: null,
    authors: 'Test Author',
  },
} as UserBook;

const game = {
  id: 'user-game-1',
  on_watchlist: true,
  on_rankings: false,
  game: {
    id: 'game-1',
    title: 'Test Game',
    poster_url: null,
    platforms: 'Test Console',
  },
} as UserVideoGame;

afterEach(cleanup);

describe('watchlist icon cards', () => {
  it('labels the promote action Rank and shows Remove in all four domains', () => {
    render(
      <WatchlistActionProvider>
        <ul>
          <WatchlistCard userMovie={movie} />
          <TVWatchlistCard userShow={show} />
          <BookWatchlistCard userBook={book} />
          <GameWatchlistCard userGame={game} />
        </ul>
      </WatchlistActionProvider>,
    );

    for (const title of ['Test Movie', 'Test Show', 'Test Book', 'Test Game']) {
      expect(screen.getByRole('button', { name: `Rank ${title}` }).textContent).toBe('Rank');
      expect(
        screen.getByRole('button', { name: `Remove ${title} from watchlist` }),
      ).toBeTruthy();
    }
  });
});
