// Base URL of the FastAPI backend. Server-side only (never shipped to client).
//
// Split out from ./api so middleware can reach the API without importing the
// fetch helper, which pulls in `next/headers` and can't run there.
export const API_BASE_URL = process.env.API_BASE_URL ?? 'http://127.0.0.1:8000';
