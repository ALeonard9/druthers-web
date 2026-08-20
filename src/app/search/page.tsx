import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { getSessionUser } from '@/lib/session';
import { includesCatalogScope, includesPeopleScope, searchScope } from '@/lib/searchScope';
import { normalizeShelfPreferences, orderedEnabledShelves } from '@/lib/shelfPreferences';
import type { Preferences, UserSearchResponse } from '@/lib/types';
import { MultiAddMode } from '@/components/MultiAddMode';
import { SearchForm } from '@/components/SearchForm';
import { SearchSectionErrorBoundary } from './SearchSectionErrorBoundary';
import {
  BestMatch,
  CatalogDomainSection,
  PeopleSection,
  PeopleSectionSkeleton,
  SearchSectionSkeleton,
  catalogDomainTitle,
  createCatalogSearchTask,
  type CatalogSearchTask,
} from './searchSections';

export const dynamic = 'force-dynamic';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const { q, scope: requestedScope } = await searchParams;
  const preferences = await apiFetch<Preferences>('/v1/users/me/preferences');
  const activeDomains = orderedEnabledShelves(
    normalizeShelfPreferences({
      order: preferences.shelf_order,
      enabled: preferences.enabled_shelves,
    }),
  );
  const requested = searchScope(requestedScope);
  const scope =
    requested === 'all' || requested === 'users' || activeDomains.includes(requested)
      ? requested
      : 'all';
  const query = q?.trim() ?? '';
  const scopedDomains = includesCatalogScope(scope)
    ? activeDomains.filter((domain) => scope === 'all' || scope === domain)
    : [];
  const catalogTasks: CatalogSearchTask[] = query
    ? scopedDomains.map((domain) => createCatalogSearchTask(domain, query))
    : [];
  const peoplePromise =
    query && includesPeopleScope(scope)
      ? apiFetch<UserSearchResponse>(`/v1/search/users?q=${encodeURIComponent(query)}`)
      : null;

  const peopleBoundary = peoplePromise ? (
    <SearchSectionErrorBoundary key={`people:${query}`} title="People">
      <Suspense fallback={<PeopleSectionSkeleton />}>
        <PeopleSection resultsPromise={peoplePromise} />
      </Suspense>
    </SearchSectionErrorBoundary>
  ) : null;

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

      <SearchForm query={q ?? ''} scope={scope} activeShelves={activeDomains} />

      {catalogTasks.length > 0 ? (
        <MultiAddMode>
          {catalogTasks.length > 1 && (
            <Suspense fallback={null}>
              <BestMatch query={query} tasks={catalogTasks} />
            </Suspense>
          )}

          {peopleBoundary}

          {catalogTasks.map((task) => {
            const title = catalogDomainTitle(task.domain);
            return (
              <SearchSectionErrorBoundary
                key={`${task.domain}:${query}`}
                title={title}
              >
                <Suspense fallback={<SearchSectionSkeleton title={title} />}>
                  <CatalogDomainSection {...task} query={query} />
                </Suspense>
              </SearchSectionErrorBoundary>
            );
          })}
        </MultiAddMode>
      ) : (
        peopleBoundary
      )}
    </div>
  );
}
