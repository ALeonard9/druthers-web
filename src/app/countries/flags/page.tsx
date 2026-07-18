import Link from 'next/link';
import { redirect } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { getSessionUser } from '@/lib/session';
import { partitionCountries } from '@/lib/countries';
import type { UserCountry } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function CountryFlagsPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  let tracked: UserCountry[];
  try {
    tracked = await apiFetch<UserCountry[]>('/v1/users/me/countries');
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) redirect('/login');
    throw err;
  }

  const { visitedPlaced, visitedUnplaced } = partitionCountries(tracked);
  const visited = [...visitedPlaced, ...visitedUnplaced];

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="font-display text-3xl font-medium tracking-tight text-paper">
          <Link href="/countries" className="hover:underline">
            Countries
          </Link>
        </h1>
        <p className="mt-1 text-lg text-neutral-300">
          Countries Visited: {visited.length}
        </p>
      </div>

      {visited.length === 0 ? (
        <p className="text-center text-sm text-neutral-500">
          No visited countries yet —{' '}
          <Link href="/countries" className="text-brass hover:underline">
            mark one as visited
          </Link>
          .
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {visited.map((uc) => (
            <Link
              key={uc.country.id}
              href={`/countries/${uc.country.id}`}
              title={
                uc.rank != null
                  ? `${uc.rank}. ${uc.country.title}`
                  : uc.country.title
              }
              className="group flex flex-col items-center gap-2 rounded-lg border border-line bg-panel p-3 hover:border-brass"
            >
              {uc.country.flag_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={uc.country.flag_url}
                  alt={`Flag of ${uc.country.title}`}
                  className="h-[133px] w-[200px] rounded object-cover"
                />
              ) : (
                <div className="flex h-[133px] w-[200px] items-center justify-center rounded bg-line text-4xl">
                  {uc.country.flag_emoji ?? '🏳️'}
                </div>
              )}
              <span className="truncate text-center text-sm text-neutral-200 group-hover:text-brass-bright">
                {uc.rank != null && (
                  <span className="text-neutral-500">{uc.rank}. </span>
                )}
                {uc.country.title}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
