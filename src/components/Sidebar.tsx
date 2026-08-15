'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ShelfId } from '@/lib/duelShelves';
import { orderedEnabledShelves } from '@/lib/shelfPreferences';
import { useShelfPreferences } from '@/lib/useShelfPreferences';
import { DOMAIN_ICON_PATHS } from './DomainIcon';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  shelf?: ShelfId;
}

const ICON = {
  home: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75"
    />
  ),
  clock: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
    />
  ),
  ticket: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z"
    />
  ),
};

const COLLECTIONS: NavItem[] = [
  { href: '/', label: 'Home', icon: ICON.home },
  { href: '/movies', label: 'Movies', icon: DOMAIN_ICON_PATHS.movies, shelf: 'movies' },
  { href: '/tv', label: 'TV', icon: DOMAIN_ICON_PATHS.tv, shelf: 'tv' },
  { href: '/books', label: 'Books', icon: DOMAIN_ICON_PATHS.books, shelf: 'books' },
  { href: '/games', label: 'Games', icon: DOMAIN_ICON_PATHS.games, shelf: 'games' },
];

const VIEWS: NavItem[] = [
  { href: '/activity', label: 'Activity', icon: ICON.clock },
  { href: '/surprise', label: 'Surprise me', icon: ICON.ticket },
];

function useActive(pathname: string, collections: NavItem[]): string | undefined {
  const all = [...collections, ...VIEWS];
  return all
    .filter((l) =>
      l.href === '/' ? pathname === '/' : pathname.startsWith(l.href),
    )
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
        active
          ? 'bg-panel font-medium text-paper'
          : 'text-neutral-400 hover:bg-panel/60 hover:text-paper'
      }`}
    >
      <svg
        className={`h-5 w-5 shrink-0 ${active ? 'text-brass' : ''}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        {item.icon}
      </svg>
      {item.label}
    </Link>
  );
}

// Persistent left rail on desktop; the same items render as a bottom tab bar
// on small screens (BottomTabs).
export function Sidebar() {
  const pathname = usePathname();
  const preferences = useShelfPreferences();
  const collections = [COLLECTIONS[0], ...orderedEnabledShelves(preferences).flatMap((id) =>
    COLLECTIONS.filter((item) => item.shelf === id),
  )];
  const active = useActive(pathname, collections);

  return (
    <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-line bg-night px-3 py-4 md:flex">
      <Link
        href="/"
        title="druthers - as in “if I had my druthers”"
        className="mb-6 flex items-center gap-1 px-3"
      >
        <span className="font-display text-3xl font-semibold leading-none text-brass">
          ’
        </span>
        <span className="font-display text-xl font-medium italic tracking-tight text-paper">
          druthers
        </span>
      </Link>
      <nav className="flex flex-col gap-1">
        {collections.map((item) => (
          <NavLink key={item.href} item={item} active={active === item.href} />
        ))}
        <div className="mx-3 my-3 border-t border-line" />
        {VIEWS.map((item) => (
          <NavLink key={item.href} item={item} active={active === item.href} />
        ))}
      </nav>
      <div className="mt-auto flex flex-col gap-0.5">
        <Link
          href="/mcp"
          className={`px-3 py-1 text-xs transition-colors ${
            pathname === '/mcp'
              ? 'text-paper'
              : 'text-neutral-500 hover:text-paper'
          }`}
        >
          MCP
        </Link>
        <Link
          href="/about"
          className={`px-3 py-1 text-xs transition-colors ${
            pathname === '/about'
              ? 'text-paper'
              : 'text-neutral-500 hover:text-paper'
          }`}
        >
          Why “druthers”?
        </Link>
      </div>
    </aside>
  );
}

export function BottomTabs() {
  const pathname = usePathname();
  const preferences = useShelfPreferences();
  const collections = [COLLECTIONS[0], ...orderedEnabledShelves(preferences).flatMap((id) =>
    COLLECTIONS.filter((item) => item.shelf === id),
  )];
  const active = useActive(pathname, collections);
  const items = [...collections, ...VIEWS];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 flex border-t border-line bg-night/95 backdrop-blur md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-label={item.label}
          className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] ${
            active === item.href ? 'text-brass' : 'text-neutral-500'
          }`}
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            {item.icon}
          </svg>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
