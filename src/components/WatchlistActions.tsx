'use client';

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
  useTransition,
} from 'react';
import { useRouter } from 'next/navigation';
import type { WatchlistActionItem } from '@/lib/deck';
import { playPop } from '@/lib/pop';

interface WatchlistRemovalContextValue {
  removedIds: ReadonlySet<string>;
  remove: (item: WatchlistActionItem) => Promise<boolean>;
}

const WatchlistRemovalContext = createContext<WatchlistRemovalContextValue | null>(null);

function useWatchlistRemoval() {
  const value = useContext(WatchlistRemovalContext);
  if (!value) throw new Error('Watchlist actions must be inside WatchlistActionProvider');
  return value;
}

export function WatchlistActionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [removedIds, setRemovedIds] = useState<ReadonlySet<string>>(() => new Set());
  const [undoItem, setUndoItem] = useState<WatchlistActionItem | null>(null);
  const [undoPending, setUndoPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!undoItem) return;
    const timeout = window.setTimeout(() => {
      setUndoItem(null);
      router.refresh();
    }, 8000);
    return () => window.clearTimeout(timeout);
  }, [router, undoItem]);

  async function remove(item: WatchlistActionItem): Promise<boolean> {
    setError(null);
    const response = await fetch(item.trackHref, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ on_watchlist: false }),
    }).catch(() => null);

    if (!response?.ok) {
      setError(`Couldn't remove “${item.title}”. Try again.`);
      return false;
    }

    setRemovedIds((current) => new Set(current).add(item.id));
    setUndoItem(item);
    return true;
  }

  async function undo() {
    if (!undoItem || undoPending) return;
    const item = undoItem;
    setUndoPending(true);
    setError(null);
    const response = await fetch(item.trackHref, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ on_watchlist: true }),
    }).catch(() => null);

    if (response?.ok) {
      setRemovedIds((current) => {
        const next = new Set(current);
        next.delete(item.id);
        return next;
      });
      setUndoItem(null);
      router.refresh();
    } else {
      setError(`Couldn't restore “${item.title}”. Try again.`);
    }
    setUndoPending(false);
  }

  return (
    <WatchlistRemovalContext.Provider value={{ removedIds, remove }}>
      {children}
      {(undoItem || error) && (
        <div
          role="status"
          className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-md items-center justify-between gap-3 rounded-lg border border-line bg-panel px-4 py-3 text-sm text-paper shadow-xl"
        >
          <span>{error ?? `Removed “${undoItem?.title}” from your watchlist.`}</span>
          {undoItem && (
            <button
              type="button"
              onClick={() => void undo()}
              disabled={undoPending}
              className="shrink-0 rounded bg-brass px-3 py-1.5 text-xs font-medium text-ink hover:bg-brass-bright disabled:opacity-50"
            >
              Undo
            </button>
          )}
        </div>
      )}
    </WatchlistRemovalContext.Provider>
  );
}

export function useWatchlistItemRemoved(id: string): boolean {
  return useWatchlistRemoval().removedIds.has(id);
}

export function useWatchlistRemovedIds(): ReadonlySet<string> {
  return useWatchlistRemoval().removedIds;
}

export function useRemoveWatchlistItem() {
  return useWatchlistRemoval().remove;
}

export function WatchlistActions({ item }: { item: WatchlistActionItem }) {
  const router = useRouter();
  const remove = useRemoveWatchlistItem();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function rank() {
    if (item.playPopOnRank) playPop();
    setError(null);
    startTransition(async () => {
      const response = await fetch(item.trackHref, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ on_rankings: true }),
      }).catch(() => null);
      if (response?.ok) {
        router.push(item.rankHref);
      } else {
        setError(`Couldn't rank “${item.title}”. Try again.`);
      }
    });
  }

  function confirmRemove() {
    setError(null);
    startTransition(async () => {
      const removed = await remove(item);
      if (!removed) setError(`Couldn't remove “${item.title}”. Try again.`);
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {item.rankable ? (
        <button
          type="button"
          onClick={rank}
          disabled={pending || item.onRankings}
          aria-label={item.onRankings ? `${item.title} is in rankings` : `Rank ${item.title}`}
          className={`rounded px-2 py-1 text-xs font-medium text-ink disabled:opacity-50 ${
            item.rankTone === 'moss'
              ? 'bg-moss hover:bg-moss-bright'
              : 'bg-brass hover:bg-brass-bright'
          }`}
          title="Add to your ranked list"
        >
          {item.onRankings ? 'In Rankings' : 'Rank'}
        </button>
      ) : (
        <span className="text-xs italic text-neutral-500">Not rankable yet</span>
      )}

      {confirming ? (
        <span
          role="group"
          aria-label={`Confirm removing ${item.title} from watchlist`}
          className="flex items-center gap-1 rounded bg-red-950/70 px-1 py-0.5 ring-1 ring-red-800"
        >
          <button
            type="button"
            onClick={() => setConfirming(false)}
            disabled={pending}
            className="rounded px-2 py-0.5 text-xs text-neutral-300 hover:text-white disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirmRemove}
            disabled={pending}
            aria-label={`Confirm remove ${item.title}`}
            className="rounded bg-red-600 px-2 py-0.5 text-xs font-medium text-white hover:bg-red-500 disabled:opacity-50"
          >
            Remove
          </button>
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          disabled={pending}
          aria-label={`Remove ${item.title} from watchlist`}
          className="rounded px-2 py-1 text-xs text-neutral-500 hover:text-red-400 disabled:opacity-50"
        >
          Remove
        </button>
      )}

      {error && <span className="basis-full text-center text-xs text-red-400">{error}</span>}
    </div>
  );
}
