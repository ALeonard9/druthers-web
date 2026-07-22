import { Suspense } from 'react';
import Link from 'next/link';
import { getSessionUser } from '@/lib/session';
import { LogoutButton } from './LogoutButton';
import { EnvBadge } from './EnvBadge';
import { UnreadBadge } from './UnreadBadge';

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return 'Up late';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export async function TopBar() {
  const user = await getSessionUser();

  return (
    <header className="flex items-center justify-between gap-4 border-b border-line bg-night px-4 py-3 md:px-8">
      <div className="flex items-center gap-3">
        {/* Wordmark shows only on mobile, where the sidebar is hidden. */}
        <Link href="/" className="flex items-center gap-1 md:hidden">
          <span className="font-display text-2xl font-semibold leading-none text-brass">
            ’
          </span>
          <span className="font-display text-lg font-medium italic tracking-tight text-paper">
            druthers
          </span>
        </Link>
        {/* Mobile route to the name explainer (sidebar link is hidden here). */}
        <Link
          href="/about"
          aria-label="Why “druthers”?"
          className="grid h-4 w-4 place-items-center rounded-full border border-line text-[10px] leading-none text-neutral-500 transition-colors hover:text-paper md:hidden"
        >
          ?
        </Link>
        <span className="hidden font-display text-lg text-paper md:inline">
          {greeting()}.
        </span>
        <EnvBadge />
      </div>
      {user && (
        <form action="/search" className="mx-2 hidden flex-1 justify-center sm:flex">
          <input
            type="search"
            name="q"
            placeholder="Search everything…"
            className="w-full max-w-sm rounded border border-neutral-700 bg-panel px-3 py-1.5 text-sm outline-none placeholder:text-neutral-600 focus:border-brass"
          />
        </form>
      )}
      {user ? (
        <div className="flex items-center gap-3 text-sm">
          <Link
            href="/notifications"
            className="relative rounded p-1 text-neutral-400 hover:text-paper"
            aria-label="Notifications"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
              />
            </svg>
            <Suspense fallback={null}>
              <UnreadBadge />
            </Suspense>
          </Link>
          <Link
            href="/settings"
            aria-label="Settings"
            title="Settings"
            className="rounded p-1 text-neutral-400 hover:text-paper"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
              />
            </svg>
          </Link>
          <span className="hidden text-neutral-500 sm:inline">
            {user.email}
          </span>
          <LogoutButton />
        </div>
      ) : (
        <Link
          href="/login"
          className="rounded bg-brass px-3 py-1.5 text-sm font-medium text-ink hover:bg-brass-bright"
        >
          Sign in
        </Link>
      )}
    </header>
  );
}
