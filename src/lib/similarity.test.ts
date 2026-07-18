import { describe, it, expect } from 'vitest';
import { similarity, rankResults, bestScore } from './similarity';

describe('similarity', () => {
  it('scores exact matches highest', () => {
    expect(similarity('a storm of swords', 'A Storm of Swords')).toBe(1);
  });

  it('scores partial matches lower than exact', () => {
    const exact = similarity('a storm of swords', 'A Storm of Swords');
    const partial = similarity('a storm of swords', 'A Storm of Swords: Comic Book');
    const loose = similarity('a storm of swords', 'Sword Storm Adventures');
    expect(exact).toBeGreaterThan(partial);
    expect(partial).toBeGreaterThan(loose);
  });

  it('boosts prefix matches', () => {
    expect(similarity('dune', 'Dune Messiah')).toBeGreaterThan(
      similarity('dune', 'Children of the Sand Dune Empire'),
    );
  });

  it('ignores punctuation and case', () => {
    expect(similarity('spider man', 'Spider-Man!')).toBe(1);
  });
});

describe('rankResults', () => {
  it('puts the exact title first', () => {
    const ranked = rankResults('a storm of swords', [
      { title: 'A Storm of Swords: The Graphic Novel' },
      { title: 'Swords and Storms' },
      { title: 'A Storm of Swords' },
    ]);
    expect(ranked[0].title).toBe('A Storm of Swords');
  });

  it('is stable for ties', () => {
    const ranked = rankResults('x', [{ title: 'Alpha' }, { title: 'Beta' }]);
    expect(ranked.map((r) => r.title)).toEqual(['Alpha', 'Beta']);
  });
});

describe('bestScore', () => {
  it('returns the max similarity of the list', () => {
    expect(
      bestScore('a storm of swords', [
        { title: 'Something Else' },
        { title: 'A Storm of Swords' },
      ]),
    ).toBe(1);
    expect(bestScore('anything', [])).toBe(0);
  });
});
