import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/session';
import { apiFetch, ApiError } from '@/lib/api';
import { normalizeShelfPreferences, isShelfEnabled } from '@/lib/shelfPreferences';
import type { Preferences } from '@/lib/types';
import type { ShelfId } from '@/lib/duelShelves';

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
      redirect('/settings#shelves');
    }
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      // Ignored: page-level auth checks will handle this
    } else {
      throw err;
    }
  }
}
