import { STATUS_LABELS, statusTooltip } from '@/lib/showStatus';
import type { UserTVShow, WatchStatus } from '@/lib/types';

const STYLES: Record<WatchStatus, string> = {
  not_started: 'bg-line text-neutral-400',
  behind: 'bg-plum-wash text-plum',
  up_to_date: 'bg-moss-wash text-moss',
  complete: 'bg-brass-wash text-brass',
};

// The per-show progress badge from the legacy series list. Tooltip carries
// the counts (native title — works on hover and long-press).
export function ShowStatusBadge({ show }: { show: UserTVShow }) {
  const status = show.watch_status ?? 'not_started';
  return (
    <span
      title={statusTooltip(show)}
      className={`inline-flex shrink-0 cursor-default items-center rounded px-1.5 py-0.5 text-[11px] font-medium ${STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
