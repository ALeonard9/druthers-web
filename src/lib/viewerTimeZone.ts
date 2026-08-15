import { apiFetch } from './api';
import { FALLBACK_TIME_ZONE } from './viewerTime';
import type { Preferences } from './types';

/**
 * The signed-in reader's time zone, for server components.
 *
 * Kept apart from ./viewerTime so the clock arithmetic stays pure and
 * testable; this half is the I/O. Any failure - signed out, API down, an
 * older API with no `time_zone` in its payload - falls back rather than
 * throwing, because the caller is usually the site header and a missing
 * preference is not worth a 500.
 */
export async function getViewerTimeZone(): Promise<string> {
  try {
    const prefs = await apiFetch<Preferences>('/v1/users/me/preferences');
    return prefs.time_zone || FALLBACK_TIME_ZONE;
  } catch {
    return FALLBACK_TIME_ZONE;
  }
}
