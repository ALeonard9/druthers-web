import { redirect } from 'next/navigation';
import { getImpersonationMeta, getToken } from './session';

export { API_BASE_URL } from './apiBase';
import { API_BASE_URL } from './apiBase';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

interface ApiOptions {
  method?: string;
  body?: unknown;
  // When true, attach a bearer token - normally resolved from the session
  // cookie via getToken(), unless `token` below overrides it.
  auth?: boolean;
  // Explicit bearer token, bypassing getToken()'s cookie lookup. Needed by
  // /api/admin/impersonation's DELETE handler (#250): it clears the
  // impersonation cookie on the request-scoped cookies() store before
  // calling this, and that mutation puts the store into "response" mode for
  // every *other* `cookies()` read in the same request too, including
  // getToken()'s own - so getToken() can no longer see aleonard_session
  // either, not just the cookie that was actually cleared. Reading the
  // admin's token before mutating anything and passing it straight through
  // sidesteps that rather than depending on it.
  token?: string;
}

/**
 * Server-side fetch against the API. Attaches the session JWT when `auth` is
 * set. Throws ApiError on non-2xx so callers can map to HTTP responses.
 */
export async function apiFetch<T>(
  path: string,
  { method = 'GET', body, auth = true, token: explicitToken }: ApiOptions = {},
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = explicitToken ?? (await getToken());
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
  });

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const data = text ? JSON.parse(text) : undefined;
  if (!res.ok) {
    // Impersonation tokens are ~15 minutes with no refresh (#250), so a 401
    // here always means that clock ran out mid-render. A 403 on a GET means
    // the same thing by elimination: reads are never blocked while
    // impersonating, only writes are, so a refused read can't be the
    // expected "read-only" refusal - something about the session itself is
    // wrong. A 403 on a write, by contrast, *is* the expected refusal and is
    // left to throw normally so the caller's own error handling shows it.
    //
    // This redirects rather than clearing cookies directly because a plain
    // Server Component render (which is most apiFetch call sites) cannot
    // mutate cookies - only a Route Handler or Server Action can. /api/admin/expire
    // is that Route Handler: it clears the impersonation cookies and lands
    // the admin back on the target's detail page with an explanation,
    // keeping their own admin session untouched throughout.
    if (auth && (res.status === 401 || (res.status === 403 && method === 'GET'))) {
      const impersonation = await getImpersonationMeta();
      if (impersonation) {
        // handle is nullable (a private user is exactly the kind of account
        // likeliest to lack one) - omit the param rather than sending the
        // literal string "null" through the query string.
        const qs = new URLSearchParams({ target: impersonation.target.id });
        if (impersonation.target.handle) qs.set('handle', impersonation.target.handle);
        redirect(`/api/admin/expire?${qs}`);
      }
    }

    const detail =
      (data && (data.detail || data.message)) || res.statusText || 'API error';
    throw new ApiError(res.status, typeof detail === 'string' ? detail : 'API error');
  }
  return data as T;
}
