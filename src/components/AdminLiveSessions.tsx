'use client';

import { useState } from 'react';
import type { AdminLiveSession } from '@/lib/types';
import { personLabel } from '@/lib/sessionCookies';
import { exactTimestamp, relativeTimeFrom } from '@/lib/relativeTime';

// relativeTimeFrom is "X ago" only (see its own doc comment) and clamps a
// future timestamp to "just now" - useless for a countdown to expiry. This
// is deliberately not folded into that shared helper: expiry is the only
// place in the admin console that counts forward instead of back.
function expiresLabel(iso: string, now: Date = new Date()): string {
  const secondsLeft = Math.round((new Date(iso).getTime() - now.getTime()) / 1000);
  if (secondsLeft <= 0) return 'expired';
  if (secondsLeft < 60) return `in ${secondsLeft}s`;
  return `in ${Math.round(secondsLeft / 60)}m`;
}

/**
 * "Am I currently viewing as anyone?" has no answer from any single tab -
 * it's a cookie, so a second tab or a forgotten window can't be seen from
 * here either. This is the console's actual answer: every live session,
 * across every admin, with a revoke that doesn't require being the admin
 * who started it (#250 follow-up).
 */
export function AdminLiveSessions({ initialSessions }: { initialSessions: AdminLiveSession[] }) {
  const [sessions, setSessions] = useState(initialSessions);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function revoke(sessionId: string) {
    setRevokingId(sessionId);
    setError(null);
    try {
      const res = await fetch(`/api/admin/impersonation/${sessionId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Could not end this session.');
      }
      setSessions((prev) => prev.filter((s) => s.session_id !== sessionId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not end this session.');
    } finally {
      setRevokingId(null);
    }
  }

  if (sessions.length === 0) {
    return (
      <section className="flex flex-col gap-2">
        <h3 className="font-display text-lg text-paper">Active view-as sessions</h3>
        <p className="text-sm text-neutral-500">No one is currently viewing as anyone.</p>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-2">
      <h3 className="font-display text-lg text-paper">Active view-as sessions</h3>
      <ul className="flex flex-col gap-2">
        {sessions.map((s) => (
          <li
            key={s.session_id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-panel px-3 py-2 text-sm"
          >
            <span>
              <span className="text-paper">{personLabel(s.acting_admin)}</span>
              <span className="text-neutral-500"> viewing as </span>
              <span className="text-paper">{personLabel(s.target)}</span>
              <span className="text-neutral-500">
                {' - started '}
                <span title={exactTimestamp(s.started_at)}>{relativeTimeFrom(s.started_at)}</span>
                {', expires '}
                <span title={exactTimestamp(s.expires_at)}>{expiresLabel(s.expires_at)}</span>
              </span>
            </span>
            <button
              type="button"
              onClick={() => void revoke(s.session_id)}
              disabled={revokingId === s.session_id}
              className="rounded border border-red-900 px-2 py-1 text-xs font-medium text-red-300 hover:bg-red-950/40 disabled:opacity-50"
            >
              {revokingId === s.session_id ? 'Ending…' : 'End session'}
            </button>
          </li>
        ))}
      </ul>
      {error && (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      )}
    </section>
  );
}
