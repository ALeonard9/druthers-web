'use client';

import { useState } from 'react';
import type { PendingFriendRequests } from '@/lib/types';

export function FriendRequestButton({
  handle,
  initialReqId = null,
}: {
  handle: string;
  initialReqId?: string | null;
}) {
  const [status, setStatus] = useState<'none' | 'pending' | 'error'>(
    initialReqId ? 'pending' : 'none'
  );
  const [reqId, setReqId] = useState<string | null>(initialReqId);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function sendRequest() {
    setBusy(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/friends/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMsg(data.error ?? 'Could not send that request.');
        return;
      }
      // Re-fetch to get the new request ID so we can cancel it
      const reqsRes = await fetch('/api/friends/requests');
      if (reqsRes.ok) {
        const reqsData = (await reqsRes.json()) as PendingFriendRequests;
        const outgoing = reqsData.outgoing.find((r) => r.user.handle === handle);
        if (outgoing) {
          setReqId(outgoing.id);
        }
      }
      setStatus('pending');
    } finally {
      setBusy(false);
    }
  }

  async function cancelRequest() {
    if (!reqId) return;
    setBusy(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/friends/requests/${reqId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.error ?? 'Could not cancel that request.');
        return;
      }
      setReqId(null);
      setStatus('none');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {status === 'pending' ? (
        <button
          type="button"
          onClick={() => void cancelRequest()}
          disabled={busy}
          title="Cancel request"
          className="rounded border border-line px-3 py-1.5 text-sm text-neutral-300 hover:border-red-400 hover:text-red-400 disabled:opacity-50"
        >
          {busy ? 'Canceling…' : 'Request sent'}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => void sendRequest()}
          disabled={busy}
          className="rounded border border-brass/60 bg-brass-wash px-3 py-1.5 text-sm text-brass hover:border-brass hover:text-brass-bright disabled:opacity-50"
        >
          {busy ? 'Sending…' : 'Add friend'}
        </button>
      )}
      {errorMsg && <span className="text-xs text-red-400">{errorMsg}</span>}
    </div>
  );
}
