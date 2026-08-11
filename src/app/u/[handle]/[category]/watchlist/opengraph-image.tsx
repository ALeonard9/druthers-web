import { ImageResponse } from 'next/og';
import { apiFetch } from '@/lib/api';
import { embedPosters, genericOgData, OgShareCard, profileOgData } from '@/lib/ogCards';
import type { PublicProfile, PublicShelf } from '@/lib/types';

export const alt = 'A watchlist on Druthers';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({
  params,
}: {
  params: Promise<{ handle: string; category: string }>;
}) {
  const { handle, category } = await params;
  let profile: PublicProfile | null = null;
  try {
    profile = await apiFetch<PublicProfile>(
      `/v1/public/${encodeURIComponent(handle)}?shelf=${encodeURIComponent(category)}&kind=watchlist&limit=5`,
      { auth: false },
    );
  } catch {
    // Hidden, absent, or not shared with this caller -- all answered alike.
    profile = null;
  }
  const shelf: PublicShelf | undefined = profile?.shelves.find((entry) => entry.slug === category);
  const data = await embedPosters(
    profile && shelf?.watchlist ? profileOgData(profile, shelf, 'watchlist') : genericOgData(),
  );
  return new ImageResponse(<OgShareCard data={data} />, size);
}
