import Link from 'next/link';
import { redirect } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { getSessionUser } from '@/lib/session';
import { buildShareData } from '@/lib/shareCards';
import { ShareTop5Button } from '@/components/ShareTop5Button';
import { partitionShows } from '@/lib/tv';
import { DECK_SIZE, tvDeckItems } from '@/lib/deck';
import { TV_TABS } from '@/lib/sectionTabs';
import type { UserTVShow, Summary } from '@/lib/types';
import { RankedPosterDeck } from '@/components/RankedPosterDeck';
import { ProgressBanner } from '@/components/ProgressBanner';
import { progressMessage } from '@/lib/progress';
import { SectionTabs } from '@/components/SectionTabs';

export const dynamic = 'force-dynamic';

export default async function TVPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  let shows: UserTVShow[] = [];
  let summary: Summary;
  try {
    [shows, summary] = await Promise.all([
      apiFetch<UserTVShow[]>('/v1/users/me/tv-shows'),
      apiFetch<Summary>('/v1/users/me/summary'),
    ]);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) redirect('/login');
    throw err;
  }

  // Deliberately unfiltered: this view is the top of the shelf as it stands.
  // Filtering belongs with the list on /tv/ranking.
  const { rankingsPlaced } = partitionShows(shows);
  const top = tvDeckItems(rankingsPlaced.slice(0, DECK_SIZE));
  const banner = progressMessage(rankingsPlaced.length, 'show');

  return (
    <div className="flex flex-col gap-6">
      <SectionTabs tabs={TV_TABS} />

      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-medium tracking-tight text-paper">
            My TV Shows
          </h1>
          <p className="text-sm text-neutral-400">
            {rankingsPlaced.length} ranked
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ShareTop5Button data={buildShareData(summary)} initialCategory="tv" />
          <Link
            href="/tv/search"
            className="rounded bg-brass px-3 py-2 text-sm font-medium text-ink hover:bg-brass-bright"
          >
            + Add a show
          </Link>
        </div>
      </div>

      {top.length > 0 ? (
        <>
          {banner && <ProgressBanner message={banner} />}
          <RankedPosterDeck
            items={top}
            placedCount={rankingsPlaced.length}
            label="Your highest ranked shows"
          />
        </>
      ) : (
        <p className="text-sm text-neutral-500">
          Nothing ranked yet —{' '}
          <Link href="/tv/search" className="text-brass">
            add a show
          </Link>{' '}
          or promote one from your{' '}
          <Link href="/tv/watchlist" className="text-brass">
            watchlist
          </Link>
          .
        </p>
      )}
    </div>
  );
}
