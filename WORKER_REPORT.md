# druthers-web#202 — Add environment banner system (QA test-only / prod beta)

## What changed
- Cause: QA and prod visitors had no prominent way to know they were on a non-production stage — only the tiny `EnvBadge` chip and the page title carried that signal — so the issue called for a dismissible, per-environment banner.
- Fix: added `src/components/EnvBanner.tsx`, a client component keyed off the existing build-time `NEXT_PUBLIC_APP_ENV` (dev | qa | prod). QA renders a sky-blue strip: "For testing purposes only — no entry permitted." with a `mailto:admin@druthers.io` link. Prod renders a brass "Beta" strip: "Druthers is in beta — expect frequent changes." Dev and unknown values render nothing. Dismissal is remembered per session and per environment in `sessionStorage`. Wired into the root layout above the app shell so signed-out visitors on the public landing page see it too.

## Tests written (not run)
- `src/components/EnvBanner.test.tsx` — asserts:
  - nothing renders in dev by default and for an unknown env value (`staging`)
  - QA copy ("for testing purposes only", "no entry permitted") and a link whose `href` is `mailto:admin@druthers.io`
  - prod copy ("beta", "frequent changes")
  - env value is handled case-insensitively (like `EnvBadge`)
  - dismissal hides the banner, writes `druthers_env_banner_dismissed_qa` to sessionStorage, and stays hidden across a re-render
  - dismissal is scoped per environment (dismissing QA does not hide prod)

## Demo notes
- Build the web app with `NEXT_PUBLIC_APP_ENV=qa` baked in (the QA workflow does this via `--build-arg NEXT_PUBLIC_APP_ENV=qa`). Every page — including the signed-out landing page at `/` and `/login` — should show a full-width sky-blue strip at the very top with a "QA" label, "For testing purposes only — no entry permitted." and an `admin@druthers.io` mailto link. The ✕ dismisses it and it stays hidden for the rest of that browser session.
- Rebuild with `NEXT_PUBLIC_APP_ENV=prod`: brass "Beta" strip reading "Druthers is in beta — expect frequent changes."
- Default dev build (`NEXT_PUBLIC_APP_ENV=dev`, which the local env template sets): no banner anywhere.
- Good pages to exercise: `/` signed out (confirms signed-out visibility), `/login`, and a signed-in page like `/movies`.

## Decisions I made
- Drove the banner off `NEXT_PUBLIC_APP_ENV` rather than a runtime env var or a new flag. It is the single env signal the codebase already keys off (`EnvBadge`, the layout `<title>`, the login dev fallback), and both deploy workflows already pass it (`deploy_qa.yaml` → `qa`, `deploy_cloud_run.yaml` → `prod`), so no CI/release/secret config changes were needed. NEXT_PUBLIC_ values being baked at build time is exactly the "per deployed environment" configurability the issue wants.
- Dismissal uses `sessionStorage` ("persistent per session is acceptable") with a per-env key (`druthers_env_banner_dismissed_<env>`) so dismissing in QA doesn't suppress the prod banner.
- The banner renders at the top of the root layout body, outside the signed-in app shell, because the capture targets QA visitors who may land signed-out on the public page.
- dev deliberately has no banner config entry. "Explicitly enabled" = baking a QA/prod env at build, the same opt-in every other env-driven surface in this repo uses.
- Treated "no entry permitted" as messaging only — no sign-in/feature block for QA — because the issue context explicitly says this is environment messaging that does not change the API or data model.

## Not done / uncertain
- Could not run tests, lint, or typecheck: `node_modules` is not installed in this worktree and the orchestrator runs the sweep. For the same reason I could not read `node_modules/next/dist/docs/` as AGENTS.md instructs; I relied on the in-repo patterns (client components already rendered from `layout.tsx`, `localStorage`-in-effect precedent, `eslint-disable` idiom from `Tutorial.tsx`).
- Could not verify happy-dom's `sessionStorage` behavior against the pinned version; the test assumes the Web Storage API is present, which the codebase already depends on for `localStorage` (Tutorial/rankedListLength tests).
- Banner copy is my settlement of the raw capture — wording is the one thing worth a human review pass.
- Not applicable: the movies/TV/books/games sibling check — this issue touches no media category; it is an infra/UX banner. iOS and MCP have no UI surface, matching the issue's Channel Impact.
