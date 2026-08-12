import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { API_BASE_URL } from '@/lib/api';
import { applyTokenCookies } from '@/lib/session';

// Once GIS hands the browser a credential, budget 4s for the token exchange
// and 1s for the primary home summary below: 5s to a fully populated home,
// with its usable shell visible sooner.
const AUTH_API_BUDGET_MS = 4_000;

function withAuthTiming(response: NextResponse, durationMs: number): NextResponse {
  response.headers.set(
    'Server-Timing',
    `druthers_auth_api;dur=${durationMs.toFixed(1)};desc="Google token exchange"`,
  );
  if (durationMs > AUTH_API_BUDGET_MS) {
    console.warn(
      `[auth/google] API token exchange exceeded ${AUTH_API_BUDGET_MS}ms budget (${durationMs.toFixed(0)}ms)`,
    );
  }
  return response;
}

// BFF Google sign-in: forward the Google Identity Services ID token (credential)
// to the API, then store the returned JWT in an httpOnly cookie.
export async function POST(request: Request) {
  const { credential } = await request.json();
  if (!credential) {
    return NextResponse.json({ error: 'Missing credential' }, { status: 400 });
  }

  const startedAt = performance.now();
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/v1/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential }),
      cache: 'no-store',
    });
  } catch {
    return withAuthTiming(
      NextResponse.json({ error: 'Authentication service unavailable' }, { status: 502 }),
      performance.now() - startedAt,
    );
  }
  const apiDurationMs = performance.now() - startedAt;

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const detail =
      body?.detail ?? body?.message ?? 'Google sign-in failed';
    return withAuthTiming(
      NextResponse.json({ error: detail }, { status: 401 }),
      apiDurationMs,
    );
  }

  const data = await res.json();
  const user = applyTokenCookies(await cookies(), data);
  return withAuthTiming(NextResponse.json({ ok: true, user }), apiDurationMs);
}
