# druthers-web#89 — Add Terms of Use and Privacy Policy pages

## What changed
- Added `Terms of Use` and `Privacy Policy` pages to provide the site with proper legal coverage for data handling.
- Added a `SiteFooter` component and linked it from both logged-in and logged-out layouts so the legal pages are always accessible.

## Tests
- `src/app/terms/page.test.tsx`: Asserts the draft warning banner and mentions of Lady Bird LLC.
- `src/app/privacy/page.test.tsx`: Asserts the draft warning banner, mentions of Lady Bird LLC, and mentions of Google OAuth, Goodreads, TMDB, Open Library, IGDB, and Neon.
- `src/components/SiteFooter.test.tsx`: Asserts the presence of both legal page links.
- Test run results: Test Files: 52 passed (52), Tests: 265 passed (265).

## Demo notes
- Open `http://localhost:3000/`.
- Scroll to the bottom of the public landing page to view the new `SiteFooter`.
- Click "Terms of Use" to view the generated Terms of Use page.
- Click "Privacy Policy" to view the generated Privacy Policy page.
- Check that the draft warning banner is present on both pages and Lady Bird LLC is explicitly mentioned.
- Sign in as `friend@example.com` / `change-me`.
- Check that the footer still appears at the bottom of the page.

## Decisions I made
- The `SiteFooter` component was created to provide a universal footer, since the app didn't have one. It was injected into both the authenticated and unauthenticated page layouts in `src/app/layout.tsx`.

## Not done / uncertain
- The legal text is a generated first pass and requires your formal legal review before taking effect.
- The issue applies globally to the site rather than touching one specific media domain (movies/TV/books/games), so no cross-domain checks were necessary.
