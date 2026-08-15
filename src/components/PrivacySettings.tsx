'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { Visibility, VisibilityTier } from '@/lib/types';
import { BASE_DOMAIN, getSiteUrl } from '@/lib/shareCards';
import {
  resolveShelfTier,
  shelfInheritsDefault,
  type ShelfField,
} from '@/lib/privacyDefaults';
import type { ShelfId } from '@/lib/duelShelves';
import { useShelfPreferences } from '@/lib/useShelfPreferences';
import { DomainIcon } from './DomainIcon';

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

const DOMAINS: {
  key: string;
  label: string;
  field: ShelfField;
  watchlistField: ShelfField;
  // The queue list's display name — "Watchlist" only actually fits Movies
  // and TV; Books and Games have their own established terms elsewhere in
  // the app (BookDetail's "to-read", GameDetail's "backlog").
  queueLabel: string;
}[] = [
  {
    key: 'movies',
    label: 'Movies',
    field: 'visibility_movies',
    watchlistField: 'visibility_watchlist_movies',
    queueLabel: 'Watchlist',
  },
  {
    key: 'tv',
    label: 'TV',
    field: 'visibility_tv',
    watchlistField: 'visibility_watchlist_tv',
    queueLabel: 'Watchlist',
  },
  {
    key: 'books',
    label: 'Books',
    field: 'visibility_books',
    watchlistField: 'visibility_watchlist_books',
    queueLabel: 'Read List',
  },
  {
    key: 'games',
    label: 'Games',
    field: 'visibility_games',
    watchlistField: 'visibility_watchlist_games',
    queueLabel: 'Play List',
  },
];

// The profile can never sit below the most open of these (#274) — mirrors
// the API's own floor check so a doomed selection is explained immediately
// instead of round-tripping to a 422.
function floorTier(
  settings: Visibility,
  domains = DOMAINS,
): { tier: VisibilityTier; source: string } {
  let tier: VisibilityTier = 'private';
  let source = '';
  for (const d of domains) {
    for (const [field, suffix] of [
      [d.field, ''],
      [d.watchlistField, ` ${d.queueLabel.toLowerCase()}`],
    ] as [ShelfField, string][]) {
      const candidate = resolveShelfTier(settings, field);
      if (moreOpen(candidate, tier)) {
        tier = candidate;
        source = `${d.label}${suffix}`;
      }
    }
  }
  return { tier, source };
}

function PencilIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-3.5 w-3.5"
      aria-hidden="true"
    >
      <path d="M13.586 3.586a2 2 0 1 1 2.828 2.828l-8.5 8.5a2 2 0 0 1-.878.507l-3 .857a.5.5 0 0 1-.618-.618l.857-3a2 2 0 0 1 .507-.878l8.5-8.5Z" />
    </svg>
  );
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

// `origin` distinguishes a shelf change from a Default Sharing change so the
// confirmation notice renders beside the control that needs it.
type PendingRaise = {
  origin: 'default' | ShelfField;
  patch: Partial<Visibility>;
  tier: VisibilityTier;
};

// Rebuilt for #274/#119: nine tiers (private/friends/public) instead of eight
// on/off switches. The profile control is pulled out above the four domain
// blocks since it's the one every shelf is constrained against.
export function PrivacySettings() {
  const shelfPreferences = useShelfPreferences();
  const [settings, setSettings] = useState<Visibility | null>(null);
  const [handle, setHandle] = useState('');
  const [handleBusy, setHandleBusy] = useState(false);
  const [handleError, setHandleError] = useState<string | null>(null);
  const [handleSaved, setHandleSaved] = useState(false);
  const [handleNotice, setHandleNotice] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedShelfLink, setCopiedShelfLink] = useState<ShelfField | null>(null);
  const [editingHandle, setEditingHandle] = useState(false);
  const handleInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (editingHandle) {
      handleInputRef.current?.focus();
    }
  }, [editingHandle]);

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
      setEditingHandle(false);
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
      setPendingRaise({ origin: field, patch: { [field]: tier }, tier });
      return;
    }
    setPendingRaise(null);
    void save({ [field]: tier }, field);
  }

  function confirmRaise() {
    if (!pendingRaise) return;
    const { origin, patch, tier } = pendingRaise;
    setPendingRaise(null);
    void save({ ...patch, visibility_profile: tier }, origin);
  }

  function requestDefaultTier(tier: VisibilityTier) {
    if (!settings) return;
    setHandleNotice(false);
    if (!settings.handle && tier !== 'private') {
      setHandleNotice(true);
      return;
    }
    if (moreOpen(tier, settings.visibility_profile)) {
      setPendingRaise({ origin: 'default', patch: { default_privacy: tier }, tier });
      return;
    }
    setPendingRaise(null);
    void save({ default_privacy: tier }, 'default');
  }

  function clearShelfOverride(field: ShelfField) {
    if (!settings) return;
    const tier = settings.default_privacy;
    if (moreOpen(tier, settings.visibility_profile)) {
      setPendingRaise({ origin: field, patch: { [field]: null }, tier });
      return;
    }
    void save({ [field]: null }, field);
  }

  function requestProfileTier(tier: VisibilityTier) {
    if (!settings) return;
    setHandleNotice(false);
    if (!settings.handle && tier !== 'private') {
      setHandleNotice(true);
      return;
    }
    const floor = floorTier(
      settings,
      DOMAINS.filter((d) => shelfPreferences.enabled.includes(d.key as ShelfId)),
    );
    if (moreOpen(floor.tier, tier)) {
      setProfileFloorNotice(floor);
      return;
    }
    setProfileFloorNotice(null);
    void save({ visibility_profile: tier }, 'visibility_profile');
  }

  function copyShelfLink(field: ShelfField, url: string) {
    void navigator.clipboard.writeText(url);
    setCopiedShelfLink(field);
    window.setTimeout(() => setCopiedShelfLink((cur) => (cur === field ? null : cur)), 1500);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-line bg-panel p-4">
        {settings.handle && !editingHandle ? (
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <a
              href={`/u/${settings.handle}`}
              title="Click to copy · Cmd/Ctrl-click to open"
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) {
                  return;
                }
                e.preventDefault();
                void navigator.clipboard.writeText(`${getSiteUrl()}/u/${settings.handle}`);
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1500);
              }}
              className="font-mono text-brass hover:text-brass-bright"
            >
              {copied ? 'Copied' : `${BASE_DOMAIN}/u/${settings.handle}`}
            </a>
            <button
              type="button"
              title="Edit handle"
              onClick={() => setEditingHandle(true)}
              className="inline-flex items-center gap-1.5 rounded border border-line bg-line/50 px-2.5 py-1 text-xs font-medium text-neutral-300 hover:border-brass hover:text-paper"
            >
              <PencilIcon />
              <span>Edit handle</span>
            </button>
          </div>
        ) : (
          <form onSubmit={saveHandle} className="flex flex-col sm:flex-row gap-2">
            <div className="flex flex-1 min-w-0 items-center overflow-hidden rounded border border-neutral-700 bg-night focus-within:border-brass">
              <span className="pl-3 shrink-0 font-mono text-xs text-neutral-500">
                {BASE_DOMAIN}/u/
              </span>
              <input
                ref={handleInputRef}
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="your-handle"
                maxLength={30}
                className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm outline-none placeholder:text-neutral-600"
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="submit"
                disabled={handleBusy || (handle.trim() || null) === settings.handle}
                className="flex-1 sm:flex-none rounded bg-brass px-3 py-2 text-sm font-medium text-ink hover:bg-brass-bright disabled:opacity-50"
              >
                {handleSaved ? 'Saved' : 'Save handle'}
              </button>
              {settings.handle && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingHandle(false);
                    setHandle(settings.handle ?? '');
                    setHandleError(null);
                  }}
                  className="rounded px-2 py-2 text-sm text-neutral-400 hover:text-paper"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        )}
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
          <span
            className="flex-1 text-sm text-neutral-200"
            title="Controls who can view your profile page. A shelf can never be more open than your profile — raising a shelf above it raises the profile too."
          >
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
        {tierError && <p className="mt-2 text-xs text-red-400">{tierError}</p>}
      </div>

      <div className="rounded-lg border border-line bg-panel p-4">
        <div className="flex items-center gap-3">
          <span
            className="flex-1 text-sm text-neutral-200"
            title="Sets the account-wide privacy used by shelves and watchlists without an override."
          >
            Default Sharing
            {savingField === 'default' && (
              <span className="ml-2 text-xs text-neutral-500">Saving…</span>
            )}
          </span>
          <TierPills
            ariaLabel="Default privacy for all shelves"
            value={settings.default_privacy}
            busy={savingField === 'default'}
            onSelect={requestDefaultTier}
          />
        </div>
        {pendingRaise?.origin === 'default' && (
          <p className="mt-2 flex items-center gap-2 rounded bg-brass-wash px-2 py-1.5 text-xs text-brass-bright ring-1 ring-brass/40">
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
      </div>

      <details className="rounded-lg border border-line bg-panel">
        <summary className="cursor-pointer select-none px-4 py-3 text-sm font-medium text-neutral-200 hover:text-brass-bright">
          Advanced Sharing Options
        </summary>
        <ul className="divide-y divide-line/60 border-t border-line">
        {DOMAINS.filter((d) => shelfPreferences.enabled.includes(d.key as ShelfId)).map((d) => (
          <li key={d.key} className="px-4 py-3">
            <p className="mb-1.5 flex items-center gap-2 text-sm font-medium text-neutral-200">
              <DomainIcon domain={d.key as ShelfId} className="h-4 w-4" />
              {d.label}
            </p>
            <div className="flex items-center gap-3 py-1">
              <span
                className="flex-1 text-xs text-neutral-400"
                title={`Controls who can see your ${d.label} ranked list.`}
              >
                {resolveShelfTier(settings, d.field) !== 'private' && settings.handle ? (
                  <button
                    type="button"
                    title="Click to copy a direct link to this shelf"
                    onClick={() =>
                      copyShelfLink(d.field, `${getSiteUrl()}/u/${settings.handle}/${d.key}`)
                    }
                    className="hover:text-brass-bright"
                  >
                    {copiedShelfLink === d.field ? 'Copied' : 'Ranked list'}
                  </button>
                ) : (
                  'Ranked list'
                )}
                {savingField === d.field && (
                  <span className="ml-2 text-neutral-500">Saving…</span>
                )}
              </span>
              <TierPills
                ariaLabel={`${d.label} ranked list visibility`}
                value={resolveShelfTier(settings, d.field)}
                busy={savingField === d.field}
                onSelect={(tier) => requestShelfTier(d.field, tier)}
              />
            </div>
            <p className="pl-3 text-xs text-neutral-500">
              {shelfInheritsDefault(settings, d.field) ? (
                <>Using default ({TIER_LABEL[settings.default_privacy]}).</>
              ) : (
                <>
                  Override ({TIER_LABEL[settings[d.field] as VisibilityTier]}).{' '}
                  <button
                    type="button"
                    disabled={savingField === d.field}
                    onClick={() => clearShelfOverride(d.field)}
                    className="text-brass hover:text-brass-bright disabled:opacity-40"
                  >
                    Use default
                  </button>
                </>
              )}
            </p>
            {pendingRaise?.origin === d.field && (
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
              <span
                className="flex-1 text-xs text-neutral-500"
                title={`Controls who can see your ${d.label} ${d.queueLabel.toLowerCase()}.`}
              >
                {resolveShelfTier(settings, d.watchlistField) !== 'private' && settings.handle ? (
                  <button
                    type="button"
                    title={`Click to copy a direct link to this ${d.queueLabel.toLowerCase()}`}
                    onClick={() =>
                      copyShelfLink(
                        d.watchlistField,
                        `${getSiteUrl()}/u/${settings.handle}/${d.key}/watchlist`
                      )
                    }
                    className="hover:text-brass-bright"
                  >
                    {copiedShelfLink === d.watchlistField ? 'Copied' : d.queueLabel}
                  </button>
                ) : (
                  d.queueLabel
                )}
                {savingField === d.watchlistField && (
                  <span className="ml-2 text-neutral-600">Saving…</span>
                )}
              </span>
              <TierPills
                ariaLabel={`${d.label} ${d.queueLabel.toLowerCase()} visibility`}
                value={resolveShelfTier(settings, d.watchlistField)}
                busy={savingField === d.watchlistField}
                onSelect={(tier) => requestShelfTier(d.watchlistField, tier)}
              />
            </div>
            <p className="pl-3 text-xs text-neutral-500">
              {shelfInheritsDefault(settings, d.watchlistField) ? (
                <>Using default ({TIER_LABEL[settings.default_privacy]}).</>
              ) : (
                <>
                  Override ({TIER_LABEL[settings[d.watchlistField] as VisibilityTier]}).{' '}
                  <button
                    type="button"
                    disabled={savingField === d.watchlistField}
                    onClick={() => clearShelfOverride(d.watchlistField)}
                    className="text-brass hover:text-brass-bright disabled:opacity-40"
                  >
                    Use default
                  </button>
                </>
              )}
            </p>
            {pendingRaise?.origin === d.watchlistField && (
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
      </details>

      <p className="text-xs text-neutral-500">
        <span className="text-neutral-400">Private</span> — only you.{' '}
        <span className="text-neutral-400">Friends</span> — people you&apos;ve accepted as a
        friend.{' '}
        <span className="text-neutral-400">Public</span> — anyone with your profile link.
      </p>
    </div>
  );
}
