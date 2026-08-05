import { ImageResponse } from 'next/og';
import { OgShareCard } from '@/lib/ogCards';

export const alt = 'Druthers — your favorites, ranked';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    <OgShareCard
      data={{
        eyebrow: 'YOUR FAVORITES',
        title: 'What would you rather?',
        description: 'Movies, TV, books, and games — ranked by the choices you actually make.',
        items: [
          { rank: 1, title: 'Watch', year: null, posterUrl: null },
          { rank: 2, title: 'Read', year: null, posterUrl: null },
          { rank: 3, title: 'Play', year: null, posterUrl: null },
        ],
        footer: 'druthers.io',
      }}
    />,
    size,
  );
}
