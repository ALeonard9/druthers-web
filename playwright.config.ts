import { defineConfig, devices } from '@playwright/test';

// Two lanes, matching the tiered testing model in AGENTS.md.
//
//   smoke          unauthenticated, no backend needed. Runs in PR CI on every
//                  push: `npm run test:e2e`. Starts its own `next start`.
//   authenticated  the real multi-service flow (BFF cookie mint, proxy.ts
//                  refresh, ranking, visibility). Needs a live api + database,
//                  so it NEVER runs in PR CI. Point it at the local dev stack
//                  or at QA with E2E_BASE_URL: `task e2e:local` / `task e2e:qa`.
//
// Prod is deliberately absent and must stay that way. The authenticated specs
// write (add a title, rank it, send a friend request) and the dev sign-in form
// is compiled out of the prod bundle anyway (NEXT_PUBLIC_APP_ENV === 'prod').
const baseURL = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3000';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  // A QA run crosses the public internet and shares one source IP with
  // everything else on the runner, so retries matter more there than locally.
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'smoke',
      grepInvert: /@authenticated/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'authenticated',
      grep: /@authenticated/,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Only the smoke lane can boot its own server: the authenticated lane needs
  // an api and a database behind it, which E2E_BASE_URL is the signal for.
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: 'npm run start',
        url: 'http://127.0.0.1:3000/login',
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
      },
});
