# Changelog

All notable changes to this project are documented here. This project follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and
[Semantic Versioning](https://semver.org/). Commit messages follow the
[Conventional Commits](https://www.conventionalcommits.org/) spec (enforced by
husky + commitlint).

## [Unreleased]

### Added
- Razorpay gateway: real checkout via the shared `startRazorpayCheckout` modal in the
  booking flow and student portal, order creation + verification API routes
  (rate-limited and ownership-checked), and a signed `/api/payments/webhook`
  endpoint that confirms `payment.captured` / `order.paid` and fails
  `payment.failed` events idempotently (HMAC-SHA256 via `RAZORPAY_WEBHOOK_SECRET`).
- PDF invoices & receipts: `pdfkit`-rendered GST invoices with per-line totals,
  downloadable from the student portal (`/api/portal/invoices/<no>/download`) with
  ownership checks, plus emailed receipts when Resend is configured.
- `/api/cron` endpoint + automation engine (`src/lib/automation.ts`) for scheduled
  reminders: overdue payments, lessons starting within 24h, documents expiring
  within 30 days, and birthdays. Protected by `CRON_SECRET`; idempotent per run.
- SEO & marketing: `sitemap.ts`, `robots.ts`, `manifest.ts`, canonical/OG/Twitter
  metadata, and `DrivingSchool` JSON-LD structured data.
- Security hardening: in-memory rate limiting on login/register/OTP/demo auth,
  auth + audit events in the admin audit trail, and expanded security headers
  (HSTS, Permissions-Policy, Content-Security-Policy).
- Developer tooling: husky pre-commit (lint-staged ESLint) + commitlint
  conventional-commit gate, `CONTRIBUTING.md`, this changelog.
- Test coverage: unit tests for automation (11), rate limiting (6), CSV exports (7);
  e2e tests for cron auth/idempotency, SEO files, rate limiting, security headers,
  admin audit trail, and CSV exports.
- Reporting: admin CSV exports (`/api/admin/exports`) for finance, students, and
  payroll, with RFC-safe escaping.
- Real notification providers: direct Resend (email) and Twilio (WhatsApp/SMS)
  adapters alongside the generic webhook contract.
- Deployment assets: `docker-compose.yml` healthcheck + env mapping,
  `deploy/nginx.conf` reverse proxy, `deploy/sri-mathru-driving.service` systemd
  unit, and `deploy/checklist.md` production launch checklist.
- Analytics dashboard: profit-trend bar chart (revenue/expenses/profit, 6 months)
  and instructor leaderboard (rating/reviews) on the admin overview.
- Credential verification script: `npm run check:keys` validates
  `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` against the Razorpay API and exits
  non-zero on rejection (never prints the secret).
- Live payment smoke test: `npm run smoke:live` runs the full payment path
  against the real Razorpay API (order creation, webhook, invoice PDF) against
  a scratch DB (`scripts/smoke-live.mjs`).

### Changed
- Auth routes now write `login_*`, `otp_*`, and `register_*` audit entries.
- `package.json` `prepare` script installs git hooks.
- Student invoice list: newest-first sort, per-row payment method + issued date,
  and a "Download all" button that avoids popup blockers via staggered downloads.
- Dependency security: `npm audit` reduced to 0 vulnerabilities by overriding
  `next`'s nested `postcss` (8.5.25) and `sharp` (0.35.3).
- E2e availability check tolerates the seed's Sunday skips (asserts at least one
  non-empty day rather than `days[0]`).
- Failed payments now release the slot: `markPaymentFailed` cancels the
  pending-payment booking it was paying for and reopens the slot, so abandoned
  checkouts stop holding slots hostage. Non-pending payments are left untouched.

## [0.1.0] — 2026-07-29

### Added
- Full driving-school platform: public site (home, courses, instructors, about,
  contact, book), auth (password + OTP), student/instructor/admin portals.
- Booking engine with slot availability, waitlist, rescheduling, attendance, and
  lesson notes.
- Payments with Razorpay (demo mode fallback), EMIs, coupons, invoices, receipts.
- Analytics dashboard, leads, expenses, payroll, broadcast, reviews, certificates.
- SQLite persistence (`better-sqlite3`-free custom store) with schema versioning,
  backups/restore scripts, and rolling demo seed.
- Notification engine with simulated providers and optional webhook delivery.
- CI (lint, unit, component, e2e) and release workflow (GHCR images + release
  notes on version tags).

[Unreleased]: https://github.com/AdarshKakarla-AK/Driving-School-website-trial/compare/0.1.0...HEAD
[0.1.0]: https://github.com/AdarshKakarla-AK/Driving-School-website-trial/releases/tag/0.1.0
