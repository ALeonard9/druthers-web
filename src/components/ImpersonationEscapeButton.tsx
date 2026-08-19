'use client';

// The one-click way out of a view-as session (#250). No confirmation - the
// whole point of an escape hatch is that it always works. Always does a full
// navigation, never router.refresh(): the layouts rendered under the
// impersonated identity can be served from a client-side cache, and a hard
// reload is what actually drops the impersonation cookie's effect from every
// rendered surface, not just the one this button sits on.
export function ImpersonationEscapeButton({
  targetId,
  label = 'Back to admin',
  className = 'rounded border border-white/40 px-2 py-1 text-xs font-medium text-white hover:bg-white/10',
}: {
  targetId: string;
  label?: string;
  className?: string;
}) {
  async function stop() {
    try {
      await fetch('/api/admin/impersonation', { method: 'DELETE' });
    } catch {
      // Best-effort, same as the route handler's own upstream call - a
      // network blip here must not trap the admin in view-as mode.
    } finally {
      // A hard reload, not router.push(): the layouts under the impersonated
      // identity can be served stale from a client-side cache, and dropping
      // the impersonation cookie's effect everywhere needs a clean request.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign(`/admin/users/${targetId}`);
    }
  }

  return (
    <button type="button" onClick={() => void stop()} className={className}>
      {label}
    </button>
  );
}
