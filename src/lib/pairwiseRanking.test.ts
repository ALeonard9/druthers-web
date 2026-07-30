import { describe, it, expect } from 'vitest';
import {
  answer,
  comparisonsNeeded,
  currentPair,
  insertionIndex,
  isComplete,
  possibleIndices,
  result,
  settledIndex,
  startSession,
  totalComparisons,
  type PairwiseSession,
} from './pairwiseRanking';

/**
 * The engine's contract: place a title in the right spot, lose nothing, and do
 * it in a logarithmic number of questions. Ported from the iOS suite so the
 * two implementations are held to the same standard — a title has to land in
 * the same place on both.
 *
 * The oracle is a list of even numbers, so a candidate can sit strictly
 * between any two neighbours without ties. Answering is then mechanical —
 * lower value means better rank — and the engine has to land the candidate
 * exactly where arithmetic says it belongs.
 */

/** Drives a whole session and returns it for inspection. */
function run(n: number, target: number): PairwiseSession<number> {
  const ranked = Array.from({ length: n }, (_, i) => i * 2);
  let session = startSession(ranked, target * 2 - 1);

  let iterations = 0;
  for (;;) {
    const pair = currentPair(session);
    if (!pair) break;
    iterations += 1;
    // A runaway loop should fail as a test, not hang the suite.
    if (iterations > n + 2) break;
    session = answer(
      session,
      pair.candidate < pair.opponent ? 'candidate' : 'opponent',
    );
  }
  return session;
}

const SIZES = Array.from({ length: 49 }, (_, n) => n); // 0…48

describe('pairwise ranking', () => {
  it('lands at the correct index for every size and position', () => {
    for (const n of SIZES) {
      for (let target = 0; target <= n; target++) {
        const session = run(n, target);
        expect(isComplete(session)).toBe(true);
        expect(insertionIndex(session), `n=${n} target=${target}`).toBe(target);
      }
    }
  });

  it('never loses or duplicates an entry', () => {
    for (const n of SIZES) {
      for (let target = 0; target <= n; target++) {
        const out = result(run(n, target));
        expect(out, `n=${n} target=${target} produced no result`).not.toBeNull();
        expect(out!).toHaveLength(n + 1);
        expect(new Set(out!).size, `n=${n} target=${target} duplicated`).toBe(
          n + 1,
        );
      }
    }
  });

  it('produces a genuinely ordered result, not just a plausible index', () => {
    for (const n of SIZES) {
      for (let target = 0; target <= n; target++) {
        const out = result(run(n, target))!;
        expect([...out].sort((a, b) => a - b), `n=${n} target=${target}`).toEqual(
          out,
        );
      }
    }
  });

  it('converges within ceil(log2(n+1)) comparisons', () => {
    for (const n of SIZES) {
      const bound = comparisonsNeeded(n);
      for (let target = 0; target <= n; target++) {
        const session = run(n, target);
        expect(
          session.comparisonsMade,
          `n=${n} target=${target} took ${session.comparisonsMade}, bound ${bound}`,
        ).toBeLessThanOrEqual(bound);
      }
    }
  });

  it('needs no comparisons for an empty shelf', () => {
    const session = startSession<number>([], 42);
    expect(isComplete(session)).toBe(true);
    expect(currentPair(session)).toBeNull();
    expect(result(session)).toEqual([42]);
  });

  it('asks exactly once against a one-item shelf', () => {
    let session = startSession([10], 5);
    expect(currentPair(session)).not.toBeNull();
    session = answer(session, 'candidate');
    expect(isComplete(session)).toBe(true);
    expect(result(session)).toEqual([5, 10]);
  });

  it('is inert when answered after completion', () => {
    let session = startSession([1, 2], 3);
    while (currentPair(session)) session = answer(session, 'opponent');

    const index = insertionIndex(session);
    const made = session.comparisonsMade;
    session = answer(session, 'candidate');

    expect(insertionIndex(session)).toBe(index);
    expect(session.comparisonsMade).toBe(made);
  });

  it('stays tractable on a full shelf', () => {
    // The whole reason for binary insertion: Adam's movie shelf.
    expect(comparisonsNeeded(1305)).toBe(11);
  });
});

describe('the estimate shown while judging', () => {
  it('narrows the possible range with every answer', () => {
    const ranked = Array.from({ length: 32 }, (_, i) => i * 2);
    let session = startSession(ranked, 21);

    let [lo, hi] = possibleIndices(session);
    expect([lo, hi]).toEqual([0, 32]);

    let width = hi - lo;
    while (currentPair(session)) {
      const pair = currentPair(session)!;
      session = answer(
        session,
        pair.candidate < pair.opponent ? 'candidate' : 'opponent',
      );
      [lo, hi] = possibleIndices(session);
      expect(hi - lo).toBeLessThan(width);
      width = hi - lo;
    }
    expect(lo).toBe(hi);
  });

  it('always offers a settled index inside the range still in play', () => {
    const ranked = Array.from({ length: 40 }, (_, i) => i * 2);
    let session = startSession(ranked, 55);

    while (currentPair(session)) {
      const [lo, hi] = possibleIndices(session);
      const settled = settledIndex(session);
      expect(settled).toBeGreaterThanOrEqual(lo);
      expect(settled).toBeLessThanOrEqual(hi);

      const pair = currentPair(session)!;
      session = answer(
        session,
        pair.candidate < pair.opponent ? 'candidate' : 'opponent',
      );
    }
    // Once converged, the estimate is the answer.
    expect(settledIndex(session)).toBe(insertionIndex(session));
  });

  it('never lands further than half the remaining range from the truth', () => {
    // The claim the "good enough" button rests on: stopping early is bounded.
    const ranked = Array.from({ length: 64 }, (_, i) => i * 2);
    for (let target = 0; target <= 64; target++) {
      let session = startSession(ranked, target * 2 - 1);
      while (currentPair(session)) {
        const [lo, hi] = possibleIndices(session);
        expect(Math.abs(settledIndex(session) - target)).toBeLessThanOrEqual(
          Math.ceil((hi - lo) / 2),
        );
        const pair = currentPair(session)!;
        session = answer(
          session,
          pair.candidate < pair.opponent ? 'candidate' : 'opponent',
        );
      }
    }
  });

  it('reports a total that only ever shrinks as answers come in', () => {
    const ranked = Array.from({ length: 50 }, (_, i) => i * 2);
    let session = startSession(ranked, 47);

    let total = totalComparisons(session);
    expect(total).toBe(comparisonsNeeded(50));
    while (currentPair(session)) {
      const pair = currentPair(session)!;
      session = answer(
        session,
        pair.candidate < pair.opponent ? 'candidate' : 'opponent',
      );
      expect(totalComparisons(session)).toBeLessThanOrEqual(total);
      total = totalComparisons(session);
    }
  });
});
