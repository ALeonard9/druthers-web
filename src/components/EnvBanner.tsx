'use client';

import { useEffect, useState } from 'react';

// Environment warning strip pinned to the very top of every page. Keyed off
// the same NEXT_PUBLIC_APP_ENV (dev | qa | prod) that EnvBadge and the
// <title> already use, so the banner tracks whatever stage the bundle was
// baked for. dev deliberately has no entry - local work stays clean unless a
// QA/prod build is explicitly baked in.
interface EnvBannerConfig {
  /** Short all-caps chip label. */
  label: string;
  /** The warning itself. */
  message: string;
  /** When set, a mailto link is appended (the QA banner's contact point). */
  contactEmail?: string;
  /** Tailwind colors - mirrors EnvBadge's per-env tints. */
  style: string;
}

const BANNERS: Record<string, EnvBannerConfig> = {
  qa: {
    label: 'QA',
    message: 'For testing purposes only - no entry permitted.',
    contactEmail: 'admin@druthers.io',
    style: 'bg-sky-500 text-black',
  },
  prod: {
    label: 'Beta',
    message: 'Druthers is in beta - expect frequent changes.',
    style: 'bg-brass text-ink',
  },
};

// Dismissal is remembered per session and per environment, so agreeing in QA
// doesn't silence the prod banner (or vice versa).
const storageKey = (env: string) => `druthers_env_banner_dismissed_${env}`;

export function EnvBanner() {
  const env = (process.env.NEXT_PUBLIC_APP_ENV ?? 'dev').toLowerCase();
  const banner = BANNERS[env];
  const [dismissed, setDismissed] = useState(false);

  // sessionStorage is client-only, so the dismissed flag is reconciled after
  // mount (same shape as Tutorial/rankedListLength) rather than read during
  // render, which would let SSR and the client disagree on the first paint.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDismissed(window.sessionStorage.getItem(storageKey(env)) === 'true');
  }, [env]);

  if (!banner || dismissed) return null;

  function dismiss() {
    window.sessionStorage.setItem(storageKey(env), 'true');
    setDismissed(true);
  }

  // The standalone PWA window starts at the OS status bar / notch, so the
  // strip pads below it via env(safe-area-inset-top) - same trick as AppShell's
  // bottom inset. env() resolves to 0 in a browser tab, so the extra pt- class
  // just re-states py-2's 0.5rem there and nothing shifts.
  return (
    <div
      className={`${banner.style} flex items-center justify-center gap-3 px-4 py-2 pt-[calc(0.5rem+env(safe-area-inset-top))] text-sm`}
      role="note"
    >
      <span className="rounded bg-black/15 px-1.5 py-0.5 text-xs font-bold uppercase tracking-wide">
        {banner.label}
      </span>
      <span>
        {banner.message}
        {banner.contactEmail && (
          <>
            {' '}
            <a
              href={`mailto:${banner.contactEmail}`}
              className="font-medium underline underline-offset-2"
            >
              {banner.contactEmail}
            </a>
          </>
        )}
      </span>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss environment notice"
        className="ml-auto rounded px-2 py-0.5 hover:bg-black/15"
      >
        ✕
      </button>
    </div>
  );
}
