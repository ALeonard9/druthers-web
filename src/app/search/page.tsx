import { redirect } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { getSessionUser } from '@/lib/session';
import { bestScore, rankResults } from '@/lib/similarity';
import type { GlobalSearch } from '@/lib/types';
import { AddFromSearchButton } from '@/components/AddFromSearchButton';

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
  const { q } = await searchParams;

  let results: GlobalSearch | null = null;
  if (q?.trim()) {
    try {
      results = await apiFetch<GlobalSearch>(
        `/v1/search?q=${encodeURIComponent(q)}`,
      );
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) redirect('/login');
      throw err;
    }
  }

  const total = results
    ? results.movies.length +
      results.tv_shows.length +
      results.games.length +
      results.books.length
    : 0;

  // Close matches first, within each domain and across sections — an exact
  // title match puts its whole section at the top.
  const ranked = results
    ? {
        movies: rankResults(results.query, results.movies),
        tv_shows: rankResults(results.query, results.tv_shows),
        games: rankResults(results.query, results.games),
        books: rankResults(results.query, results.books),
      }
    : null;
  const effectiveQuery = results?.corrected ?? results?.query ?? '';

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-medium tracking-tight text-paper">
          Search
        </h1>
        <p className="text-sm text-neutral-400">
          Movies, TV, books, and games in one go.
        </p>
      </div>

      <form action="/search" className="flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ''}
          placeholder="Search everything…"
          autoFocus
          className="w-full max-w-xl rounded border border-neutral-700 bg-panel px-3 py-2 text-sm outline-none focus:border-brass"
        />
        <button
          type="submit"
          className="rounded bg-brass px-4 py-2 text-sm font-medium text-ink hover:bg-brass-bright"
        >
          Search
        </button>
      </form>

      {results?.corrected && (
        <p className="text-sm text-neutral-400">
          Showing results for{' '}
          <span className="text-brass">{results.corrected}</span> (searched
          for “{results.query}”).
        </p>
      )}

      {results && total === 0 && (
        <p className="text-sm text-neutral-500">
          Nothing found for “{results.query}” in any category — check the
          spelling or try fewer words.
        </p>
      )}

      {ranked && (
        <div className="flex flex-col gap-4">
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
                          imdb: m.imdb,
                          title: m.title,
                          poster_url: m.poster_url,
                        }}
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
        </div>
      )}
    </div>
  );
}
