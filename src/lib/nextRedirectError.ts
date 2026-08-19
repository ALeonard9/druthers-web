/**
 * True for the special error `redirect()` (from `next/navigation`) throws to
 * unwind a Server Component render into a real navigation.
 *
 * Needed because apiFetch (#250) calls `redirect()` itself when a request
 * hits an expired impersonation token, and several call sites wrap apiFetch
 * in a bare `catch` that would otherwise swallow that redirect along with
 * any real API failure - rethrow whenever this is true, or the admin never
 * actually leaves the expired view-as session.
 */
export function isNextRedirectError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'digest' in err &&
    typeof (err as { digest?: unknown }).digest === 'string' &&
    (err as { digest: string }).digest.startsWith('NEXT_REDIRECT')
  );
}
