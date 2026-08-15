import { redirect } from 'next/navigation';
import Link from 'next/link';
import { apiFetch, ApiError } from '@/lib/api';
import { getSessionUser } from '@/lib/session';
import { bestScore, rankResults } from '@/lib/similarity';
import { includesCatalogScope, includesPeopleScope, searchScope } from '@/lib/searchScope';
import { normalizeShelfPreferences, orderedEnabledShelves } from '@/lib/shelfPreferences';
import type {
  BookSearchResult,
  GameSearchResult,
  GlobalSearch,
  MovieSearchResult,
  Preferences,
  TVShowSearchResult,
  UserSearchResponse,
} from '@/lib/types';
import { AddFromSearchButton } from '@/components/AddFromSearchButton';
import { MultiAddMode } from '@/components/MultiAddMode';
import { SearchForm } from '@/components/SearchForm';
import {
  CatalogSearchResults,
  type CatalogDomain,
  type CatalogSearchResult,
} from '@/components/CatalogSearchResults';

export const dynamic = 'force-dynamic';

const CATALOG_ENDPOINTS = {
  movies: '/v1/movies/search',
  tv: '/v1/tv-shows/search',
  games: '/v1/games/search',
  books: '/v1/books/search',
} as const;

async function searchActiveCatalogDomains(query: string, scope: ReturnType<typeof searchScope>) {
  const preferences = await apiFetch<Preferences>('/v1/users/me/preferences');
  const activeDomains = orderedEnabledShelves(
    normalizeShelfPreferences({
      order: preferences.shelf_order,
      enabled: preferences.enabled_shelves,
    }),
  ).filter((domain) => scope === 'all' || scope === domain);
  const searchUrl = (domain: keyof typeof CATALOG_ENDPOINTS) =>
    `${CATALOG_ENDPOINTS[domain]}?q=${encodeURIComponent(query)}`;

  const [movies, tvShows, games, books] = await Promise.all([
    activeDomains.includes('movies')
      ? apiFetch<MovieSearchResult[]>(searchUrl('movies'))
      : Promise.resolve([]),
    activeDomains.includes('tv')
      ? apiFetch<TVShowSearchResult[]>(searchUrl('tv'))
      : Promise.resolve([]),
    activeDomains.includes('games')
      ? apiFetch<GameSearchResult[]>(searchUrl('games'))
      : Promise.resolve([]),
    activeDomains.includes('books')
      ? apiFetch<BookSearchResult[]>(searchUrl('books'))
      : Promise.resolve([]),
  ]);

  return {
    query,
    corrected: null,
    movies,
    tv_shows: tvShows,
    games,
    books,
  } satisfies GlobalSearch;
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  if (count === 0) return null;
  return (
    <section className="rounded-lg border border-line bg-panel">
      <h2 className="border-b border-line px-4 py-2 font-display text-lg text-paper">
        {title} <span className="text-sm text-neutral-500">{count}</span>
      </h2>
      <div className="p-4">{children}</div>
    </section>
  );
}

const ROW = 'flex items-center gap-3 px-4 py-2 text-sm';

function CatalogSectionResults({
  domain,
  results,
}: {
  domain: CatalogDomain;
  results: CatalogSearchResult[];
}) {
  return (
    <CatalogSearchResults
      domain={domain}
      results={results}
      actionFor={(result) => (
        <AddFromSearchButton
          domain={domain}
          payload={result.payload}
          onWatchlist={result.onWatchlist}
          onRankings={result.onRankings}
          rank={result.rank}
          addable={result.addable}
          rankable={result.rankable}
        />
      )}
    />
  );
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  const { q, scope: requestedScope } = await searchParams;
  const scope = searchScope(requestedScope);

  let results: GlobalSearch | null = null;
  let peopleResults: UserSearchResponse | null = null;
  if (q?.trim()) {
    try {
      [results, peopleResults] = await Promise.all([
        includesCatalogScope(scope)
          ? searchActiveCatalogDomains(q, scope)
          : Promise.resolve(null),
        includesPeopleScope(scope)
          ? apiFetch<UserSearchResponse>(`/v1/search/users?q=${encodeURIComponent(q)}`)
          : Promise.resolve(null),
      ]);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) redirect('/login');
      throw err;
    }
  }

  // Close matches first, within each domain and across sections — an exact
  // title match puts its whole section at the top.
  const ranked = results
    ? {
        movies: scope === 'all' || scope === 'movies' ? rankResults(results.query, results.movies) : [],
        tv_shows: scope === 'all' || scope === 'tv' ? rankResults(results.query, results.tv_shows) : [],
        games: scope === 'all' || scope === 'games' ? rankResults(results.query, results.games) : [],
        books: scope === 'all' || scope === 'books' ? rankResults(results.query, results.books) : [],
      }
    : null;
  const total = ranked
    ? ranked.movies.length + ranked.tv_shows.length + ranked.games.length + ranked.books.length
    : 0;
  const effectiveQuery = results?.corrected ?? results?.query ?? '';
  const people = peopleResults?.users ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-medium tracking-tight text-paper">
          Search
        </h1>
        <p className="text-sm text-neutral-400">
          Movies, TV, books, games, and people in one go.
        </p>
      </div>

      <SearchForm query={q ?? ''} scope={scope} />

      {results?.corrected && (
        <p className="text-sm text-neutral-400">
          Showing results for{' '}
          <span className="text-brass">{results.corrected}</span> (searched
          for “{results.query}”).
        </p>
      )}

      {results && total === 0 && (
        <p className="text-sm text-neutral-500">
          Nothing found for “{results.query}” in {scope === 'all' ? 'the catalog' : scope} — check the
          spelling or try fewer words.
        </p>
      )}

      {peopleResults && (
        <section className="rounded-lg border border-line bg-panel">
          <h2 className="border-b border-line px-4 py-2 font-display text-lg text-paper">
            People <span className="text-sm text-neutral-500">{people.length}</span>
          </h2>
          {people.length === 0 ? (
            <p className="px-4 py-3 text-sm text-neutral-500">No people found.</p>
          ) : (
            <ul className="divide-y divide-line/60">
              {people.map((person) => (
                <li key={person.id} className={ROW}>
                  {person.handle ? (
                    <Link href={`/u/${person.handle}`} className="font-medium hover:text-brass">
                      {person.display_name || `@${person.handle}`}
                    </Link>
                  ) : (
                    <span className="font-medium">{person.display_name}</span>
                  )}
                  {person.handle && <span className="text-neutral-500">@{person.handle}</span>}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {ranked && (
        <MultiAddMode>
          {[
            {
              name: 'Movies',
              score: bestScore(effectiveQuery, ranked.movies),
              count: ranked.movies.length,
              node: (
                <Section title="Movies" count={ranked.movies.length}>
                  <CatalogSectionResults domain="movies" results={ranked.movies} />
                </Section>
              ),
            },
            {
              name: 'TV Shows',
              score: bestScore(effectiveQuery, ranked.tv_shows),
              count: ranked.tv_shows.length,
              node: (
                <Section title="TV Shows" count={ranked.tv_shows.length}>
                  <CatalogSectionResults domain="tv" results={ranked.tv_shows} />
                </Section>
              ),
            },
            {
              name: 'Games',
              score: bestScore(effectiveQuery, ranked.games),
              count: ranked.games.length,
              node: (
                <Section title="Games" count={ranked.games.length}>
                  <CatalogSectionResults domain="games" results={ranked.games} />
                </Section>
              ),
            },
            {
              name: 'Books',
              score: bestScore(effectiveQuery, ranked.books),
              count: ranked.books.length,
              node: (
                <Section title="Books" count={ranked.books.length}>
                  <CatalogSectionResults domain="books" results={ranked.books} />
                </Section>
              ),
            },
          ]
            // Ties (exact match in two domains) go to the deeper section.
            .sort((a, b) => b.score - a.score || b.count - a.count)
            .map((s) => (
              <div key={s.name}>{s.node}</div>
            ))}
        </MultiAddMode>
      )}
    </div>
  );
}
