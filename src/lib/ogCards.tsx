import type { PublicProfile, PublicShelf } from './types';

export interface OgCardItem {
  rank?: number;
  title: string;
  year: number | null;
  posterUrl: string | null;
}

export interface OgCardData {
  eyebrow: string;
  title: string;
  description: string;
  items: OgCardItem[];
  footer: string;
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
      if (!item.posterUrl) return item;
      try {
        const response = await fetch(item.posterUrl);
        if (!response.ok) return { ...item, posterUrl: null };
        const type = response.headers.get('content-type') ?? 'image/jpeg';

        const buffer = await response.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const b64 = btoa(binary);

        return { ...item, posterUrl: `data:${type};base64,${b64}` };
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
        padding: '64px',
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
          padding: '42px 48px',
          background: '#17171d',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', color: '#c9a86a', fontSize: 22, letterSpacing: 5, textTransform: 'uppercase' }}>
              {data.eyebrow}
            </div>
            <div style={{ display: 'flex', marginTop: 10, fontFamily: 'Georgia, serif', fontSize: 58, lineHeight: 1 }}>
              {data.title}
            </div>
            <div style={{ display: 'flex', marginTop: 14, color: '#a4a4ad', fontSize: 23 }}>{data.description}</div>
          </div>
          <div style={{ display: 'flex', color: '#c9a86a', fontFamily: 'Georgia, serif', fontSize: 32 }}>’druthers</div>
        </div>

        <div style={{ display: 'flex', gap: 22, marginTop: 34, flex: 1 }}>
          {data.items.length > 0 ? (
            data.items.map((item, index) => (
              <div key={`${item.title}-${index}`} style={{ display: 'flex', flex: 1, minWidth: 0, flexDirection: 'column' }}>
                <div
                  style={{
                    display: 'flex',
                    height: 250,
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    borderRadius: 16,
                    background: '#24242c',
                  }}
                >
                  {item.posterUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.posterUrl} alt="" width="166" height="250" style={{ objectFit: 'cover' }} />
                  ) : (
                    <div style={{ display: 'flex', color: '#c9a86a', fontFamily: 'Georgia, serif', fontSize: 58 }}>
                      {item.rank ?? index + 1}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', marginTop: 14, color: '#c9a86a', fontSize: 20 }}>
                  {item.rank ? `#${item.rank}` : 'UP NEXT'}
                </div>
                <div style={{ display: 'flex', marginTop: 4, fontSize: 22, lineHeight: 1.15 }}>{item.title}</div>
                {item.year && <div style={{ display: 'flex', marginTop: 5, color: '#83838d', fontSize: 17 }}>{item.year}</div>}
              </div>
            ))
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', color: '#83838d', fontSize: 28 }}>
              The shelf is waiting for its first favorite.
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #34343d', paddingTop: 20, color: '#a4a4ad', fontSize: 18 }}>
          <span>{data.footer}</span>
          <span>Your favorites, ranked.</span>
        </div>
      </div>
    </div>
  );
}
