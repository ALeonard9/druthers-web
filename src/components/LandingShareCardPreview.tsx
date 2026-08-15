'use client';

import { useEffect, useRef } from 'react';
import type { ShareData, ShareShelf } from '@/lib/shareCards';
import { ensureFontsLoaded, renderShareCard } from '@/lib/shareCardRender';

// Sample Top 5 for the public landing page (web#134) - a visitor hasn't
// ranked anything yet, so this renders the *real* share-card canvas (same
// lib/shareCardRender used by ShareTop5Button once you're signed in)
// against illustrative data, not a live fetch. 'story' is the portrait
// ticket format - the one people actually post.
const SAMPLE_SHELF: ShareShelf = {
  category: 'movies',
  label: 'Movies',
  rankedCount: 1907,
  top: [
    { title: 'Interstellar', year: 2014 },
    { title: 'V for Vendetta', year: 2006 },
    { title: 'American Beauty', year: 1999 },
    { title: 'The Matrix', year: 1999 },
    { title: 'The Prestige', year: 2006 },
  ],
};

const SAMPLE_DATA: ShareData = {
  handle: 'adam',
  url: 'https://www.druthers.io/u/adam',
  profilePublic: true,
  shelves: [SAMPLE_SHELF],
  totalRanked: 1907,
};

export function LandingShareCardPreview() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await ensureFontsLoaded();
      const canvas = canvasRef.current;
      if (cancelled || !canvas) return;
      renderShareCard(canvas, 'story', SAMPLE_DATA, SAMPLE_SHELF);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-label="Sample Top 5 share card"
      className="h-auto w-full max-w-xs rounded-lg border border-line shadow-[0_18px_48px_rgba(0,0,0,0.5)]"
    />
  );
}
