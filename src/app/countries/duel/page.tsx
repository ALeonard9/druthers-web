import { redirect } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { getSessionUser } from '@/lib/session';
import { RankingDuelPage } from '@/components/RankingDuelPage';
import { SHELVES, countryToDuelEntry } from '@/lib/duelShelves';
import type { UserCountry } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function CountriesDuelPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  const { item } = await searchParams;

  let countries: UserCountry[] = [];
  try {
    countries = await apiFetch<UserCountry[]>('/v1/users/me/countries');
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) redirect('/login');
    throw err;
  }

  return (
    <RankingDuelPage
      shelf={SHELVES.countries}
      // `on_rankings` is "visited" here — the bucket list isn't ranked.
      entries={countries.filter((c) => c.on_rankings).map(countryToDuelEntry)}
      focusId={item}
    />
  );
}
