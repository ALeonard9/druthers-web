'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// The five collections, then the views over them — the divider dot encodes
// that boundary. Active page gets a brass underline, like a placed marker.
const COLLECTIONS = [
  { href: '/movies', label: 'Movies' },
  { href: '/tv', label: 'TV' },
  { href: '/books', label: 'Books' },
  { href: '/games', label: 'Games' },
  { href: '/countries', label: 'Countries' },
];

const VIEWS = [
  { href: '/tv/schedule', label: 'Schedule' },
  { href: '/activity', label: 'Activity' },
  { href: '/countries/flags', label: 'Flags' },
  { href: '/bored', label: 'Bored?' },
];

const ALL = [...COLLECTIONS, ...VIEWS];

export function NavLinks() {
  const pathname = usePathname();
  // Longest matching prefix wins, so /tv/schedule lights Schedule, not TV.
  const active = ALL.filter(
    (l) => pathname === l.href || pathname.startsWith(`${l.href}/`),
  ).sort((a, b) => b.href.length - a.href.length)[0]?.href;

  const linkClass = (href: string) =>
    `border-b-2 pb-0.5 transition-colors ${
      href === active
        ? 'border-brass text-paper'
        : 'border-transparent text-neutral-400 hover:text-paper'
    }`;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
      {COLLECTIONS.map((l) => (
        <Link key={l.href} href={l.href} className={linkClass(l.href)}>
          {l.label}
        </Link>
      ))}
      <span aria-hidden className="text-neutral-600">
        ·
      </span>
      {VIEWS.map((l) => (
        <Link key={l.href} href={l.href} className={linkClass(l.href)}>
          {l.label}
        </Link>
      ))}
    </div>
  );
}
