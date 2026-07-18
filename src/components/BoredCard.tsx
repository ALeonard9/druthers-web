'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { boredHref } from '@/lib/bored';
import type { BoredResponse } from '@/lib/types';

const DRAW_LABEL: Record<string, string> = {
  movie: 'Movie',
  tv_show: 'Series',
  game: 'Game',
  book: 'Book',
  country: 'Trip',
};

// The pick, styled as a paper ticket stub: poster above a perforated tear
// line, the "printed" draw below it. Re-rolls via the BFF route, excluding
// items already shown this session so "Draw again" doesn't repeat itself.
export function BoredCard({ initial }: { initial: BoredResponse | null }) {
  const [data, setData] = useState(initial);
  const [shown, setShown] = useState<string[]>(
    initial ? [initial.pick.entity_id] : [],
  );
  const [pending, startTransition] = useTransition();

  function draw() {
    startTransition(async () => {
      const exclude = shown.join(',');
      const res = await fetch(
        `/api/bored${exclude ? `?exclude=${encodeURIComponent(exclude)}` : ''}`,
      );
      if (!res.ok) {
        setData(null);
        return;
      }
      const next: BoredResponse = await res.json();
      setData(next);
      setShown((prev) => [...prev, next.pick.entity_id]);
    });
  }

  if (!data) {
    return (
      <p className="max-w-sm text-sm text-neutral-400">
        Nothing to draw from yet. Add something to a watchlist or bucket
        list, then come back.
      </p>
    );
  }

  const { pick, pool_size: poolSize } = data;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="-rotate-2">
        {/* Keyed on the pick so each draw re-deals the ticket. */}
        <div
          key={pick.entity_id}
          className="deal-in w-64 rounded-lg bg-[#f2ead8] shadow-[0_12px_40px_rgba(0,0,0,0.55)]"
        >
          {/* Artwork inset on the paper, like a printed ticket. */}
          <div className="px-3 pb-4 pt-3">
            {pick.poster_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={pick.poster_url}
                alt={pick.title}
                className="h-[22rem] w-full rounded object-cover"
              />
            ) : (
              <div className="flex h-[22rem] w-full items-center justify-center rounded bg-[#e6dcc4] text-5xl">
                🎟️
              </div>
            )}
          </div>

          {/* Perforated tear line with punched notches. */}
          <div className="relative">
            <div className="border-t-2 border-dashed border-[#c9bda0]" />
            <span className="absolute -left-2.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-night" />
            <span className="absolute -right-2.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-night" />
          </div>

          <div className="flex flex-col gap-1.5 px-5 pb-5 pt-4 text-left">
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#8a7d5e]">
              Tonight&apos;s draw · {DRAW_LABEL[pick.category] ?? pick.category}
            </span>
            <Link
              href={boredHref(pick)}
              className="text-xl font-semibold leading-snug text-[#1c1917] hover:underline"
            >
              {pick.title}
            </Link>
            {pick.subtitle && (
              <span className="text-sm text-[#6b5f45]">{pick.subtitle}</span>
            )}
          </div>
        </div>
      </div>

      <p className="font-mono text-xs text-neutral-500">
        Drawn from {poolSize} thing{poolSize === 1 ? '' : 's'}{' '}
        you&apos;ve been meaning to get to.
      </p>
      <button
        onClick={draw}
        disabled={pending || poolSize <= 1}
        className="rounded bg-brass px-5 py-2 text-sm font-medium text-ink hover:bg-brass-bright focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass disabled:opacity-50"
      >
        {pending ? 'Drawing…' : 'Draw again'}
      </button>
    </div>
  );
}
