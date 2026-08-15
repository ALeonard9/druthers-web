/**
 * Windowing math for the rankings pager, shared by every *RankingsBoard
 * component (movies/tv/books/games).
 *
 * `start` is a 1-based position within whatever list is currently rendered
 * (filtered or not) - never an item's real rank. Real ranks go sparse once a
 * filter is applied (or a legacy row carries a 0-based rank), which made
 * "Showing #X–#Y of Z" windowed-by-rank read as inconsistent with the total
 * even though every individual number was correct (api#225 / web#80).
 * Position is always contiguous 1..total, so callers never special-case
 * out-of-contract ranks or empty windows.
 */
export interface PagerWindow {
  /** 1-based position of the first visible item. */
  start: number;
  /** 1-based position of the last visible item. */
  end: number;
  /** Number of items in this window (0 when `total` is 0). */
  length: number;
  hasPrev: boolean;
  hasNext: boolean;
}

export function pagerWindow(
  start: number,
  windowSize: number,
  total: number,
): PagerWindow {
  const clampedStart = Math.min(Math.max(1, start), Math.max(1, total));
  const length = Math.max(0, Math.min(windowSize, total - clampedStart + 1));
  return {
    start: clampedStart,
    end: clampedStart + length - 1,
    length,
    hasPrev: clampedStart > 1,
    hasNext: clampedStart + length - 1 < total,
  };
}
