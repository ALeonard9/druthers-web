import { apiFetch, ApiError } from './api';
import type { PublicProfile } from './types';

// Public, read-only profile (#143, viewer-aware since #277): the shelves
// this caller may see, plus their relationship to the owner. Auth is
// attached when a session cookie exists (an anonymous visitor simply sends
// none) - the endpoint itself makes authentication optional, so the same
// call serves a signed-out visitor, a stranger, a friend, and the owner.
// Shared by the profile clone and its per-category/watchlist sub-pages (#93).
export async function fetchPublicProfile(
  handle: string,
): Promise<PublicProfile | null> {
  try {
    return await apiFetch<PublicProfile>(
      `/v1/public/${encodeURIComponent(handle)}`,
    );
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}
