import type { Metadata, Viewport } from 'next';
import { Fraunces, Instrument_Sans } from 'next/font/google';
import './globals.css';
import { AppShell } from '@/components/AppShell';
import { EnvBanner } from '@/components/EnvBanner';
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister';
import { getSessionUser } from '@/lib/session';
import { SITE_URL } from '@/lib/shareCards';
import { GENERIC_OG_IMAGE_PATH } from '@/lib/ogCards';
import { apiFetch } from '@/lib/api';
import { normalizeShelfPreferences, orderedEnabledShelves } from '@/lib/shelfPreferences';
import type { Preferences } from '@/lib/types';

// Display face: bookish, characterful - wordmark, page titles, rank numerals.
const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
});

// Body face: a quiet grotesque that stays out of the collection's way.
const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-instrument',
});

// Add environment marker to title outside prod (mirrors EnvBadge).
const getTitle = () => {
  const env = (process.env.NEXT_PUBLIC_APP_ENV ?? 'dev').toLowerCase();
  const baseTitle = 'Druthers';
  if (env === 'qa') {
    return `[QA] ${baseTitle}`;
  }
  if (env !== 'prod' && env !== 'production') {
    return `[DEV] ${baseTitle}`;
  }
  return baseTitle;
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: getTitle(),
  description: 'Your favorites - watched, read, played, and ranked.',
  openGraph: {
    type: 'website',
    siteName: 'Druthers',
    title: 'Druthers - your favorites, ranked',
    description: 'Your favorites - watched, read, played, and ranked.',
    images: [
      {
        url: GENERIC_OG_IMAGE_PATH,
        type: 'image/png',
        width: 1200,
        height: 630,
        alt: 'Druthers - your favorites, ranked',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Druthers - your favorites, ranked',
    description: 'Your favorites - watched, read, played, and ranked.',
    images: [GENERIC_OG_IMAGE_PATH],
  },
  appleWebApp: {
    title: 'Druthers',
    statusBarStyle: 'black-translucent',
  },
};

export const viewport: Viewport = {
  themeColor: '#101014',
  colorScheme: 'dark',
  viewportFit: 'cover',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Signed-out visitors only ever reach public pages (the landing page,
  // /login, /about) - none of them want the logged-in app shell (its nav
  // just bounces back to /login anyway). Keeping this check here, rather
  // than per-page, is what lets the public landing page (#27) go chrome-free
  // without a route-group refactor of every existing page.
  const user = await getSessionUser();
  let activeShelves;
  if (user) {
    try {
      const preferences = await apiFetch<Preferences>('/v1/users/me/preferences');
      activeShelves = orderedEnabledShelves(
        normalizeShelfPreferences({ order: preferences.shelf_order, enabled: preferences.enabled_shelves }),
      );
    } catch {
      activeShelves = undefined;
    }
  }

  return (
    <html
      lang="en"
      className={`h-full antialiased ${fraunces.variable} ${instrumentSans.variable}`}
    >
      <body className="min-h-full bg-night text-neutral-100">
        {/* Environment warning sits above the app shell so signed-out visitors
            on the public landing page see it too. Renders nothing in dev. */}
        <EnvBanner />
        <AppShell user={user} activeShelves={activeShelves}>{children}</AppShell>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
