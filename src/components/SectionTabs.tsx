'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Sub-navigation within a section (e.g. Movies → Rankings · Watchlist). The
// active tab is matched exactly so nested detail routes fall back to the first
// tab. Each tab filters independently — switching tabs drops the current
// filter rather than carrying it across.
export function SectionTabs({
  tabs,
}: {
  tabs: { href: string; label: string }[];
}) {
  const pathname = usePathname();
  // Exact match first (e.g. Ranking now defaults to the duel at
  // `/movies/ranking`); otherwise fall back to the longest href that's a
  // path prefix, so a nested route like `/movies/ranking/list` still lights
  // up the Ranking tab rather than defaulting to the first tab.
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
