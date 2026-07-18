import type { ScheduleEpisodeItem } from './types';

/**
 * Group "what to watch" episodes by their airdate (calendar day, in whatever
 * timezone the browser renders in), preserving the server's sort order
 * within each day.
 */
export function groupByDay(
  items: ScheduleEpisodeItem[],
): { day: string; items: ScheduleEpisodeItem[] }[] {
  const groups: { day: string; items: ScheduleEpisodeItem[] }[] = [];
  const byDay = new Map<string, ScheduleEpisodeItem[]>();
  for (const item of items) {
    const day = item.airdate?.slice(0, 10) ?? 'unknown';
    if (!byDay.has(day)) {
      byDay.set(day, []);
      groups.push({ day, items: byDay.get(day)! });
    }
    byDay.get(day)!.push(item);
  }
  return groups;
}

/**
 * Group the catch-up backlog by show, preserving the server's sort order
 * (show title, then season/episode) within each show.
 */
export function groupByShow(
  items: ScheduleEpisodeItem[],
): { showId: string; showTitle: string; items: ScheduleEpisodeItem[] }[] {
  const groups: { showId: string; showTitle: string; items: ScheduleEpisodeItem[] }[] =
    [];
  const byShow = new Map<string, ScheduleEpisodeItem[]>();
  for (const item of items) {
    if (!byShow.has(item.show_id)) {
      byShow.set(item.show_id, []);
      groups.push({
        showId: item.show_id,
        showTitle: item.show_title,
        items: byShow.get(item.show_id)!,
      });
    }
    byShow.get(item.show_id)!.push(item);
  }
  return groups;
}
