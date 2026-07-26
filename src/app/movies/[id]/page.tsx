import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { getSessionUser } from '@/lib/session';
import type { Movie, UserMovie, WatchProviders } from '@/lib/types';
import { MovieDetail } from '@/components/MovieDetail';

export const dynamic = 'force-dynamic';

export default async function MovieDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  const { id } = await params;

  // Streaming availability is a nicety (#26) and the slowest call on the page
  // (it can reach TMDB), so start it now and don't let it fail the render.
  // The endpoint already degrades to empty buckets upstream; this only covers
  // the API itself being unreachable.
  const providersOrNull = apiFetch<WatchProviders>(
    `/v1/movies/${id}/watch-providers`,
  ).catch(() => null);

  let movie: Movie;
  try {
    movie = await apiFetch<Movie>(`/v1/movies/${id}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    if (err instanceof ApiError && err.status === 401) redirect('/login');
    throw err;
  }

  let tracker: UserMovie | null = null;
  try {
    tracker = await apiFetch<UserMovie>(`/v1/users/me/movies/${id}`);
  } catch (err) {
    if (!(err instanceof ApiError && err.status === 404)) throw err;
  }

  const providers = await providersOrNull;

  return (
    <div className="flex flex-col gap-6">
      <Link href="/movies" className="text-sm text-brass hover:text-brass-bright">
        ← Back to My Movies
      </Link>
      <MovieDetail movie={movie} tracker={tracker} providers={providers} />
    </div>
  );
}
