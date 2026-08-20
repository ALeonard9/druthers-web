import { apiFetch, ApiError } from './api';
import { getSessionUser } from './session';
import type { AdminUserListResponse, SessionUser } from './types';

// Re-exported so server-only call sites can import both the hint and the
// real gate from one place. Client components must import isAdminHint from
// ./adminHint directly - this module pulls in next/headers via ./session.
export { isAdminHint } from './adminHint';

/**
 * The real gate for the `/admin` route group.
 *
 * Proves adminness against the API rather than trusting the cookie: it
 * makes an authenticated call to an admin-only endpoint and reads whether
 * the API accepted or refused it. A forged `aleonard_user` cookie claiming
 * `user_group: "admin"` still gets refused here, because the API checks the
 * JWT's own claims, not anything the client sent about itself.
 *
 * Returns the signed-in user on success, or null on "not an admin" (no
 * session, or the API answered 401/403). Any other failure (5xx, network)
 * is rethrown - that is an outage, not an authorization answer, and should
 * not be presented to the operator as "page not found".
 */
export async function requireAdminUser(): Promise<SessionUser | null> {
  const user = await getSessionUser();
  if (!user) return null;
  try {
    // Cheapest admin-only call available: one row, offset 0. Next's request
    // memoization means the directory page's own fetch for the same URL in
    // the same render pass reuses this result instead of hitting the API twice.
    await apiFetch<AdminUserListResponse>('/v1/admin/users?limit=1&offset=0');
    return user;
  } catch (err) {
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
      return null;
    }
    throw err;
  }
}
