import { redirect } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { getSessionUser } from '@/lib/session';
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

      {results && (
        <div className="flex flex-col gap-4">
          <Section title="Movies" count={results.movies.length}>
            {results.movies.map((m) => (
              <li key={m.imdb} className={ROW}>
                <Thumb url={m.poster_url} title={m.title} />
                <span className="flex-1 truncate">
                  {m.title}
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

          <Section title="TV Shows" count={results.tv_shows.length}>
            {results.tv_shows.map((s) => (
              <li key={`${s.tvmaze}-${s.title}`} className={ROW}>
                <Thumb url={s.poster_url} title={s.title} />
                <span className="flex-1 truncate">
                  {s.title}
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

          <Section title="Games" count={results.games.length}>
            {results.games.map((g) => (
              <li key={`${g.igdb}-${g.title}`} className={ROW}>
                <Thumb url={g.poster_url} title={g.title} />
                <span className="flex-1 truncate">
                  {g.title}
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

          <Section title="Books" count={results.books.length}>
            {results.books.map((b) => (
              <li key={`${b.isbn}-${b.title}`} className={ROW}>
                <Thumb url={b.poster_url} title={b.title} />
                <span className="flex-1 truncate">
                  {b.title}
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
        </div>
      )}
    </div>
  );
}
