import { NextResponse } from 'next/server';
import { apiFetch, ApiError } from '@/lib/api';
import type { Book, UserBook } from '@/lib/types';

// Add a book to one of the user's lists. Ensures the catalog entry exists
// (creating it requires admin), then marks it for the requested list.
export async function POST(request: Request) {
  const { isbn, title, poster_url, list } = await request.json();
  if (!isbn || !title) {
    return NextResponse.json(
      { error: 'isbn and title are required' },
      { status: 400 },
    );
  }
  const target = list === 'rankings' ? 'on_rankings' : 'on_watchlist';

  try {
    let book: Book;
    try {
      book = await apiFetch<Book>('/v1/books', {
        method: 'POST',
        body: { isbn, title, poster_url: poster_url ?? null },
      });
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        const all = await apiFetch<Book[]>('/v1/books');
        const found = all.find((b) => b.isbn === isbn);
        if (!found) throw err;
        book = found;
      } else {
        throw err;
      }
    }

    const tracker = await apiFetch<UserBook>(`/v1/users/me/books/${book.id}`, {
      method: 'POST',
      body: { [target]: true },
    });
    return NextResponse.json(tracker, { status: 201 });
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 500;
    const message = err instanceof ApiError ? err.message : 'Failed to add book';
    return NextResponse.json({ error: message }, { status });
  }
}
