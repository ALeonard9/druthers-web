'use client';

import type { ReactNode } from 'react';
import { useImpersonation } from '@/lib/ImpersonationContext';

/**
 * Wraps a write control (or a whole settings section) so it visibly cannot
 * be used while impersonating, instead of relying on the admin to notice a
 * 403 land a moment after they already clicked (#250 follow-up).
 *
 * `inert` (native HTML, not just a style) removes the wrapped subtree from
 * both pointer AND keyboard interaction and from the accessibility tree -
 * opacity/pointer-events alone would still let Tab reach a "disabled-looking"
 * button. The server enforcement is unconditional either way; this is about
 * an admin never believing a click succeeded before the 403 they'd get
 * anyway lands.
 */
export function ImpersonationReadOnlyGuard({ children }: { children: ReactNode }) {
  const { impersonating, targetLabel } = useImpersonation();

  if (!impersonating) return <>{children}</>;

  return (
    <div>
      <div inert className="pointer-events-none opacity-50">
        {children}
      </div>
      <p className="mt-2 text-xs text-plum">
        Read-only while viewing as {targetLabel ?? 'this user'}.
      </p>
    </div>
  );
}
