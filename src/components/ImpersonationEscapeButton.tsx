'use client';

// The one-click way out of a view-as session (#250). No confirmation - the
// whole point of an escape hatch is that it always works, in the sense that
// it always gets the admin out of the impersonated view locally (the local
// cookies are cleared unconditionally by the route handler). Always does a
// full navigation, never router.refresh(): the layouts under the
// impersonated identity can be served from a client-side cache, and a hard
// reload is what actually drops the cookie's effect from every rendered
// surface, not just the one this button sits on.
//
// "Always works locally" is not the same claim as "always ends the session
// server-side" - the route handler reports whether it could confirm the
// upstream session actually ended (sessionEnded), and a failure there is
// carried through as a query param rather than silently presenting a clean
// "you are back" state while the token could still be live.
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
    let sessionEnded = false;
    try {
      const res = await fetch('/api/admin/impersonation', { method: 'DELETE' });
      const data = await res.json().catch(() => null);
      sessionEnded = Boolean(data?.sessionEnded);
    } catch {
      // Could not even reach the BFF - treat the same as an unconfirmed
      // end, since we genuinely don't know the upstream state.
    } finally {
      const destination = sessionEnded
        ? `/admin/users/${targetId}`
        : `/admin/users/${targetId}?impersonation_stop_warning=1`;
      // A hard reload, not router.push(): the layouts under the impersonated
      // identity can be served stale from a client-side cache, and dropping
      // the impersonation cookie's effect everywhere needs a clean request.
      window.location.assign(destination);
    }
  }

  return (
    <button type="button" onClick={() => void stop()} className={className}>
      {label}
    </button>
  );
}
