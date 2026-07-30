import Link from 'next/link';
import { GoogleSignIn } from './GoogleSignIn';
import { LandingShareCardPreview } from './LandingShareCardPreview';

const DOMAINS = [
  { label: 'Movies', icon: '🎬', accent: 'from-brass/20' },
  { label: 'TV', icon: '📺', accent: 'from-moss/20' },
  { label: 'Books', icon: '📚', accent: 'from-plum/20' },
  { label: 'Games', icon: '🎮', accent: 'from-brass/20' },
] as const;

/**
 * Public marketing landing page — what signed-out visitors see at `/`
 * instead of a bare login form (issue #27). Most likely arrival path is a
 * shared Top 5 card, so this leads with what that card is and lets the
 * "ranked, not rated" pitch and a real render of the format do the
 * convincing before asking for the sign-in.
 *
 * Deliberately louder than the rest of the site's restrained in-app tone —
 * this is the one page a stranger sees before they know what druthers is, so
 * it leans on scale/contrast/glow rather than the dry "after-hours archive"
 * register everything past sign-in uses.
 */
export function PublicLanding({ googleClientId }: { googleClientId: string }) {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative flex flex-col items-center gap-6 overflow-hidden px-4 pb-16 pt-16 text-center sm:pt-24">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[32rem] bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,var(--color-brass-wash),transparent)]"
          aria-hidden
        />
        <h1 className="font-display text-6xl font-medium tracking-tight text-paper sm:text-8xl">
          <span className="mr-1 not-italic text-brass">’</span>druthers
        </h1>
        <p className="max-w-xl text-xl leading-relaxed text-neutral-200 sm:text-2xl">
          Your favorites — movies, TV, books, and games — watched, read, and
          played, then ranked into the order you&apos;d pick them again.
        </p>
        <div className="mt-4 rounded-xl border border-brass/40 bg-panel p-6 shadow-[0_0_60px_-15px_var(--color-brass-wash)]">
          <GoogleSignIn clientId={googleClientId} />
        </div>
        <Link
          href="/login"
          className="text-xs text-neutral-600 hover:text-neutral-400"
        >
          Other sign-in options
        </Link>
      </section>

      {/* Ranked, not rated — reusing the framing from /about verbatim. */}
      <section className="border-y border-line bg-panel px-6 py-14 text-center sm:px-10">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-brass">
          Not another five-star rating
        </p>
        <p className="mx-auto mt-5 max-w-2xl text-xl leading-relaxed text-paper sm:text-2xl">
          Every movie, show, book, and game here has been watched, read, or
          played — then ranked into the order we&apos;d pick them again. Not
          reviews, not ratings out of ten: just{' '}
          <Link href="/about" className="text-brass hover:text-brass-bright">
            druthers
          </Link>
          , on the record.
        </p>
      </section>

      {/* Four domains */}
      <section className="flex flex-col items-center gap-8 px-4 py-16">
        <h2 className="font-display text-3xl text-paper sm:text-4xl">
          One shelf, four collections
        </h2>
        <div className="grid w-full max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
          {DOMAINS.map((d) => (
            <div
              key={d.label}
              className={`flex flex-col items-center gap-3 rounded-xl border border-line bg-gradient-to-b ${d.accent} to-panel py-10 transition-transform hover:-translate-y-1 hover:border-brass/50`}
            >
              <span className="text-5xl" aria-hidden>
                {d.icon}
              </span>
              <span className="text-base font-medium text-paper">{d.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Top 5 share card showcase */}
      <section className="flex flex-col items-center gap-6 bg-panel px-4 py-16">
        <div className="max-w-lg text-center">
          <h2 className="font-display text-3xl text-paper sm:text-4xl">
            Rank five, get a card worth sharing
          </h2>
          <p className="mt-3 text-base text-neutral-300">
            Once you&apos;ve got a Top 5 in any category, druthers turns it
            into a shareable card in one tap — this is the actual format,
            rendered right in the browser.
          </p>
        </div>
        <div className="w-full max-w-md drop-shadow-[0_25px_60px_rgba(0,0,0,0.6)]">
          <LandingShareCardPreview />
        </div>
      </section>

      {/* Closing CTA */}
      <section className="flex flex-col items-center gap-5 px-4 py-20 text-center">
        <p className="font-display text-2xl text-paper sm:text-3xl">
          Got sent a card? Build your own shelf in under a minute.
        </p>
        <GoogleSignIn clientId={googleClientId} />
      </section>
    </div>
  );
}
