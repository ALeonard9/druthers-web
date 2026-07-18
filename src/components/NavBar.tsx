import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { getSessionUser } from '@/lib/session';
import { badgeLabel } from '@/lib/notifications';
import type { UnreadCount } from '@/lib/types';
import { LogoutButton } from './LogoutButton';
import { EnvBadge } from './EnvBadge';
import { NavLinks } from './NavLinks';

export async function NavBar() {
  const user = await getSessionUser();

  // Unread badge is decoration — never let an API blip take down the nav.
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
    <header className="border-b border-line bg-night">
      <nav className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-y-2 px-4 py-3">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <Link
            href="/movies"
            className="font-display text-xl font-medium italic tracking-tight text-paper"
          >
            aleonard<span className="not-italic text-brass">.us</span>
          </Link>
          <EnvBadge />
          {user && <NavLinks />}
        </div>
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
      </nav>
    </header>
  );
}
