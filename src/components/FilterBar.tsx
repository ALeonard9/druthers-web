'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FILTER_KEYS, type FilterValues } from '@/lib/filterParams';

export type { FilterValues };

/** A domain-specific control the drawer should render alongside the shared ones. */
export type ExtraField =
  | { kind: 'select'; name: string; label: string; options: { value: string; label: string }[] }
  | { kind: 'number'; name: string; label: string; width?: string }
  | { kind: 'checkbox'; name: string; label: string };

const EMPTY: FilterValues = Object.fromEntries(FILTER_KEYS.map((k) => [k, '']));

const TITLE_CASE = (s: string) =>
  s.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

/**
 * Human-readable chips for whatever is currently filtering the list, shown on
 * the collapsed control so an active filter is never invisible.
 */
function summarize(f: FilterValues, extras: ExtraField[]): string[] {
  const out: string[] = [];
  if (f.q) out.push(`“${f.q}”`);
  if (f.genre) out.push(f.genre);
  if (f.yearMin && f.yearMax) out.push(`${f.yearMin}–${f.yearMax}`);
  else if (f.yearMin) out.push(`from ${f.yearMin}`);
  else if (f.yearMax) out.push(`to ${f.yearMax}`);
  if (f.ratingMin) out.push(`≥ ${f.ratingMin}`);
  for (const x of extras) {
    const v = f[x.name];
    if (!v) continue;
    if (x.kind === 'checkbox') out.push(x.label);
    else if (x.kind === 'number') out.push(`${x.label} ${v}`);
    else {
      const opt = x.options.find((o) => o.value === v);
      out.push(opt ? opt.label : TITLE_CASE(v));
    }
  }
  return out;
}

/**
 * Collapsed-by-default filter drawer. Filters the lists via URL search params
 * (the server re-renders the filtered set), so `basePath` must be the page the
 * control is on - each tab filters independently.
 *
 * `genreOptions` and any `extras` are built from the caller's own library data,
 * so the menus only ever offer values that exist.
 */
export function FilterBar({
  initial,
  basePath = '/movies',
  searchLabel = 'Search (title, director, cast)',
  searchPlaceholder = 'e.g. Nolan',
  ratingMaxBound = 10,
  genreOptions = [],
  extras = [],
}: {
  initial: FilterValues;
  basePath?: string;
  searchLabel?: string;
  searchPlaceholder?: string;
  ratingMaxBound?: number;
  genreOptions?: { value: string; label: string }[];
  extras?: ExtraField[];
}) {
  const router = useRouter();
  const [f, setF] = useState<FilterValues>({ ...EMPTY, ...initial });
  const [open, setOpen] = useState(false);

  const applied = summarize({ ...EMPTY, ...initial }, extras);
  const active = applied.length > 0;

  function apply(next: FilterValues) {
    const params = new URLSearchParams();
    for (const k of FILTER_KEYS) if (next[k]) params.set(k, next[k]);
    const qs = params.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    apply(f);
    setOpen(false);
  }

  function reset() {
    setF(EMPTY);
    apply(EMPTY);
    setOpen(false);
  }

  const set = (k: string, v: string) => setF({ ...f, [k]: v });

  const input =
    'rounded border border-neutral-700 bg-panel px-2 py-1.5 text-sm outline-none focus:border-brass';
  const field = 'flex flex-col gap-1 text-xs text-neutral-400';

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="filter-panel"
          className={`flex items-center gap-1.5 rounded border px-3 py-1.5 text-sm transition-colors ${
            active
              ? 'border-brass/60 bg-brass/10 text-brass'
              : 'border-line text-neutral-300 hover:border-neutral-600 hover:text-paper'
          }`}
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z"
            />
          </svg>
          Filter
          <span className="text-xs opacity-70">{open ? '▴' : '▾'}</span>
        </button>

        {active && (
          <>
            {applied.map((chip) => (
              <span
                key={chip}
                className="rounded-full bg-panel px-2.5 py-1 text-xs text-neutral-300"
              >
                {chip}
              </span>
            ))}
            <button
              type="button"
              onClick={reset}
              className="rounded px-2 py-1 text-xs text-neutral-400 underline-offset-2 hover:text-neutral-200 hover:underline"
            >
              Clear
            </button>
          </>
        )}
      </div>

      {open && (
        <form
          id="filter-panel"
          onSubmit={submit}
          className="flex flex-wrap items-end gap-2 rounded-lg border border-line bg-panel/50 p-3"
        >
          <label className={field}>
            {searchLabel}
            <input
              autoFocus
              value={f.q}
              onChange={(e) => set('q', e.target.value)}
              placeholder={searchPlaceholder}
              className={`${input} w-52`}
            />
          </label>

          <label className={field}>
            Genre
            <select
              value={f.genre}
              onChange={(e) => set('genre', e.target.value)}
              className={`${input} w-40`}
            >
              <option value="">Any</option>
              {genreOptions.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </label>

          <label className={field}>
            Year from
            <input
              type="number"
              value={f.yearMin}
              onChange={(e) => set('yearMin', e.target.value)}
              className={`${input} w-20`}
            />
          </label>
          <label className={field}>
            to
            <input
              type="number"
              value={f.yearMax}
              onChange={(e) => set('yearMax', e.target.value)}
              className={`${input} w-20`}
            />
          </label>

          <label className={field}>
            Min rating (0–{ratingMaxBound})
            <input
              type="number"
              step="0.1"
              min="0"
              max={ratingMaxBound}
              value={f.ratingMin}
              onChange={(e) => set('ratingMin', e.target.value)}
              className={`${input} w-24`}
            />
          </label>

          {extras.map((x) =>
            x.kind === 'select' ? (
              <label key={x.name} className={field}>
                {x.label}
                <select
                  value={f[x.name] ?? ''}
                  onChange={(e) => set(x.name, e.target.value)}
                  className={`${input} w-36`}
                >
                  <option value="">Any</option>
                  {x.options.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : x.kind === 'number' ? (
              <label key={x.name} className={field}>
                {x.label}
                <input
                  type="number"
                  min="0"
                  value={f[x.name] ?? ''}
                  onChange={(e) => set(x.name, e.target.value)}
                  className={`${input} ${x.width ?? 'w-24'}`}
                />
              </label>
            ) : (
              <label
                key={x.name}
                className="flex items-center gap-2 py-2 text-xs text-neutral-400"
              >
                <input
                  type="checkbox"
                  checked={f[x.name] === '1'}
                  onChange={(e) => set(x.name, e.target.checked ? '1' : '')}
                  className="h-4 w-4 accent-brass"
                />
                {x.label}
              </label>
            ),
          )}

          <button
            type="submit"
            className="rounded bg-brass px-3 py-1.5 text-sm font-medium text-ink hover:bg-brass-bright"
          >
            Apply
          </button>
          {active && (
            <button
              type="button"
              onClick={reset}
              className="rounded px-2 py-1.5 text-sm text-neutral-400 hover:text-neutral-200"
            >
              Clear
            </button>
          )}
        </form>
      )}
    </div>
  );
}
