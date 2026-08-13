'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const CONFIRMATION = 'DELETE';

// This is intentionally separate from the other settings cards: an account
// deletion is final, and a typed acknowledgement makes that boundary clear.
export function DeleteAccount() {
  const router = useRouter();
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function deleteAccount() {
    if (confirmation !== CONFIRMATION) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/account', { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Could not delete your account.');
      }
      router.replace('/');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete your account.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border border-red-950 bg-red-950/20 px-4 py-4">
      <p className="text-sm text-neutral-300">
        Before you continue, <a href="/api/export" download className="text-brass hover:text-brass-bright">Download everything (JSON)</a>.
        {' '}Deleting your account permanently removes your rankings, watchlists, watch
        history, notes, friendships and follows, and API keys. Your handle returns to the
        pool and may be claimed by someone else.
      </p>
      <label className="mt-4 block text-sm text-paper" htmlFor="delete-account-confirmation">
        Type <code className="font-mono text-xs text-red-300">{CONFIRMATION}</code> to permanently delete your account.
      </label>
      <div className="mt-2 flex flex-wrap gap-2">
        <input
          id="delete-account-confirmation"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          placeholder={CONFIRMATION}
          autoComplete="off"
          className="rounded border border-red-900 bg-panel px-3 py-2 text-sm text-paper outline-none placeholder:text-neutral-600 focus:border-red-500"
        />
        <button
          type="button"
          onClick={() => void deleteAccount()}
          disabled={busy || confirmation !== CONFIRMATION}
          className="rounded bg-red-700 px-3 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? 'Deleting…' : 'Delete account'}
        </button>
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}
    </div>
  );
}
