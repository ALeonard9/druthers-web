import { ImageResponse } from 'next/og';
import { notFound } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { embedPosters, OgShareCard, profileOgData } from '@/lib/ogCards';
import type { PublicProfile } from '@/lib/types';

export const alt = 'A public Druthers profile';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  let profile: PublicProfile;
  try {
    profile = await apiFetch<PublicProfile>(`/v1/public/${encodeURIComponent(handle)}`, {
      auth: false,
    });
  } catch {
    notFound();
  }
  const data = await embedPosters(profileOgData(profile));
  return new ImageResponse(<OgShareCard data={data} />, size);
}
