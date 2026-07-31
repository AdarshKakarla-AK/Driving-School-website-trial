# Changelog

All notable changes to this project are documented here. This project follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and
[Semantic Versioning](https://semver.org/). Commit messages follow the
[Conventional Commits](https://www.conventionalcommits.org/) spec (enforced by
husky + commitlint).

## [Unreleased]

### Added
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

### Changed
- Auth routes now write `login_*`, `otp_*`, and `register_*` audit entries.
- `package.json` `prepare` script installs git hooks.

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
