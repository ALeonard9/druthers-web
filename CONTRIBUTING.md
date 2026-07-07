# Contributing

This repo follows the shared aleonard.us SDLC — see
[`SDLC.md`](https://github.com/ALeonard9/aleonard.us-api/blob/main/SDLC.md) in the
API repo (canonical).

## TL;DR

- **Branches**: `main` is protected. Work on short-lived `feat/…`, `fix/…`, or
  `chore/…` branches; open a PR; merge when CI is green (squash).
- **Before pushing**: `npm run lint && npm run typecheck && npm run test && npm run build`.
- **Pre-commit**: `pre-commit install` runs eslint/typecheck/vitest on commit.
- **Commits**: imperative subject; explain the *why* in the body.

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Point `API_BASE_URL` at a running `aleonard.us-api`.
