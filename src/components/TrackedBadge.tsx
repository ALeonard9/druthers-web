// Badge shown on a search result the user already tracks (web#31), instead
// of the "add" action. Ranked takes precedence over watchlist-only, matching
// the one-home rule (a tracked item is on exactly one of the two lists).
export function TrackedBadge({
  onRankings,
  rank,
}: {
  onRankings: boolean;
  rank: number | null;
}) {
  if (onRankings) {
    return (
      <span className="shrink-0 rounded bg-brass-wash px-2 py-1 text-center text-xs font-medium text-brass">
        {rank != null ? `✓ Ranked #${rank}` : '✓ Ranked'}
      </span>
    );
  }
  return (
    <span className="shrink-0 rounded bg-moss-wash px-2 py-1 text-center text-xs font-medium text-moss">
      ✓ On Watchlist
    </span>
  );
}
