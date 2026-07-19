import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import type { PublicProfile } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ handle: string }>;
}

// Public, read-only profile (#143): the owner's opted-in ranked lists and
// nothing else. Deliberately no session check — this is the shareable page.
async function fetchProfile(handle: string): Promise<PublicProfile | null> {
  try {
    return await apiFetch<PublicProfile>(
      `/v1/public/${encodeURIComponent(handle)}`,
      { auth: false },
    );
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  return {
    title: `@${handle} — Druthers`,
    description: `@${handle}’s druthers: their favorites, ranked.`,
  };
}

export default async function PublicProfilePage({ params }: Props) {
  const { handle } = await params;
  const profile = await fetchProfile(handle);
  if (!profile) notFound();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-brass">
          @{profile.handle}’s all-timers
        </p>
        <h1 className="mt-1 font-display text-3xl font-medium tracking-tight text-paper">
          {profile.display_name ?? `@${profile.handle}`}
        </h1>
        <p className="text-sm text-neutral-400">
          {profile.total_ranked} ranked · shared shelves only
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {profile.shelves.map((shelf) => (
          <section
            key={shelf.category}
            className="rounded-lg border border-line bg-panel"
          >
            <div className="flex items-baseline justify-between border-b border-line px-4 py-3">
              <h2 className="font-display text-lg text-paper">
                {shelf.category}
              </h2>
              <span className="font-mono text-xs text-neutral-500">
                {shelf.ranked_count} ranked
              </span>
            </div>
            <ol>
              {shelf.items.map((item) => (
                <li
                  key={`${shelf.category}-${item.rank}`}
                  className="flex items-center gap-3 border-b border-line/60 px-4 py-2 text-sm last:border-b-0"
                >
                  <span className="inline-flex h-6 w-8 shrink-0 items-center justify-center rounded bg-brass-wash font-display text-sm text-brass">
                    {item.rank}
                  </span>
                  <span className="flex-1 truncate text-neutral-200">
                    {item.title}
                  </span>
                  {item.year && (
                    <span className="shrink-0 font-mono text-xs text-neutral-500">
                      {item.year}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>

      <p className="text-center font-mono text-[11px] uppercase tracking-[0.18em] text-neutral-600">
        www.druthers.io — your favorites, ranked
      </p>
    </div>
  );
}
