'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  SEARCH_SCOPES,
  SEARCH_SCOPE_LABELS,
  type SearchScope,
} from '@/lib/searchScope';
import {
  parseSearchQuery,
  serializeSearchQuery,
  suggestFilterKeys,
} from '@/lib/searchFilters';
import type { CatalogDomain } from '@/components/CatalogSearchResults';
import type { ShelfId } from '@/lib/duelShelves';
import { FilterChip } from './FilterChip';
import { VoiceSearch } from './VoiceSearch';

type CatalogSearchFormProps = {
  query?: string;
  placeholder: string;
  loading?: boolean;
  compact?: boolean;
  scope?: SearchScope;
  showScope?: boolean;
  activeShelves?: ShelfId[];
  domain?: CatalogDomain | 'all';
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
  activeShelves,
  domain = 'all',
  onQueryChange,
  onSearch,
}: CatalogSearchFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const controlled = Boolean(onQueryChange);
  const scopeOptions: SearchScope[] = activeShelves
    ? ['all', ...activeShelves, 'users']
    : [...SEARCH_SCOPES];

  const [internalQuery, setInternalQuery] = useState(query);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const cursorPosRef = useRef<number | null>(null);

  const currentQuery = controlled ? query : internalQuery;
  const { filters, freeText } = parseSearchQuery(currentQuery, domain);

  // Restore cursor position after React re-renders the controlled input.
  useEffect(() => {
    if (cursorPosRef.current != null && inputRef.current) {
      inputRef.current.setSelectionRange(cursorPosRef.current, cursorPosRef.current);
      cursorPosRef.current = null;
    }
  });

  function updateQuery(newQuery: string) {
    if (controlled) {
      onQueryChange?.(newQuery);
    } else {
      setInternalQuery(newQuery);
      if (inputRef.current) inputRef.current.value = newQuery;
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    if (!onSearch) return;
    event.preventDefault();
    onSearch(controlled ? query : internalQuery);
  }

  function acceptTranscript(transcript: string) {
    updateQuery(transcript);
    if (onSearch) onSearch(transcript);
    else formRef.current?.requestSubmit();
  }

  function removeFilter(index: number) {
    const next = filters.filter((_, i) => i !== index);
    updateQuery(serializeSearchQuery(next, freeText));
  }

  function handleInput(value: string) {
    updateQuery(value);

    // Check if the user is typing a potential filter key at the cursor.
    const el = inputRef.current;
    if (!el) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const pos = el.selectionStart ?? value.length;
    const before = value.slice(0, pos);
    const match = before.match(/(?:^|\s)(\w*)$/);
    const currentWord = match?.[1] ?? '';

    if (currentWord.length > 0 && !currentWord.includes(':')) {
      const keys = suggestFilterKeys(currentWord, domain);
      setSuggestions(keys);
      setShowSuggestions(keys.length > 0);
      setHighlightedIndex(-1);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }

  function selectSuggestion(key: string) {
    const el = inputRef.current;
    const value = controlled ? query : internalQuery;
    const pos = el?.selectionStart ?? value.length;
    const before = value.slice(0, pos);
    const after = value.slice(pos);
    const match = before.match(/(?:^|\s)(\w*)$/);

    let newValue: string;
    let cursorPos: number;

    if (match) {
      const prefix = before.slice(0, match.index);
      const insertion = prefix.length > 0 && !prefix.endsWith(' ') ? ` ${key}:` : `${key}:`;
      newValue = `${prefix}${insertion}${after}`;
      cursorPos = prefix.length + insertion.length;
    } else {
      newValue = `${value}${key}:`;
      cursorPos = newValue.length;
    }

    updateQuery(newValue);
    setShowSuggestions(false);
    setSuggestions([]);
    setHighlightedIndex(-1);

    // Restore cursor after React re-renders the controlled input.
    cursorPosRef.current = cursorPos;
  }

  function handleInputKeyDown(event: React.KeyboardEvent) {
    if (!showSuggestions || suggestions.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % suggestions.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightedIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
    } else if (event.key === 'Enter' && highlightedIndex >= 0) {
      event.preventDefault();
      selectSuggestion(suggestions[highlightedIndex]);
    } else if (event.key === 'Escape') {
      setShowSuggestions(false);
      setHighlightedIndex(-1);
    }
  }

  function handleInputBlur() {
    // Delay hiding so a click on a suggestion registers before the blur.
    setTimeout(() => setShowSuggestions(false), 150);
  }

  return (
    <div className="relative w-full">
      <form
        ref={formRef}
        action={onSearch ? undefined : '/search'}
        onSubmit={submit}
        className={
          compact
            ? 'flex min-w-0 w-full'
            : 'flex w-full max-w-xl gap-2'
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
              {scopeOptions.map((option) => (
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
            ? { value: query, onChange: (event) => handleInput(event.target.value) }
            : { defaultValue: query, onChange: (event) => handleInput(event.target.value) })}
          placeholder={placeholder}
          autoFocus={!compact}
          onKeyDown={handleInputKeyDown}
          onBlur={handleInputBlur}
          onFocus={() => {
            // Re-check suggestions when refocusing.
            const value = controlled ? query : internalQuery;
            const el = inputRef.current;
            if (!el) return;
            const pos = el.selectionStart ?? value.length;
            const before = value.slice(0, pos);
            const match = before.match(/(?:^|\s)(\w*)$/);
            const currentWord = match?.[1] ?? '';
            if (currentWord.length > 0 && !currentWord.includes(':')) {
              const keys = suggestFilterKeys(currentWord, domain);
              setSuggestions(keys);
              setShowSuggestions(keys.length > 0);
            }
          }}
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

      {filters.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1" role="list" aria-label="Active filters">
          {filters.map((f, i) => (
            <FilterChip
              key={`${f.key}:${f.value}`}
              filterKey={f.key}
              value={f.value}
              onRemove={() => removeFilter(i)}
            />
          ))}
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <ul
          role="listbox"
          aria-label="Filter suggestions"
          className="absolute left-0 top-full z-10 mt-1 w-full overflow-hidden rounded border border-neutral-700 bg-panel shadow-lg"
        >
          {suggestions.map((key, i) => (
            <li
              key={key}
              role="option"
              aria-selected={i === highlightedIndex}
              onMouseDown={(e) => {
                e.preventDefault();
                selectSuggestion(key);
              }}
              className={`cursor-pointer px-3 py-1.5 text-sm ${
                i === highlightedIndex
                  ? 'bg-brass-wash text-brass'
                  : 'text-neutral-300 hover:bg-line'
              }`}
            >
              <span className="text-neutral-500">{key}:</span>{' '}
              <span className="text-xs text-neutral-600">filter</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
