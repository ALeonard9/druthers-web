import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ComparisonView } from '@/components/ComparisonView';
import { PrivateProfileNotice } from '@/components/PrivateProfileNotice';
import { fetchComparison } from '@/lib/comparison';
import { getSessionUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ handle: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  return {
    title: `You × @${handle} — Druthers`,
    description: `Compare your favorites with @${handle}.`,
  };
}

export default async function ComparisonPage({ params }: Props) {
  const { handle } = await params;
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/u/${handle}/compare`)}`);

  const comparison = await fetchComparison(handle);
  if (!comparison) return <PrivateProfileNotice handle={handle} />;
  return <ComparisonView initial={comparison} />;
}
