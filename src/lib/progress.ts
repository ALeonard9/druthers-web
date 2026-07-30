/** Full Top 5 share card needs this many ranked items. */
const SHARE_THRESHOLD = 5;

/**
 * Encouraging micro-copy for a shelf page (movies/TV/books/games) with
 * `rankedCount` ranked items, where `label` is what to call one item
 * ("movie", "show", "book", "game"). Nudges toward a concrete, real payoff —
 * a full, shareable Top 5 — rather than generic cheerleading.
 *
 * Returns null once there's nothing useful left to say: 0 is handled by the
 * page's own empty state (it already has a real CTA), and once the list
 * reaches SHARE_THRESHOLD there's no next milestone to point at here.
 */
export function progressMessage(rankedCount: number, label: string): string | null {
  if (rankedCount <= 0 || rankedCount >= SHARE_THRESHOLD) return null;
  const remaining = SHARE_THRESHOLD - rankedCount;
  const plural = remaining === 1 ? label : `${label}s`;
  return `${rankedCount} ranked so far — ${remaining} more ${plural} and you've got a shareable Top 5.`;
}
