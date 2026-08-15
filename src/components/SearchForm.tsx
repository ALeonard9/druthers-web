import type { SearchScope } from '@/lib/searchScope';
import type { ShelfId } from '@/lib/duelShelves';
import { CatalogSearchForm } from './CatalogSearchForm';

export function SearchForm({
  query = '',
  scope = 'all',
  compact = false,
  activeShelves,
}: {
  query?: string;
  scope?: SearchScope;
  compact?: boolean;
  activeShelves?: ShelfId[];
}) {
  return (
    <CatalogSearchForm
      query={query}
      scope={scope}
      compact={compact}
      activeShelves={activeShelves}
      placeholder="Search everything…"
      showScope
    />
  );
}
