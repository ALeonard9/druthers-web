import { redirect } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { getSessionUser } from '@/lib/session';
import { buildShareData } from '@/lib/shareCards';
import { ShareTop5Button } from '@/components/ShareTop5Button';
import { partitionMovies } from '@/lib/movies';
import { DECK_SIZE, movieDeckItems } from '@/lib/deck';
import { MOVIE_TABS } from '@/lib/sectionTabs';
import type { UserMovie, Summary } from '@/lib/types';
import { RankedPosterDeck } from '@/components/RankedPosterDeck';
import { ProgressBanner } from '@/components/ProgressBanner';
import { progressMessage } from '@/lib/progress';
import { SectionTabs } from '@/components/SectionTabs';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function MoviesPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  let movies: UserMovie[] = [];
  let summary: Summary;
  try {
    [movies, summary] = await Promise.all([
      apiFetch<UserMovie[]>('/v1/users/me/movies'),
      apiFetch<Summary>('/v1/users/me/summary'),
    ]);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) redirect('/login');
    throw err;
  }

  // Deliberately unfiltered: this view is the top of the shelf as it stands.
  // Filtering belongs with the list on /movies/ranking.
  const { rankingsPlaced } = partitionMovies(movies);
  const top = movieDeckItems(rankingsPlaced.slice(0, DECK_SIZE));
  const banner = progressMessage(rankingsPlaced.length, 'movie');

  return (
    <div className="flex flex-col gap-6">
      <SectionTabs tabs={MOVIE_TABS} />

      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-medium tracking-tight text-paper">
            My Movies
          </h1>
          <p className="text-sm text-neutral-400">
            {rankingsPlaced.length} ranked
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ShareTop5Button
            data={buildShareData(summary)}
            initialCategory="movies"
          />
          <Link
            href="/movies/search"
            className="rounded bg-brass px-3 py-2 text-sm font-medium text-ink hover:bg-brass-bright"
          >
            + Add a movie
          </Link>
        </div>
      </div>

      {top.length > 0 ? (
        <>
          {banner && <ProgressBanner message={banner} />}
          <RankedPosterDeck
            items={top}
            placedCount={rankingsPlaced.length}
            label="Your highest ranked movies"
          />
        </>
      ) : (
        <p className="text-sm text-neutral-500">
          Nothing ranked yet —{' '}
          <Link href="/movies/search" className="text-brass">
            add a movie
          </Link>{' '}
          or promote one from your{' '}
          <Link href="/movies/watchlist" className="text-brass">
            watchlist
          </Link>
          .
        </p>
      )}
    </div>
  );
}
