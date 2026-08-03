import Link from 'next/link';
import { RankingDuel } from '@/components/RankingDuel';
import { duelLists, type DuelEntry, type ShelfConfig } from '@/lib/duelShelves';

/**
 * The chrome around a comparison session, shared by all five shelves: a
 * header that says which shelf is being judged and how deep it is, the duel
 * itself, and the standing link back to the drag-and-drop board.
 *
 * Deliberately not the section tab rail — the tabs mark the active page by
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

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-3">
      {/* Kept to two compact rows: every pixel here is one the posters don't
          get, and the whole point is to see the question without scrolling. */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div className="flex items-baseline gap-3">
          <h1 className="font-display text-2xl font-medium tracking-tight text-paper">
            Rank by comparison
          </h1>
          <span className="text-xs text-neutral-500">
            {ranked.length} placed
            {queue.length > 0 && ` · ${queue.length} to judge`}
          </span>
        </div>
        <Link
          href={shelf.boardHref}
          className="text-xs text-neutral-400 hover:text-brass"
        >
          ← Back to {shelf.label} · prefer dragging? Use the board →
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
