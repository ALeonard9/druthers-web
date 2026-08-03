'use client';

import { useState } from 'react';

// The share affordance every shareable page needs (#121) — the universal
// share menu itself is Phase 4 (#123); this is the plain-copy floor until
// then.
export function CopyProfileLinkButton({ handle }: { handle: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(`https://www.druthers.io/u/${handle}`);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      }}
      className="rounded border border-line px-3 py-1.5 text-sm text-neutral-300 transition-colors hover:border-brass hover:text-paper"
    >
      {copied ? 'Copied!' : 'Copy link'}
    </button>
  );
}
