import { redirect } from 'next/navigation';
import { EnableShelfPrompt } from '@/components/EnableShelfPrompt';
import { apiFetch, ApiError } from '@/lib/api';
import { getSessionUser } from '@/lib/session';
import {
  isShelfEnabled,
  isShelfId,
  normalizeShelfPreferences,
} from '@/lib/shelfPreferences';
import { safeShelfDestination } from '@/lib/shelfDestination';
import type { Preferences } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function EnableShelfPage({
  searchParams,
}: {
  searchParams: Promise<{ shelf?: string; next?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const params = await searchParams;
  if (!isShelfId(params.shelf)) redirect('/settings#shelves');

  let rawPreferences: Preferences;
  try {
    rawPreferences = await apiFetch<Preferences>('/v1/users/me/preferences');
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) redirect('/login');
    throw error;
  }

  const preferences = normalizeShelfPreferences({
    order: rawPreferences.shelf_order,
    enabled: rawPreferences.enabled_shelves,
  });
  const destination = safeShelfDestination(params.next, params.shelf);
  if (isShelfEnabled(preferences, params.shelf)) redirect(destination);

  return (
    <EnableShelfPrompt
      shelf={params.shelf}
      destination={destination}
      preferences={preferences}
    />
  );
}
