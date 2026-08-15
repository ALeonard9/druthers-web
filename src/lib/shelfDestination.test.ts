import { describe, expect, it } from 'vitest';
import { safeShelfDestination } from './shelfDestination';

describe('safeShelfDestination', () => {
  it('preserves a local deep link including its query and fragment', () => {
    expect(
      safeShelfDestination('/movies/ranking?item=42#duel', 'movies'),
    ).toBe('/movies/ranking?item=42#duel');
  });

  it.each([
    'https://attacker.example/movies',
    '//attacker.example/movies',
    '/\\attacker.example/movies',
    'javascript:alert(1)',
    '/settings/shelves/enable?shelf=movies',
  ])('replaces an unsafe or looping destination: %s', (candidate) => {
    expect(safeShelfDestination(candidate, 'movies')).toBe('/movies?view=icons');
  });
});
