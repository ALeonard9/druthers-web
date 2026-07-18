import type { Metadata } from 'next';
import { Fraunces, Instrument_Sans } from 'next/font/google';
import './globals.css';
import { NavBar } from '@/components/NavBar';

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

export const metadata: Metadata = {
  title: 'aleonard.us — Sandbox',
  description: 'Personal media trackers, rebuilt.',
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
      <body className="min-h-full flex flex-col bg-night text-neutral-100">
        <NavBar />
        <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
