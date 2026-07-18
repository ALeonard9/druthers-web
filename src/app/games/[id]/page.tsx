import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { getSessionUser } from '@/lib/session';
import type { UserVideoGame, VideoGame } from '@/lib/types';
import { GameDetail } from '@/components/GameDetail';

export const dynamic = 'force-dynamic';

export default async function GameDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  const { id } = await params;

  // The tracker 404s when the game isn't on any list — that's not an error.
  const trackerOrNull = apiFetch<UserVideoGame>(`/v1/users/me/games/${id}`).catch(
    (err) => {
      if (err instanceof ApiError && err.status === 404) return null;
      throw err;
    },
  );

  let game: VideoGame;
  let tracker: UserVideoGame | null;
  try {
    [game, tracker] = await Promise.all([
      apiFetch<VideoGame>(`/v1/games/${id}`),
      trackerOrNull,
    ]);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    if (err instanceof ApiError && err.status === 401) redirect('/login');
    throw err;
  }

  return (
    <div className="flex flex-col gap-6">
      <Link href="/games" className="text-sm text-brass hover:text-brass-bright">
        ← Back to My Games
      </Link>
      <GameDetail game={game} tracker={tracker} />
    </div>
  );
}
