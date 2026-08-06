'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { ComparisonDomain, ComparisonItem, UserComparison } from '@/lib/types';

type Filter = 'all' | ComparisonDomain['category'];

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'movies', label: 'Movies' },
  { key: 'tv', label: 'TV' },
  { key: 'books', label: 'Books' },
  { key: 'games', label: 'Games' },
];

const WATCHLIST_NAMES: Record<ComparisonDomain['category'], string> = {
  movies: 'Watchlist',
  tv: 'Watchlist',
  books: 'Reading List',
  games: 'Play List',
};

function Poster({ item }: { item: ComparisonItem }) {
  return item.poster_url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={item.poster_url} alt="" className="h-full w-full object-cover" />
  ) : (
    <div className="flex h-full items-center justify-center bg-line p-2 text-center text-[10px] text-neutral-500">
      {item.title}
    </div>
  );
}

function ItemLine({ item, category }: { item: ComparisonItem; category: ComparisonDomain['category'] }) {
  const itemHref = `/${category}/${item.id}`;
  return (
    <li className="flex min-w-0 items-center gap-3 border-b border-line/60 py-2.5 last:border-b-0">
      <Link href={itemHref} className="h-12 w-8 shrink-0 overflow-hidden rounded bg-line hover:opacity-80 transition-opacity">
        <Poster item={item} />
      </Link>
      <Link href={itemHref} className="min-w-0 flex-1 truncate text-sm text-neutral-200 hover:text-brass transition-colors">
        {item.title}
      </Link>
      {item.year && <span className="font-mono text-[10px] text-neutral-600">{item.year}</span>}
    </li>
  );
}

function RankLine({
  item,
  category,
  handle,
  showRerank = false,
}: {
  item: ComparisonItem;
  category: ComparisonDomain['category'];
  handle: string;
  showRerank?: boolean;
}) {
  const itemHref = `/${category}/${item.id}`;
  const rerankHref = `/${category}/ranking?item=${item.id}`;
  return (
    <li className="flex flex-col gap-1 border-b border-line/60 py-2.5 last:border-b-0">
      <div className="grid grid-cols-[2.5rem_minmax(0,1fr)_2.5rem] items-center gap-3">
        <span className="rounded bg-brass-wash py-1 text-center font-mono text-xs text-brass">#{item.your_rank}</span>
        <Link href={itemHref} className="min-w-0 truncate text-center text-sm font-medium text-neutral-200 hover:text-brass transition-colors">
          {item.title}
        </Link>
        <span className="rounded bg-neutral-800 py-1 text-center font-mono text-xs text-neutral-300">#{item.their_rank}</span>
      </div>
      <div className="flex items-center justify-between px-1">
        <span className="font-mono text-[9px] uppercase tracking-wider text-neutral-600">You vs @{handle}</span>
        {showRerank && (
          <Link
            href={rerankHref}
            className="rounded border border-line px-2 py-0.5 text-[10px] font-medium text-brass hover:border-brass hover:bg-brass-wash transition-colors"
          >
            Re-rank
          </Link>
        )}
      </div>
    </li>
  );
}

function Recommendation({
  item,
  domain,
  handle,
  onSaved,
}: {
  item: ComparisonItem;
  domain: ComparisonDomain;
  handle: string;
  onSaved: (id: string, destination: 'watchlist' | 'rankings') => void;
}) {
  const [busy, setBusy] = useState<'watchlist' | 'rankings' | null>(null);
  const [error, setError] = useState(false);

  async function save(destination: 'watchlist' | 'rankings') {
    setBusy(destination);
    setError(false);
    const response = await fetch(
      `/api/comparison/${encodeURIComponent(handle)}/${domain.category}/${encodeURIComponent(item.id)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination }),
      },
    );
    setBusy(null);
    if (!response.ok) {
      setError(true);
      return;
    }
    onSaved(item.id, destination);
  }

  const itemHref = `/${domain.category}/${item.id}`;

  return (
    <li className="flex min-w-0 gap-3 rounded-lg border border-line bg-night/50 p-3">
      <Link href={itemHref} className="h-24 w-16 shrink-0 overflow-hidden rounded bg-line hover:opacity-80 transition-opacity">
        <Poster item={item} />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <Link href={itemHref} className="line-clamp-2 text-sm font-medium text-paper hover:text-brass transition-colors">
          {item.title}
        </Link>
        <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-neutral-500">
          @{handle} ranks it #{item.their_rank}
        </p>
        <div className="mt-auto grid grid-cols-2 gap-1.5 pt-2">
          <button
            type="button"
            disabled={busy !== null || item.on_your_watchlist}
            onClick={() => void save('watchlist')}
            className={`min-h-8 rounded px-2 py-1 text-[11px] font-medium transition-colors disabled:cursor-default ${
              item.on_your_watchlist
                ? 'bg-moss-wash text-moss'
                : 'border border-line text-neutral-300 hover:border-brass hover:text-paper disabled:opacity-50'
            }`}
          >
            {busy === 'watchlist'
              ? 'Adding…'
              : item.on_your_watchlist
                ? `✓ ${WATCHLIST_NAMES[domain.category]}`
                : `+ ${WATCHLIST_NAMES[domain.category]}`}
          </button>
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void save('rankings')}
            className="min-h-8 rounded bg-brass px-2 py-1 text-[11px] font-medium text-ink transition-colors hover:bg-brass-bright disabled:opacity-50"
          >
            {busy === 'rankings' ? 'Adding…' : '+ Rank'}
          </button>
        </div>
        {error && <p className="mt-1 text-[11px] text-red-400">Could not save this pick.</p>}
      </div>
    </li>
  );
}

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h3 className="font-display text-lg text-paper">{title}</h3>
        {note && <p className="text-right text-xs text-neutral-500">{note}</p>}
      </div>
      {children}
    </section>
  );
}

function AlignmentHelp({ method }: { method: string }) {
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-label="How alignment is calculated"
        className="flex h-4 w-4 items-center justify-center rounded-full border border-neutral-600 font-sans text-[10px] normal-case tracking-normal text-neutral-500 transition-colors hover:border-brass/70 hover:text-brass focus-visible:border-brass focus-visible:text-brass focus-visible:outline-none"
      >
        ?
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute right-0 top-full z-20 mt-2 w-64 rounded-lg border border-brass/30 bg-night px-3 py-2 text-left font-sans text-xs normal-case leading-5 tracking-normal text-neutral-300 opacity-0 shadow-xl shadow-black/40 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {method}
      </span>
    </span>
  );
}

function DomainPanel({
  domain,
  handle,
  onSaved,
}: {
  domain: ComparisonDomain;
  handle: string;
  onSaved: (category: ComparisonDomain['category'], id: string, destination: 'watchlist' | 'rankings') => void;
}) {
  if (!domain.rankings_visible) {
    return (
      <article className="rounded-xl border border-line bg-panel p-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-brass">{domain.label}</p>
        <p className="mt-2 text-sm text-neutral-400">@{handle} hasn’t shared this shelf with you.</p>
      </article>
    );
  }

  return (
    <article className="overflow-hidden rounded-xl border border-line bg-panel shadow-xl shadow-black/10">
      <header className="flex items-center justify-between gap-4 border-b border-line bg-night/45 px-5 py-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-brass">Shelf comparison</p>
          <h2 className="font-display text-2xl text-paper">{domain.label}</h2>
        </div>
        <div className="relative z-10 min-w-24 border-l border-brass/30 pl-4 text-right">
          {domain.alignment_status === 'ready' ? (
            <>
              <p className="font-display text-3xl text-brass">{domain.alignment_score}%</p>
              <p className="flex items-center justify-end gap-1.5 font-mono text-[9px] uppercase tracking-wider text-neutral-500">
                aligned <AlignmentHelp method={domain.method} />
              </p>
            </>
          ) : (
            <><p className="font-display text-xl text-neutral-300">{domain.shared_ranked_count}/5</p><p className="font-mono text-[9px] uppercase tracking-wider text-neutral-500">to score</p></>
          )}
        </div>
      </header>

      <div className="grid gap-6 p-5 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <Section title={`On both ${WATCHLIST_NAMES[domain.category]}s`}>
            {!domain.watchlist_visible ? (
              <p className="rounded-lg border border-dashed border-line px-3 py-4 text-sm text-neutral-500">Their {WATCHLIST_NAMES[domain.category]} isn’t visible to you.</p>
            ) : domain.common_watchlist.length === 0 ? (
              <p className="text-sm text-neutral-500">No overlap here yet.</p>
            ) : (
              <ul>{domain.common_watchlist.map((item) => <ItemLine key={item.id} item={item} category={domain.category} />)}</ul>
            )}
          </Section>

          <Section title={`Try one of @${handle}’s favorites`} note="Top 5 you haven’t ranked">
            {domain.recommendations.length === 0 ? (
              <p className="text-sm text-neutral-500">You’ve already ranked everything visible here.</p>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                {domain.recommendations.map((item) => (
                  <Recommendation key={item.id} item={item} domain={domain} handle={handle} onSaved={(id, destination) => onSaved(domain.category, id, destination)} />
                ))}
              </ul>
            )}
          </Section>
        </div>

        <div className="flex flex-col gap-6">
          <Section title="Your biggest gaps" note="Where the debate starts">
            {domain.biggest_gaps.length === 0 ? <p className="text-sm text-neutral-500">Rank more of the same titles to compare.</p> : <ul>{domain.biggest_gaps.map((item) => <RankLine key={item.id} item={item} category={domain.category} handle={handle} showRerank={true} />)}</ul>}
          </Section>
          <Section title="Most aligned" note="Your closest calls">
            {domain.most_aligned.length === 0 ? <p className="text-sm text-neutral-500">Not enough shared rankings yet.</p> : <ul>{domain.most_aligned.map((item) => <RankLine key={item.id} item={item} category={domain.category} handle={handle} />)}</ul>}
          </Section>
          <p className="border-t border-line pt-3 text-xs leading-5 text-neutral-600">{domain.method}</p>
        </div>
      </div>
    </article>
  );
}

export function ComparisonView({ initial }: { initial: UserComparison }) {
  const [filter, setFilter] = useState<Filter>('all');
  const [domains, setDomains] = useState(initial.domains);
  const visible = useMemo(
    () => (filter === 'all' ? domains : domains.filter((domain) => domain.category === filter)),
    [domains, filter],
  );

  function onSaved(category: ComparisonDomain['category'], id: string, destination: 'watchlist' | 'rankings') {
    setDomains((current) => current.map((domain) => {
      if (domain.category !== category) return domain;
      if (destination === 'rankings') {
        return { ...domain, recommendations: domain.recommendations.filter((item) => item.id !== id) };
      }
      return {
        ...domain,
        recommendations: domain.recommendations.map((item) => item.id === id ? { ...item, on_your_watchlist: true } : item),
      };
    }));
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-brass">Side by side</p>
          <h1 className="mt-1 font-display text-4xl tracking-tight text-paper">You <span className="text-brass">×</span> @{initial.handle}</h1>
          <p className="mt-1 text-sm text-neutral-400">Shared queues, taste gaps, and the next thing worth trying.</p>
        </div>
        <Link href={`/u/${initial.handle}`} className="text-sm text-neutral-400 hover:text-brass">Back to profile →</Link>
      </header>

      <nav aria-label="Comparison domain" className="flex gap-1 overflow-x-auto rounded-lg border border-line bg-panel p-1">
        {FILTERS.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => setFilter(option.key)}
            className={`min-h-10 shrink-0 rounded px-4 text-sm transition-colors ${filter === option.key ? 'bg-brass text-ink' : 'text-neutral-400 hover:bg-line hover:text-paper'}`}
          >
            {option.label}
          </button>
        ))}
      </nav>

      <div className="flex flex-col gap-5">
        {visible.map((domain) => <DomainPanel key={domain.category} domain={domain} handle={initial.handle} onSaved={onSaved} />)}
      </div>
    </div>
  );
}
