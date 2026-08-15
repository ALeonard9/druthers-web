'use client';

import { useState } from 'react';

interface DuelMovie {
  title: string;
  posterUrl: string | null;
}

function Poster({ url, className }: { url: string | null; className: string }) {
  if (!url) return <div className={`${className} bg-line`} />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" loading="lazy" className={`${className} object-cover`} />;
}

/**
 * A tappable but consequence-free "which would you rather" - real titles,
 * real poster art, no session or ranking write behind it. Landing-page
 * visitors are anonymous, so this can only gesture at the real duel flow
 * (`RankingDuel.tsx`), not run it.
 */
export function LandingDuelExample({ a, b }: { a: DuelMovie; b: DuelMovie }) {
  const [picked, setPicked] = useState<'a' | 'b' | null>(null);

  function card(side: 'a' | 'b', item: DuelMovie) {
    const isPicked = picked === side;
    const dimmed = picked !== null && !isPicked;
    return (
      <button
        type="button"
        onClick={() => setPicked(side)}
        className={`group flex flex-1 flex-col items-center gap-3 rounded-xl border bg-panel p-4 text-center transition-all ${
          isPicked
            ? 'border-brass bg-brass-wash/40'
            : 'border-line hover:border-brass/50'
        } ${dimmed ? 'opacity-50' : ''}`}
      >
        <div className="relative w-full max-w-[10rem]">
          <Poster url={item.posterUrl} className="aspect-[2/3] w-full rounded-lg" />
          {isPicked && (
            <span className="absolute -right-2 -top-2 rounded-full bg-brass px-2 py-1 font-display text-xs font-bold text-ink">
              ✓ picked
            </span>
          )}
        </div>
        <p className="line-clamp-1 text-sm font-medium text-paper">{item.title}</p>
      </button>
    );
  }

  return (
    <div className="flex w-full max-w-lg flex-col items-center gap-4">
      <div className="flex w-full items-center gap-3 sm:gap-5">
        {card('a', a)}
        <span className="shrink-0 font-display text-sm font-bold text-neutral-500">
          vs
        </span>
        {card('b', b)}
      </div>
      <p className="text-center text-sm text-neutral-400">
        {picked
          ? "That's a duel - the pick gets slotted into your shelf, no stars involved."
          : 'Tap one. This is the whole ranking mechanic.'}
      </p>
    </div>
  );
}
