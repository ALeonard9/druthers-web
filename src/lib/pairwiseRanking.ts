/**
 * Places one new title into an already-ranked list by asking "which would you
 * rather?" — the engine behind the comparison screen.
 *
 * This is a binary insertion. The ranked list is, by definition, already in
 * the user's preferred order, so each answer halves the range the candidate
 * can land in. That gives ceil(log2(n+1)) questions to place something in a
 * list of n — 11 questions against a 1300-title shelf, rather than 1300.
 *
 * Ported from the iOS app's `PairwiseRanking`, with one change: the session is
 * an immutable value and `answer` returns a new one, so it can live in React
 * state without a mutation escaping the render. Deliberately has no API
 * surface and no UI — it is driven by `answer` and read through `currentPair`,
 * so it can be exhaustively tested without a network or a screen.
 *
 * The API needs no new endpoint for this. The final index commits through the
 * existing `PUT /v1/users/me/{shelf}/{id}/rank`, which takes a 1-based
 * position and shifts everything below it down.
 */

/** Which of the two titles the user preferred. */
export type Answer = 'candidate' | 'opponent';

export interface PairwiseSession<T> {
  /** The titles already in preferred order, best first. */
  readonly ranked: readonly T[];
  /** The title being placed. */
  readonly candidate: T;
  /**
   * Inclusive lower bound and exclusive upper bound of where the candidate can
   * still land. They converge as answers come in.
   */
  readonly low: number;
  readonly high: number;
  readonly comparisonsMade: number;
}

export function startSession<T>(
  ranked: readonly T[],
  candidate: T,
): PairwiseSession<T> {
  return { ranked, candidate, low: 0, high: ranked.length, comparisonsMade: 0 };
}

export function isComplete<T>(s: PairwiseSession<T>): boolean {
  return s.low >= s.high;
}

/**
 * Computed as an offset from `low` rather than (low + high) / 2 to match the
 * iOS engine exactly — the two have to agree on where a title lands.
 */
function midpoint<T>(s: PairwiseSession<T>): number {
  return s.low + Math.floor((s.high - s.low) / 2);
}

/** The question to put on screen, or null once the position is known. */
export function currentPair<T>(
  s: PairwiseSession<T>,
): { candidate: T; opponent: T } | null {
  if (isComplete(s)) return null;
  return { candidate: s.candidate, opponent: s.ranked[midpoint(s)] };
}

/** Where the candidate lands. Only meaningful once complete. */
export function insertionIndex<T>(s: PairwiseSession<T>): number {
  return s.low;
}

/**
 * The insertion indices still in play, as an inclusive `[lo, hi]`. Narrows
 * with every answer, and is a single value once complete — the progress
 * readout ("narrowed to #14–#38") is this range, made 1-based.
 */
export function possibleIndices<T>(s: PairwiseSession<T>): [number, number] {
  return [s.low, s.high];
}

/**
 * Where the candidate would land if the user stopped answering now.
 *
 * The midpoint of what's left, which is the least-wrong guess available: no
 * remaining answer could move it further than half the range. Backs the "good
 * enough" escape hatch, and equals `insertionIndex` once the search has
 * converged.
 */
export function settledIndex<T>(s: PairwiseSession<T>): number {
  return midpoint(s);
}

/** The final list, or null while questions remain. */
export function result<T>(s: PairwiseSession<T>): T[] | null {
  if (!isComplete(s)) return null;
  const output = [...s.ranked];
  output.splice(s.low, 0, s.candidate);
  return output;
}

/**
 * The worst case from here, for a progress indicator. Answering can only ever
 * reduce it.
 */
export function remainingComparisons<T>(s: PairwiseSession<T>): number {
  if (isComplete(s)) return 0;
  return Math.ceil(Math.log2(s.high - s.low + 1));
}

/** Total questions this session will ask, worst case. */
export function totalComparisons<T>(s: PairwiseSession<T>): number {
  return s.comparisonsMade + remainingComparisons(s);
}

/**
 * Records an answer and narrows the range, returning the narrowed session.
 *
 * Preferring the candidate means it outranks everything from the midpoint
 * down, so the search moves to the better half; preferring the opponent moves
 * it past the midpoint.
 */
export function answer<T>(
  s: PairwiseSession<T>,
  choice: Answer,
): PairwiseSession<T> {
  if (isComplete(s)) return s;
  const mid = midpoint(s);
  return {
    ...s,
    low: choice === 'opponent' ? mid + 1 : s.low,
    high: choice === 'candidate' ? mid : s.high,
    comparisonsMade: s.comparisonsMade + 1,
  };
}

/** Worst-case questions needed to place one title into a list of `count`. */
export function comparisonsNeeded(count: number): number {
  if (count <= 0) return 0;
  return Math.ceil(Math.log2(count + 1));
}
