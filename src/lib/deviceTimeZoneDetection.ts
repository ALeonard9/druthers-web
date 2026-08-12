import { deviceTimeZone } from './deviceTimeZone';

/**
 * Fill an account's never-chosen time zone from the browser after sign-in.
 *
 * The nullable value comes from the token response, rather than preferences:
 * the preferences endpoint resolves NULL to its display fallback and cannot
 * distinguish it from a zone the reader deliberately chose.
 */
export async function fillDeviceTimeZoneIfUnset(
  storedTimeZone: string | null | undefined,
): Promise<void> {
  if (storedTimeZone) return;

  try {
    await fetch('/api/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ time_zone: deviceTimeZone() }),
    });
  } catch {
    // Detection is a convenience after authentication; its failure must not
    // turn a completed sign-in into a failed one.
  }
}
