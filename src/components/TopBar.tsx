import { Suspense } from 'react';
import Link from 'next/link';
import { greetingAt } from '@/lib/viewerTime';
import { getViewerTimeZone } from '@/lib/viewerTimeZone';
import type { SessionUser } from '@/lib/types';
import { LogoutButton } from './LogoutButton';
import { EnvBadge } from './EnvBadge';
import { UnreadBadge } from './UnreadBadge';
import { FriendRequestBadge } from './FriendRequestBadge';
import { SearchForm } from './SearchForm';

async function ViewerGreeting() {
  // This runs on the server, so the greeting has to be told which clock to
  // read — `new Date().getHours()` here is the container's hour, which is how
  // a reader in Sydney got "Good evening" with their breakfast. It streams
  // separately because a preference lookup must not hold up the whole bar.
  const timeZone = await getViewerTimeZone();
  const greeting = greetingAt(new Date(), timeZone);

  return <>{greeting}.</>;
}

export function TopBar({ user }: { user: SessionUser }) {
  return (
    <header
      className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-night px-4 py-3 sm:flex-nowrap sm:gap-4 md:px-8"
      style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top))' }}
    >
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
          <Suspense fallback={<>Welcome.</>}>
            <ViewerGreeting />
          </Suspense>
        </span>
        <EnvBadge />
      </div>
      <div className="order-3 basis-full sm:order-none sm:mx-2 sm:flex-1 sm:basis-auto sm:max-w-lg">
        <SearchForm compact />
      </div>
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
            href="/friends"
            className="relative rounded p-1 text-neutral-400 hover:text-paper"
            aria-label="Friends"
            title="Friends"
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
                d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
              />
            </svg>
            <Suspense fallback={null}>
              <FriendRequestBadge />
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
    </header>
  );
}
