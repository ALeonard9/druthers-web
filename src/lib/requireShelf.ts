import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getSessionUser } from '@/lib/session';
import { apiFetch, ApiError } from '@/lib/api';
import { normalizeShelfPreferences, isShelfEnabled } from '@/lib/shelfPreferences';
import type { Preferences } from '@/lib/types';
import type { ShelfId } from '@/lib/duelShelves';
import { safeShelfDestination } from '@/lib/shelfDestination';

/**
 * Ensures the logged-in user has the specified shelf enabled.
 * Redirects to the settings page if disabled.
 */
export async function requireShelf(shelf: ShelfId) {
  const user = await getSessionUser();
  if (!user) return; // Let public/unauthenticated pages handle their own auth

  try {
    const preferences = await apiFetch<Preferences>('/v1/users/me/preferences');
    const normalized = normalizeShelfPreferences({
      order: preferences.shelf_order,
      enabled: preferences.enabled_shelves,
    });

    if (!isShelfEnabled(normalized, shelf)) {
      const requestHeaders = await headers();
      const destination = safeShelfDestination(
        requestHeaders.get('x-druthers-path') ?? undefined,
        shelf,
      );
      const params = new URLSearchParams({ shelf, next: destination });
      redirect(`/settings/shelves/enable?${params}`);
    }
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      // Ignored: page-level auth checks will handle this
    } else {
      throw err;
    }
  }
}
