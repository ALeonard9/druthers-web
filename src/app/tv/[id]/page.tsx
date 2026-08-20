import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { getSessionUser } from '@/lib/session';
import { resolveShelfTier } from '@/lib/privacyDefaults';
import type {
  SocialItemContext,
  TVEpisode,
  TVShow,
  UserTVEpisode,
  UserTVShow,
  Visibility,
  WatchProviders,
} from '@/lib/types';
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

  // The tracker 404s when the show isn't on any list - that's not an error.
  const trackerOrNull = apiFetch<UserTVShow>(`/v1/users/me/tv-shows/${id}`).catch(
    (err) => {
      if (err instanceof ApiError && err.status === 404) return null;
      throw err;
    },
  );

  // Streaming availability is a nicety (#26) - it already degrades to empty
  // buckets upstream, so swallowing the error here only covers the API itself
  // being unreachable, and never fails the page.
  const providersOrNull = apiFetch<WatchProviders>(
    `/v1/tv-shows/${id}/watch-providers`,
  ).catch(() => null);

  let show: TVShow;
  let tracker: UserTVShow | null;
  let episodes: TVEpisode[];
  let marks: UserTVEpisode[];
  let providers: WatchProviders | null;
  let social: SocialItemContext[];
  let visibility: Visibility;
  try {
    [show, tracker, episodes, marks, providers, social, visibility] = await Promise.all([
      apiFetch<TVShow>(`/v1/tv-shows/${id}`),
      trackerOrNull,
      apiFetch<TVEpisode[]>(`/v1/tv-shows/${id}/episodes`),
      apiFetch<UserTVEpisode[]>(`/v1/users/me/tv-shows/${id}/episodes`),
      providersOrNull,
      apiFetch<SocialItemContext[]>(`/v1/tv/${id}/social`),
      apiFetch<Visibility>('/v1/users/me/visibility'),
    ]);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    if (err instanceof ApiError && err.status === 401) redirect('/login');
    throw err;
  }
  const watchedIds = marks
    .filter((m) => m.watched)
    .map((m) => m.episode.id);
  const favoritedIds = marks
    .filter((m) => m.favorited)
    .map((m) => m.episode.id);

  return (
    <div className="flex flex-col gap-6">
      <Link href="/tv" className="text-sm text-brass hover:text-brass-bright">
        ← Back to My TV Shows
      </Link>
      <TVShowDetail
        show={show}
        tracker={tracker}
        providers={providers}
        social={social}
        notesVisibility={resolveShelfTier(visibility, 'visibility_notes_tv')}
      />
      <section>
        <h2 className="mb-3 text-lg font-medium text-neutral-200">Episodes</h2>
        <EpisodeList
          showId={id}
          episodes={episodes}
          watchedIds={watchedIds}
          favoritedIds={favoritedIds}
        />
      </section>
    </div>
  );
}
