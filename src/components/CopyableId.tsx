'use client';

import { useState } from 'react';

// The detail view otherwise shows the account's UUID nowhere but the URL -
// worth having on the page itself for anyone pasting it into a support
// ticket, a DB query, or another admin tool.
export function CopyableId({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access can be denied by the browser - the id is still
      // selectable as plain text, so this isn't the only way to get it.
    }
  }

  return (
    <button
      type="button"
      onClick={() => void copy()}
      className="inline-flex items-center gap-1 font-mono text-neutral-500 hover:text-paper"
      title="Copy user ID"
    >
      {id}
      <span aria-hidden="true">{copied ? '✓' : '⧉'}</span>
      <span className="sr-only">{copied ? 'Copied' : 'Copy user ID'}</span>
    </button>
  );
}
