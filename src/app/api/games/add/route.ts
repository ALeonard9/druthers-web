import { NextResponse } from 'next/server';
import { apiFetch, ApiError } from '@/lib/api';
import type { UserVideoGame, VideoGame } from '@/lib/types';

// Add a game to one of the user's lists. Ensures the catalog entry exists
// (creating it requires admin), then marks it for the requested list.
export async function POST(request: Request) {
  const { igdb, title, poster_url, list } = await request.json();
  if (!igdb || !title) {
    return NextResponse.json(
      { error: 'igdb and title are required' },
      { status: 400 },
    );
  }
  const target = list === 'rankings' ? 'on_rankings' : 'on_watchlist';

  try {
    let game: VideoGame;
    try {
      game = await apiFetch<VideoGame>('/v1/games', {
        method: 'POST',
        body: { igdb, title, poster_url: poster_url ?? null },
      });
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        const all = await apiFetch<VideoGame[]>('/v1/games');
        const found = all.find((g) => g.igdb === igdb);
        if (!found) throw err;
        game = found;
      } else {
        throw err;
      }
    }

    const tracker = await apiFetch<UserVideoGame>(
      `/v1/users/me/games/${game.id}`,
      { method: 'POST', body: { [target]: true } },
    );
    return NextResponse.json(tracker, { status: 201 });
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 500;
    const message = err instanceof ApiError ? err.message : 'Failed to add game';
    return NextResponse.json({ error: message }, { status });
  }
}
