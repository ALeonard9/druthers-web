import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/session';
import { ApiKeysManager } from '@/components/ApiKeysManager';
import { SoundPicker } from '@/components/SoundPicker';

export const dynamic = 'force-dynamic';

const CSV_DOMAINS = [
  ['movies', 'Movies'],
  ['tv-shows', 'TV shows'],
  ['tv-episodes', 'TV episodes'],
  ['books', 'Books'],
  ['games', 'Games'],
] as const;

export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl font-medium tracking-tight text-paper">
          Settings
        </h1>
        <p className="text-sm text-neutral-400">
          Signed in as <span className="text-neutral-300">{user.email}</span>
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="font-display text-lg text-paper">API keys</h2>
          <p className="text-sm text-neutral-400">
            Personal credentials for the{' '}
            <a
              href="https://github.com/ALeonard9/aleonard.us-mcp"
              className="text-brass hover:text-brass-bright"
              rel="noreferrer"
              target="_blank"
            >
              MCP server
            </a>{' '}
            and scripts — use one as <code className="font-mono text-xs">API_TOKEN</code>{' '}
            instead of your password. Revoking takes effect immediately.
          </p>
        </div>
        <ApiKeysManager />
      </section>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="font-display text-lg text-paper">Sound</h2>
          <p className="text-sm text-neutral-400">
            Played when you mark something watched, read, or played. Saved on
            this device.
          </p>
        </div>
        <SoundPicker />
      </section>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="font-display text-lg text-paper">Your data</h2>
          <p className="text-sm text-neutral-400">
            Everything you’ve tracked, downloadable any time. Never locked in.
          </p>
        </div>
        <div className="rounded-lg border border-line bg-panel px-4 py-3 text-sm">
          {/* Plain anchors on purpose: these are file downloads served by BFF
              route handlers, not pages — <Link/> would try to client-navigate
              and prefetch them. */}
          <a
            href="/api/export"
            download
            className="text-brass hover:text-brass-bright"
          >
            Download everything (JSON)
          </a>
          <p className="mt-2 text-xs text-neutral-500">
            Spreadsheets:{' '}
            {CSV_DOMAINS.map(([slug, label], i) => (
              <span key={slug}>
                {i > 0 && ' · '}
                <a
                  href={`/api/export/${slug}.csv`}
                  download
                  className="text-neutral-300 underline decoration-line hover:text-paper"
                >
                  {label}
                </a>
              </span>
            ))}
          </p>
        </div>
      </section>
    </div>
  );
}
