import { describe, expect, it } from 'vitest';
import { contentSecurityPolicy } from './contentSecurityPolicy';

const BASE_DIRECTIVES = [
  "default-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://image.tmdb.org https://static.tvmaze.com https://covers.openlibrary.org https://books.google.com https://books.googleusercontent.com https://images.igdb.com",
  "font-src 'self'",
  "frame-src 'self' https://accounts.google.com",
  "connect-src 'self' https://accounts.google.com",
  "form-action 'self'",
  "object-src 'none'",
];

describe('contentSecurityPolicy', () => {
  it('keeps every baseline directive in the static policy', () => {
    const policy = contentSecurityPolicy();

    for (const directive of BASE_DIRECTIVES) expect(policy).toContain(directive);
    expect(policy).toContain("script-src 'self' 'unsafe-inline' https://accounts.google.com");
  });

  it('changes only script execution when adding a request nonce', () => {
    const policy = contentSecurityPolicy({ nonce: 'request-nonce', development: true });

    for (const directive of BASE_DIRECTIVES) expect(policy).toContain(directive);
    expect(policy).toContain("script-src 'self' 'nonce-request-nonce' 'strict-dynamic' 'unsafe-eval'");
    expect(policy).not.toContain("script-src 'self' 'unsafe-inline'");
  });
});
