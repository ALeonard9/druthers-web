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
