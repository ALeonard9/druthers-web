import type { UserTVShow, WatchStatus } from './types';

export const STATUS_LABELS: Record<WatchStatus, string> = {
  not_started: 'Not started',
  behind: 'Behind',
  up_to_date: 'Up to date',
  complete: 'Complete',
};

/** Tooltip text: the label plus the progress that earned it. */
export function statusTooltip(show: UserTVShow): string {
  const status = show.watch_status ?? 'not_started';
  const aired = show.aired_count ?? 0;
  const watched = show.watched_count ?? 0;
  switch (status) {
    case 'complete':
      return `Complete — all ${aired} episodes watched`;
    case 'up_to_date':
      return `Up to date — all ${aired} aired episodes watched`;
    case 'behind':
      return `Behind — ${watched} of ${aired} aired episodes watched`;
    default:
      return aired === 0
        ? 'Not started — no episodes aired yet'
        : `Not started — ${aired} episodes waiting`;
  }
}
