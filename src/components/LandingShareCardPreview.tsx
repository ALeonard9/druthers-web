'use client';

import { useEffect, useRef } from 'react';
import type { ShareData, ShareShelf } from '@/lib/shareCards';
import { ensureFontsLoaded, renderShareCard } from '@/lib/shareCardRender';

// Sample Top 5 for the public landing page — a visitor hasn't ranked
// anything yet, so this renders the *real* share-card canvas (same
// lib/shareCardRender used by ShareTop5Button once you're signed in) against
// fictional, non-personal data. It's here to show what the format looks
// like, not to claim it's anyone's actual list.
const SAMPLE_SHELF: ShareShelf = {
  category: 'movies',
  label: 'Movies',
  rankedCount: 5,
  top: [
    { title: 'The Godfather', year: 1972 },
    { title: 'Spirited Away', year: 2001 },
    { title: 'Parasite', year: 2019 },
    { title: 'Mad Max: Fury Road', year: 2015 },
    { title: 'The Grand Budapest Hotel', year: 2014 },
  ],
};

const SAMPLE_DATA: ShareData = {
  handle: 'yourname',
  url: 'https://www.druthers.io/u/yourname',
  profilePublic: true,
  shelves: [SAMPLE_SHELF],
  totalRanked: 5,
};

export function LandingShareCardPreview() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await ensureFontsLoaded();
      const canvas = canvasRef.current;
      if (cancelled || !canvas) return;
      renderShareCard(canvas, 'square', SAMPLE_DATA, SAMPLE_SHELF);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-label="Sample Top 5 share card"
      className="h-auto w-full max-w-sm rounded-lg border border-line shadow-[0_18px_48px_rgba(0,0,0,0.5)]"
    />
  );
}
