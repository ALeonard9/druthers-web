import type { PublicProfile, PublicShelf } from './types';

export interface OgCardItem {
  rank?: number;
  title: string;
  year: number | null;
  posterUrl: string | ArrayBuffer | null;
}

export interface OgCardData {
  eyebrow: string;
  title: string;
  description: string;
  items: OgCardItem[];
  footer: string;
}

export const GENERIC_OG_IMAGE_PATH = '/opengraph-image?v=web-200';

/**
 * The unbranded-by-user card. Served for the home page, and - byte-identical -
 * for any profile URL the caller may not see: friends-only, private, and
 * handles that do not exist. Keeping the three indistinguishable is what stops
 * the card from becoming a way to enumerate accounts, so this must never take
 * the handle or anything else caller-specific as input.
 */
export function genericOgData(): OgCardData {
  return {
    eyebrow: 'YOUR FAVORITES',
    title: 'What would you rather?',
    description: 'Movies, TV, books, and games - ranked by the choices you actually make.',
    items: [
      { rank: 1, title: 'The Matrix', year: 1999, posterUrl: 'https://image.tmdb.org/t/p/w500/dXNAPwY7VrqMAo51EKhhCJfaGb5.jpg' },
      { rank: 2, title: 'The Godfather', year: 1972, posterUrl: 'https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg' },
      { rank: 3, title: 'Spirited Away', year: 2001, posterUrl: 'https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg' },
    ],
    footer: 'druthers.io',
  };
}

export function profileOgData(
  profile: PublicProfile,
  shelf?: PublicShelf,
  kind: 'ranked' | 'watchlist' = 'ranked',
): OgCardData {
  const selected = shelf ? [shelf] : profile.shelves;
  const rawItems = selected.flatMap((entry) =>
    kind === 'watchlist'
      ? (entry.watchlist ?? []).map((item) => ({
          title: item.title,
          year: item.year,
          posterUrl: item.poster_url,
        }))
      : entry.items.map((item) => ({
          rank: item.rank,
          title: item.title,
          year: item.year,
          posterUrl: item.poster_url,
        })),
  );
  const title = shelf
    ? kind === 'watchlist'
      ? `${shelf.category} up next`
      : `All-time ${shelf.category}`
    : `${profile.display_name ?? `@${profile.handle}`}’s druthers`;

  return {
    eyebrow: `@${profile.handle}`,
    title,
    description: shelf
      ? `${kind === 'watchlist' ? shelf.watchlist_count ?? rawItems.length : shelf.ranked_count} ${kind === 'watchlist' ? 'up next' : 'ranked'}`
      : `${profile.total_ranked} favorites ranked`,
    items: rawItems.slice(0, 5),
    footer: `druthers.io/u/${profile.handle}${shelf ? `/${shelf.slug}` : ''}${kind === 'watchlist' ? '/watchlist' : ''}`,
  };
}

/** Fetch remote posters up front so one broken host degrades to text. */
export async function embedPosters(data: OgCardData): Promise<OgCardData> {
  const items = await Promise.all(
    data.items.map(async (item) => {
      if (!item.posterUrl || item.posterUrl instanceof ArrayBuffer) return item;
      try {
        const response = await fetch(item.posterUrl);
        if (!response.ok) return { ...item, posterUrl: null };
        const type = response.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
        if (!type || !['image/jpeg', 'image/png', 'image/gif'].includes(type)) {
          return { ...item, posterUrl: null };
        }

        // Satori accepts image bytes directly. Passing the ArrayBuffer avoids
        // the data-URI path that produced valid PNG cards with blank posters.
        return { ...item, posterUrl: await response.arrayBuffer() };
      } catch (e) {
        console.error('Failed to embed poster:', e);
        return { ...item, posterUrl: null };
      }
    }),
  );
  return { ...data, items };
}

export function OgShareCard({ data }: { data: OgCardData }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        background: '#101014',
        color: '#f4eddf',
        padding: '40px',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          border: '2px solid #34343d',
          borderRadius: '28px',
          padding: '30px 36px 24px',
          background: '#17171d',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', color: '#c9a86a', fontSize: 19, letterSpacing: 5, textTransform: 'uppercase' }}>
              {data.eyebrow}
            </div>
            <div style={{ display: 'flex', marginTop: 7, fontFamily: 'Georgia, serif', fontSize: 47, lineHeight: 1 }}>
              {data.title}
            </div>
            <div style={{ display: 'flex', marginTop: 9, color: '#a4a4ad', fontSize: 20 }}>{data.description}</div>
          </div>
          <div style={{ display: 'flex', color: '#c9a86a', fontFamily: 'Georgia, serif', fontSize: 30 }}>’druthers</div>
        </div>

        <div style={{ display: 'flex', gap: 18, marginTop: 20, flex: 1, minHeight: 0 }}>
          {data.items.length > 0 ? (
            data.items.map((item, index) => (
              <div key={`${item.title}-${index}`} style={{ display: 'flex', flex: 1, minWidth: 0, flexDirection: 'column' }}>
                <div
                  style={{
                    display: 'flex',
                    height: 210,
                    flexShrink: 0,
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    borderRadius: 16,
                    background: '#24242c',
                  }}
                >
                  {item.posterUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.posterUrl as string}
                      alt=""
                      width="166"
                      height="210"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ display: 'flex', color: '#c9a86a', fontFamily: 'Georgia, serif', fontSize: 52 }}>
                      {item.rank ?? index + 1}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', marginTop: 9, color: '#c9a86a', fontSize: 17 }}>
                  {item.rank ? `#${item.rank}` : 'UP NEXT'}
                </div>
                <div style={{ display: 'flex', marginTop: 3, fontSize: 18, lineHeight: 1.12, maxHeight: 41, overflow: 'hidden' }}>{item.title}</div>
                {item.year && <div style={{ display: 'flex', marginTop: 3, color: '#83838d', fontSize: 15 }}>{item.year}</div>}
              </div>
            ))
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', color: '#83838d', fontSize: 28 }}>
              The shelf is waiting for its first favorite.
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexShrink: 0, justifyContent: 'space-between', borderTop: '1px solid #34343d', marginTop: 14, paddingTop: 13, color: '#a4a4ad', fontSize: 16 }}>
          <span>{data.footer}</span>
          <span>Your favorites, ranked.</span>
        </div>
      </div>
    </div>
  );
}
