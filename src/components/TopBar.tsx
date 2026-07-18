import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { getSessionUser } from '@/lib/session';
import { badgeLabel } from '@/lib/notifications';
import type { UnreadCount } from '@/lib/types';
import { LogoutButton } from './LogoutButton';
import { EnvBadge } from './EnvBadge';

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return 'Up late';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export async function TopBar() {
  const user = await getSessionUser();

  // Unread badge is decoration — never let an API blip take down the bar.
  let unread = 0;
  if (user) {
    try {
      const count = await apiFetch<UnreadCount>(
        '/v1/users/me/notifications/unread-count',
      );
      unread = count.unread;
    } catch {
      unread = 0;
    }
  }
  const badge = badgeLabel(unread);

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
            aria-label={
              badge ? `Notifications (${unread} unread)` : 'Notifications'
            }
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
            {badge && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brass px-1 text-[10px] font-semibold text-ink">
                {badge}
              </span>
            )}
          </Link>
          <Link
            href="/sounds"
            aria-label="Sound settings"
            title="Sound settings"
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
                d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z"
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
