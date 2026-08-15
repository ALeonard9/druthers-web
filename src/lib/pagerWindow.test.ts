import { describe, it, expect } from 'vitest';
import { pagerWindow } from './pagerWindow';

describe('pagerWindow', () => {
  it('windows the first page of an unfiltered list', () => {
    expect(pagerWindow(1, 25, 229)).toEqual({
      start: 1,
      end: 25,
      length: 25,
      hasPrev: false,
      hasNext: true,
    });
  });

  it('windows a filtered list that fits in a single page (api#225 / web#80 repro)', () => {
    // Filtering to a narrow year range left 12 matches whose real ranks were
    // scattered (e.g. 35-186). Windowing by rank produced "Showing #35-#186
    // of 12" - the fix is to window by position, so the summary always
    // reads coherently regardless of how sparse the underlying ranks are.
    expect(pagerWindow(1, 25, 12)).toEqual({
      start: 1,
      end: 12,
      length: 12,
      hasPrev: false,
      hasNext: false,
    });
  });

  it('windows a later page', () => {
    expect(pagerWindow(26, 25, 60)).toEqual({
      start: 26,
      end: 50,
      length: 25,
      hasPrev: true,
      hasNext: true,
    });
  });

  it('windows a final partial page', () => {
    expect(pagerWindow(51, 25, 60)).toEqual({
      start: 51,
      end: 60,
      length: 10,
      hasPrev: true,
      hasNext: false,
    });
  });

  it('clamps an out-of-range start down to the last valid position', () => {
    // Board components additionally reset `start` to 1 on a `placedCount`
    // change (e.g. a filter was just applied) for better UX - this is the
    // pure function's fallback safety net, not that reset.
    expect(pagerWindow(51, 25, 12)).toEqual({
      start: 12,
      end: 12,
      length: 1,
      hasPrev: true,
      hasNext: false,
    });
  });

  it('never goes below position 1', () => {
    expect(pagerWindow(0, 25, 12).start).toBe(1);
    expect(pagerWindow(-5, 25, 12).start).toBe(1);
  });

  it('degrades gracefully for an empty list', () => {
    expect(pagerWindow(1, 25, 0)).toEqual({
      start: 1,
      end: 0,
      length: 0,
      hasPrev: false,
      hasNext: false,
    });
  });
});
