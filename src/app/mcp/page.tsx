import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'MCP — Druthers',
  description:
    'Connect your Druthers library to an MCP client with the Model Context Protocol.',
};

const MCP_GUIDE_URL =
  'https://github.com/ALeonard9/druthers-api/blob/main/docs/mcp-usage.md';
const MCP_REPO_URL = 'https://github.com/ALeonard9/druthers-mcp';

import { McpClientSnippet } from '../../components/McpClientSnippet';

// Intentionally public — a user evaluating the integration shouldn't need an
// account first.
export default function McpPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="rotate-[-0.4deg] rounded-lg bg-paper px-7 py-8 text-ink shadow-[0_18px_48px_rgba(0,0,0,0.55)]">
        <div className="flex items-baseline justify-between border-b border-dashed border-brass/40 pb-4">
          <span className="font-display text-2xl font-semibold">
            MCP
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-brass-wash/70">
            mcp
          </span>
        </div>
        <p className="mt-5 text-sm leading-relaxed text-ink/80">
          Druthers isn&apos;t just a web app. It comes with a personal{' '}
          <a
            href="https://modelcontextprotocol.io"
            className="text-brass hover:text-brass-bright"
            rel="noreferrer"
            target="_blank"
          >
            Model Context Protocol
          </a>{' '}
          server that puts your library in front of your favorite MCP client. Connect your own
          Druthers account to manage your tracking in plain language.
        </p>
      </div>

      {/* MCP */}
      <section className="rounded-lg border border-line bg-panel px-6 py-5">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-500">
          Talk to it from your tools — the Druthers MCP server
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-neutral-400">
          Connect your library to an MCP client and manage it
          in plain language — &ldquo;add Dune to my watchlist,&rdquo; &ldquo;mark
          episode 3 watched,&rdquo; &ldquo;what have I 100%&apos;d?&rdquo;
        </p>

        <h3 className="mt-5 text-xs font-medium uppercase tracking-wide text-neutral-500">
          What the tools do
        </h3>
        <ul className="mt-2 flex flex-col gap-1.5 text-sm leading-relaxed text-neutral-400">
          <li>
            <span className="text-paper">search_*</span> — look up a title in
            the external catalog to find what to add
          </li>
          <li>
            <span className="text-paper">add_*</span> — add a movie, show,
            book, or game to your library
          </li>
          <li>
            <span className="text-paper">list_my_*</span> / *_detail — list
            what you&apos;re tracking, or pull full detail on one item
          </li>
          <li>
            <span className="text-paper">mark_*</span> — flip a status
            (watched, episode watched, 100%-completed)
          </li>
          <li>
            <span className="text-paper">set_*_note</span> /
            set_*_completed_date — personal notes and finish dates
          </li>
        </ul>
        <p className="mt-2 text-sm leading-relaxed text-neutral-400">
          One consistent set across all four domains — Movies, TV, Books,
          Games.
        </p>

        <McpClientSnippet />

        <p className="mt-3 text-xs text-neutral-600">
          Server source:{' '}
          <a
            href={MCP_REPO_URL}
            className="underline decoration-line hover:text-neutral-300"
            rel="noreferrer"
            target="_blank"
          >
            druthers-mcp
          </a>
          .
        </p>
      </section>

      <Link
        href="/"
        className="self-center text-sm text-neutral-400 transition-colors hover:text-paper"
      >
        ← Back to the collection
      </Link>
    </div>
  );
}
