'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Sub-navigation within a section (e.g. TV → Shows · Schedule). The active
// tab is matched exactly so nested detail routes fall back to the first tab.
export function SectionTabs({
  tabs,
}: {
  tabs: { href: string; label: string }[];
}) {
  const pathname = usePathname();
  const active =
    tabs.find((t) => t.href === pathname)?.href ?? tabs[0].href;

  return (
    <div className="flex gap-1 border-b border-line">
      {tabs.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={`-mb-px border-b-2 px-3 py-2 text-sm ${
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
