/**
 * Reading the clock in the viewer's own time zone.
 *
 * Every one of these used to run in whatever zone the *server* happened to
 * be in - `new Date().getHours()` inside a server component is the container's
 * hour, not the reader's, so a user in Sydney was greeted "Good evening" over
 * their breakfast. The zone comes from the API preference (`time_zone`, unset
 * rows falling back to the deployment's `TIME_ZONE`), so it follows the account
 * across devices instead of guessing from the browser.
 */

/** The zone used when the preference cannot be read. */
export const FALLBACK_TIME_ZONE = 'UTC';

function isValidZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
}

/**
 * The hour (0–23) that `at` reads as in `timeZone`.
 *
 * An unusable zone name falls back rather than throwing: this sits on the
 * render path of every page, and a zone the browser's ICU build has never
 * heard of must not take the header down with it.
 */
export function hourIn(at: Date, timeZone: string): number {
  const zone = isValidZone(timeZone) ? timeZone : FALLBACK_TIME_ZONE;
  const hour = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    hourCycle: 'h23',
    timeZone: zone,
  }).format(at);
  return Number(hour);
}

/** The calendar date in `timeZone`, as the `YYYY-MM-DD` the API speaks. */
export function dayIn(at: Date, timeZone: string): string {
  const zone = isValidZone(timeZone) ? timeZone : FALLBACK_TIME_ZONE;
  // 'en-CA' is the shortest route to ISO order out of Intl.
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: zone,
  }).format(at);
}

/**
 * The header greeting for the hour it is where the reader is.
 *
 * Boundaries match the copy: "Up late" is the small hours, and the day turns
 * over to morning at 05:00 rather than midnight.
 */
export function greetingAt(at: Date, timeZone: string): string {
  const hour = hourIn(at, timeZone);
  if (hour < 5) return 'Up late';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * "Today"/"Tomorrow"/"Yesterday" for an API calendar date, or null.
 *
 * `day` is a bare `YYYY-MM-DD` with no time and no zone - comparing it as a
 * timestamp is what produces off-by-one day labels - so this compares it as a
 * string against the viewer's own calendar date.
 */
export function relativeDayLabel(
  day: string,
  at: Date,
  timeZone: string,
): string | null {
  const today = dayIn(at, timeZone);
  if (day === today) return 'Today';
  // Step the calendar date itself rather than adding 24h to the instant:
  // a DST day is 23 or 25 hours long, and "+86400000ms" lands on the wrong
  // date on exactly the days a reader is most likely to notice.
  const [year, month, date] = today.split('-').map(Number);
  const shift = (days: number) =>
    new Date(Date.UTC(year, month - 1, date + days)).toISOString().slice(0, 10);
  if (day === shift(1)) return 'Tomorrow';
  if (day === shift(-1)) return 'Yesterday';
  return null;
}
