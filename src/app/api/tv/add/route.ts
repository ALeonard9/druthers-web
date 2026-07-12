import { NextResponse } from 'next/server';
import { apiFetch, ApiError } from '@/lib/api';
import type { TVShow, UserTVShow } from '@/lib/types';

// Add a TV show to one of the user's lists. Ensures the catalog entry exists
// (creating it requires admin), then marks it for the requested list.
export async function POST(request: Request) {
  const { tvmaze, imdb, title, poster_url, list } = await request.json();
  if (!tvmaze || !title) {
    return NextResponse.json(
      { error: 'tvmaze and title are required' },
      { status: 400 },
    );
  }
  const target = list === 'rankings' ? 'on_rankings' : 'on_watchlist';

  try {
    let show: TVShow;
    try {
      show = await apiFetch<TVShow>('/v1/tv-shows', {
        method: 'POST',
        body: {
          tvmaze,
          imdb: imdb ?? null,
          title,
          poster_url: poster_url ?? null,
        },
      });
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        // Create dedups on tvmaze OR imdb, so re-find on either key.
        const all = await apiFetch<TVShow[]>('/v1/tv-shows');
        const found = all.find(
          (s) => s.tvmaze === tvmaze || (imdb != null && s.imdb === imdb),
        );
        if (!found) throw err;
        show = found;
      } else {
        throw err;
      }
    }

    const tracker = await apiFetch<UserTVShow>(
      `/v1/users/me/tv-shows/${show.id}`,
      { method: 'POST', body: { [target]: true } },
    );
    return NextResponse.json(tracker, { status: 201 });
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 500;
    const message = err instanceof ApiError ? err.message : 'Failed to add show';
    return NextResponse.json({ error: message }, { status });
  }
}
