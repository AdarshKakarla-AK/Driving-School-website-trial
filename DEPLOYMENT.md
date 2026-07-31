# Deployment Guide

## Architecture notes

- **Data layer:** SQLite via Node's built-in `node:sqlite` (`DatabaseSync`), stored at `data/db.sqlite` (WAL mode, transactional writes, auto-migrated from the legacy `data/db.json`).
- **Sessions:** signed HMAC cookie (`smds_session`). Secret comes from `SESSION_SECRET` or an auto-generated `data/secret.key`.
- **Payments:** Razorpay. If `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` are unset, the app runs in **demo mode** (fake orders, instant verification).
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
cp .env.example .env.local      # set SESSION_SECRET (and Razorpay keys if you have them)

# 2. Build & run
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
| `NEXT_PUBLIC_SITE_URL` | Recommended | Base URL for absolute links (certificates, emails) |
| `WHATSAPP_WEBHOOK_URL` / `EMAIL_WEBHOOK_URL` | No | Optional outbound notification webhooks |

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

## Health check

```bash
curl http://localhost:3000/api/public/site
```

## Backups & restore

- Snapshot the SQLite DB with `npm run backup` (writes `data/backups/db-<timestamp>.sqlite`, keeps the last 14).
- `data/db.sqlite` is safe to copy while the app is running (WAL gives crash-consistent snapshots).
- Restore (after stopping the app) with `npm run restore -- data/backups/db-<timestamp>.sqlite` — it validates the file, snapshots the current DB first, and clears stale WAL sidecars.
- Schedule nightly backups with cron:
  ```bash
  0 2 * * * cd /path/to/app && npm run backup >> /var/log/smds-backup.log 2>&1
  ```
