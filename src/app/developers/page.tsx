import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Developers — Druthers',
  description:
    'Build on the Druthers API: a Postman collection and an MCP server for Claude.',
};

const MCP_GUIDE_URL =
  'https://github.com/ALeonard9/druthers-api/blob/main/docs/mcp-usage.md';
const MCP_REPO_URL = 'https://github.com/ALeonard9/druthers-mcp';
const API_REPO_URL = 'https://github.com/ALeonard9/druthers-api';
const POSTMAN_COLLECTION_URL = '/downloads/druthers-api.postman_collection.json';

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-md border border-line bg-night px-4 py-3 text-xs leading-relaxed text-neutral-300">
      <code>{children}</code>
    </pre>
  );
}

// Intentionally public — a developer evaluating the API shouldn't need an
// account first.
export default function DevelopersPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="rotate-[-0.4deg] rounded-lg bg-paper px-7 py-8 text-ink shadow-[0_18px_48px_rgba(0,0,0,0.55)]">
        <div className="flex items-baseline justify-between border-b border-dashed border-brass/40 pb-4">
          <span className="font-display text-2xl font-semibold">
            For developers
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-brass-wash/70">
            api · mcp
          </span>
        </div>
        <p className="mt-5 text-sm leading-relaxed text-ink/80">
          Druthers is backed by a plain JWT/API-key-authenticated REST API,
          and a{' '}
          <a
            href="https://modelcontextprotocol.io"
            className="text-brass hover:text-brass-bright"
            rel="noreferrer"
            target="_blank"
          >
            Model Context Protocol
          </a>{' '}
          server that puts your library in front of Claude. Both are open
          source. Pick whichever fits what you&apos;re building.
        </p>
      </div>

      {/* Postman collection */}
      <section className="rounded-lg border border-line bg-panel px-6 py-5">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-500">
          Call the API — Postman collection
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-neutral-400">
          Every route — movies, TV, books, games, activity, search, and more
          — as a ready-to-run Postman request. It&apos;s generated straight
          from the live OpenAPI schema, so it never drifts from what&apos;s
          actually deployed.
        </p>
        <ol className="mt-3 flex list-decimal flex-col gap-1.5 pl-5 text-sm leading-relaxed text-neutral-400">
          <li>
            Download the collection and import it into Postman (or any
            client that reads Collection v2.1).
          </li>
          <li>
            Mint a personal API key from{' '}
            <Link href="/settings" className="text-brass hover:text-brass-bright">
              Settings → API keys
            </Link>
            .
          </li>
          <li>
            Set the collection&apos;s <code className="text-paper">apiToken</code>{' '}
            variable to that key. Requests default to production
            (<code className="text-paper">api.druthers.io</code>).
          </li>
        </ol>
        <a
          href={POSTMAN_COLLECTION_URL}
          download
          className="mt-4 inline-flex items-center gap-2 rounded bg-brass px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-brass-bright"
        >
          Download the Postman collection
        </a>
        <p className="mt-3 text-xs text-neutral-600">
          Source lives in{' '}
          <a
            href={`${API_REPO_URL}/blob/main/docs/druthers-api.postman_collection.json`}
            className="underline decoration-line hover:text-neutral-300"
            rel="noreferrer"
            target="_blank"
          >
            druthers-api/docs/
          </a>{' '}
          — a static, versioned file rather than a hosted Postman workspace,
          so there&apos;s nothing extra to keep an account alive for.
        </p>
      </section>

      {/* MCP */}
      <section className="rounded-lg border border-line bg-panel px-6 py-5">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-500">
          Talk to it from Claude — the Druthers MCP server
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-neutral-400">
          Connect your library to Claude Desktop or Claude Code and manage it
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

        <h3 className="mt-5 text-xs font-medium uppercase tracking-wide text-neutral-500">
          Connect it (Claude Code)
        </h3>
        <div className="mt-2">
          <CodeBlock>{`claude mcp add druthers \\
  -e API_BASE_URL=https://api.druthers.io \\
  -e API_TOKEN=drk_your_key_here \\
  --scope user \\
  -- python -m aleonard_mcp.server`}</CodeBlock>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-neutral-400">
          Claude Desktop uses the same env vars in its JSON config instead.
          Full setup (including Claude Desktop config, troubleshooting, and
          the complete tool list) is in the{' '}
          <a
            href={MCP_GUIDE_URL}
            className="text-brass hover:text-brass-bright"
            rel="noreferrer"
            target="_blank"
          >
            MCP usage guide
          </a>
          .
        </p>
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
          . API source:{' '}
          <a
            href={API_REPO_URL}
            className="underline decoration-line hover:text-neutral-300"
            rel="noreferrer"
            target="_blank"
          >
            druthers-api
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
