import type { Metadata, Viewport } from 'next';
import { Fraunces, Instrument_Sans } from 'next/font/google';
import './globals.css';
import { Sidebar, BottomTabs } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister';
import { RefreshHomeOnReturn } from '@/components/RefreshHomeOnReturn';
import { getSessionUser } from '@/lib/session';
import { SITE_URL } from '@/lib/shareCards';

// Display face: bookish, characterful — wordmark, page titles, rank numerals.
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
  description: 'Your favorites — watched, read, played, and ranked.',
  openGraph: {
    type: 'website',
    siteName: 'Druthers',
    title: 'Druthers — your favorites, ranked',
    description: 'Your favorites — watched, read, played, and ranked.',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Druthers — your favorites, ranked',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Druthers — your favorites, ranked',
    description: 'Your favorites — watched, read, played, and ranked.',
    images: ['/opengraph-image'],
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
  // /login, /about) — none of them want the logged-in app shell (its nav
  // just bounces back to /login anyway). Keeping this check here, rather
  // than per-page, is what lets the public landing page (#27) go chrome-free
  // without a route-group refactor of every existing page.
  const user = await getSessionUser();

  return (
    <html
      lang="en"
      className={`h-full antialiased ${fraunces.variable} ${instrumentSans.variable}`}
    >
      <body className="min-h-full bg-night text-neutral-100">
        {user ? (
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex min-w-0 flex-1 flex-col">
              <TopBar />
              <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 pb-[calc(6rem+env(safe-area-inset-bottom))] md:px-8 md:pb-8">
                {children}
              </main>
            </div>
          </div>
        ) : (
          <main className="min-h-screen px-4 py-8 md:px-8">{children}</main>
        )}
        {user && <BottomTabs />}
        {user && <RefreshHomeOnReturn />}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
