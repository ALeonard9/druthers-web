const IMDB_TITLE_ID = /^tt\d{7,}$/;

export function imdbTitleUrl(imdbId: string | null): string | null {
  if (!imdbId || !IMDB_TITLE_ID.test(imdbId)) return null;
  return `https://www.imdb.com/title/${imdbId}/`;
}
