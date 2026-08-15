// covers.openlibrary.org 302s to archive.org (and then to an iaXXXXXX.us.archive.org
// mirror) whenever a cover isn't cached locally, so both hosts have to be allowed
// or those redirected book covers get silently blocked.
const BASE_DIRECTIVES = [
  "default-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://image.tmdb.org https://static.tvmaze.com https://covers.openlibrary.org https://archive.org https://*.us.archive.org https://books.google.com https://books.googleusercontent.com https://images.igdb.com",
  "font-src 'self'",
  "frame-src 'self' https://accounts.google.com",
  "connect-src 'self' https://accounts.google.com",
  "form-action 'self'",
  "object-src 'none'",
];

export function contentSecurityPolicy(options?: {
  nonce?: string;
  development?: boolean;
}): string {
  const scriptSources = options?.nonce
    ? `script-src 'self' 'nonce-${options.nonce}' 'strict-dynamic'${options.development ? " 'unsafe-eval'" : ''} https://accounts.google.com`
    : "script-src 'self' 'unsafe-inline' https://accounts.google.com";

  return [BASE_DIRECTIVES[0], scriptSources, ...BASE_DIRECTIVES.slice(1)].join('; ');
}
