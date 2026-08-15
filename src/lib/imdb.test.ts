import { describe, expect, it } from 'vitest';
import { imdbTitleUrl } from './imdb';

describe('imdbTitleUrl', () => {
  it.each(['tt0111161', 'tt12345678'])(
    'builds the canonical title URL for %s',
    (imdbId) => {
      expect(imdbTitleUrl(imdbId)).toBe(
        `https://www.imdb.com/title/${imdbId}/`,
      );
    },
  );

  it.each([null, '', '   ', 'nm0000158', 'tt123', 'tt0111161/episodes'])(
    'rejects a missing or malformed title ID (%s)',
    (imdbId) => {
      expect(imdbTitleUrl(imdbId)).toBeNull();
    },
  );
});
