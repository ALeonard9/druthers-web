import { describe, it, expect } from 'vitest';
import {
  movieWatchlistDeckItems,
  tvWatchlistDeckItems,
  bookWatchlistDeckItems,
  gameWatchlistDeckItems,
} from './deck';
import type { UserMovie, UserTVShow, UserBook, UserVideoGame } from './types';

function um(id: string, title: string): UserMovie {
  return {
    id,
    on_watchlist: true,
    on_rankings: false,
    rank: null,
    completed: null,
    notes: null,
    completed_at: null,
    created_at: '2020-01-01T00:00:00',
    updated_at: '2020-01-01T00:00:00',
    movie: {
      id: `movie-${id}`,
      title,
      tmdb: null,
      imdb: null,
      release_date: null,
      rating_imdb: null,
      rating_tmdb: null,
      runtime: null,
      language: null,
      rated: null,
      poster_url: `https://example.com/${id}.jpg`,
      year: 1999,
      genre: 'Drama, Thriller',
      director: null,
      actors: null,
      plot: null,
    },
  };
}

describe('movieWatchlistDeckItems', () => {
  it('assigns rank by list position rather than any real rank', () => {
    const items = movieWatchlistDeckItems([um('1', 'First'), um('2', 'Second')]);
    expect(items.map((i) => i.rank)).toEqual([1, 2]);
  });

  it('maps id, title, subtitle, poster and href off the nested movie', () => {
    const [item] = movieWatchlistDeckItems([um('1', 'First')]);
    expect(item).toMatchObject({
      id: 'movie-1',
      title: 'First',
      subtitle: '1999 · Drama',
      posterUrl: 'https://example.com/1.jpg',
      href: '/movies/movie-1',
    });
  });
});

describe('cross-domain watchlist deck builders', () => {
  it('tvWatchlistDeckItems links into /tv', () => {
    const show: UserTVShow = {
      id: '1',
      on_watchlist: true,
      on_rankings: false,
      rank: null,
      notes: null,
      completed_at: null,
      status: null,
      freeze: null,
      created_at: '2020-01-01T00:00:00',
      updated_at: '2020-01-01T00:00:00',
      tv_show: {
        id: 'show-1',
        title: 'A Show',
        imdb: null,
        tvmaze: null,
        status: null,
        poster_url: null,
        year: 2020,
        genre: null,
        network: null,
        runtime: null,
        rating: null,
      },
    };
    const [item] = tvWatchlistDeckItems([show]);
    expect(item.href).toBe('/tv/show-1');
  });

  it('bookWatchlistDeckItems links into /books', () => {
    const book: UserBook = {
      id: '1',
      on_watchlist: true,
      on_rankings: false,
      rank: null,
      completed: null,
      notes: null,
      completed_at: null,
      created_at: '2020-01-01T00:00:00',
      updated_at: '2020-01-01T00:00:00',
      book: {
        id: 'book-1',
        title: 'A Book',
        isbn: null,
        poster_url: null,
        authors: 'A. Author',
        year: 2001,
        genre: null,
        page_count: null,
        rating: null,
      },
    };
    const [item] = bookWatchlistDeckItems([book]);
    expect(item.href).toBe('/books/book-1');
  });

  it('gameWatchlistDeckItems links into /games', () => {
    const game: UserVideoGame = {
      id: '1',
      on_watchlist: true,
      on_rankings: false,
      rank: null,
      completed: null,
      is_100_percent: false,
      notes: null,
      completed_at: null,
      created_at: '2020-01-01T00:00:00',
      updated_at: '2020-01-01T00:00:00',
      game: {
        id: 'game-1',
        title: 'A Game',
        igdb: null,
        poster_url: null,
        rating: null,
        time_to_beat: null,
        slug: null,
        year: 2015,
        genre: null,
        platforms: null,
      },
    };
    const [item] = gameWatchlistDeckItems([game]);
    expect(item.href).toBe('/games/game-1');
  });
});
