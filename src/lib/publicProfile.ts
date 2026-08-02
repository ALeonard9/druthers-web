import { apiFetch, ApiError } from './api';
import type { PublicProfile } from './types';

// Public, read-only profile (#143): the owner's opted-in ranked lists and
// nothing else. Deliberately no session check — this is the shareable page.
// Shared by the hub page and its per-category/watchlist sub-pages (#93).
export async function fetchPublicProfile(
  handle: string,
): Promise<PublicProfile | null> {
  try {
    return await apiFetch<PublicProfile>(
      `/v1/public/${encodeURIComponent(handle)}`,
      { auth: false },
    );
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}
