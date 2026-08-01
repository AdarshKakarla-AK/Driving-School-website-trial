# Deployment Guide

## Architecture notes

- **Data layer:** SQLite via Node's built-in `node:sqlite` (`DatabaseSync`), stored at `data/db.sqlite` (WAL mode, transactional writes, auto-migrated from the legacy `data/db.json`). Collections are stored as per-row JSON; a stored `schema_version` is advanced on boot, and missing collection keys from older payloads are backfilled automatically — upgrades never drop data.
- **Sessions:** signed HMAC cookie (`smds_session`). Secret comes from `SESSION_SECRET` or an auto-generated `data/secret.key`.
- **Payments:** Razorpay. If `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` are unset, the app runs in **demo mode** (fake orders, instant verification). Real payments are confirmed via the signed `/api/payments/webhook` endpoint (requires `RAZORPAY_WEBHOOK_SECRET`), and paid bookings get downloadable PDF invoices.
- **Build:** `output: "standalone"` produces a self-contained server for Docker.

## Important: SQLite persistence

SQLite is **file-based**. The database only persists where the filesystem is writable and durable across restarts:

| Platform | Persistent? | Notes |
| --- | --- | --- |
| Docker (with a volume) | ✅ | Mount a volume at `/app/data` (see `docker-compose.yml`) |
| VPS / dedicated server (`npm start`) | ✅ | Data lives on disk |
| Vercel / serverless | ❌ | Ephemeral filesystem — data is lost between function invocations |

> If you must deploy to a serverless platform, run a separate persistent instance (Docker / VPS) for the API, or migrate the data layer to a hosted Postgres.

## Option A — Docker (recommended)

```bash
# 1. Configure
cp .env.example .env.production   # set SESSION_SECRET, CRON_SECRET (and Razorpay keys if you have them)

# 2. Build & run (docker-compose.yml: port 3000, smds-data volume, healthcheck)
docker compose up -d --build

# 3. The app is now at http://localhost:3000
# The SQLite database lives in the "smds-data" volume (survives container restarts).
```

Manual Docker run:

```bash
docker build -t sri-mathru .
docker run -d -p 3000:3000 \
  -e SESSION_SECRET="$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")" \
  -v smds-data:/app/data \
  sri-mathru
```

## Option B — Node.js server (VPS / bare metal)

```bash
npm ci
npm run build
npm start          # serves on :3000
```

Set env vars (see `.env.example`). Back up `data/db.sqlite` regularly.

## Production assets

Ready-to-use files in `deploy/` and `docker-compose.yml`:

| File | Purpose |
| --- | --- |
| `docker-compose.yml` | Production compose: restart policy, `smds-data` volume, healthcheck on `/api/health` |
| `deploy/nginx.conf` | Reverse proxy with TLS redirect, forwarded-IP headers, static caching |
| `deploy/sri-mathru-driving.service` | systemd unit (hardened) for the standalone server |
| `deploy/checklist.md` | Pre/post-launch checklist + first-issue playbook |

Work through `deploy/checklist.md` before going live (HTTPS, secrets, backups,
cron schedule, health monitoring).

## Option C — Vercel

Only suitable if you accept ephemeral data (resets on redeploy) — not recommended for production. If you still want to try it:

```bash
vercel
```

Then set `SESSION_SECRET` and `NEXT_PUBLIC_SITE_URL` in the Vercel dashboard. Data will NOT persist.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `SESSION_SECRET` | Recommended | Signs session cookies. Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | No | Real payments; omit for demo mode |
| `RAZORPAY_WEBHOOK_SECRET` | For live payments | HMAC secret that verifies Razorpay webhook signatures; `/api/payments/webhook` returns `503` when unset |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Base URL for absolute links (certificates, emails) |
| `WHATSAPP_WEBHOOK_URL` / `EMAIL_WEBHOOK_URL` | No | Optional outbound notification webhooks |
| `RESEND_API_KEY` / `RESEND_FROM` | No | Send email notifications directly via Resend |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_WHATSAPP_FROM` / `TWILIO_SMS_FROM` | No | Send WhatsApp/SMS notifications directly via Twilio |
| `CRON_SECRET` | For automations | Bearer token protecting `/api/cron`; endpoint returns `503` when unset |

## Payments & webhooks

Payment flow: the client creates a Razorpay order via `POST /api/payments/order`,
opens the Razorpay Checkout modal, then confirms via `POST /api/payments/verify`
(rate-limited, ownership-checked). `verify` never trusts the client — in live mode
it fetches the payment from the Razorpay API and only proceeds if it is captured.

The server keeps DB state in sync via `POST /api/payments/webhook`, so payments are
recorded even if the browser is closed mid-checkout. Configure the webhook in the
[Razorpay dashboard](https://dashboard.razorpay.com) to send `payment.captured`,
`order.paid`, and `payment.failed` events to:

```
https://your-domain.example.com/api/payments/webhook
```

and set the webhook secret as `RAZORPAY_WEBHOOK_SECRET` (generate with
`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`). The
endpoint verifies the HMAC-SHA256 `X-Razorpay-Signature` header, ignores unknown
events, and is idempotent — repeated events never double-confirm. Until the secret
is set, the endpoint returns `503`.

Before going live, sanity-check your credentials with `npm run check:keys` (exits
`0` only when the Razorpay API accepts them; prints the key's LIVE/TEST mode and
never the secret).

Once the app is running in live mode (see "Running the app"), run
`npm run smoke:live` against a scratch database to verify the whole payment path
against the real Razorpay API: direct order creation, the app's order route, a
signed webhook, booking confirmation, and PDF invoice download. See
`scripts/smoke-live.mjs` for usage (`SMOKE_BASE` points at your server, default
`http://localhost:3130`).

Paid bookings generate an invoice automatically; students download it as a PDF from
the portal (`/api/portal/invoices/<no>/download`) and receive a receipt by email when
`RESEND_API_KEY` is configured.

## Notifications

The automation engine (`src/lib/notify.ts`) always records notifications in the app
(in-app inbox + `automationLogs`), then **optionally** forwards to real providers via
fire-and-forget webhooks. Delivery failures never block or fail a request.

If `WHATSAPP_WEBHOOK_URL` is set, every WhatsApp-channel notification POSTs JSON to it:

```json
{
  "to": "+91 90000 00010",
  "title": "Lesson Reminder",
  "body": "Your lesson with Ravi Kumar is tomorrow at 7:30 AM.",
  "type": "lesson_reminder",
  "meta": "/portal/dashboard"
}
```

`EMAIL_WEBHOOK_URL` receives the same shape but `title` doubles as the email subject
and `to` is the student's email address. The receiver is responsible for turning these
into real messages (e.g. WhatsApp Business API, Twilio, Resend, SendGrid). A trivial
echo server works for testing:

```bash
npx http-echo-server -p 9090          # or any endpoint that accepts POST JSON
WHATSAPP_WEBHOOK_URL=http://localhost:9090 EMAIL_WEBHOOK_URL=http://localhost:9090 npm start
```

Requests carry a 5-second timeout and are sent with `Connection: keep-alive` semantics
via Node's `fetch`. Expect the following `type` values (from the automation engine):
`welcome`, `booking_confirmed`, `lesson_reminder`, `payment_reminder`, `invoice`,
`receipt`, `license_reminder`, `birthday`, `course_completed`, `feedback_request`,
`promo`, `instructor_delayed`, `lesson_cancelled`, `rescheduled`, `referral`, `otp`,
`review`, `vehicle_changed`.

### Direct provider adapters

Instead of (or alongside) the generic webhook, the app can call real providers
directly — same fire-and-forget, never-blocking behavior:

- **Resend** (`RESEND_API_KEY`, optional `RESEND_FROM`) — email-channel
  notifications are sent via the Resend API with the student's email as `to`.
- **Twilio** (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`,
  `TWILIO_WHATSAPP_FROM` or `TWILIO_SMS_FROM`) — WhatsApp-channel notifications
  are sent via Twilio Messages. 10-digit Indian numbers are normalized to `+91…`;
  set a WhatsApp-enabled sender for WhatsApp, or a regular sender for SMS.

## Health check

The app exposes an unauthenticated health endpoint that probes the database and
reports schema version, payment mode, and uptime:

```bash
curl http://localhost:3000/api/health
# {"ok":true,"service":"sri-mathru-driving-school","schemaVersion":1,
#  "db":{"status":"ok","collections":20},"mode":"demo","uptimeSec":42,"time":"..."}
```

It returns `200` when healthy and `503` if the database is unavailable — wire it
into your load balancer or uptime monitor. Legacy fallback for simple checks:
`curl http://localhost:3000/api/public/site`.

## Security hardening

The app ships with defense-in-depth that needs no configuration:

- **Security headers** — `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`,
  `Strict-Transport-Security` (HSTS), `Permissions-Policy`, and a `Content-Security-Policy`
  are applied to every response; `X-Powered-By` is removed.
- **Rate limiting** — in-memory token buckets protect `login` (30/15min per IP),
  `register` (10/hour per IP), OTP `send` (10/15min per IP and per identifier),
  OTP `verify` (10/15min per identifier), and the demo login (10/15min per IP).
  Blocked requests get `429` with a `Retry-After` header. Limits are per-process;
  move to a shared store (Redis) if you scale horizontally.
- **Audit trail** — logins (success/failure/blocked/rate-limited), OTP events,
  registrations, and admin mutations are recorded in `auditLogs` and surfaced in the
  admin dashboard (`/api/admin/settings`).

## Scheduled jobs

The app has no built-in scheduler; a cron endpoint (`GET/POST /api/cron`) runs the
automation engine on demand so your own scheduler (cron, GitHub Actions, UptimeRobot,
etc.) drives it. Protected by the `CRON_SECRET` bearer token; returns `503` if unset
and `401` on a missing/wrong token.

```bash
# Every hour, run due automations
0 * * * * curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://your-domain.example.com/api/cron
```

Or without a header via query token (less secure; avoid in shared logs):

```bash
curl -fsS "https://your-domain.example.com/api/cron?token=$CRON_SECRET"
```

Each run rolls the slot window forward (fresh availability, safe for production) and
sends reminders for:

| Automation | Rule | Dedupe |
| --- | --- | --- |
| Payment reminder | Overdue pending payments (`dueDate <= today`) | `payment.reminderSentAt` |
| Lesson reminder | Confirmed/upcoming lessons starting within 24h | `booking.reminderSentAt` |
| License reminder | Documents expiring within 30 days | `doc.reminderSentAt` |
| Birthday | Student `dob` matches today (UTC) | `user.birthdayRemindedYear` |

Every reminder is recorded in the in-app inbox + `automationLogs` and optionally
forwarded to the webhook URLs above. Response shape:

```json
{"ok":true,"at":"2026-06-15T08:00:00.000Z","summary":{"paymentReminders":2,"lessonReminders":1,"licenseReminders":0,"birthdays":1}}
```

Runs are idempotent — repeated calls never double-send, so an hourly (or even
per-minute) schedule is safe.

## Backups & restore

- Snapshot the SQLite DB with `npm run backup` (writes `data/backups/db-<timestamp>.sqlite`, keeps the last 14).
- `data/db.sqlite` is safe to copy while the app is running (WAL gives crash-consistent snapshots).
- Restore (after stopping the app) with `npm run restore -- data/backups/db-<timestamp>.sqlite` — it validates the file, snapshots the current DB first, and clears stale WAL sidecars.
- Schedule nightly backups with cron:
  ```bash
  0 2 * * * cd /path/to/app && npm run backup >> /var/log/smds-backup.log 2>&1
  ```
