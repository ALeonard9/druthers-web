import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { getSessionUser } from '@/lib/session';
import type { TVEpisode, TVShow, UserTVEpisode, UserTVShow } from '@/lib/types';
import { TVShowDetail } from '@/components/TVShowDetail';
import { EpisodeList } from '@/components/EpisodeList';

export const dynamic = 'force-dynamic';

export default async function TVShowDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  const { id } = await params;

  // The tracker 404s when the show isn't on any list — that's not an error.
  const trackerOrNull = apiFetch<UserTVShow>(`/v1/users/me/tv-shows/${id}`).catch(
    (err) => {
      if (err instanceof ApiError && err.status === 404) return null;
      throw err;
    },
  );

  let show: TVShow;
  let tracker: UserTVShow | null;
  let episodes: TVEpisode[];
  let marks: UserTVEpisode[];
  try {
    [show, tracker, episodes, marks] = await Promise.all([
      apiFetch<TVShow>(`/v1/tv-shows/${id}`),
      trackerOrNull,
      apiFetch<TVEpisode[]>(`/v1/tv-shows/${id}/episodes`),
      apiFetch<UserTVEpisode[]>(`/v1/users/me/tv-shows/${id}/episodes`),
    ]);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    if (err instanceof ApiError && err.status === 401) redirect('/login');
    throw err;
  }
  const watchedIds = marks
    .filter((m) => m.watched)
    .map((m) => m.episode.id);

  return (
    <div className="flex flex-col gap-6">
      <Link href="/tv" className="text-sm text-brass hover:text-brass-bright">
        ← Back to My TV Shows
      </Link>
      <TVShowDetail show={show} tracker={tracker} />
      <section>
        <h2 className="mb-3 text-lg font-medium text-neutral-200">Episodes</h2>
        <EpisodeList showId={id} episodes={episodes} watchedIds={watchedIds} />
      </section>
    </div>
  );
}
