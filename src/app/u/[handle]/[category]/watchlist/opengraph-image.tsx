import { ImageResponse } from 'next/og';
import { notFound } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { embedPosters, OgShareCard, profileOgData } from '@/lib/ogCards';
import type { PublicProfile } from '@/lib/types';

export const alt = 'A public watchlist on Druthers';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({
  params,
}: {
  params: Promise<{ handle: string; category: string }>;
}) {
  const { handle, category } = await params;
  let profile: PublicProfile;
  try {
    profile = await apiFetch<PublicProfile>(
      `/v1/public/${encodeURIComponent(handle)}?shelf=${encodeURIComponent(category)}&kind=watchlist&limit=5`,
      { auth: false },
    );
  } catch {
    notFound();
  }
  const shelf = profile.shelves.find((entry) => entry.slug === category);
  if (!shelf?.watchlist) notFound();
  const data = await embedPosters(profileOgData(profile, shelf, 'watchlist'));
  return new ImageResponse(<OgShareCard data={data} />, size);
}
