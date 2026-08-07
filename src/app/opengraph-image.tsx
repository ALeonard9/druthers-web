import { ImageResponse } from 'next/og';
import { OgShareCard, embedPosters } from '@/lib/ogCards';

export const alt = 'Druthers — your favorites, ranked';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  const data = await embedPosters({
    eyebrow: 'YOUR FAVORITES',
    title: 'What would you rather?',
    description: 'Movies, TV, books, and games — ranked by the choices you actually make.',
    items: [
      { rank: 1, title: 'The Matrix', year: 1999, posterUrl: 'https://image.tmdb.org/t/p/w500/dXNAPwY7VrqMAo51EKhhCJfaGb5.jpg' },
      { rank: 2, title: 'The Godfather', year: 1972, posterUrl: 'https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg' },
      { rank: 3, title: 'Spirited Away', year: 2001, posterUrl: 'https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg' },
    ],
    footer: 'druthers.io',
  });

  return new ImageResponse(
    <OgShareCard data={data} />,
    size,
  );
}
