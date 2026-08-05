'use client';

import { useState } from 'react';
import Link from 'next/link';

export function PrivateProfileNotice({ handle, signedIn = true }: { handle: string; signedIn?: boolean }) {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function requestFriendship() {
    setState('sending');
    const response = await fetch('/api/friends/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ handle }),
    });
    setState(response.ok ? 'sent' : 'error');
  }

  return (
    <section className="mx-auto mt-12 max-w-lg rounded-xl border border-line bg-panel p-6 text-center shadow-2xl shadow-black/20">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-brass-wash text-brass">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
          <rect x="5" y="10" width="14" height="10" rx="2" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </svg>
      </div>
      <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.24em] text-brass">
        Profile unavailable
      </p>
      <h1 className="mt-2 font-display text-3xl text-paper">@{handle} keeps this close</h1>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-neutral-400">
        This profile may be private, friends-only, or unavailable. A friend request can unlock anything they share with friends.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {signedIn ? (
          <button
            type="button"
            onClick={() => void requestFriendship()}
            disabled={state === 'sending' || state === 'sent'}
            className="rounded bg-brass px-4 py-2 text-sm font-medium text-ink hover:bg-brass-bright disabled:opacity-60"
          >
            {state === 'sending' ? 'Sending…' : state === 'sent' ? 'Request sent' : 'Send friend request'}
          </button>
        ) : (
          <Link href={`/login?next=${encodeURIComponent(`/u/${handle}`)}`} className="rounded bg-brass px-4 py-2 text-sm font-medium text-ink hover:bg-brass-bright">
            Sign in to connect
          </Link>
        )}
        <Link href="/friends" className="rounded border border-line px-4 py-2 text-sm text-neutral-300 hover:border-brass hover:text-paper">
          Friends
        </Link>
      </div>
      {state === 'error' && <p className="mt-3 text-xs text-red-400">Could not send that request.</p>}
    </section>
  );
}
