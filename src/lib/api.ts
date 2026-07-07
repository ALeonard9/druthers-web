import { getToken } from './session';

// Base URL of the FastAPI backend. Server-side only (never shipped to client).
export const API_BASE_URL =
  process.env.API_BASE_URL ?? 'http://127.0.0.1:8000';

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
  // When true, attach the caller's bearer token from the session cookie.
  auth?: boolean;
}

/**
 * Server-side fetch against the API. Attaches the session JWT when `auth` is
 * set. Throws ApiError on non-2xx so callers can map to HTTP responses.
 */
export async function apiFetch<T>(
  path: string,
  { method = 'GET', body, auth = true }: ApiOptions = {},
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = await getToken();
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
    const detail =
      (data && (data.detail || data.message)) || res.statusText || 'API error';
    throw new ApiError(res.status, typeof detail === 'string' ? detail : 'API error');
  }
  return data as T;
}
