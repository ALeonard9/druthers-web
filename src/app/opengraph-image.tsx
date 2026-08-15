import { ImageResponse } from 'next/og';
import { OgShareCard, embedPosters, genericOgData } from '@/lib/ogCards';

export const alt = 'Druthers - your favorites, ranked';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  const data = await embedPosters(genericOgData());

  return new ImageResponse(
    <OgShareCard data={data} />,
    size,
  );
}
