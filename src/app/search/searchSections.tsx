import Link from 'next/link';
import { apiFetch, ApiError } from '@/lib/api';
import { bestScore, rankResults } from '@/lib/similarity';
import { isNextRedirectError } from '@/lib/nextRedirectError';
import type { UserSearchResponse } from '@/lib/types';
import { AddFromSearchButton } from '@/components/AddFromSearchButton';
import {
  CatalogSearchResults,
  normalizeCatalogResult,
  type CatalogDomain,
  type CatalogSearchResult,
} from '@/components/CatalogSearchResults';

// `minQueryLength` mirrors MIN_QUERY_LENGTH_BY_DOMAIN in the API's
// app/services/search_policy.py, which is the source of truth and still
// enforces these floors server-side. They are duplicated here so a section the
// provider cannot serve says so instead of issuing a request and reporting the
// empty answer as "nothing found". Each value is that provider's own observed
// limit, probed 2026-08-20 (api#398): TMDB, TVMaze and IGDB serve
// one-character queries, Open Library rejects anything under three.
const CATALOG_DOMAINS: Record<
  CatalogDomain,
  { title: string; endpoint: string; singular: string; minQueryLength: number }
> = {
  movies: {
    title: 'Movies',
    endpoint: '/v1/movies/search',
    singular: 'Movie',
    minQueryLength: 1,
  },
  tv: {
    title: 'TV Shows',
    endpoint: '/v1/tv-shows/search',
    singular: 'TV Show',
    minQueryLength: 1,
  },
  games: {
    title: 'Games',
    endpoint: '/v1/games/search',
    singular: 'Game',
    minQueryLength: 1,
  },
  books: {
    title: 'Books',
    endpoint: '/v1/books/search',
    singular: 'Book',
    minQueryLength: 3,
  },
};

const BEST_MATCH_THRESHOLD = 0.75;
const ROW = 'flex items-center gap-3 px-4 py-2 text-sm';

export interface CatalogSearchTask {
  domain: CatalogDomain;
  resultsPromise: Promise<CatalogSearchResult[]>;
  /** The query is below this provider's floor, so nothing was searched. */
  belowMinQuery: boolean;
}

export function catalogDomainMinQueryLength(domain: CatalogDomain): number {
  return CATALOG_DOMAINS[domain].minQueryLength;
}

export function catalogDomainTitle(domain: CatalogDomain): string {
  return CATALOG_DOMAINS[domain].title;
}

export function createCatalogSearchTask(
  domain: CatalogDomain,
  query: string,
): CatalogSearchTask {
  // Below the provider's floor there is nothing to ask for, so skip the round
  // trip entirely rather than rendering its empty answer as a real result.
  if (query.trim().length < CATALOG_DOMAINS[domain].minQueryLength) {
    return { domain, resultsPromise: Promise.resolve([]), belowMinQuery: true };
  }
  return {
    domain,
    belowMinQuery: false,
    resultsPromise: apiFetch<CatalogSearchResult[]>(
      `${CATALOG_DOMAINS[domain].endpoint}?q=${encodeURIComponent(query)}`,
    ),
  };
}

function SectionFrame({
  title,
  count,
  busy = false,
  children,
}: {
  title: string;
  count?: number;
  busy?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className="rounded-lg border border-line bg-panel"
      aria-busy={busy || undefined}
    >
      <h2 className="border-b border-line px-4 py-2 font-display text-lg text-paper">
        {title}{' '}
        {count != null && <span className="text-sm text-neutral-500">{count}</span>}
      </h2>
      {children}
    </section>
  );
}

function SessionExpiredNotice({ title }: { title: string }) {
  return (
    <SectionFrame title={title}>
      <p role="alert" className="px-4 py-6 text-sm text-amber-300">
        Your session expired.{' '}
        <Link href="/login" className="font-medium text-brass hover:text-brass-bright">
          Sign in again
        </Link>{' '}
        to search {title.toLowerCase()}.
      </p>
    </SectionFrame>
  );
}

function UnavailableNotice({ title }: { title: string }) {
  return (
    <SectionFrame title={title}>
      <p role="alert" className="px-4 py-6 text-sm text-amber-300">
        {title} search is unavailable right now.
      </p>
    </SectionFrame>
  );
}

function BelowMinQueryNotice({
  title,
  minimum,
}: {
  title: string;
  minimum: number;
}) {
  // Deliberately not the empty state and deliberately without a count: nothing
  // was searched, so claiming zero results would be a claim we did not make.
  return (
    <SectionFrame title={title}>
      <p className="px-4 py-6 text-sm text-neutral-400">
        {title} search needs at least {minimum} characters.
      </p>
    </SectionFrame>
  );
}

function isUnauthorizedSearchError(error: unknown): boolean {
  return (error instanceof ApiError && error.status === 401) || isNextRedirectError(error);
}

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

export function SearchSectionSkeleton({ title }: { title: string }) {
  return (
    <SectionFrame title={title} busy>
      <div className="p-4" aria-label={`Loading ${title.toLowerCase()} search`}>
        <p className="mb-3 animate-pulse text-sm text-neutral-600 motion-reduce:animate-none">
          Loading {title.toLowerCase()}…
        </p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4" aria-hidden="true">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={`${index > 1 ? 'hidden sm:block' : ''} h-24 animate-pulse rounded bg-line/70 motion-reduce:animate-none`}
            />
          ))}
        </div>
      </div>
    </SectionFrame>
  );
}

export async function CatalogDomainSection({
  domain,
  query,
  resultsPromise,
  belowMinQuery,
}: CatalogSearchTask & { query: string }) {
  const title = CATALOG_DOMAINS[domain].title;
  if (belowMinQuery) {
    return (
      <BelowMinQueryNotice
        title={title}
        minimum={CATALOG_DOMAINS[domain].minQueryLength}
      />
    );
  }
  let results: CatalogSearchResult[];
  try {
    results = await resultsPromise;
  } catch (error) {
    return isUnauthorizedSearchError(error) ? (
      <SessionExpiredNotice title={title} />
    ) : (
      <UnavailableNotice title={title} />
    );
  }

  const ranked = rankResults(query, results);
  return (
    <SectionFrame title={title} count={ranked.length}>
      {ranked.length === 0 ? (
        <p className="px-4 py-6 text-sm text-neutral-500">
          No {title.toLowerCase()} found.
        </p>
      ) : (
        <div className="p-4">
          <CatalogSectionResults domain={domain} results={ranked} />
        </div>
      )}
    </SectionFrame>
  );
}

export function PeopleSectionSkeleton() {
  return (
    <SectionFrame title="People" busy>
      <p
        className="animate-pulse px-4 py-6 text-sm text-neutral-600 motion-reduce:animate-none"
        aria-label="Loading people search"
      >
        Loading people…
      </p>
    </SectionFrame>
  );
}

export async function PeopleSection({
  resultsPromise,
}: {
  resultsPromise: Promise<UserSearchResponse>;
}) {
  let response: UserSearchResponse;
  try {
    response = await resultsPromise;
  } catch (error) {
    return isUnauthorizedSearchError(error) ? (
      <SessionExpiredNotice title="People" />
    ) : (
      <UnavailableNotice title="People" />
    );
  }

  const people = response.users;
  return (
    <SectionFrame title="People" count={people.length}>
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
    </SectionFrame>
  );
}

export async function BestMatch({
  query,
  tasks,
}: {
  query: string;
  tasks: CatalogSearchTask[];
}) {
  const settled = await Promise.allSettled(
    tasks.map(async ({ domain, resultsPromise }) => ({
      domain,
      results: await resultsPromise,
    })),
  );

  let winning:
    | { domain: CatalogDomain; source: CatalogSearchResult; score: number }
    | undefined;
  for (const outcome of settled) {
    if (outcome.status !== 'fulfilled') continue;
    const ranked = rankResults(query, outcome.value.results);
    const source = ranked[0];
    if (!source) continue;
    const score = bestScore(query, [source]);
    if (!winning || score > winning.score) {
      winning = { domain: outcome.value.domain, source, score };
    }
  }

  if (!winning || winning.score < BEST_MATCH_THRESHOLD) return null;

  const result = normalizeCatalogResult(winning.domain, winning.source);
  const medium = CATALOG_DOMAINS[winning.domain].singular;
  return (
    <section className="rounded-lg border border-brass/40 bg-brass-wash/50">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="h-16 w-12 shrink-0 overflow-hidden rounded bg-line">
            {result.posterUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={result.posterUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex h-full items-center justify-center px-1 text-center text-[10px] text-neutral-500">
                {medium}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <h2 className="font-display text-lg text-paper">Best match</h2>
            <p className="truncate text-sm font-medium">
              {result.sourceUrl ? (
                <a
                  href={result.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-brass-bright hover:underline"
                >
                  {result.title}
                </a>
              ) : (
                result.title
              )}
            </p>
            <p className="text-xs text-neutral-500">
              {medium}{result.metadata ? ` · ${result.metadata}` : ''}
            </p>
          </div>
        </div>
        <div className="flex w-full shrink-0 gap-1 sm:w-36 sm:flex-col">
          <AddFromSearchButton
            domain={winning.domain}
            payload={result.payload}
            onWatchlist={result.onWatchlist}
            onRankings={result.onRankings}
            rank={result.rank}
            addable={result.addable}
            rankable={result.rankable}
          />
        </div>
      </div>
    </section>
  );
}
