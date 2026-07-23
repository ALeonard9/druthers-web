'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ApiKey, ApiKeyCreated } from '@/lib/types';

// Mint, list, and revoke personal API keys — the credential for running the
// MCP server (or scripts) against your account. The plaintext secret is
// displayed exactly once, right after creation.
export function ApiKeysManager() {
  const [keys, setKeys] = useState<ApiKey[] | null>(null);
  const [name, setName] = useState('');
  const [minted, setMinted] = useState<ApiKeyCreated | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch('/api/api-keys');
    if (res.ok) setKeys(await res.json());
    else setError('Could not load keys.');
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/api-keys').then(async (res) => {
      if (cancelled) return;
      if (res.ok) setKeys(await res.json());
      else setError('Could not load keys.');
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function mint() {
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) throw new Error();
      setMinted(await res.json());
      setName('');
      await refresh();
    } catch {
      setError('Could not create the key.');
    } finally {
      setBusy(false);
    }
  }

  async function revoke(key: ApiKey) {
    // Native confirm keeps this honest without a modal framework.
    if (!window.confirm(`Revoke “${key.name}”? Anything using it stops working immediately.`)) {
      return;
    }
    setBusy(true);
    try {
      await fetch(`/api/api-keys/${key.id}`, { method: 'DELETE' });
      if (minted?.id === key.id) setMinted(null);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function copyKey() {
    if (!minted) return;
    await navigator.clipboard.writeText(minted.key);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-lg border border-line bg-panel px-4 py-3">
        <p className="text-sm text-neutral-300">
          This key is for your personal use only — do not share it or use it to build public-facing integrations.
        </p>
      </div>

      {minted && (
        <div className="rounded-lg border border-brass bg-brass-wash p-4">
          <p className="text-sm font-medium text-brass">
            Key “{minted.name}” created — copy it now. It will never be shown
            again.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 overflow-x-auto rounded bg-night px-3 py-2 font-mono text-xs text-paper">
              {minted.key}
            </code>
            <button
              type="button"
              onClick={copyKey}
              className="shrink-0 rounded bg-brass px-3 py-2 text-xs font-semibold text-ink hover:bg-brass-bright"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      )}

      {keys === null ? (
        <p className="text-sm text-neutral-500">Loading…</p>
      ) : keys.length === 0 ? (
        <p className="text-sm text-neutral-500">
          No keys yet — name one below and mint it.
        </p>
      ) : (
        <ul className="divide-y divide-line/60 rounded-lg border border-line bg-panel">
          {keys.map((k) => (
            <li key={k.id} className="flex items-center gap-3 px-4 py-2.5">
              <div className="min-w-0 flex-1">
                <span className="block truncate text-sm text-paper">
                  {k.name}
                </span>
                <span className="block font-mono text-xs text-neutral-500">
                  {k.prefix}…{' · '}
                  {k.last_used_at
                    ? `last used ${new Date(k.last_used_at).toLocaleDateString()}`
                    : 'never used'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => revoke(k)}
                disabled={busy}
                className="shrink-0 rounded px-2 py-1 text-xs text-neutral-500 hover:text-red-400 disabled:opacity-50"
              >
                Revoke
              </button>
            </li>
          ))}
        </ul>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void mint();
        }}
        className="flex gap-2"
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Key name, e.g. “laptop mcp”"
          maxLength={60}
          className="flex-1 rounded border border-neutral-700 bg-panel px-3 py-2 text-sm outline-none placeholder:text-neutral-600 focus:border-brass"
        />
        <button
          type="submit"
          disabled={busy || !name.trim()}
          className="shrink-0 rounded bg-brass px-3 py-2 text-sm font-medium text-ink hover:bg-brass-bright disabled:opacity-50"
        >
          Mint key
        </button>
      </form>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
