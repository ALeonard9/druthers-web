import { getWatchlistLabels, type MediaDomain } from '@/lib/domainLabels';

export function TrackedBadge({
  onRankings,
  rank,
  domain,
}: {
  onRankings: boolean;
  rank: number | null;
  domain?: MediaDomain | string;
}) {
  if (onRankings) {
    return (
      <span className="shrink-0 rounded bg-brass-wash px-2 py-1 text-center text-xs font-medium text-brass">
        {rank != null ? `✓ Ranked #${rank}` : '✓ Ranked'}
      </span>
    );
  }
  const watchlistBadge = domain ? getWatchlistLabels(domain).on_badge : 'On Watchlist';
  return (
    <span className="shrink-0 rounded bg-moss-wash px-2 py-1 text-center text-xs font-medium text-moss">
      ✓ {watchlistBadge}
    </span>
  );
}
