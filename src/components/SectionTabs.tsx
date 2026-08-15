'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

// Sub-navigation within a section (e.g. Movies → Rankings · Watchlist). The
// active tab is matched exactly so nested detail routes fall back to the first
// tab. Each tab filters independently - switching tabs drops the current
// filter rather than carrying it across. An optional `icon` (the domain glyph,
// web#282) sits at the leading edge of the rail as a section marker.
export function SectionTabs({
  tabs,
  icon,
}: {
  tabs: { href: string; label: string }[];
  icon?: ReactNode;
}) {
  const pathname = usePathname();
  // Exact match first; otherwise fall back to the longest href that's a path
  // prefix so nested section routes still light up their owning tab.
  const active =
    tabs.find((t) => t.href === pathname)?.href ??
    [...tabs]
      .sort((a, b) => b.href.length - a.href.length)
      .find((t) => pathname.startsWith(`${t.href}/`))?.href ??
    tabs[0].href;

  return (
    // Scrolls sideways rather than wrapping: a wrapped tab would push the
    // active underline onto a second line and misalign the row.
    <div className="tab-rail flex gap-1 overflow-x-auto border-b border-line">
      {icon && (
        <span className="flex shrink-0 items-center py-2 pr-2 text-neutral-500">
          {icon}
        </span>
      )}
      {tabs.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={`-mb-px shrink-0 whitespace-nowrap border-b-2 px-3 py-2 text-sm ${
            t.href === active
              ? 'border-brass font-medium text-paper'
              : 'border-transparent text-neutral-400 hover:text-paper'
          }`}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}
