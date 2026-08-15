import Link from 'next/link';
import { redirect } from 'next/navigation';
import { RankingDuel } from '@/components/RankingDuel';
import { duelLists, type DuelEntry, type ShelfConfig } from '@/lib/duelShelves';

/**
 * The chrome around a comparison session, shared by all five shelves: a
 * header that says which shelf is being judged and how deep it is, the duel
 * itself, and the standing link back to the drag-and-drop board.
 *
 * Deliberately not the section tab rail - the tabs mark the active page by
 * exact path, so a duel route would light up the wrong tab. A crumb back to
 * the board says where you are more honestly.
 */
export function RankingDuelPage({
  shelf,
  entries,
  focusId,
  priorRank,
}: {
  shelf: ShelfConfig;
  entries: DuelEntry[];
  /** A specific title to place first, from the board's "Place it →" link. */
  focusId?: string;
  /** `focusId`'s rank just before a "Rerank" sent it back through the duel. */
  priorRank?: number;
}) {
  const { ranked, queue } = duelLists(entries, focusId);

  // A duel needs a candidate plus at least one ranked opponent to compare it
  // against. An empty queue means every shelf title already has a position -
  // or the shelf has nothing on it at all - so there's no question the duel
  // could ask. Land on the shelf's icon view instead, so finishing the queue
  // returns to browsing rather than opening another ranking screen (web#296).
  if (queue.length === 0) redirect(shelf.shelfHref);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-3">
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-4">
          <h1 className="font-display text-2xl font-medium tracking-tight text-paper">
            Rank by comparison
          </h1>
          <span className="shrink-0 pt-1 text-right text-xs leading-relaxed text-neutral-500">
            {ranked.length} placed
            {queue.length > 0 && ` · ${queue.length} to judge`}
          </span>
        </div>
        <Link
          href={shelf.boardHref}
          aria-label={`Back to ${shelf.label} board`}
          className="group inline-flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border border-brass/45 bg-brass-wash px-3 py-2 text-sm font-medium text-paper transition-colors hover:border-brass hover:bg-brass/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-brass sm:w-fit"
        >
          <span className="inline-flex items-center gap-2">
            <span aria-hidden="true" className="text-brass transition-transform group-hover:-translate-x-0.5">←</span>
            Back to {shelf.label}
          </span>
          <span className="border-l border-brass/30 pl-3 text-xs font-normal text-brass">
            Use the board
          </span>
        </Link>
      </div>

      <RankingDuel
        shelf={shelf}
        ranked={ranked}
        queue={queue}
        rerankId={focusId}
        priorRank={priorRank}
      />
    </div>
  );
}
