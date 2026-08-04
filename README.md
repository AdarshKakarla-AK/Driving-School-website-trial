# Sri Mathru Driving School

A full-featured driving school management platform — public marketing site, student portal, instructor tools, and an admin back office — built with Next.js 16 (App Router) and SQLite.

[![CI](https://github.com/AdarshKakarla-AK/Driving-School-website-trial/actions/workflows/ci.yml/badge.svg)](https://github.com/AdarshKakarla-AK/Driving-School-website-trial/actions/workflows/ci.yml)

## Features

- **Public site** — premium marketing homepage (hero, social proof, pricing, fleet, instructors, process, testimonials, FAQ, contact, final CTA, mobile sticky CTA), courses & packages, instructors, about, certificate verification. Dark + light themes with a shared design token system (Manrope/Inter, semantic colors).
- **Booking & scheduling** — 14-day rolling slot window (Sundays off), availability by instructor/vehicle type, bookings, reschedules, cancellations with policy-based fees, waitlist auto-notify.
- **Payments** — Razorpay integration (signed webhook for `payment.captured` / `payment.failed`) with full & EMI plans, invoices with GST, coupons. Runs in **demo mode** (fake orders, instant verify) when Razorpay keys are absent; `npm run check:keys` verifies credentials before launch.
- **Student portal** — dashboard, bookings, payments, lesson progress tracking, documents, certificates, reviews, notifications.
- **Admin portal** — overview & analytics, CRM (students & leads), bookings, finance (expenses, payroll), coupons, vehicles, automation & broadcast, settings.
- **Automation & notifications** — in-app inbox + optional WhatsApp/email webhooks (fire-and-forget, never block requests). See `DEPLOYMENT.md` for the webhook contract.
- **SQLite persistence** — per-collection JSON storage with WAL mode, transaction-safe writes, automatic schema migrations & collection backfill, legacy `db.json` auto-import, and a backup/restore toolchain.

## Tech stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · node:sqlite (native) · Razorpay · Vitest + Testing Library

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000. Demo accounts (seeded on first boot):

| Role       | Login                    | Password  |
| ---------- | ------------------------ | --------- |
| Admin      | `admin@srimathru.in`     | `admin123`|
| Instructor | `ravi@srimathru.in`      | `demo123` |
| Student    | `rahul.sharma@gmail.com` | `demo123` |

## Scripts

| Command             | Description                                        |
| ------------------- | -------------------------------------------------- |
| `npm run dev`       | Start the dev server                               |
| `npm run build`     | Production build (`output: "standalone"`)          |
| `npm start`         | Serve the production build                         |
| `npm run lint`      | ESLint                                            |
| `npm test`          | Unit tests (vitest, node env)                      |
| `npm run test:component` | Component tests (jsdom + Testing Library)     |
| `npm run test:e2e`  | Build + end-to-end API tests against a throwaway DB|
| `npm run backup`    | Snapshot the SQLite DB to `data/backups/`          |
| `npm run restore -- <file>` | Validate + restore a backup snapshot       |
| `npm run check:keys`| Verify `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` against the Razorpay API |
| `npm run smoke:live` | End-to-end live payment smoke test (see `scripts/smoke-live.mjs`) |

## Environment variables

See [`.env.example`](.env.example). Key ones:

- `SESSION_SECRET` — session signing key (auto-generated if unset)
- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` — real payments; omit for demo mode
- `NEXT_PUBLIC_SITE_URL` — base URL for absolute links
- `WHATSAPP_WEBHOOK_URL` / `EMAIL_WEBHOOK_URL` — optional notification webhooks
- `DATABASE_PATH` — override the SQLite file (default `data/db.sqlite`)

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md): Docker (recommended), bare Node, or serverless. Health checks: `GET /api/health`.

## Testing

Unit tests live in `tests/unit/`, component tests in `tests/component/`, and end-to-end API tests in `tests/e2e/`. E2E tests spin up a production build against a fresh temp database, so they never touch real data. CI runs lint + unit + component + e2e on every push/PR.
