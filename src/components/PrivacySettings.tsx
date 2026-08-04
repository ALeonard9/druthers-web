'use client';

import { useEffect, useState, type FormEvent } from 'react';
import type { Visibility, VisibilityTier } from '@/lib/types';
import { BASE_DOMAIN, SITE_URL } from '@/lib/shareCards';

const TIER_ORDER: VisibilityTier[] = ['private', 'friends', 'public'];

const TIER_LABEL: Record<VisibilityTier, string> = {
  private: 'Private',
  friends: 'Friends',
  public: 'Public',
};

const TIER_HELP: Record<VisibilityTier, string> = {
  private: 'Only you can see this.',
  friends: "Visible to friends you've accepted — nobody else.",
  public: 'Visible to anyone with your profile link.',
};

const TIER_OPENNESS: Record<VisibilityTier, number> = {
  private: 0,
  friends: 1,
  public: 2,
};

function moreOpen(a: VisibilityTier, b: VisibilityTier) {
  return TIER_OPENNESS[a] > TIER_OPENNESS[b];
}

type ShelfField = Exclude<keyof Visibility, 'handle'>;

const DOMAINS: {
  key: string;
  label: string;
  field: ShelfField;
  watchlistField: ShelfField;
}[] = [
  {
    key: 'movies',
    label: 'Movies',
    field: 'visibility_movies',
    watchlistField: 'visibility_watchlist_movies',
  },
  { key: 'tv', label: 'TV', field: 'visibility_tv', watchlistField: 'visibility_watchlist_tv' },
  {
    key: 'books',
    label: 'Books',
    field: 'visibility_books',
    watchlistField: 'visibility_watchlist_books',
  },
  {
    key: 'games',
    label: 'Games',
    field: 'visibility_games',
    watchlistField: 'visibility_watchlist_games',
  },
];

// The profile can never sit below the most open of these (#274) — mirrors
// the API's own floor check so a doomed selection is explained immediately
// instead of round-tripping to a 422.
function floorTier(settings: Visibility): { tier: VisibilityTier; source: string } {
  let tier: VisibilityTier = 'private';
  let source = '';
  for (const d of DOMAINS) {
    for (const [field, suffix] of [
      [d.field, ''],
      [d.watchlistField, ' watchlist'],
    ] as const) {
      const candidate = settings[field];
      if (moreOpen(candidate, tier)) {
        tier = candidate;
        source = `${d.label}${suffix}`;
      }
    }
  }
  return { tier, source };
}

function TierPills({
  ariaLabel,
  value,
  busy,
  onSelect,
}: {
  ariaLabel: string;
  value: VisibilityTier;
  busy: boolean;
  onSelect: (tier: VisibilityTier) => void;
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="flex shrink-0 gap-1">
      {TIER_ORDER.map((tier) => {
        const active = value === tier;
        return (
          <button
            key={tier}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={busy}
            title={TIER_HELP[tier]}
            onClick={() => onSelect(tier)}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
              active
                ? 'bg-brass text-ink'
                : 'border border-line text-neutral-400 hover:border-brass hover:text-brass-bright'
            }`}
          >
            {TIER_LABEL[tier]}
          </button>
        );
      })}
    </div>
  );
}

type PendingRaise = { field: ShelfField; tier: VisibilityTier };

// Rebuilt for #274/#119: nine tiers (private/friends/public) instead of eight
// on/off switches. The profile control is pulled out above the four domain
// blocks since it's the one every shelf is constrained against.
export function PrivacySettings() {
  const [settings, setSettings] = useState<Visibility | null>(null);
  const [handle, setHandle] = useState('');
  const [handleBusy, setHandleBusy] = useState(false);
  const [handleError, setHandleError] = useState<string | null>(null);
  const [handleSaved, setHandleSaved] = useState(false);
  const [handleNotice, setHandleNotice] = useState(false);
  const [copied, setCopied] = useState(false);

  const [savingField, setSavingField] = useState<string | null>(null);
  const [tierError, setTierError] = useState<string | null>(null);
  const [pendingRaise, setPendingRaise] = useState<PendingRaise | null>(null);
  const [profileFloorNotice, setProfileFloorNotice] = useState<{
    tier: VisibilityTier;
    source: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/visibility').then(async (res) => {
      if (cancelled) return;
      if (res.ok) {
        const body: Visibility = await res.json();
        setSettings(body);
        setHandle(body.handle ?? '');
      } else {
        setHandleError('Could not load privacy settings.');
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function save(patch: Partial<Visibility>, field: string) {
    setSavingField(field);
    setTierError(null);
    try {
      const res = await fetch('/api/visibility', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const body = await res.json();
      if (!res.ok) {
        setTierError(body.error ?? 'Could not save.');
        return;
      }
      setSettings(body);
      setHandle(body.handle ?? '');
    } finally {
      setSavingField(null);
    }
  }

  async function saveHandle(e: FormEvent) {
    e.preventDefault();
    setHandleBusy(true);
    setHandleError(null);
    setHandleSaved(false);
    try {
      const res = await fetch('/api/visibility', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle: handle.trim() || null }),
      });
      const body = await res.json();
      if (!res.ok) {
        setHandleError(body.error ?? 'Could not save.');
        return;
      }
      setSettings(body);
      setHandle(body.handle ?? '');
      setHandleSaved(true);
      window.setTimeout(() => setHandleSaved(false), 2000);
    } finally {
      setHandleBusy(false);
    }
  }

  if (settings === null) {
    return <p className="text-sm text-neutral-500">{handleError ?? 'Loading…'}</p>;
  }

  function requestShelfTier(field: ShelfField, tier: VisibilityTier) {
    if (!settings) return;
    setHandleNotice(false);
    if (!settings.handle && tier !== 'private') {
      setHandleNotice(true);
      return;
    }
    if (moreOpen(tier, settings.visibility_profile)) {
      setPendingRaise({ field, tier });
      return;
    }
    setPendingRaise(null);
    void save({ [field]: tier }, field);
  }

  function confirmRaise() {
    if (!pendingRaise) return;
    const { field, tier } = pendingRaise;
    setPendingRaise(null);
    void save({ [field]: tier, visibility_profile: tier }, field);
  }

  function requestProfileTier(tier: VisibilityTier) {
    if (!settings) return;
    setHandleNotice(false);
    if (!settings.handle && tier !== 'private') {
      setHandleNotice(true);
      return;
    }
    const floor = floorTier(settings);
    if (moreOpen(floor.tier, tier)) {
      setProfileFloorNotice(floor);
      return;
    }
    setProfileFloorNotice(null);
    void save({ visibility_profile: tier }, 'visibility_profile');
  }

  const profileUrl = settings.handle ? `${BASE_DOMAIN}/u/${settings.handle}` : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-line bg-panel p-4">
        <form onSubmit={saveHandle} className="flex gap-2">
          <div className="flex flex-1 items-center rounded border border-neutral-700 bg-night focus-within:border-brass">
            <span className="pl-3 font-mono text-xs text-neutral-500">
              {BASE_DOMAIN}/u/
            </span>
            <input
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="your-handle"
              maxLength={30}
              className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm outline-none placeholder:text-neutral-600"
            />
          </div>
          <button
            type="submit"
            disabled={handleBusy || (handle.trim() || null) === settings.handle}
            className="shrink-0 rounded bg-brass px-3 py-2 text-sm font-medium text-ink hover:bg-brass-bright disabled:opacity-50"
          >
            {handleSaved ? 'Saved' : 'Save handle'}
          </button>
        </form>
        {handleError && <p className="mt-2 text-xs text-red-400">{handleError}</p>}
        {!settings.handle && (
          <p className="mt-2 text-xs text-neutral-500">
            Pick a handle before sharing anything — it becomes your profile URL.
            Everything below stays private until you do.
          </p>
        )}
        {handleNotice && (
          <p className="mt-2 text-xs text-amber-400">
            Pick a handle above first — Friends and Public need somewhere to point to.
          </p>
        )}

        <div className="mt-4 flex items-center gap-3 border-t border-line pt-3">
          <span className="flex-1 text-sm text-neutral-200">
            Profile
            {savingField === 'visibility_profile' && (
              <span className="ml-2 text-xs text-neutral-500">Saving…</span>
            )}
          </span>
          <TierPills
            ariaLabel="Profile visibility"
            value={settings.visibility_profile}
            busy={savingField === 'visibility_profile'}
            onSelect={requestProfileTier}
          />
        </div>
        {profileFloorNotice && (
          <p className="mt-2 text-xs text-amber-400">
            {profileFloorNotice.source} is set to {TIER_LABEL[profileFloorNotice.tier]}, so your
            profile must stay at least {TIER_LABEL[profileFloorNotice.tier]} — a shelf can never
            be more visible than the page that links to it.{' '}
            <button
              type="button"
              onClick={() => setProfileFloorNotice(null)}
              className="text-brass hover:text-brass-bright"
            >
              Got it
            </button>
          </p>
        )}
        {profileUrl && (
          <p className="mt-2 flex items-center gap-2 text-xs text-neutral-500">
            <a href={`/u/${settings.handle}`} className="text-brass hover:text-brass-bright">
              {profileUrl}
            </a>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(
                  settings.handle ? `${SITE_URL}/u/${settings.handle}` : ''
                );
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1500);
              }}
              className="text-neutral-400 hover:text-paper"
            >
              {copied ? 'Copied' : 'Copy link'}
            </button>
          </p>
        )}
        {tierError && <p className="mt-2 text-xs text-red-400">{tierError}</p>}
      </div>

      <ul className="divide-y divide-line/60 rounded-lg border border-line bg-panel">
        {DOMAINS.map((d) => (
          <li key={d.key} className="px-4 py-3">
            <p className="mb-1.5 text-sm font-medium text-neutral-200">{d.label}</p>
            <div className="flex items-center gap-3 py-1">
              <span className="flex-1 text-xs text-neutral-400">
                Ranked list
                {savingField === d.field && (
                  <span className="ml-2 text-neutral-500">Saving…</span>
                )}
              </span>
              <TierPills
                ariaLabel={`${d.label} ranked list visibility`}
                value={settings[d.field]}
                busy={savingField === d.field}
                onSelect={(tier) => requestShelfTier(d.field, tier)}
              />
            </div>
            {pendingRaise?.field === d.field && (
              <p className="mt-1 flex items-center gap-2 rounded bg-brass-wash px-2 py-1.5 text-xs text-brass-bright ring-1 ring-brass/40">
                <span className="flex-1">
                  This also raises your profile to {TIER_LABEL[pendingRaise.tier]}.
                </span>
                <button
                  type="button"
                  onClick={() => setPendingRaise(null)}
                  className="text-neutral-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmRaise}
                  className="rounded bg-brass px-2 py-0.5 font-medium text-ink hover:bg-brass-bright"
                >
                  Raise profile & save
                </button>
              </p>
            )}
            <div className="flex items-center gap-3 py-1 pl-3">
              <span className="flex-1 text-xs text-neutral-500">
                Watchlist
                {savingField === d.watchlistField && (
                  <span className="ml-2 text-neutral-600">Saving…</span>
                )}
              </span>
              <TierPills
                ariaLabel={`${d.label} watchlist visibility`}
                value={settings[d.watchlistField]}
                busy={savingField === d.watchlistField}
                onSelect={(tier) => requestShelfTier(d.watchlistField, tier)}
              />
            </div>
            {pendingRaise?.field === d.watchlistField && (
              <p className="mt-1 flex items-center gap-2 rounded bg-brass-wash px-2 py-1.5 text-xs text-brass-bright ring-1 ring-brass/40">
                <span className="flex-1">
                  This also raises your profile to {TIER_LABEL[pendingRaise.tier]}.
                </span>
                <button
                  type="button"
                  onClick={() => setPendingRaise(null)}
                  className="text-neutral-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmRaise}
                  className="rounded bg-brass px-2 py-0.5 font-medium text-ink hover:bg-brass-bright"
                >
                  Raise profile & save
                </button>
              </p>
            )}
          </li>
        ))}
      </ul>

      <p className="text-xs text-neutral-500">
        <span className="text-neutral-400">Private</span> — only you.{' '}
        <span className="text-neutral-400">Friends</span> — people you&apos;ve accepted as a
        friend.{' '}
        <span className="text-neutral-400">Public</span> — anyone with your profile link.
      </p>
    </div>
  );
}
