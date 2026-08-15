import Link from 'next/link';
import { LANDING_DUEL_ITEMS, LANDING_CAROUSEL_ITEMS } from '@/lib/landingMovies';
import { GoogleSignIn } from './GoogleSignIn';
import { LandingDuelExample } from './LandingDuelExample';
import { RankedPosterDeck } from './RankedPosterDeck';
import { LandingShareCardPreview } from './LandingShareCardPreview';
import { ShareTop5Button } from './ShareTop5Button';
import { SITE_URL, type ShareData } from '@/lib/shareCards';

const DOMAINS = [
  { label: 'Movies', icon: '🎬', accent: 'from-brass/20' },
  { label: 'TV', icon: '📺', accent: 'from-moss/20' },
  { label: 'Books', icon: '📚', accent: 'from-plum/20' },
  { label: 'Games', icon: '🎮', accent: 'from-brass/20' },
] as const;

const LANDING_SHARE_DATA: ShareData = {
  handle: null,
  url: SITE_URL,
  profilePublic: false,
  shelves: [
    {
      category: 'movies',
      label: 'Movies',
      rankedCount: LANDING_CAROUSEL_ITEMS.length,
      top: LANDING_CAROUSEL_ITEMS.map((item) => ({
        title: item.title,
        year: Number(item.subtitle),
        posterUrl: item.posterUrl,
      })),
    },
  ],
  totalRanked: LANDING_CAROUSEL_ITEMS.length,
};

/**
 * Public marketing landing page - what signed-out visitors see at `/`
 * instead of a bare login form (issue #27). Walks the three-step loop (pick
 * a domain, rank via duels, share a shelf) and demonstrates the last two
 * steps against a small fixed set of widely recognisable movies (#134) -
 * deliberately not any one account's real shelf, so a stranger's obscure or
 * mismatched rankings can never be what a new visitor sees first.
 *
 * Deliberately louder than the rest of the site's restrained in-app tone -
 * this is the one page a stranger sees before they know what druthers is, so
 * it leans on scale/contrast/glow rather than the dry "after-hours archive"
 * register everything past sign-in uses.
 */
export function PublicLanding({ googleClientId }: { googleClientId: string }) {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative flex flex-col items-center gap-7 overflow-hidden px-4 pb-24 pt-20 text-center sm:pt-28">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[32rem] bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,var(--color-brass-wash),transparent)]"
          aria-hidden
        />
        <div className="absolute right-4 top-4 sm:right-8 sm:top-8">
          <ShareTop5Button
            data={LANDING_SHARE_DATA}
            destination={{
              url: SITE_URL,
              label: 'druthers.io',
              visibility: 'public',
              warning: null,
              settingsHref: null,
            }}
          />
        </div>
        <h1 className="font-display text-6xl font-medium tracking-tight text-paper sm:text-8xl">
          <span className="mr-1 not-italic text-brass">’</span>druthers
        </h1>
        <p className="max-w-xl text-xl leading-relaxed text-neutral-200 sm:text-2xl">
          Your favorites - movies, TV, books, and games - watched, read, and
          played, then ranked into the order you&apos;d pick them again.
        </p>
        <div className="mt-3 rounded-xl border border-brass/40 bg-panel p-6 shadow-[0_0_60px_-15px_var(--color-brass-wash)]">
          <GoogleSignIn clientId={googleClientId} />
        </div>
        <Link
          href="/login"
          className="text-xs text-neutral-600 hover:text-neutral-400"
        >
          Other sign-in options
        </Link>
      </section>

      {/* Four domains + the three-step loop (web#134) */}
      <section className="flex flex-col items-center gap-10 px-4 py-24">
        <div className="max-w-xl text-center">
          <h2 className="font-display text-3xl text-paper sm:text-4xl">
            One shelf, four collections
          </h2>
          <p className="mt-3 text-base text-neutral-300">
            Pick a domain, rank what&apos;s on it through quick head-to-head{' '}
            <span className="text-brass">duels</span>, then share the shelf
            that comes out the other end.
          </p>
        </div>
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

      {/* Example duel - tappable but not wired to a real ranking write (no
          session to write against, and this isn't anyone's actual shelf). */}
      <section className="flex flex-col items-center gap-8 border-y border-line bg-panel px-4 py-24">
        <div className="max-w-lg text-center">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-brass">
            Step two
          </p>
          <h2 className="mt-3 font-display text-3xl text-paper sm:text-4xl">
            Rank by dueling, not by starring
          </h2>
        </div>
        <LandingDuelExample a={LANDING_DUEL_ITEMS[0]} b={LANDING_DUEL_ITEMS[1]} />
      </section>

      {/* Top 5 carousel - a fixed, generally-popular set (#134), not any
          one account's real shelf. */}
      <section className="flex flex-col items-center gap-8 px-4 py-24">
        <div className="max-w-lg text-center">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-brass">
            Step three
          </p>
          <h2 className="mt-3 font-display text-3xl text-paper sm:text-4xl">
            This is what a ranked shelf looks like
          </h2>
        </div>
        <div className="w-full max-w-sm">
          <RankedPosterDeck
            items={LANDING_CAROUSEL_ITEMS}
            placedCount={LANDING_CAROUSEL_ITEMS.length}
            label="A ranked shelf on druthers"
            interactive={false}
          />
        </div>
      </section>

      {/* Step four - the sharing payoff: a real render of the actual card
          format (lib/shareCardRender, same canvas ShareTop5Button uses),
          against illustrative data rather than a live fetch. */}
      <section className="flex flex-col items-center gap-8 border-y border-line bg-panel px-4 py-24">
        <div className="max-w-lg text-center">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-brass">
            Step four
          </p>
          <h2 className="mt-3 font-display text-3xl text-paper sm:text-4xl">
            Rank five, get a card worth sharing
          </h2>
          <p className="mt-3 text-base text-neutral-300">
            Once you&apos;ve got a Top 5 in any category, druthers turns it
            into a shareable card in one tap - this is the actual format,
            rendered right in the browser.
          </p>
        </div>
        <div className="w-full max-w-xs drop-shadow-[0_25px_60px_rgba(0,0,0,0.6)]">
          <LandingShareCardPreview />
        </div>
      </section>
    </div>
  );
}
