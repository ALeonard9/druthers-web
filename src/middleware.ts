import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Server Components have no direct way to read the current pathname; the
// documented workaround is a request header set here and read back with
// `headers()`. Introduced for the admin console (#249), which needs to know
// it's rendering under `/admin` so it can opt the layout out of the app
// shell's `max-w-5xl` content clamp - a directory table wants the room.
export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', request.nextUrl.pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
