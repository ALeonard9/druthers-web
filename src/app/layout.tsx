import type { Metadata } from 'next';
import { Fraunces, Instrument_Sans } from 'next/font/google';
import './globals.css';
import { Sidebar, BottomTabs } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';

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
  title: getTitle(),
  description: 'Your favorites — watched, read, played, and ranked.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full antialiased ${fraunces.variable} ${instrumentSans.variable}`}
    >
      <body className="min-h-full bg-night text-neutral-100">
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <TopBar />
            <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 pb-24 md:px-8 md:pb-8">
              {children}
            </main>
          </div>
        </div>
        <BottomTabs />
      </body>
    </html>
  );
}
