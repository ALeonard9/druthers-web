'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const ICON = {
  home: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75"
    />
  ),
  film: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0 1 18 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 7.746 6 7.125v-1.5M4.875 8.25C5.496 8.25 6 8.754 6 9.375v1.5m0-5.25v5.25m0-5.25C6 5.004 6.504 4.5 7.125 4.5h9.75c.621 0 1.125.504 1.125 1.125m1.125 2.625h1.5m-1.5 0A1.125 1.125 0 0 1 18 7.125v-1.5m1.125 2.625c-.621 0-1.125.504-1.125 1.125v1.5m2.625-2.625c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125M18 5.625v5.25M7.125 12h9.75m-9.75 0A1.125 1.125 0 0 1 6 10.875M7.125 12C6.504 12 6 12.504 6 13.125m0-2.25C6 11.496 5.496 12 4.875 12M18 10.875c0 .621-.504 1.125-1.125 1.125M18 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m-12 5.25v-5.25m0 5.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125m-12 0v-1.5c0-.621-.504-1.125-1.125-1.125M18 18.375v-5.25m0 5.25v-1.5c0-.621.504-1.125 1.125-1.125M18 13.125v1.5c0 .621.504 1.125 1.125 1.125"
    />
  ),
  tv: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 20.25h12m-7.5-3v3m3-3v3m-10.125-3h17.25c.621 0 1.125-.504 1.125-1.125V4.875c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125Z"
    />
  ),
  book: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"
    />
  ),
  game: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 0 1-.657.643 48.39 48.39 0 0 1-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 0 1-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 0 0-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 0 1-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 0 0 .657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 0 1-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 0 0 5.427-.63 48.05 48.05 0 0 0 .582-4.717.532.532 0 0 0-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.96.401v0a.656.656 0 0 0 .658-.663 48.422 48.422 0 0 0-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 0 1-.61-.58v0Z"
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
  { href: '/movies', label: 'Movies', icon: ICON.film },
  { href: '/tv', label: 'TV', icon: ICON.tv },
  { href: '/books', label: 'Books', icon: ICON.book },
  { href: '/games', label: 'Games', icon: ICON.game },
];

const VIEWS: NavItem[] = [
  { href: '/activity', label: 'Activity', icon: ICON.clock },
  { href: '/surprise', label: 'Surprise me', icon: ICON.ticket },
];

function useActive(pathname: string): string | undefined {
  const all = [...COLLECTIONS, ...VIEWS];
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
  const active = useActive(pathname);

  return (
    <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-line bg-night px-3 py-4 md:flex">
      <Link
        href="/"
        title="druthers — as in “if I had my druthers”"
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
        {COLLECTIONS.map((item) => (
          <NavLink key={item.href} item={item} active={active === item.href} />
        ))}
        <div className="mx-3 my-3 border-t border-line" />
        {VIEWS.map((item) => (
          <NavLink key={item.href} item={item} active={active === item.href} />
        ))}
      </nav>
      <Link
        href="/about"
        className={`mt-auto px-3 py-2 text-xs transition-colors ${
          pathname === '/about'
            ? 'text-paper'
            : 'text-neutral-500 hover:text-paper'
        }`}
      >
        Why “druthers”?
      </Link>
    </aside>
  );
}

export function BottomTabs() {
  const pathname = usePathname();
  const active = useActive(pathname);
  const items = [...COLLECTIONS, ...VIEWS];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-line bg-night/95 backdrop-blur md:hidden">
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
