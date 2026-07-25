import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Why “druthers” — Druthers',
  description: 'What the name druthers means and why the site wears it.',
};

// Intentionally public — no session redirect. A visitor puzzling over the
// name shouldn't need an account to get the joke.
export default function AboutPage() {
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div className="rotate-[-0.6deg] rounded-lg bg-paper px-7 py-8 text-ink shadow-[0_18px_48px_rgba(0,0,0,0.55)]">
        <div className="flex items-baseline justify-between border-b border-dashed border-brass/40 pb-4">
          <span className="font-display text-2xl font-semibold">’druthers</span>
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-brass-wash/70">
            noun · american slang
          </span>
        </div>
        <p className="mt-5 font-display text-lg italic leading-relaxed">
          “If I had my druthers…”
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink/80">
          Say <em>“I’d rather”</em> fast and often enough and it squishes into{' '}
          <em>druthers</em> — 19th-century American slang for your preferences:
          the things you’d pick, given the choice.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink/80">
          That’s exactly what this site is. Every movie, show, book, and game
          here has been watched, read, or played — then ranked into the order
          we’d pick them again. Not reviews, not ratings out of ten: just
          druthers, on the record.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink/80">
          The stray apostrophe in the wordmark is the one <em>’d rather</em>{' '}
          left behind.
        </p>
      </div>
      <section className="rounded-lg border border-line bg-panel px-6 py-5">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-500">
          The data on the shelves
        </h2>
        <ul className="mt-3 flex flex-col gap-2.5 text-sm leading-relaxed text-neutral-400">
          <li className="flex flex-col gap-2">
            <span>
              Movie data and posters from{' '}
              <a
                href="https://www.themoviedb.org/"
                className="text-brass hover:text-brass-bright"
                rel="noreferrer"
                target="_blank"
              >
                TMDB
              </a>
              .
            </span>
            {/*
              TMDB requires this exact sentence alongside an unmodified logo
              for every application using their data or images. Don't reword
              it, and don't recolor or crop the mark.
              https://www.themoviedb.org/about/logos-attribution
            */}
            <span className="flex items-center gap-2.5">
              <img
                src="/tmdb.svg"
                alt="TMDB"
                className="h-3 w-auto shrink-0"
              />
              <span className="text-xs text-neutral-500">
                This product uses the TMDB API but is not endorsed or certified
                by TMDB.
              </span>
            </span>
          </li>
          <li>
            TV shows, episodes, and air dates from{' '}
            <a
              href="https://www.tvmaze.com"
              className="text-brass hover:text-brass-bright"
              rel="noreferrer"
              target="_blank"
            >
              TVmaze
            </a>{' '}
            (licensed{' '}
            <a
              href="https://creativecommons.org/licenses/by-sa/4.0/"
              className="underline decoration-line hover:text-neutral-300"
              rel="noreferrer"
              target="_blank"
            >
              CC BY-SA 4.0
            </a>
            ).
          </li>
          <li>
            Book records and covers from{' '}
            <a
              href="https://openlibrary.org"
              className="text-brass hover:text-brass-bright"
              rel="noreferrer"
              target="_blank"
            >
              Open Library
            </a>
            , an Internet Archive project.
          </li>
          <li>
            Video game data and covers from{' '}
            <a
              href="https://www.igdb.com"
              className="text-brass hover:text-brass-bright"
              rel="noreferrer"
              target="_blank"
            >
              IGDB.com
            </a>
            .
          </li>
        </ul>
        <p className="mt-3 text-xs text-neutral-600">
          druthers is a personal, non-commercial project and isn’t endorsed by
          or affiliated with any of these services.
        </p>
      </section>
      <Link
        href="/"
        className="self-center text-sm text-neutral-400 transition-colors hover:text-paper"
      >
        ← Back to the collection
      </Link>
    </div>
  );
}
