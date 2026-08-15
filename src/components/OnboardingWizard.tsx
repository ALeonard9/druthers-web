'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BASE_DOMAIN } from '@/lib/shareCards';
import type { GlobalSearch, Summary } from '@/lib/types';
import { SHELVES, movieToDuelEntry, showToDuelEntry, bookToDuelEntry, gameToDuelEntry, type DuelEntry } from '@/lib/duelShelves';
import { RankingDuel } from '@/components/RankingDuel';
import { playPop } from '@/lib/pop';
import { ShelfPreferenceEditor } from '@/components/ShelfPreferenceEditor';
import {
  DEFAULT_SHELF_PREFERENCES,
  orderedEnabledShelves,
  type ShelfPreferences,
} from '@/lib/shelfPreferences';
import { saveShelfPreferences } from '@/lib/shelfPreferencesClient';
import { GoodreadsImport } from '@/components/GoodreadsImport';
import { CatalogSearchForm } from '@/components/CatalogSearchForm';
import {
  CatalogSearchResults,
  NotRankableMessage,
  normalizeCatalogResult,
  type CatalogSearchResult,
} from '@/components/CatalogSearchResults';
import { TrackedBadge } from '@/components/TrackedBadge';
import { DomainIcon } from '@/components/DomainIcon';

type Step = 'handle' | 'shelves' | 'ranking';
type DomainKey = keyof typeof SHELVES;

export function OnboardingWizard({
  summary,
  shelfToSetUp,
}: {
  summary: Summary;
  shelfToSetUp?: DomainKey;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(shelfToSetUp ? 'ranking' : summary.handle ? 'shelves' : 'handle');

  // Handle state
  const [handle, setHandle] = useState(summary.handle ?? '');
  const [handleBusy, setHandleBusy] = useState(false);
  const [handleError, setHandleError] = useState<string | null>(null);

  // Shelf selection, visibility, and order are one shared account preference.
  const [shelfPreferences, setShelfPreferences] = useState<ShelfPreferences>(
    shelfToSetUp
      ? { order: DEFAULT_SHELF_PREFERENCES.order, enabled: [shelfToSetUp] }
      : DEFAULT_SHELF_PREFERENCES,
  );
  const [shelfBusy, setShelfBusy] = useState(false);
  const [shelfError, setShelfError] = useState<string | null>(null);

  // Ranking state
  const [currentDomainIdx, setCurrentDomainIdx] = useState(0);
  const [completing, setCompleting] = useState(false);
  const [completionError, setCompletionError] = useState<string | null>(null);

  const activeDomain = orderedEnabledShelves(shelfPreferences)[currentDomainIdx];

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
      setStep('shelves');
    } catch {
      setHandleError('Something went wrong.');
    } finally {
      setHandleBusy(false);
    }
  }

  async function startRanking() {
    if (shelfPreferences.enabled.length === 0) return;
    setShelfBusy(true);
    setShelfError(null);
    try {
      await saveShelfPreferences(shelfPreferences);
      setCurrentDomainIdx(0);
      setStep('ranking');
    } catch {
      setShelfError('Could not save your shelf choices. Try again.');
    } finally {
      setShelfBusy(false);
    }
  }

  async function finishOnboarding() {
    setCompleting(true);
    setCompletionError(null);
    try {
      const res = await fetch('/api/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onboarding_completed: true }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? 'Could not finish onboarding. Try again.');
      }

      // A shelf setup stays on /onboarding after a refresh, so completion
      // must navigate independently of the server page's redirect behavior.
      router.push(shelfToSetUp ? `/${shelfToSetUp}` : '/');
    } catch (err) {
      setCompletionError(err instanceof Error ? err.message : 'Could not finish onboarding. Try again.');
    } finally {
      setCompleting(false);
    }
  }

  function handleDomainComplete() {
    if (currentDomainIdx < orderedEnabledShelves(shelfPreferences).length - 1) {
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
          <button
            type="button"
            onClick={() => setStep('shelves')}
            className="self-start text-sm text-neutral-500 hover:text-white"
          >
            Set this up later
          </button>
          {handleError && <p className="text-sm text-red-400">{handleError}</p>}
        </div>
      )}

      {step === 'shelves' && (
        <div className="flex flex-col gap-6 rounded-xl border border-line bg-panel p-6 shadow-lg shadow-night/50">
          <div>
            <h2 className="font-display text-2xl font-medium text-paper">Arrange your shelves</h2>
            <p className="text-sm text-neutral-400">Choose the shelves you use and drag them into your preferred order. You can change this later in Settings.</p>
          </div>
          <ShelfPreferenceEditor preferences={shelfPreferences} onChange={setShelfPreferences} />

          {shelfPreferences.enabled.includes('books') && (
            <div className="mt-2 border-t border-line/50 pt-6">
              <GoodreadsImport />
            </div>
          )}

          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-neutral-500">
              {shelfPreferences.enabled.length} on
            </span>
            <button
              onClick={startRanking}
              disabled={shelfBusy || shelfPreferences.enabled.length === 0}
              className="rounded bg-brass px-6 py-3 text-sm font-medium text-ink hover:bg-brass-bright disabled:opacity-50"
            >
              {shelfBusy ? 'Saving…' : 'Continue'}
            </button>
          </div>
          {shelfError && <p className="text-sm text-red-400">{shelfError}</p>}
        </div>
      )}

      {step === 'ranking' && activeDomain && (
        <>
          <DomainRankingStep
            domainKey={activeDomain}
            onComplete={handleDomainComplete}
            requireFive={Boolean(shelfToSetUp)}
          />
          {completionError && <p role="alert" className="text-sm text-red-400">{completionError}</p>}
        </>
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

function DomainRankingStep({
  domainKey,
  onComplete,
  requireFive = false,
}: {
  domainKey: DomainKey;
  onComplete: () => void;
  requireFive?: boolean;
}) {
  const shelf = SHELVES[domainKey];

  const [ranked, setRanked] = useState<DuelEntry[]>([]);
  const [queue, setQueue] = useState<DuelEntry[]>([]);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<GlobalSearch | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedEntries, setAddedEntries] = useState<Map<string, string>>(() => new Map());

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
    })
    .catch(() => {
      if (!active) return;
      setLoadingInitial(false);
    });
    return () => { active = false; };
  }, [domainKey]);

  async function runSearch(query: string) {
    if (!query.trim()) return;
    setSearching(true);
    setSearchError(null);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (!res.ok) {
        setSearchError(data.error ?? 'Search failed');
        return;
      }
      setResults(data);
      const domainResults = domainKey === 'movies' ? data.movies :
                            domainKey === 'tv' ? data.tv_shows :
                            domainKey === 'books' ? data.books : data.games;
      if (domainResults.length === 0) setSearchError('No results.');
    } catch {
      setSearchError('Search failed');
    } finally {
      setSearching(false);
    }
  }

  const totalPlaced = ranked.length;
  const isDone = totalPlaced >= 5;

  async function addAndQueue(item: CatalogSearchResult, resultId: string) {
    if (addingId) return;

    // Play sound immediately for quick reaction
    playPop();

    const normalized = normalizeCatalogResult(domainKey, item);
    setAddingId(resultId);

    try {
      const res = await fetch(`/api/${domainKey}/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...normalized.payload, list: 'rankings' })
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
      setAddedEntries((current) => new Map(current).set(resultId, entry.id));
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
            <h2 className="inline-flex items-center gap-2 font-display text-xl font-medium text-paper">
              <DomainIcon domain={domainKey} className="h-5 w-5" />
              Rank your {shelf.label}
            </h2>
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
          onQueueEmpty={({ ranked: newRanked, skipped }) => {
            setRanked(newRanked);
            setQueue([]);
            const trackedIds = new Set(
              [...newRanked, ...skipped].map((entry) => entry.id),
            );
            setAddedEntries(
              (current) =>
                new Map(
                  [...current].filter(([, entryId]) => trackedIds.has(entryId)),
                ),
            );
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
          <h2 className="inline-flex items-center gap-2 font-display text-2xl font-medium text-paper">
            <DomainIcon domain={domainKey} className="h-5 w-5" />
            Pick 5 {shelf.label}
          </h2>
          <p className="text-sm text-neutral-400">Search and add at least 5 to your ranking.</p>
        </div>
        <div className="text-right">
          <span className="font-display text-3xl text-brass">{totalPlaced}</span>
          <span className="text-sm text-neutral-500"> / 5</span>
        </div>
      </div>

      <CatalogSearchForm
        query={search}
        onQueryChange={setSearch}
        onSearch={(query) => void runSearch(query)}
        placeholder={`Search for ${shelf.label.toLowerCase()}…`}
        loading={searching}
      />

      {searchError && <p className="text-sm text-amber-400">{searchError}</p>}

      {searchItems && searchItems.length > 0 && (
        <CatalogSearchResults
          domain={domainKey}
          results={searchItems}
          limit={8}
          actionFor={(result, item) => {
            const isRanked = result.onRankings || addedEntries.has(result.key);
            if (isRanked) {
              return <TrackedBadge onRankings rank={result.rank} />;
            }
            if (!result.rankable) return <NotRankableMessage />;
            return (
              <button
                disabled={!result.addable || addingId === result.key}
                onClick={() => void addAndQueue(item, result.key)}
                aria-label={`Add ${result.title} to Ranked List`}
                className="rounded bg-brass px-2 py-1 text-xs font-medium text-ink hover:bg-brass-bright disabled:opacity-50"
              >
                {addingId === result.key ? 'Adding…' : '+ Ranked List'}
              </button>
            );
          }}
        />
      )}

      {!requireFive && (
        <button
          onClick={onComplete}
          className="self-end text-sm text-neutral-500 hover:text-white"
        >
          Skip the rest of {shelf.label}
        </button>
      )}
    </div>
  );
}
