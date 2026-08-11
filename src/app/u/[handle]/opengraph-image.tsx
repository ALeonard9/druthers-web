import { ImageResponse } from 'next/og';
import { apiFetch } from '@/lib/api';
import { embedPosters, genericOgData, OgShareCard, profileOgData } from '@/lib/ogCards';
import type { PublicProfile } from '@/lib/types';

export const alt = 'A Druthers profile';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  let profile: PublicProfile | null = null;
  try {
    profile = await apiFetch<PublicProfile>(`/v1/public/${encodeURIComponent(handle)}`, {
      auth: false,
    });
  } catch {
    // The profile is private, friends-only, or absent -- the API answers all
    // three the same way on purpose. Serving the generic card rather than a 404
    // keeps them indistinguishable here too, and stops the unavailable page's
    // own og:image tag from resolving to nothing (a blank Facebook card).
    profile = null;
  }
  const data = await embedPosters(profile ? profileOgData(profile) : genericOgData());
  return new ImageResponse(<OgShareCard data={data} />, size);
}
