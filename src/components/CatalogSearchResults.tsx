import type { ReactNode } from 'react';
import { imdbTitleUrl } from '@/lib/imdb';
import { formatReleaseDate, isRankable, isUnreleased } from '@/lib/movies';
import type {
  BookSearchResult,
  GameSearchResult,
  MovieSearchResult,
  TVShowSearchResult,
} from '@/lib/types';

export type CatalogDomain = 'movies' | 'tv' | 'books' | 'games';
export type CatalogSearchResult =
  | MovieSearchResult
  | TVShowSearchResult
  | BookSearchResult
  | GameSearchResult;

export type CatalogResult = {
  key: string;
  title: string;
  posterUrl: string | null;
  metadata: string;
  sourceUrl: string | null;
  payload: Record<string, unknown>;
  onWatchlist: boolean;
  onRankings: boolean;
  rank: number | null;
  addable: boolean;
  rankable: boolean;
  releaseLabel: string | null;
};

export function NotRankableMessage() {
  return <span className="text-center text-xs text-neutral-500 italic">Not rankable yet</span>;
}

export function normalizeCatalogResult(
  domain: CatalogDomain,
  result: CatalogSearchResult,
  index = 0,
): CatalogResult {
  if (domain === 'movies') {
    const movie = result as MovieSearchResult;
    return {
      key: `movies-${movie.tmdb}`,
      title: movie.title,
      posterUrl: movie.poster_url,
      metadata: movie.year ?? '',
      sourceUrl: imdbTitleUrl(movie.imdb),
      payload: { tmdb: movie.tmdb, title: movie.title, poster_url: movie.poster_url },
      onWatchlist: movie.on_watchlist,
      onRankings: movie.on_rankings,
      rank: movie.rank,
      addable: true,
      rankable: isRankable(movie.release_date),
      releaseLabel: isUnreleased(movie.release_date)
        ? `Release: ${formatReleaseDate(movie.release_date)}`
        : null,
    };
  }

  if (domain === 'tv') {
    const show = result as TVShowSearchResult;
    return {
      key: `tv-${show.tvmaze ?? `${show.title}-${index}`}`,
      title: show.title,
      posterUrl: show.poster_url,
      metadata: [show.year, show.network, show.status].filter(Boolean).join(' · '),
      sourceUrl:
        imdbTitleUrl(show.imdb) ??
        (show.tvmaze ? `https://www.tvmaze.com/shows/${show.tvmaze}` : null),
      payload: {
        tvmaze: show.tvmaze,
        imdb: show.imdb,
        title: show.title,
        poster_url: show.poster_url,
      },
      onWatchlist: show.on_watchlist,
      onRankings: show.on_rankings,
      rank: show.rank,
      addable: show.tvmaze != null,
      rankable: true,
      releaseLabel: null,
    };
  }

  if (domain === 'books') {
    const book = result as BookSearchResult;
    return {
      key: `books-${book.isbn ?? `${book.title}-${index}`}`,
      title: book.title,
      posterUrl: book.poster_url,
      metadata: [book.authors, book.year].filter(Boolean).join(' · '),
      sourceUrl: book.isbn ? `https://openlibrary.org/isbn/${book.isbn}` : null,
      payload: { isbn: book.isbn, title: book.title, poster_url: book.poster_url },
      onWatchlist: book.on_watchlist,
      onRankings: book.on_rankings,
      rank: book.rank,
      addable: Boolean(book.isbn),
      rankable: true,
      releaseLabel: null,
    };
  }

  const game = result as GameSearchResult;
  return {
    key: `games-${game.igdb ?? `${game.title}-${index}`}`,
    title: game.title,
    posterUrl: game.poster_url,
    metadata: [game.year, game.platforms].filter(Boolean).join(' · '),
    sourceUrl: game.slug ? `https://www.igdb.com/games/${game.slug}` : null,
    payload: { igdb: game.igdb, title: game.title, poster_url: game.poster_url },
    onWatchlist: game.on_watchlist,
    onRankings: game.on_rankings,
    rank: game.rank,
    addable: game.igdb != null,
    rankable: true,
    releaseLabel: null,
  };
}

function ResultTitle({ result }: { result: CatalogResult }) {
  if (!result.sourceUrl) return <>{result.title}</>;
  return (
    <a
      href={result.sourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      title="Open on the source site"
      className="hover:text-brass-bright hover:underline"
    >
      {result.title}
    </a>
  );
}

export function CatalogSearchResults({
  domain,
  results,
  limit,
  actionFor,
}: {
  domain: CatalogDomain;
  results: CatalogSearchResult[];
  limit?: number;
  actionFor: (result: CatalogResult, source: CatalogSearchResult) => ReactNode;
}) {
  const visibleResults = limit == null ? results : results.slice(0, limit);

  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
      {visibleResults.map((source, index) => {
        const result = normalizeCatalogResult(domain, source, index);
        return (
          <li
            key={result.key}
            className="flex flex-col overflow-hidden rounded-lg border border-line bg-panel"
          >
            <div className="aspect-[2/3] bg-line">
              {result.posterUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={result.posterUrl}
                  alt={result.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center p-2 text-center text-xs text-neutral-500">
                  {result.title}
                </div>
              )}
            </div>
            <div className="flex flex-1 flex-col gap-2 p-3">
              <p className="line-clamp-2 text-sm font-medium">
                <ResultTitle result={result} />
              </p>
              {result.metadata && (
                <p className="line-clamp-1 text-xs text-neutral-500">{result.metadata}</p>
              )}
              {result.releaseLabel && (
                <span className="inline-block rounded border border-sky-800/50 bg-sky-950/60 px-2 py-0.5 font-mono text-[10px] text-sky-400">
                  {result.releaseLabel}
                </span>
              )}
              <div className="mt-auto flex flex-row gap-1 md:flex-col">{actionFor(result, source)}</div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
