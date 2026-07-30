import Link from 'next/link';
import { GoogleSignIn } from './GoogleSignIn';
import { LandingShareCardPreview } from './LandingShareCardPreview';

const DOMAINS = [
  { label: 'Movies', icon: '🎬' },
  { label: 'TV', icon: '📺' },
  { label: 'Books', icon: '📚' },
  { label: 'Games', icon: '🎮' },
] as const;

/**
 * Public marketing landing page — what signed-out visitors see at `/`
 * instead of a bare login form (issue #27). Most likely arrival path is a
 * shared Top 5 card, so this leads with what that card is and lets the
 * "ranked, not rated" pitch and a real render of the format do the
 * convincing before asking for the sign-in.
 */
export function PublicLanding({ googleClientId }: { googleClientId: string }) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-16 pb-12">
      {/* Hero */}
      <section className="flex flex-col items-center gap-5 pt-8 text-center">
        <h1 className="font-display text-4xl font-medium tracking-tight text-paper sm:text-5xl">
          <span className="mr-1 not-italic text-brass">’</span>druthers
        </h1>
        <p className="max-w-md text-lg leading-relaxed text-neutral-300">
          Your favorites — movies, TV, books, and games — watched, read, and
          played, then ranked into the order you&apos;d pick them again.
        </p>
        <div className="mt-2 rounded-lg border border-line bg-panel p-5">
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
      <section className="rounded-lg border border-line bg-panel px-6 py-7 text-center sm:px-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-500">
          Not another five-star rating
        </p>
        <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-neutral-200">
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
      <section className="flex flex-col items-center gap-5">
        <h2 className="font-display text-2xl text-paper">One shelf, four collections</h2>
        <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
          {DOMAINS.map((d) => (
            <div
              key={d.label}
              className="flex flex-col items-center gap-2 rounded-lg border border-line bg-panel py-6"
            >
              <span className="text-3xl" aria-hidden>
                {d.icon}
              </span>
              <span className="text-sm font-medium text-neutral-200">{d.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Top 5 share card showcase */}
      <section className="flex flex-col items-center gap-5">
        <div className="max-w-md text-center">
          <h2 className="font-display text-2xl text-paper">
            Rank five, get a card worth sharing
          </h2>
          <p className="mt-2 text-sm text-neutral-400">
            Once you&apos;ve got a Top 5 in any category, druthers turns it
            into a shareable card in one tap — this is the actual format,
            rendered right in the browser.
          </p>
        </div>
        <LandingShareCardPreview />
      </section>

      {/* Closing CTA */}
      <section className="flex flex-col items-center gap-4 border-t border-line pt-10 text-center">
        <p className="text-sm text-neutral-400">
          Got sent a card? Build your own shelf in under a minute.
        </p>
        <GoogleSignIn clientId={googleClientId} />
      </section>
    </div>
  );
}
