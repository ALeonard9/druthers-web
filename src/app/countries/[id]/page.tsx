import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { getSessionUser } from '@/lib/session';
import type { Country, UserCountry } from '@/lib/types';
import { CountryDetail } from '@/components/CountryDetail';

export const dynamic = 'force-dynamic';

export default async function CountryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  const { id } = await params;

  // The tracker 404s when the country isn't on any list — that's not an error.
  const trackerOrNull = apiFetch<UserCountry>(
    `/v1/users/me/countries/${id}`,
  ).catch((err) => {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  });

  let country: Country;
  let tracker: UserCountry | null;
  try {
    [country, tracker] = await Promise.all([
      apiFetch<Country>(`/v1/countries/${id}`),
      trackerOrNull,
    ]);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    if (err instanceof ApiError && err.status === 401) redirect('/login');
    throw err;
  }

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/countries"
        className="text-sm text-brass hover:text-brass-bright"
      >
        ← Back to My Countries
      </Link>
      <CountryDetail country={country} tracker={tracker} />
    </div>
  );
}
