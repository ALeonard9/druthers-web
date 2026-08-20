/**
 * Coarse "3h ago" style labels for admin surfaces.
 *
 * The rest of the app speaks in calendar days (viewerTime.ts) because a
 * reader cares which day a show aired. The admin console cares how stale a
 * timestamp is, which wants a duration instead - "signed up 6 months ago" is
 * the useful read of a join date, not "signed up on 2026-02-11".
 */

const MINUTE = 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;
const MONTH = DAY * 30;
const YEAR = DAY * 365;

/** "just now" / "5m ago" / "3h ago" / "12d ago" / "4mo ago" / "2y ago". */
export function relativeTimeFrom(iso: string, now: Date = new Date()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return iso;
  const diffSeconds = Math.max(0, Math.round((now.getTime() - then) / 1000));

  if (diffSeconds < 60) return 'just now';
  if (diffSeconds < HOUR) return `${Math.floor(diffSeconds / MINUTE)}m ago`;
  if (diffSeconds < DAY) return `${Math.floor(diffSeconds / HOUR)}h ago`;
  if (diffSeconds < MONTH) return `${Math.floor(diffSeconds / DAY)}d ago`;
  if (diffSeconds < YEAR) return `${Math.floor(diffSeconds / MONTH)}mo ago`;
  return `${Math.floor(diffSeconds / YEAR)}y ago`;
}

/** The exact instant, for a `title` tooltip next to a relative label. */
export function exactTimestamp(iso: string): string {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return iso;
  return at.toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}
