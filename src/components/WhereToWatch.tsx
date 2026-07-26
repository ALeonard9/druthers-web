import { watchTiers } from '@/lib/watchProviders';
import type { WatchProviders } from '@/lib/types';

/**
 * Streaming availability for a movie or show (#26).
 *
 * Renders nothing when there's nothing to show: the API answers with empty
 * buckets for a title that streams nowhere, one it couldn't resolve upstream,
 * and one where TMDB was unreachable — none of which is worth an empty state
 * on a detail page.
 */
export function WhereToWatch({
  providers,
}: {
  providers: WatchProviders | null;
}) {
  const tiers = watchTiers(providers);
  if (!providers || tiers.length === 0) return null;

  return (
    <section className="rounded-lg border border-line bg-panel p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="text-xs uppercase tracking-wide text-neutral-500">
          Where to watch
          <span className="ml-2 normal-case tracking-normal text-neutral-600">
            {providers.region}
          </span>
        </h2>
        {providers.link && (
          <a
            href={providers.link}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-brass hover:text-brass-bright"
          >
            All options ↗
          </a>
        )}
      </div>

      {/*
        Each tier's label stacks above its row rather than sitting beside it:
        a tier with one provider and a tier that wraps to three lines both
        need to read the same way.
      */}
      <dl className="mt-3 flex flex-col gap-2.5">
        {tiers.map((tier) => (
          <div key={tier.key}>
            <dt className="mb-1.5 text-xs text-neutral-500">{tier.label}</dt>
            <dd className="flex flex-wrap items-center gap-1.5">
              {tier.providers.map((provider) => (
                <span
                  key={provider.provider_id ?? provider.name}
                  className="flex items-center gap-1.5 rounded bg-night px-2 py-1 text-xs text-neutral-300 ring-1 ring-line"
                >
                  {provider.logo_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={provider.logo_url}
                      alt=""
                      className="h-4 w-4 shrink-0 rounded-[3px]"
                    />
                  )}
                  {provider.name}
                </span>
              ))}
            </dd>
          </div>
        ))}
      </dl>

      {/*
        TMDB licenses this availability data from JustWatch and requires the
        source be credited wherever it's displayed. Keep this line next to the
        providers — the TMDB attribution on /about doesn't cover it.
      */}
      <p className="mt-3 text-[11px] text-neutral-600">
        Availability data by {providers.attribution}, via TMDB.
      </p>
    </section>
  );
}
