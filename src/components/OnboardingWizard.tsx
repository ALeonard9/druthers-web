'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BASE_DOMAIN } from '@/lib/shareCards';
import type { GlobalSearch, Summary } from '@/lib/types';
import { SHELVES, movieToDuelEntry, showToDuelEntry, bookToDuelEntry, gameToDuelEntry, type DuelEntry } from '@/lib/duelShelves';
import { RankingDuel } from '@/components/RankingDuel';
import { playPop } from '@/lib/pop';

type Step = 'handle' | 'domains' | 'ranking';
type DomainKey = 'movies' | 'tv' | 'books' | 'games';

const DOMAINS: { key: DomainKey; label: string; icon: string }[] = [
  { key: 'movies', label: 'Movies', icon: '🍿' },
  { key: 'tv', label: 'TV Shows', icon: '📺' },
  { key: 'books', label: 'Books', icon: '📚' },
  { key: 'games', label: 'Games', icon: '🎮' },
];

export function OnboardingWizard({ summary }: { summary: Summary }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(summary.handle ? 'domains' : 'handle');

  // Handle state
  const [handle, setHandle] = useState(summary.handle ?? '');
  const [handleBusy, setHandleBusy] = useState(false);
  const [handleError, setHandleError] = useState<string | null>(null);

  // Domains state
  const [selectedDomains, setSelectedDomains] = useState<Set<DomainKey>>(new Set());

  // Ranking state
  const [currentDomainIdx, setCurrentDomainIdx] = useState(0);
  const [completing, setCompleting] = useState(false);

  const activeDomain = Array.from(selectedDomains)[currentDomainIdx];

  async function saveHandle(e: FormEvent) {
    e.preventDefault();
    setHandleBusy(true);
    setHandleError(null);
    try {
      const res = await fetch('/api/visibility', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle: handle.trim() || null }),
      });
      const body = await res.json();
      if (!res.ok) {
        setHandleError(body.error ?? 'Could not save.');
        return;
      }
      setStep('domains');
    } catch {
      setHandleError('Something went wrong.');
    } finally {
      setHandleBusy(false);
    }
  }

  function toggleDomain(key: DomainKey) {
    const next = new Set(selectedDomains);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSelectedDomains(next);
  }

  function startRanking() {
    if (selectedDomains.size === 0) return;
    setStep('ranking');
  }

  async function finishOnboarding() {
    setCompleting(true);
    try {
      await fetch('/api/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onboarding_completed: true }),
      });
      router.refresh();
      // Wait for layout refresh to redirect us to '/'
    } catch {
      setCompleting(false);
    }
  }

  function handleDomainComplete() {
    if (currentDomainIdx < selectedDomains.size - 1) {
      setCurrentDomainIdx((i) => i + 1);
    } else {
      finishOnboarding();
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {step === 'handle' && (
        <div className="flex flex-col gap-4 rounded-xl border border-line bg-panel p-6 shadow-lg shadow-night/50">
          <h2 className="font-display text-2xl font-medium text-paper">Claim your handle</h2>
          <p className="text-sm text-neutral-400">
            This will be your public profile URL (e.g. {BASE_DOMAIN}/u/<strong>handle</strong>).
            You need one before you can share your lists.
          </p>
          <form onSubmit={saveHandle} className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center overflow-hidden rounded border border-neutral-700 bg-night focus-within:border-brass">
              <span className="shrink-0 pl-3 font-mono text-xs text-neutral-500">{BASE_DOMAIN}/u/</span>
              <input
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="your-handle"
                maxLength={30}
                required
                className="min-w-0 flex-1 bg-transparent px-2 py-3 text-sm outline-none placeholder:text-neutral-600"
              />
            </div>
            <button
              type="submit"
              disabled={handleBusy || !handle.trim()}
              className="shrink-0 rounded bg-brass px-6 py-3 text-sm font-medium text-ink hover:bg-brass-bright disabled:opacity-50"
            >
              {handleBusy ? 'Saving…' : 'Continue'}
            </button>
          </form>
          {handleError && <p className="text-sm text-red-400">{handleError}</p>}
        </div>
      )}

      {step === 'domains' && (
        <div className="flex flex-col gap-6 rounded-xl border border-line bg-panel p-6 shadow-lg shadow-night/50">
          <div>
            <h2 className="font-display text-2xl font-medium text-paper">What do you want to rank?</h2>
            <p className="text-sm text-neutral-400">Pick one or more to get started. You can always add the others later.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {DOMAINS.map((d) => (
              <button
                key={d.key}
                onClick={() => toggleDomain(d.key)}
                className={`flex flex-col items-center gap-3 rounded-lg border p-4 transition-colors ${
                  selectedDomains.has(d.key)
                    ? 'border-brass bg-brass-wash/30 text-paper'
                    : 'border-line bg-night text-neutral-400 hover:border-neutral-500'
                }`}
              >
                <span className="text-3xl">{d.icon}</span>
                <span className="font-medium">{d.label}</span>
              </button>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-neutral-500">
              {selectedDomains.size} selected
            </span>
            <button
              onClick={startRanking}
              disabled={selectedDomains.size === 0}
              className="rounded bg-brass px-6 py-3 text-sm font-medium text-ink hover:bg-brass-bright disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 'ranking' && activeDomain && (
        <DomainRankingStep
          domainKey={activeDomain}
          onComplete={handleDomainComplete}
        />
      )}

      {completing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-night/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 text-brass">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brass border-t-transparent" />
            <p className="font-medium">Finishing up…</p>
          </div>
        </div>
      )}
    </div>
  );
}

function DomainRankingStep({ domainKey, onComplete }: { domainKey: DomainKey; onComplete: () => void }) {
  const shelf = SHELVES[domainKey];

  const [ranked, setRanked] = useState<DuelEntry[]>([]);
  const [queue, setQueue] = useState<DuelEntry[]>([]);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<GlobalSearch | null>(null);
  const [searching, setSearching] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [addingId, setAddingId] = useState<string | null>(null);

  // Load existing items (e.g. from prior failed attempts or MCP)
  useEffect(() => {
    let active = true;
    fetch(`/api/user/${domainKey}`)
      .then((res) => res.json())
      .then((items) => {
        if (!active) return;
      const shelfRanked: DuelEntry[] = [];
      const shelfQueue: DuelEntry[] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items.forEach((item: any) => {
        let entry: DuelEntry;
        if (domainKey === 'movies') entry = movieToDuelEntry(item);
        else if (domainKey === 'tv') entry = showToDuelEntry(item);
        else if (domainKey === 'books') entry = bookToDuelEntry(item);
        else entry = gameToDuelEntry(item);

        if (item.on_rankings && item.rank != null) shelfRanked.push(entry);
        else if (item.on_rankings) shelfQueue.push(entry);
      });
      setRanked(shelfRanked.sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999)));
      setQueue(shelfQueue);
      setLoadingInitial(false);
    });
    return () => { active = false; };
  }, [domainKey]);

  useEffect(() => {
    if (!search.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults(null);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(search)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch {} finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const totalPlaced = ranked.length;
  const isDone = totalPlaced >= 5;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function addAndQueue(item: any) {
    if (addingId) return;

    // Play sound immediately for quick reaction
    playPop();

    const id = item.tmdb || item.tvmaze || item.isbn || item.igdb;
    setAddingId(id);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let payload: any = {};
      if (domainKey === 'movies') payload = { tmdb: item.tmdb, title: item.title, poster_url: item.poster_url };
      else if (domainKey === 'tv') payload = { tvmaze: item.tvmaze, imdb: item.imdb, title: item.title, poster_url: item.poster_url };
      else if (domainKey === 'books') payload = { isbn: item.isbn, title: item.title, poster_url: item.poster_url };
      else payload = { igdb: item.igdb, title: item.title, poster_url: item.poster_url };

      const res = await fetch(`/api/${domainKey}/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, list: 'rankings' })
      });
      if (!res.ok) return;

      const tracker = await res.json();
      let entry: DuelEntry;
      if (domainKey === 'movies') entry = movieToDuelEntry(tracker);
      else if (domainKey === 'tv') entry = showToDuelEntry(tracker);
      else if (domainKey === 'books') entry = bookToDuelEntry(tracker);
      else entry = gameToDuelEntry(tracker);

      if (tracker.rank != null) {
        setRanked((prev) => [...prev, entry].sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999)));
      } else {
        setQueue((prev) => [...prev, entry]);
      }
      setSearch('');
      setResults(null);
    } catch {
    } finally {
      setAddingId(null);
    }
  }

  if (loadingInitial) return <p className="text-sm text-neutral-400">Loading {shelf.label}…</p>;

  // If there are things in the queue, prioritize letting them rank them!
  if (queue.length > 0) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-medium text-paper">Rank your {shelf.label}</h2>
            <p className="text-sm text-neutral-400">Place what you added.</p>
          </div>
          <div className="text-right">
            <span className="font-display text-2xl text-brass">{totalPlaced}</span>
            <span className="text-sm text-neutral-500"> / 5</span>
          </div>
        </div>
        <RankingDuel
          shelf={shelf}
          ranked={ranked}
          queue={queue}
          onQueueEmpty={(newRanked) => {
            setRanked(newRanked);
            setQueue([]);
          }}
        />
        {/* We need to clear the local queue once RankingDuel commits it, but RankingDuel manages its own local state.
            Actually, RankingDuel expects a fresh mount if we want to change its props.
            A simpler approach is to let RankingDuel own the ranking flow. */}
      </div>
    );
  }

  if (isDone) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-line bg-panel p-6 text-center">
        <div className="text-4xl">🎉</div>
        <h2 className="font-display text-2xl font-medium text-paper">Great start!</h2>
        <p className="text-sm text-neutral-400">You&apos;ve ranked {totalPlaced} {shelf.label.toLowerCase()}.</p>
        <button
          onClick={onComplete}
          className="mt-2 rounded bg-brass px-6 py-3 text-sm font-medium text-ink hover:bg-brass-bright"
        >
          Next Step
        </button>
      </div>
    );
  }

  // Pick 5 interface
  const searchItems = domainKey === 'movies' ? results?.movies :
                      domainKey === 'tv' ? results?.tv_shows :
                      domainKey === 'books' ? results?.books :
                      results?.games;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-2xl font-medium text-paper">Pick 5 {shelf.label}</h2>
          <p className="text-sm text-neutral-400">Search and add at least 5 to your ranking.</p>
        </div>
        <div className="text-right">
          <span className="font-display text-3xl text-brass">{totalPlaced}</span>
          <span className="text-sm text-neutral-500"> / 5</span>
        </div>
      </div>

      <div className="relative">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search for ${shelf.label.toLowerCase()}…`}
          className="w-full rounded-lg border border-neutral-700 bg-panel px-4 py-3 text-sm outline-none focus:border-brass"
        />
        {searching && <span className="absolute right-4 top-3.5 text-xs text-neutral-500">Searching…</span>}
      </div>

      {searchItems && searchItems.length > 0 && (
        <div className="flex max-h-[400px] flex-col gap-2 overflow-y-auto rounded-lg border border-line bg-panel p-2">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {searchItems.slice(0, 8).map((item: any, i) => {
            const isRanked = item.on_rankings;
            return (
              <div key={i} className="flex items-center gap-3 rounded p-2 hover:bg-night">
                {item.poster_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.poster_url} alt={item.title} className="h-14 w-10 rounded object-cover" />
                ) : (
                  <div className="h-14 w-10 rounded bg-line" />
                )}
                <div className="flex-1 truncate">
                  <p className="truncate text-sm font-medium text-neutral-200">{item.title}</p>
                  <p className="truncate text-xs text-neutral-500">{item.year}</p>
                </div>
                <button
                  disabled={isRanked || addingId === (item.tmdb || item.tvmaze || item.isbn || item.igdb)}
                  onClick={() => addAndQueue(item)}
                  className={`shrink-0 rounded px-3 py-1.5 text-xs font-medium ${
                    isRanked ? 'bg-line text-neutral-500' : 'bg-brass text-ink hover:bg-brass-bright'
                  } disabled:opacity-50 min-w-[65px]`}
                >
                  {isRanked ? 'Added' : addingId === (item.tmdb || item.tvmaze || item.isbn || item.igdb) ? 'Adding…' : 'Add'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <button
        onClick={onComplete}
        className="self-end text-sm text-neutral-500 hover:text-white"
      >
        Skip the rest of {shelf.label}
      </button>
    </div>
  );
}
