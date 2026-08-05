import { describe, expect, it } from 'vitest';
import { duelShareFilename } from './duelShareCardRender';

describe('duel share cards (web#125)', () => {
  it('names open matchups and verdicts distinctly', () => {
    expect(duelShareFilename('wide', false)).toBe('druthers-duel-matchup-wide.png');
    expect(duelShareFilename('story', true)).toBe('druthers-duel-verdict-story.png');
  });
});
