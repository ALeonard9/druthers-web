'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { UserMovie } from '@/lib/types';

// Posters sit closer together than they are wide, so they overlap. The width
// itself lives in .poster-deck (globals.css) as --deck-card, which lets the
// transform below stay pure CSS calc — nothing needs measuring to paint.
const STEP_RATIO = 0.72;
// Beyond this many posters either side of the front one, stop drawing.
const DEPTH = 4;
// A flick faster than this advances the deck rather than snapping back.
const FLICK_CARDS_PER_SEC = 1.4;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/**
 * The top of a user's rankings as a deck of overlapping posters, dragged with
 * a finger. Opens on #1; the rank rides the artwork on a brass plate.
 */
export function RankedPosterDeck({
  items,
  placedCount,
}: {
  items: UserMovie[];
  placedCount: number;
}) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [drag, setDrag] = useState(0);
  const [dragging, setDragging] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  // Mirrors `drag` so the pointerup handler reads the live value rather than
  // whatever was captured when it last rendered.
  const dragRef = useRef(0);
  const pointerRef = useRef<{ id: number; x: number; t: number } | null>(null);
  const movedRef = useRef(false);

  const last = items.length - 1;
  const nearest = clamp(Math.round(index + drag), 0, last);
  const front = items[nearest];

  function setDragValue(v: number) {
    dragRef.current = v;
    setDrag(v);
  }

  function stepPx() {
    return (cardRef.current?.offsetWidth ?? 1) * STEP_RATIO;
  }

  function settle(target: number) {
    setIndex(clamp(target, 0, last));
    setDragValue(0);
    setDragging(false);
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (pointerRef.current) return;
    // Timestamps come off the events themselves rather than a clock read, so
    // nothing impure is called during a render pass.
    pointerRef.current = { id: e.pointerId, x: e.clientX, t: e.timeStamp };
    movedRef.current = false;
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const p = pointerRef.current;
    if (!p || e.pointerId !== p.id) return;
    const dx = e.clientX - p.x;
    if (Math.abs(dx) > 3) movedRef.current = true;
    let d = -dx / stepPx();
    // Rubber-band rather than hard-stop when dragged past either end.
    if (index + d < 0) d = -index + (index + d) * 0.3;
    if (index + d > last) d = last - index + (index + d - last) * 0.3;
    setDragValue(d);
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    const p = pointerRef.current;
    if (!p || e.pointerId !== p.id) return;
    const d = dragRef.current;
    const velocity = (d / Math.max(e.timeStamp - p.t, 1)) * 1000;
    pointerRef.current = null;
    const target =
      Math.abs(velocity) > FLICK_CARDS_PER_SEC
        ? index + Math.sign(d) * Math.max(1, Math.round(Math.abs(d)))
        : Math.round(index + d);
    settle(target);
  }

  // Tapping a poster behind the front one brings it forward; tapping the front
  // one opens the movie.
  function onCardClick(i: number) {
    if (movedRef.current) return;
    if (i === nearest) router.push(`/movies/${items[i].movie.id}`);
    else settle(i);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      settle(index + 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      settle(index - 1);
    }
  }

  return (
    <section className="poster-deck" aria-label="Your highest ranked movies">
      <div
        className="relative select-none touch-pan-y [overflow-x:clip] [overflow-y:visible]"
        style={{ height: 'calc(var(--deck-card) * 1.5 + 1.5rem)' }}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
      >
        {items.map((m, i) => {
          const offset = i - index - drag;
          const depth = Math.abs(offset);
          const scale = Math.max(0.7, 1 - depth * 0.085);
          const lift = Math.min(depth, DEPTH) * 5;
          return (
            <div
              key={m.movie.id}
              ref={i === 0 ? cardRef : undefined}
              onClick={() => onCardClick(i)}
              className={`deck-card absolute left-1/2 top-1.5 w-[var(--deck-card)] cursor-pointer ${
                dragging
                  ? ''
                  : 'transition-[transform,opacity] duration-[420ms] ease-out'
              }`}
              style={{
                transform: `translate3d(calc(-50% + (${offset.toFixed(3)} * var(--deck-step))), ${lift}px, 0) scale(${scale.toFixed(3)})`,
                zIndex: 1000 - Math.round(depth * 10),
                opacity: depth > 3.4 ? 0 : Math.max(0, 1 - depth * 0.13),
                visibility: depth > DEPTH ? 'hidden' : 'visible',
              }}
            >
              <div className="relative aspect-[2/3] overflow-hidden rounded-md border border-line bg-panel shadow-[0_18px_34px_-16px_rgba(0,0,0,0.95)]">
                {m.movie.poster_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={m.movie.poster_url}
                    alt=""
                    draggable={false}
                    loading={i < 6 ? 'eager' : 'lazy'}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-line" />
                )}
                <span className="deck-plate absolute bottom-2.5 left-2.5 min-w-8 rounded px-2 py-0.5 text-center font-display text-xl font-bold tabular-nums text-ink">
                  {m.rank}
                </span>
                <div
                  className={`pointer-events-none absolute inset-0 bg-night ${
                    dragging ? '' : 'transition-opacity duration-[420ms] ease-out'
                  }`}
                  style={{ opacity: Math.min(0.55, depth * 0.26) }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div key={front.movie.id} className="deck-caption mt-5 text-center">
        <p className="font-display text-xl font-medium tracking-tight text-paper">
          {front.movie.title}
        </p>
        <p className="mt-1 text-sm text-neutral-400 tabular-nums">
          {[front.movie.year, front.movie.genre?.split(',')[0]?.trim()]
            .filter(Boolean)
            .join(' · ')}
        </p>
      </div>

      <div className="mt-4 flex flex-col items-center gap-2">
        <div className="h-0.5 w-[min(180px,44vw)] overflow-hidden rounded bg-line">
          <span
            className="block h-full rounded bg-brass transition-[width] duration-300"
            style={{ width: `${((nearest + 1) / items.length) * 100}%` }}
          />
        </div>
        <p className="text-xs text-neutral-500">
          Drag to move down the list · top {items.length} of {placedCount}
        </p>
      </div>
    </section>
  );
}
