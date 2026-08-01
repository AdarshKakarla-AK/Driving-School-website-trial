# Contributing

Thanks for helping improve Sri Mathru Driving School. This guide covers the
workflow, conventions, and how to run the checks that keep the project healthy.

## Development setup

```bash
npm install
npm run dev
```

The app boots with seeded demo data (`data/db.sqlite`, created on first run) so
every feature works without external services. Payments run in demo mode unless
Razorpay keys are set.

## Project layout

- `src/app` — Next.js App Router: `(site)` public pages, `(auth)` login/register,
  `portal/*` dashboards, `api/*` route handlers.
- `src/lib` — domain logic: `db/` (store + seed + schema versioning), `notify.ts`,
  `automation.ts`, `payments.ts`, `booking.ts`, `analytics.ts`, `rate-limit.ts`,
  `auth.ts`, `secret.ts`.
- `tests/unit` — logic tests (vitest, node environment; `@/lib/db/store` is mocked).
- `tests/component` — React component tests (vitest + jsdom + Testing Library).
- `tests/e2e` — full-stack API tests against a real `next start` server with a
  throwaway SQLite database (`DATABASE_PATH`).
- `tests/helpers/seed.ts` — shared fixture for unit/component tests.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run test:unit` | Unit tests |
| `npm run test:component` | Component tests |
| `npm run test:e2e` | Build + end-to-end API tests |
| `npm run backup` / `npm run restore` | Back up / restore the SQLite database |
| `npm run check:keys` | Verify Razorpay credentials against the live API |

## Commit convention

Commits are checked by husky + commitlint and must follow
[Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): subject

- body bullets explaining what and why (optional)
```

Common types: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `ci`,
`perf`, `style`, `revert`. A staged-file ESLint check runs on every commit.

## Definition of done

A change is not done until all of these pass:

```bash
npm run lint
npx tsc --noEmit
npm run test:unit
npm run test:component
npm run test:e2e
```

- Unit tests must not depend on the real database — mock `@/lib/db/store`.
- E2E tests must not depend on real data — they already run against a fresh
  throwaway DB.
- When a feature changes the database, bump `SCHEMA_VERSION` in
  `src/lib/db/database.ts` and add a migration in `MIGRATIONS` (see
  `data/README.md`).
- New automation or notification types should be documented in `DEPLOYMENT.md`.

## Updating the changelog

Add notable changes under `[Unreleased]` in `CHANGELOG.md`, grouped by Added /
Changed / Deprecated / Removed / Fixed / Security.
