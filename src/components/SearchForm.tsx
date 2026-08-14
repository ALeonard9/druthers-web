'use client';

import { useRef } from 'react';
import { SEARCH_SCOPES, SEARCH_SCOPE_LABELS, type SearchScope } from '@/lib/searchScope';
import { VoiceSearch } from './VoiceSearch';

export function SearchForm({
  query = '',
  scope = 'all',
  compact = false,
}: {
  query?: string;
  scope?: SearchScope;
  compact?: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <form
      ref={formRef}
      action="/search"
      className={compact ? 'relative flex min-w-0 w-full' : 'relative flex w-full max-w-xl gap-2'}
    >
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
      <input
        ref={inputRef}
        type="search"
        name="q"
        defaultValue={query}
        placeholder="Search everything…"
        autoFocus={!compact}
        className="min-w-0 flex-1 border border-neutral-700 bg-panel px-3 py-1.5 text-sm outline-none placeholder:text-neutral-600 focus:border-brass"
      />
      <VoiceSearch
        onTranscript={(transcript) => {
          if (inputRef.current) inputRef.current.value = transcript;
          formRef.current?.requestSubmit();
        }}
        className="shrink-0 border border-l-0 border-neutral-700 bg-panel px-2 text-neutral-300 hover:text-paper focus:outline-none focus:ring-1 focus:ring-brass"
      />
      <button
        type="submit"
        className="shrink-0 rounded-r bg-brass px-3 py-1.5 text-sm font-medium text-ink hover:bg-brass-bright"
      >
        Search
      </button>
    </form>
  );
}
