'use client';

import { useRef, type FormEvent } from 'react';
import {
  SEARCH_SCOPES,
  SEARCH_SCOPE_LABELS,
  type SearchScope,
} from '@/lib/searchScope';
import { VoiceSearch } from './VoiceSearch';

type CatalogSearchFormProps = {
  query?: string;
  placeholder: string;
  loading?: boolean;
  compact?: boolean;
  scope?: SearchScope;
  showScope?: boolean;
  onQueryChange?: (query: string) => void;
  onSearch?: (query: string) => void;
};

export function CatalogSearchForm({
  query = '',
  placeholder,
  loading = false,
  compact = false,
  scope = 'all',
  showScope = false,
  onQueryChange,
  onSearch,
}: CatalogSearchFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const controlled = Boolean(onQueryChange);

  function submit(event: FormEvent<HTMLFormElement>) {
    if (!onSearch) return;
    event.preventDefault();
    onSearch(inputRef.current?.value ?? query);
  }

  function acceptTranscript(transcript: string) {
    if (inputRef.current) inputRef.current.value = transcript;
    onQueryChange?.(transcript);
    if (onSearch) onSearch(transcript);
    else formRef.current?.requestSubmit();
  }

  return (
    <form
      ref={formRef}
      action={onSearch ? undefined : '/search'}
      onSubmit={submit}
      className={
        compact
          ? 'relative flex min-w-0 w-full'
          : 'relative flex w-full max-w-xl gap-2'
      }
    >
      {showScope && (
        <>
          <label className="sr-only" htmlFor={compact ? 'top-search-scope' : 'search-scope'}>
            Search scope
          </label>
          <select
            id={compact ? 'top-search-scope' : 'search-scope'}
            name="scope"
            defaultValue={scope}
            className="shrink-0 rounded-l border border-r-0 border-neutral-700 bg-panel px-2 py-1.5 text-sm text-neutral-200 outline-none focus:border-brass"
          >
            {SEARCH_SCOPES.map((option) => (
              <option key={option} value={option}>
                {SEARCH_SCOPE_LABELS[option]}
              </option>
            ))}
          </select>
        </>
      )}
      <input
        ref={inputRef}
        type="search"
        name="q"
        {...(controlled
          ? { value: query, onChange: (event) => onQueryChange?.(event.target.value) }
          : { defaultValue: query })}
        placeholder={placeholder}
        autoFocus={!compact}
        className={`min-w-0 flex-1 border border-neutral-700 bg-panel px-3 py-2 text-sm outline-none placeholder:text-neutral-600 focus:border-brass ${
          showScope ? '' : 'rounded-l'
        }`}
      />
      <VoiceSearch
        onTranscript={acceptTranscript}
        className="shrink-0 border border-l-0 border-neutral-700 bg-panel px-2 text-neutral-300 hover:text-paper focus:outline-none focus:ring-1 focus:ring-brass"
      />
      <button
        type="submit"
        disabled={loading}
        className="shrink-0 rounded-r bg-brass px-3 py-2 text-sm font-medium text-ink hover:bg-brass-bright disabled:opacity-50"
      >
        {loading ? 'Searching…' : 'Search'}
      </button>
    </form>
  );
}
