import type { Metadata, Viewport } from 'next';
import { Fraunces, Instrument_Sans } from 'next/font/google';
import { headers } from 'next/headers';
import './globals.css';
import { AppShell } from '@/components/AppShell';
import { EnvBanner } from '@/components/EnvBanner';
import { ImpersonationBanner } from '@/components/ImpersonationBanner';
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister';
import { getImpersonationMeta, getSessionUser } from '@/lib/session';
import { SITE_URL } from '@/lib/shareCards';
import { GENERIC_OG_IMAGE_PATH } from '@/lib/ogCards';
import { apiFetch } from '@/lib/api';
import { isNextRedirectError } from '@/lib/nextRedirectError';
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

/**
 * A document-title prefix while impersonating, e.g. `[AS @private-user]
 * Druthers` (#250) - the third of three unmissable-impersonation mechanisms,
 * alongside the banner and the body ring, and the only one of the three that
 * covers the background-tab case: a strip or a ring can't be seen in a tab
 * that isn't focused, but the title bar can.
 *
 * `metadata` has to become `generateMetadata()` for this: a static export
 * can't read the impersonation cookie per request.
 */
export async function generateMetadata(): Promise<Metadata> {
  const impersonation = await getImpersonationMeta();
  const title = impersonation ? `[AS @${impersonation.target.handle}] ${getTitle()}` : getTitle();

  return {
    metadataBase: new URL(SITE_URL),
    title,
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
}

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
  // Non-null only while an admin is actively viewing as someone else (#250).
  // Read once, here, and passed down - the banner, the ring, and the title
  // prefix all derive from this one read rather than each tracking their own
  // copy of "am I impersonating".
  const impersonation = await getImpersonationMeta();
  // Server Components have no direct pathname access. Rather than adding a
  // second middleware entry point (Next 16 only allows one - see
  // src/proxy.ts), reuse the `x-druthers-path` header proxy.ts already
  // forwards on every request for this exact purpose.
  const path = (await headers()).get('x-druthers-path') ?? '';
  const fullWidth = path.startsWith('/admin');
  let activeShelves;
  if (user) {
    try {
      const preferences = await apiFetch<Preferences>('/v1/users/me/preferences');
      activeShelves = orderedEnabledShelves(
        normalizeShelfPreferences({ order: preferences.shelf_order, enabled: preferences.enabled_shelves }),
      );
    } catch (err) {
      // Rethrow apiFetch's own impersonation-expiry redirect (#250) rather
      // than swallowing it here - this fetch runs on every page, so it is
      // the most likely place to be the first thing that notices the token
      // died. Anything else (preferences genuinely unavailable) still falls
      // back to undefined, same as before.
      if (isNextRedirectError(err)) throw err;
      activeShelves = undefined;
    }
  }

  return (
    <html
      lang="en"
      className={`h-full antialiased ${fraunces.variable} ${instrumentSans.variable}`}
    >
      <body
        className={`min-h-full bg-night text-neutral-100 ${
          impersonation ? 'ring-4 ring-inset ring-red-600' : ''
        }`}
      >
        {/* Impersonation renders above EnvBanner - the two must never be
            confused or dismissed as a pair, and if both are ever showing
            (prod + an active view-as session) impersonation is the one that
            matters more. */}
        {impersonation && <ImpersonationBanner meta={impersonation} />}
        {/* Environment warning sits above the app shell so signed-out visitors
            on the public landing page see it too. Renders nothing in dev. */}
        <EnvBanner />
        <AppShell user={user} activeShelves={activeShelves} fullWidth={fullWidth}>
          {children}
        </AppShell>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
