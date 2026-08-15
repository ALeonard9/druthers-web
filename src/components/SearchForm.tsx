import type { SearchScope } from '@/lib/searchScope';
import { CatalogSearchForm } from './CatalogSearchForm';

export function SearchForm({
  query = '',
  scope = 'all',
  compact = false,
}: {
  query?: string;
  scope?: SearchScope;
  compact?: boolean;
}) {
  return (
    <CatalogSearchForm
      query={query}
      scope={scope}
      compact={compact}
      placeholder="Search everything…"
      showScope
    />
  );
}
