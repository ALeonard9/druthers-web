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
      <Link
        href="/"
        className="self-center text-sm text-neutral-400 transition-colors hover:text-paper"
      >
        ← Back to the collection
      </Link>
    </div>
  );
}
