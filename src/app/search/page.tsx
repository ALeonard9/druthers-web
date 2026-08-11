import { redirect } from 'next/navigation';
import Link from 'next/link';
import { apiFetch, ApiError } from '@/lib/api';
import { getSessionUser } from '@/lib/session';
import { bestScore, rankResults } from '@/lib/similarity';
import { includesCatalogScope, includesPeopleScope, searchScope } from '@/lib/searchScope';
import type { GlobalSearch, UserSearchResponse } from '@/lib/types';
import { AddFromSearchButton } from '@/components/AddFromSearchButton';
import { MultiAddMode } from '@/components/MultiAddMode';
import { SearchForm } from '@/components/SearchForm';

export const dynamic = 'force-dynamic';

function Thumb({ url, title }: { url: string | null; title: string }) {
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={title} className="h-14 w-10 shrink-0 rounded object-cover" />
  ) : (
    <div className="h-14 w-10 shrink-0 rounded bg-line" />
  );
}

function SourceLink({
  href,
  children,
}: {
  href: string | null;
  children: React.ReactNode;
}) {
  if (!href) return <>{children}</>;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title="Open on the source site"
      className="hover:text-brass-bright hover:underline"
    >
      {children}
    </a>
  );
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
      <ul className="divide-y divide-line/60">{children}</ul>
    </section>
  );
}

const ROW = 'flex items-center gap-3 px-4 py-2 text-sm';

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
          ? apiFetch<GlobalSearch>(`/v1/search?q=${encodeURIComponent(q)}`)
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
                  {ranked.movies.map((m, i) => (
                    <li key={`${m.imdb}-${i}`} className={ROW}>
                      <Thumb url={m.poster_url} title={m.title} />
                      <span className="flex-1 truncate">
                        <SourceLink
                          href={`https://www.imdb.com/title/${m.imdb}/`}
                        >
                          {m.title}
                        </SourceLink>
                        {m.year && (
                          <span className="text-neutral-500"> ({m.year})</span>
                        )}
                      </span>
                      <AddFromSearchButton
                        domain="movies"
                        payload={{
                          tmdb: m.tmdb,
                          title: m.title,
                          poster_url: m.poster_url,
                        }}
                        onWatchlist={m.on_watchlist}
                        onRankings={m.on_rankings}
                        rank={m.rank}
                      />
                    </li>
                  ))}
                </Section>
              ),
            },
            {
              name: 'TV Shows',
              score: bestScore(effectiveQuery, ranked.tv_shows),
              count: ranked.tv_shows.length,
              node: (
                <Section title="TV Shows" count={ranked.tv_shows.length}>
                  {ranked.tv_shows.map((s, i) => (
                    <li key={`${s.tvmaze}-${i}`} className={ROW}>
                      <Thumb url={s.poster_url} title={s.title} />
                      <span className="flex-1 truncate">
                        <SourceLink
                          href={
                            s.imdb
                              ? `https://www.imdb.com/title/${s.imdb}/`
                              : s.tvmaze
                                ? `https://www.tvmaze.com/shows/${s.tvmaze}`
                                : null
                          }
                        >
                          {s.title}
                        </SourceLink>
                        {s.year && (
                          <span className="text-neutral-500"> ({s.year})</span>
                        )}
                        {s.network && (
                          <span className="text-neutral-500"> · {s.network}</span>
                        )}
                      </span>
                      <AddFromSearchButton
                        domain="tv"
                        payload={{
                          tvmaze: s.tvmaze,
                          imdb: s.imdb,
                          title: s.title,
                          poster_url: s.poster_url,
                        }}
                        onWatchlist={s.on_watchlist}
                        onRankings={s.on_rankings}
                        rank={s.rank}
                      />
                    </li>
                  ))}
                </Section>
              ),
            },
            {
              name: 'Games',
              score: bestScore(effectiveQuery, ranked.games),
              count: ranked.games.length,
              node: (
                <Section title="Games" count={ranked.games.length}>
                  {ranked.games.map((g, i) => (
                    <li key={`${g.igdb}-${i}`} className={ROW}>
                      <Thumb url={g.poster_url} title={g.title} />
                      <span className="flex-1 truncate">
                        <SourceLink
                          href={
                            g.slug
                              ? `https://www.igdb.com/games/${g.slug}`
                              : null
                          }
                        >
                          {g.title}
                        </SourceLink>
                        {g.year && (
                          <span className="text-neutral-500"> ({g.year})</span>
                        )}
                      </span>
                      <AddFromSearchButton
                        domain="games"
                        payload={{
                          igdb: g.igdb,
                          title: g.title,
                          poster_url: g.poster_url,
                        }}
                        onWatchlist={g.on_watchlist}
                        onRankings={g.on_rankings}
                        rank={g.rank}
                      />
                    </li>
                  ))}
                </Section>
              ),
            },
            {
              name: 'Books',
              score: bestScore(effectiveQuery, ranked.books),
              count: ranked.books.length,
              node: (
                <Section title="Books" count={ranked.books.length}>
                  {ranked.books.map((b, i) => (
                    <li key={`${b.isbn}-${i}`} className={ROW}>
                      <Thumb url={b.poster_url} title={b.title} />
                      <span className="flex-1 truncate">
                        <SourceLink
                          href={
                            b.isbn
                              ? `https://openlibrary.org/isbn/${b.isbn}`
                              : null
                          }
                        >
                          {b.title}
                        </SourceLink>
                        {b.authors && (
                          <span className="text-neutral-500"> · {b.authors}</span>
                        )}
                      </span>
                      <AddFromSearchButton
                        domain="books"
                        payload={{
                          isbn: b.isbn,
                          title: b.title,
                          poster_url: b.poster_url,
                        }}
                        onWatchlist={b.on_watchlist}
                        onRankings={b.on_rankings}
                        rank={b.rank}
                      />
                    </li>
                  ))}
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
