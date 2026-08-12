'use client';

import { useState } from 'react';
import Link from 'next/link';

const MCP_GUIDE_URL =
  'https://github.com/ALeonard9/druthers-api/blob/main/docs/mcp-usage.md';

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-md border border-line bg-night px-4 py-3 text-xs leading-relaxed text-neutral-300">
      <code>{children}</code>
    </pre>
  );
}

export function McpClientSnippet() {
  const [client, setClient] = useState<'claude' | 'codex' | 'opencode'>('claude');

  return (
    <>
      <h3 className="mt-5 text-xs font-medium uppercase tracking-wide text-neutral-500">
        Connect it
      </h3>

      <div className="mt-3 flex gap-2 border-b border-line pb-px">
        <button
          onClick={() => setClient('claude')}
          className={`px-3 py-1.5 text-xs font-medium transition-colors ${
            client === 'claude'
              ? 'border-b-2 border-brass text-paper'
              : 'text-neutral-500 hover:text-neutral-300'
          }`}
        >
          Claude
        </button>
        <button
          onClick={() => setClient('codex')}
          className={`px-3 py-1.5 text-xs font-medium transition-colors ${
            client === 'codex'
              ? 'border-b-2 border-brass text-paper'
              : 'text-neutral-500 hover:text-neutral-300'
          }`}
        >
          Codex
        </button>
        <button
          onClick={() => setClient('opencode')}
          className={`px-3 py-1.5 text-xs font-medium transition-colors ${
            client === 'opencode'
              ? 'border-b-2 border-brass text-paper'
              : 'text-neutral-500 hover:text-neutral-300'
          }`}
        >
          OpenCode
        </button>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-neutral-400">
        First, mint a personal API key from{' '}
        <Link href="/settings" className="text-brass hover:text-brass-bright">
          Settings → API keys
        </Link>
        . Then, {client === 'claude' ? 'run:' : 'add this to your configuration:'}
      </p>

      <div className="mt-2">
        {client === 'claude' && (
          <CodeBlock>{`claude mcp add druthers \\
  -e API_BASE_URL=https://api.druthers.io \\
  -e API_TOKEN=drk_your_key_here \\
  --scope user \\
  -- python -m aleonard_mcp.server`}</CodeBlock>
        )}

        {client === 'codex' && (
          <CodeBlock>{`{
  "mcpServers": {
    "druthers": {
      "command": "python",
      "args": ["-m", "aleonard_mcp.server"],
      "env": {
        "API_BASE_URL": "https://api.druthers.io",
        "API_TOKEN": "drk_your_key_here"
      }
    }
  }
}`}</CodeBlock>
        )}

        {client === 'opencode' && (
          <CodeBlock>{`{
  "mcp": {
    "servers": {
      "druthers": {
        "type": "stdio",
        "command": "python",
        "args": ["-m", "aleonard_mcp.server"],
        "env": {
          "API_BASE_URL": "https://api.druthers.io",
          "API_TOKEN": "drk_your_key_here"
        }
      }
    }
  }
}`}</CodeBlock>
        )}
      </div>

      {client === 'claude' && (
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
      )}
    </>
  );
}
