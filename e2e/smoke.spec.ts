import { test, expect } from '@playwright/test';

test('login page renders the sign-in options', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: /druthers/ })).toBeVisible();
  // The Google button is an external iframe that doesn't render without the
  // GIS script + client id, so smoke-test the always-present dev fallback:
  // it lives collapsed inside a <details>, expand it to reach the button.
  const fallback = page.getByText('Developer sign-in (local)');
  await expect(fallback).toBeVisible();
  await fallback.click();
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
});

test('unauthenticated root shows the public landing page', async ({ page }) => {
  // #27: signed-out visitors get a marketing landing page at `/` instead of
  // a redirect to /login (the arrival path from a shared Top 5 card).
  await page.goto('/');
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { name: /druthers/, level: 1 })).toBeVisible();
  await expect(page.getByText('One shelf, four collections')).toBeVisible();
});

// Public surface. No backend, no session: these are what PR CI can prove on
// every push, and they are the pages a signed-out visitor or a crawler hits
// first. A build that breaks one of them is otherwise invisible until someone
// follows a shared link.

test.describe('public pages render', () => {
  for (const path of ['/about', '/privacy', '/terms', '/mcp']) {
    test(`${path} renders`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status(), `${path} did not answer 200`).toBe(200);
      await expect(page.locator('main')).not.toBeEmpty();
    });
  }
});

test('a protected route redirects a signed-out visitor to /login', async ({ page }) => {
  await page.goto('/movies');
  await expect(page).toHaveURL(/\/login/);
});

test('the landing page sets a CSP and trips no violations', async ({ page }) => {
  // contentSecurityPolicy.ts is unit-tested, but nothing proved the real page
  // survives its own policy. A nonce mismatch blocks the app's own scripts and
  // renders as a subtly dead page rather than an error.
  const violations: string[] = [];
  page.on('console', (m) => {
    if (/Content Security Policy/i.test(m.text())) violations.push(m.text());
  });

  const response = await page.goto('/');
  expect(response?.headers()['content-security-policy'], 'no CSP header on the landing page')
    .toBeTruthy();
  await expect(page.getByRole('heading', { name: /druthers/, level: 1 })).toBeVisible();
  expect(violations, `CSP violations fired: ${violations.join(' | ')}`).toEqual([]);
});
