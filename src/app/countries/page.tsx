import { redirect } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { getSessionUser } from '@/lib/session';
import { partitionCountries, untrackedCountries } from '@/lib/countries';
import type { Country, UserCountry } from '@/lib/types';
import { CountryRankingsBoard } from '@/components/CountryRankingsBoard';
import { CountryBucketList } from '@/components/CountryBucketList';
import { CountryPicker } from '@/components/CountryPicker';

export const dynamic = 'force-dynamic';

export default async function CountriesPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  let tracked: UserCountry[];
  let catalog: Country[];
  try {
    [tracked, catalog] = await Promise.all([
      apiFetch<UserCountry[]>('/v1/users/me/countries'),
      apiFetch<Country[]>('/v1/countries'),
    ]);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) redirect('/login');
    throw err;
  }

  const { bucketList, visitedPlaced, visitedUnplaced } =
    partitionCountries(tracked);
  const untracked = untrackedCountries(catalog, tracked);
  const visitedCount = visitedPlaced.length + visitedUnplaced.length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">My Countries</h1>
        <p className="text-sm text-neutral-400">
          {visitedCount}/{catalog.length} visited · {bucketList.length} on the
          bucket list
        </p>
      </div>

      <CountryPicker untracked={untracked} />

      <div className="grid gap-10 lg:grid-cols-2">
        <section>
          <h2 className="mb-1 text-lg font-medium text-neutral-200">
            Bucket list
          </h2>
          <p className="mb-4 text-xs text-neutral-500">
            Countries you want to visit.
          </p>
          <CountryBucketList items={bucketList} />
        </section>

        <section>
          <h2 className="mb-1 text-lg font-medium text-neutral-200">
            Visited rankings
          </h2>
          <p className="mb-4 text-xs text-neutral-500">
            Drag a “to rank” country into the list, or use Go To to jump to a
            spot.
          </p>
          <CountryRankingsBoard
            placed={visitedPlaced}
            unplaced={visitedUnplaced}
            placedCount={visitedPlaced.length}
          />
        </section>
      </div>
    </div>
  );
}
