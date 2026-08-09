'use client';

/**
 * "Which would you rather?" — places titles into an already-ranked shelf by
 * comparison instead of by dragging.
 *
 * The engine is `pairwiseRanking`: a binary insertion, so a shelf of 1,300
 * takes ~11 picks rather than a scroll to the right row. This component is
 * only the presentation of it — every decision about where a candidate lands
 * lives in the engine, which is exhaustively tested without a network or a
 * screen.
 *
 * Two things the phone doesn't have shape the web version: a whole "to rank"
 * queue is worked through in one sitting (each placement folds into the local
 * ranked list, so the next duel is correct without a refetch), and the arrow
 * keys drive it.
 *
 * Needs no new API endpoint: the index commits through the existing
 * `PUT /api/{shelf}/{id}/rank`, which takes a 1-based position and shifts
 * everything below it down.
 */

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { playPop } from '@/lib/pop';
import { DuelShareButton } from '@/components/DuelShareButton';
import type { DuelEntry, ShelfConfig } from '@/lib/duelShelves';
import type { DuelShareCard } from '@/lib/duelShareCardRender';
import {
  answer as answerSession,
  currentPair,
  insertionIndex,
  isComplete,
  possibleIndices,
  settledIndex,
  startSession,
  totalComparisons,
  type Answer,
  type PairwiseSession,
} from '@/lib/pairwiseRanking';

interface Placement {
  title: string;
  rank: number;
  imageUrl?: string | null;
}

/**
 * The tallest the contenders should ever get, whatever the screen. Not a
 * guess about the viewport — a design ceiling, so a large monitor gets a
 * comfortable card rather than a billboard.
 */
const MAX_STAGE = 340;
/** Below this the posters stop being recognisable, so scroll instead. */
const MIN_STAGE = 150;

/** Breathing room below the controls, so they never sit flush to the edge. */
const GUTTER = 16;

/**
 * Sizes the contenders so the controls beneath them are always fully on
 * screen — by checking where those controls actually land, not by predicting
 * it.
 *
 * The earlier version added up everything it thought was on the page and
 * derived a height from the leftovers. That has to know about the top bar, the
 * bottom tabs, safe-area insets, browser zoom, wrapped text — and it was wrong
 * whenever any of those differed from the guess. This instead reads the
 * controls' real bottom edge, compares it to the bottom of the *visual*
 * viewport (the one that accounts for PWA standalone chrome, zoom and mobile
 * toolbars), and corrects the stage by exactly the overshoot. One pass lands
 * it; the tolerance stops it oscillating.
 *
 * The measured element must not be `position: sticky` — a stuck element
 * reports where it's pinned rather than where it sits, which makes an
 * overflowing page look like a fitting one.
 *
 * Returns null until the first measurement so the server render and the client
 * agree on the CSS fallback instead of flashing a different size.
 */
function useFittedStage(
  stageRef: React.RefObject<HTMLDivElement | null>,
  footerRef: React.RefObject<HTMLDivElement | null>,
  // Whether the comparison UI (and so the footer) is actually on screen —
  // it isn't for the "nothing to compare against yet" and "nothing left to
  // place" states, and `footerRef.current` is null until it is (web#110).
  active: boolean,
) {
  const [height, setHeight] = useState<number | null>(null);

  useLayoutEffect(() => {
    const footer = footerRef.current;
    if (!active || !footer) return;

    function measure() {
      const stage = stageRef.current;
      if (!stage || !footer) return;
      const viewportBottom = window.visualViewport?.height ?? window.innerHeight;
      const stageHeight = stage.getBoundingClientRect().height;
      // Positive means the controls hang off the bottom of the screen;
      // negative means there's room going spare.
      const overshoot =
        footer.getBoundingClientRect().bottom + GUTTER - viewportBottom;
      if (Math.abs(overshoot) < 2) return; // settled

      const next = Math.round(
        Math.min(MAX_STAGE, Math.max(MIN_STAGE, stageHeight - overshoot)),
      );
      setHeight((prev) => (prev === next ? prev : next));
    }

    measure();
    // The stage's own height is what we set, so observing it would loop —
    // watch what moves it instead: the page around it and the controls below.
    const observer = new ResizeObserver(measure);
    observer.observe(document.body);
    observer.observe(footer);
    window.visualViewport?.addEventListener('resize', measure);
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.visualViewport?.removeEventListener('resize', measure);
      window.removeEventListener('resize', measure);
    };
  }, [stageRef, footerRef, active]);

  return height;
}

export function RankingDuel({
  shelf,
  ranked: initialRanked,
  queue: initialQueue,
  rerankId,
  priorRank,
  onQueueEmpty,
}: {
  shelf: ShelfConfig;
  ranked: DuelEntry[];
  queue: DuelEntry[];
  /** The one entry in `queue` that got here via "Rerank", if any. */
  rerankId?: string;
  /** Its rank just before that — the candidate's own `rank` is already null. */
  priorRank?: number;
  /** Callback fired when the queue is emptied, useful for parent components that manage their own state. */
  onQueueEmpty?: (newRanked: DuelEntry[]) => void;
}) {
  const router = useRouter();
  const [ranked, setRanked] = useState(initialRanked);
  const [queue, setQueue] = useState(initialQueue);
  const [answers, setAnswers] = useState<PairwiseSession<DuelEntry> | null>(
    null,
  );
  const [committing, setCommitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [lastVerdict, setLastVerdict] = useState<DuelShareCard | null>(null);

  const stageRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  const candidate = queue[0] ?? null;

  // The session is derived rather than stored: a candidate plus the answers so
  // far is all there is to one, so reaching a new candidate produces a fresh
  // session on its own — no effect needed to reset it between placements.
  const session =
    candidate && ranked.length > 0
      ? answers?.candidate.id === candidate.id
        ? answers
        : startSession(ranked, candidate)
      : null;

  const pair = session ? currentPair(session) : null;
  const stageHeight = useFittedStage(stageRef, footerRef, Boolean(session && pair));

  /**
   * Writes the placement, then folds it into the local ranked list so the next
   * candidate is compared against a list that already includes it — the same
   * order the server now holds, without a round trip to re-read it.
   */
  const commit = useCallback(
    async (
      entry: DuelEntry,
      index: number,
      verdict?: Omit<DuelShareCard, 'rank'>,
    ) => {
      setCommitting(true);
      setError(null);
      // The API's rank *is* the 1-based position in the list ("Rank =
      // position in the list"), so the insertion index converts directly.
      const position = index + 1;
      try {
        const res = await fetch(`/api/${shelf.id}/${entry.id}/rank`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ position }),
        });
        if (!res.ok) throw new Error(String(res.status));

        setRanked((prev) => {
          const next = [...prev];
          next.splice(index, 0, entry);
          // Everything below the insertion shifted down by one.
          return next.map((e, i) => ({ ...e, rank: i + 1 }));
        });
        setPlacements((prev) => [{ title: entry.title, rank: position, imageUrl: entry.imageUrl }, ...prev]);
        if (verdict) setLastVerdict({ ...verdict, rank: position });
        setQueue((prev) => prev.filter((e) => e.id !== entry.id));
        setAnswers(null);
        playPop();
        // Keep the board (and the counts on it) honest behind this page.
        router.refresh();
      } catch {
        setError(`Couldn't save that placement. Try again.`);
      } finally {
        setCommitting(false);
      }
    },
    [router, shelf.id],
  );

  const answer = useCallback(
    (choice: Answer) => {
      if (!session || committing) return;
      const next = answerSession(session, choice);
      setAnswers(next);
      if (isComplete(next) && pair) {
        const winner = choice === 'candidate' ? pair.candidate : pair.opponent;
        void commit(next.candidate, insertionIndex(next), {
          left: pair.candidate,
          right: pair.opponent,
          winnerId: winner.id,
        });
      }
    },
    [session, committing, commit, pair],
  );

  const settle = useCallback(() => {
    if (!session || committing) return;
    void commit(session.candidate, settledIndex(session));
  }, [session, committing, commit]);

  function skip() {
    if (!candidate) return;
    setQueue((prev) => prev.slice(1));
    setAnswers(null);
  }

  async function removeFromShelf(entry: DuelEntry) {
    setCommitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/${shelf.id}/${entry.id}/track`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ on_rankings: false, on_watchlist: false }),
      });
      if (!res.ok) throw new Error(String(res.status));

      setQueue((prev) => prev.filter((queued) => queued.id !== entry.id));
      setAnswers(null);
      setConfirmingRemoveEntry(null);
      router.refresh();
    } catch {
      setError(`Couldn't remove that ${shelf.noun}. Try again.`);
    } finally {
      setCommitting(false);
    }
  }

  // Arrow keys pick a side, Enter takes the estimate — the whole point is to
  // get through a pile quickly, and reaching for the mouse each time is the
  // slow part.
  useEffect(() => {
    if (!pair) return;
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        answer('candidate');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        answer('opponent');
      } else if (e.key === 'Enter') {
        e.preventDefault();
        settle();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pair, answer, settle]);

  const [confirmingRemoveEntry, setConfirmingRemoveEntry] = useState<DuelEntry | null>(null);

  if (!candidate) {
    if (onQueueEmpty) {
      return (
        <div className="flex flex-col items-center gap-6 rounded-xl border border-line bg-panel/60 px-6 py-12 text-center">
          <p className="font-display text-2xl font-medium text-paper">
            Placed!
          </p>
          <button onClick={() => onQueueEmpty(ranked)} className="rounded bg-brass px-6 py-3 text-sm font-medium text-ink hover:bg-brass-bright">
            Continue adding {shelf.label}
          </button>
        </div>
      );
    }
    return (
      <Done shelf={shelf} placements={placements} rankedCount={ranked.length} />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {confirmingRemoveEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="flex max-w-sm flex-col gap-4 rounded-xl border border-red-800 bg-panel p-5 text-center shadow-xl">
            <h3 className="font-display text-lg font-medium text-paper">
              Remove “{confirmingRemoveEntry.title}”?
            </h3>
            <p className="text-xs text-neutral-400">
              This removes it from both your rankings and watchlist.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmingRemoveEntry(null)}
                className="rounded px-3 py-1.5 text-xs text-neutral-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => void removeFromShelf(confirmingRemoveEntry)}
                disabled={committing}
                className="rounded bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500 disabled:opacity-50"
              >
                Remove from both
              </button>
            </div>
          </div>
        </div>
      )}

      {session && pair ? (
        <>
          <Progress session={session} remaining={queue.length} />

          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <div className="min-w-0 text-left sm:text-center">
              <h2 className="font-display text-lg font-medium tracking-tight text-paper">
                Which would you rather?
              </h2>
              <p className="mt-0.5 hidden text-xs text-neutral-500 sm:block">
                Pick the one you&apos;d take. Every answer halves what&apos;s left
                to ask.
              </p>
            </div>
            <div className="shrink-0">
              <DuelShareButton card={{ left: pair.candidate, right: pair.opponent }} />
            </div>
          </div>

          <div
            ref={stageRef}
            // Falls back to viewport units until the measurement lands, so the
            // server render is close and nothing jumps on hydration.
            style={stageHeight ? { height: stageHeight } : undefined}
            className={`grid grid-cols-2 gap-3 transition-opacity ${
              stageHeight ? '' : 'h-[min(38dvh,340px)]'
            } ${committing ? 'pointer-events-none opacity-50' : ''}`}
          >
            <Contender
              entry={pair.candidate}
              badge={
                pair.candidate.id === rerankId && priorRank != null
                  ? `Currently #${priorRank}`
                  : 'Unranked'
              }
              hint="←"
              onPick={() => answer('candidate')}
              onRemove={() => setConfirmingRemoveEntry(pair.candidate)}
            />
            <Contender
              entry={pair.opponent}
              badge={pair.opponent.rank != null ? `#${pair.opponent.rank}` : null}
              hint="→"
              onPick={() => answer('opponent')}
            />
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-lg border border-red-800 bg-red-950/60 p-3 text-sm text-red-200"
            >
              {error}
            </p>
          )}

          {/* Deliberately not sticky: this is the element `useFittedStage`
              measures, and a stuck element reports where it's pinned rather
              than where it sits — which would hide exactly the overflow we're
              trying to correct. */}
          <div ref={footerRef}>
            <EscapeHatch
              session={session}
              shelf={shelf}
              disabled={committing}
              onSettle={settle}
              onSkip={skip}
            />
          </div>
        </>
      ) : (
        // Nothing placed yet, so there is nothing to compare against — the
        // first title in is #1 by definition. Still an explicit action rather
        // than a silent write, so the shelf never starts itself.
        <FirstOneIn
          entry={candidate}
          shelf={shelf}
          error={error}
          disabled={committing}
          onPlace={() => void commit(candidate, 0)}
          onSkip={skip}
        />
      )}

      {placements.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Trail shelf={shelf} placements={placements} />
          {lastVerdict && <DuelShareButton card={lastVerdict} />}
        </div>
      )}
    </div>
  );
}

/**
 * How far along, and — the part that makes stopping early a real option —
 * the band of positions the candidate can still land in.
 */
function Progress({
  session,
  remaining,
}: {
  session: PairwiseSession<DuelEntry>;
  remaining: number;
}) {
  const total = Math.max(totalComparisons(session), 1);
  const fraction = session.comparisonsMade / total;
  const [lo, hi] = possibleIndices(session);

  return (
    <div className="flex flex-col gap-2">
      <div className="h-[3px] overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full bg-brass transition-[width] duration-300 ease-out"
          style={{ width: `${Math.round(fraction * 100)}%` }}
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-neutral-500">
        {/* 1-based, because a landing index of 0 is rank #1. */}
        <span>
          Question {session.comparisonsMade + 1} of ~{total} · narrowed to{' '}
          <span className="text-brass">
            #{lo + 1}
            {hi > lo && `–#${hi + 1}`}
          </span>
        </span>
        {remaining > 1 && <span>{remaining - 1} more waiting after this</span>}
      </div>
    </div>
  );
}

/** One side of the question: the artwork, the title, and what it costs to pick. */
function Contender({
  entry,
  badge,
  hint,
  onPick,
  onRemove,
}: {
  entry: DuelEntry;
  badge: string | null;
  hint: string;
  onPick: () => void;
  onRemove?: () => void;
}) {
  return (
    <div className="relative h-full min-h-0 overflow-hidden rounded-xl bg-panel">
      <button
        onClick={onPick}
        className="group flex h-full min-h-0 w-full flex-col items-center gap-2 rounded-xl border border-line bg-panel p-3 text-center transition-colors hover:border-brass hover:bg-brass-wash/40 focus:outline-none focus-visible:border-brass focus-visible:ring-2 focus-visible:ring-brass"
      >
        {/* Sized off the viewport, not the column, so the question, both posters
          and the placement button stay on one screen without scrolling — the
          whole flow is "glance, pick, repeat". */}
      <div className="relative min-h-0 flex-1">
        {entry.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={entry.imageUrl}
            alt=""
            className="h-full w-auto rounded-lg object-contain"
          />
        ) : (
          <div className="flex h-full aspect-[2/3] items-center justify-center rounded-lg bg-line text-5xl">
            {entry.emoji ?? '🎞️'}
          </div>
        )}
        {badge && (
          <span className="absolute bottom-2 left-2 rounded bg-ink/85 px-2 py-1 font-display text-xs font-medium text-brass">
            {badge}
          </span>
        )}
      </div>
      <div className="shrink-0">
        <p className="line-clamp-1 text-sm font-medium text-neutral-100 group-hover:text-paper">
          {entry.title}
        </p>
        <p className="mt-0.5 line-clamp-1 text-xs text-neutral-500">
          {entry.subtitle && <span>{entry.subtitle} · </span>}
          <span className="hidden group-hover:text-brass sm:inline">{hint}</span>
        </p>
      </div>
      </button>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${entry.title} from rankings and watchlist`}
          title="Remove from rankings and watchlist"
          className="absolute right-2 top-2 z-20 flex min-h-11 min-w-11 items-center justify-center rounded-full border border-red-700/80 bg-red-950/95 text-2xl leading-none text-red-300 shadow-lg transition-colors hover:border-red-500 hover:bg-red-900 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
        >
          <span aria-hidden="true">×</span>
        </button>
      )}
    </div>
  );
}

/**
 * "Good enough" — stop answering and take the midpoint of what's left, which
 * is the least-wrong guess available. Sits under the question alongside the
 * two titles the candidate would land between, so the estimate can be judged
 * before it's accepted.
 *
 * Both bounds always show a number, even before the first answer — "landing
 * between #1 and #208" reads as a real range; "anywhere" doesn't tell you
 * how long a shelf you're actually placing into.
 */
function EscapeHatch({
  session,
  shelf,
  disabled,
  onSettle,
  onSkip,
}: {
  session: PairwiseSession<DuelEntry>;
  shelf: ShelfConfig;
  disabled: boolean;
  onSettle: () => void;
  onSkip: () => void;
}) {
  const [lo, hi] = possibleIndices(session);
  const better = lo > 0 ? session.ranked[lo - 1] : null;
  const worse = hi < session.ranked.length ? session.ranked[hi] : null;

  return (
    <div className="rounded-xl border border-line bg-panel px-4 py-3 shadow-lg shadow-night/50">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">
          Landing between
        </span>
        {better ? (
          <Neighbour entry={better} shelf={shelf} />
        ) : (
          <Bound rank={1} label="Top of the list" />
        )}
        {worse ? (
          <Neighbour entry={worse} shelf={shelf} />
        ) : (
          <Bound rank={session.ranked.length + 1} label="End of the list" />
        )}
      </div>

      {/* Perforated tear line, matching the ticket motif on BoredCard. */}
      <div className="relative -mx-4 my-3">
        <div className="border-t-2 border-dashed border-line" />
        <span className="absolute -left-2.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-night" />
        <span className="absolute -right-2.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-night" />
      </div>

      {/* No justify-between below sm: on a narrow/PWA viewport that pushes
          the two halves onto separate lines, "+ Add a movie" ends up alone
          on line one with nothing to its right — dead space, not a layout.
          Left-aligned stacking there reads as one flow instead. */}
      <div className="flex flex-wrap items-center gap-3 sm:justify-between">
        <Link
          href={shelf.addHref}
          className="text-sm text-neutral-400 hover:text-white"
        >
          + {shelf.addLabel}
        </Link>
        <div className="flex flex-wrap items-center gap-4">
          <span className="hidden font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-600 sm:block">
            ←→ pick · ↵ accept
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onSkip}
              disabled={disabled}
              className="rounded border border-line px-3 py-2 text-sm font-medium text-neutral-300 hover:border-brass hover:text-paper disabled:opacity-50"
            >
              Skip for now
            </button>
            <button
              onClick={onSettle}
              disabled={disabled}
              className="rounded bg-brass px-3 py-2 text-sm font-medium text-ink hover:bg-brass-bright disabled:opacity-50"
            >
              Place at #{settledIndex(session) + 1}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** A boundary with no real neighbouring title — the very top or bottom of the shelf. */
function Bound({ rank, label }: { rank: number; label: string }) {
  return (
    <span className="flex min-w-0 items-center gap-2 text-sm">
      <span className="inline-flex h-6 min-w-[2.5rem] shrink-0 items-center justify-center rounded bg-brass-wash px-1.5 font-display text-sm font-medium text-brass">
        {rank}
      </span>
      <span className="truncate text-neutral-400">{label}</span>
    </span>
  );
}

function Neighbour({ entry, shelf }: { entry: DuelEntry; shelf: ShelfConfig }) {
  return (
    <span className="flex min-w-0 items-center gap-2 text-sm">
      <span className="inline-flex h-6 min-w-[2.5rem] shrink-0 items-center justify-center rounded bg-brass-wash px-1.5 font-display text-sm font-medium text-brass">
        {entry.rank}
      </span>
      <Link
        href={`${shelf.itemBase}/${entry.id}`}
        className="truncate text-neutral-300 hover:text-brass-bright hover:underline"
      >
        {entry.title}
      </Link>
    </span>
  );
}

/**
 * What's been placed this sitting — reassurance that the picks stuck. One line
 * so it never pushes the placement button off the screen.
 */
function Trail({
  shelf,
  placements,
}: {
  shelf: ShelfConfig;
  placements: Placement[];
}) {
  const shown = placements.slice(0, 3);
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500">
      <span className="font-medium uppercase tracking-wide">Placed just now</span>
      {shown.map((p, i) => (
        <span key={`${p.title}-${i}`} className="max-w-[16rem] truncate">
          <span className="font-display font-medium text-brass">#{p.rank}</span>{' '}
          {p.title}
        </span>
      ))}
      {placements.length > shown.length && (
        <span>+{placements.length - shown.length} more</span>
      )}
      <Link
        href={shelf.boardHref}
        className="text-brass hover:underline"
      >
        See the full ranking →
      </Link>
    </div>
  );
}

/**
 * The empty-shelf case: no ranked titles means no opponent to put up against
 * the candidate, so the duel has no question to ask and offers the only answer
 * available instead.
 */
function FirstOneIn({
  entry,
  shelf,
  error,
  disabled,
  onPlace,
  onSkip,
}: {
  entry: DuelEntry;
  shelf: ShelfConfig;
  error: string | null;
  disabled: boolean;
  onPlace: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-line bg-panel/60 px-6 py-12 text-center">
      <p className="font-display text-2xl font-medium text-paper">
        Nothing to compare against yet.
      </p>
      <p className="max-w-md text-sm text-neutral-500">
        <span className="text-neutral-300">{entry.title}</span> would be the
        first {shelf.noun} on your ranking, so it starts at #1. Everything after
        it gets judged against it.
      </p>
      {error && (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      )}
      <div className="flex flex-wrap justify-center gap-2">
        <button
          onClick={onPlace}
          disabled={disabled}
          className="rounded bg-brass px-3 py-2 text-sm font-medium text-ink hover:bg-brass-bright disabled:opacity-50"
        >
          Make it #1
        </button>
        <button
          onClick={onSkip}
          disabled={disabled}
          className="rounded px-3 py-2 text-sm text-neutral-400 hover:text-white disabled:opacity-50"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}

/** Nothing left in the queue — either it was empty, or it just got emptied. */
function Done({
  shelf,
  placements,
  rankedCount,
}: {
  shelf: ShelfConfig;
  placements: Placement[];
  rankedCount: number;
}) {
  const finished = placements.length > 0;
  return (
    <div className="flex flex-col items-center gap-6 rounded-xl border border-line bg-panel/60 px-6 py-12 text-center">
      {finished && (
        <div className="flex flex-wrap justify-center gap-4">
          {placements.map((p, idx) => (
            <div key={`${p.title}-${idx}`} className="flex flex-col items-center gap-2">
              <div className="relative h-32 w-24 overflow-hidden rounded-lg border border-line bg-line shadow-md">
                {p.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.imageUrl} alt={p.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center p-2 text-center text-xs text-neutral-400">
                    {p.title}
                  </div>
                )}
                <span className="absolute bottom-1 right-1 rounded bg-brass px-1.5 py-0.5 font-mono text-xs font-semibold text-ink shadow">
                  #{p.rank}
                </span>
              </div>
              <span className="max-w-24 truncate text-xs text-paper" title={p.title}>
                {p.title}
              </span>
            </div>
          ))}
        </div>
      )}
      <p className="font-display text-2xl font-medium text-paper">
        {finished
          ? `Placed ${placements.length} ${placements.length === 1 ? shelf.noun : `${shelf.noun}s`}.`
          : `Nothing waiting to be placed.`}
      </p>
      <p className="max-w-md text-sm text-neutral-500">
        {finished
          ? `Your ${shelf.label.toLowerCase()} ranking is ${rankedCount} deep. Add more and they'll show up here to be judged.`
          : `Every ${shelf.noun} on your rankings already has a position. Add one and it lands here first.`}
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <Link
          href={shelf.boardHref}
          className="rounded bg-brass px-3 py-2 text-sm font-medium text-ink hover:bg-brass-bright"
        >
          View the full ranking
        </Link>
        <Link
          href={shelf.addHref}
          className="rounded border border-line px-3 py-2 text-sm text-neutral-300 hover:border-brass hover:text-paper"
        >
          {shelf.addLabel}
        </Link>
      </div>
    </div>
  );
}
