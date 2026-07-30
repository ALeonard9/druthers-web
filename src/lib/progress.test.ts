import { describe, it, expect } from 'vitest';
import { progressMessage } from './progress';

describe('progressMessage', () => {
  it('returns null at zero (the page empty state owns that copy)', () => {
    expect(progressMessage(0, 'movie')).toBeNull();
  });

  it('returns null once the Top 5 threshold is reached', () => {
    expect(progressMessage(5, 'movie')).toBeNull();
    expect(progressMessage(12, 'movie')).toBeNull();
  });

  it('pluralizes the remaining count correctly', () => {
    expect(progressMessage(4, 'movie')).toContain('1 more movie ');
    expect(progressMessage(4, 'movie')).not.toContain('1 more movies');
    expect(progressMessage(1, 'game')).toContain('4 more games');
  });

  it('mentions the current ranked count', () => {
    expect(progressMessage(3, 'book')).toContain('3 ranked so far');
  });
});
