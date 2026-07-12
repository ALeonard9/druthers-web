import { describe, it, expect } from 'vitest';
import { partitionBooks, byRank, filterBooks } from './books';
import type { UserBook } from './types';

function ub(partial: Partial<UserBook> & { id: string }): UserBook {
  return {
    on_watchlist: false,
    on_rankings: false,
    rank: null,
    completed: 0,
    notes: null,
    created_at: '2020-01-01T00:00:00',
    updated_at: '2020-01-01T00:00:00',
    book: {
      id: `book-${partial.id}`,
      title: `Book ${partial.id}`,
      isbn: null,
      poster_url: null,
      authors: null,
      year: null,
      genre: null,
      page_count: null,
      rating: null,
    },
    ...partial,
  } as UserBook;
}

describe('partitionBooks', () => {
  it('splits the to-read list, placed rankings, and the to-rank bucket', () => {
    const books = [
      ub({ id: '1', on_rankings: true, rank: 1 }),
      ub({ id: '2', on_watchlist: true }),
      ub({ id: '3', on_watchlist: true, on_rankings: true, rank: 2 }),
      ub({ id: '4', on_rankings: true, rank: null }),
    ];
    const { watchlist, rankingsPlaced, rankingsUnplaced } = partitionBooks(books);
    expect(watchlist.map((b) => b.id).sort()).toEqual(['2', '3']);
    expect(rankingsPlaced.map((b) => b.id)).toEqual(['1', '3']);
    expect(rankingsUnplaced.map((b) => b.id)).toEqual(['4']);
  });

  it('orders placed rankings by rank', () => {
    const books = [
      ub({ id: 'a', on_rankings: true, rank: 3 }),
      ub({ id: 'c', on_rankings: true, rank: 1 }),
      ub({ id: 'b', on_rankings: true, rank: 2 }),
    ];
    const { rankingsPlaced } = partitionBooks(books);
    expect(rankingsPlaced.map((b) => b.id)).toEqual(['c', 'b', 'a']);
  });
});

describe('filterBooks', () => {
  const books = [
    ub({ id: '1', on_watchlist: true }),
    ub({ id: '2', on_watchlist: true }),
  ];
  books[0].book = {
    ...books[0].book,
    title: 'Dune',
    authors: 'Frank Herbert',
    genre: 'Science fiction',
    year: 1965,
    rating: 4.2,
  };
  books[1].book = {
    ...books[1].book,
    title: 'Project Hail Mary',
    authors: 'Andy Weir',
    genre: 'Science fiction',
    year: 2021,
    rating: 4.5,
  };

  it('matches text across title and authors', () => {
    expect(filterBooks(books, { q: 'herbert' }).map((b) => b.id)).toEqual(['1']);
    expect(filterBooks(books, { q: 'hail' }).map((b) => b.id)).toEqual(['2']);
  });

  it('filters by genre, year range, and min rating', () => {
    expect(filterBooks(books, { genre: 'science' })).toHaveLength(2);
    expect(filterBooks(books, { yearMin: 2000 }).map((b) => b.id)).toEqual(['2']);
    expect(filterBooks(books, { ratingMin: 4.4 }).map((b) => b.id)).toEqual(['2']);
  });
});

describe('byRank', () => {
  it('orders lower rank first, null last', () => {
    expect(byRank(ub({ id: '1', rank: 1 }), ub({ id: '2', rank: 2 }))).toBeLessThan(0);
    expect(
      byRank(ub({ id: '1', rank: null }), ub({ id: '2', rank: 5 })),
    ).toBeGreaterThan(0);
  });
});
