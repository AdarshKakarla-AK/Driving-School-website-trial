# Production runbook — Sri Mathru Driving School

The app ships as a Next.js standalone server with a single-file JSON database.
There are two supported deployment paths:

1. **Docker Compose** (recommended) — build locally or pull the GHCR image.
2. **systemd + Docker** — same image, managed as a native service behind Caddy.

Both are covered below. TLS is handled by Caddy (automatic HTTPS). A scheduler
**must** run or automations (lesson reminders, payment pings, invoice emails)
never fire.

## What's in here

| File | Purpose |
| --- | --- |
| `docker-compose.yml` (repo root) | `web` + `scheduler` services, data volume, healthcheck |
| `deploy/Caddyfile` | Reverse proxy with automatic HTTPS |
| `deploy/sri-mathru.service` | systemd unit running the GHCR image |
| `deploy/sri-mathru-cron.service` / `.timer` | Fires `/api/cron` every 30 min |
| `deploy/backup.sh` | Daily DB backup with 14-day rotation |
| `deploy/deploy.sh` | One-command compose deploy |
| `deploy/.env.production.example` | Production env template |

## Prerequisites

- A Linux VM (Ubuntu 22.04+ tested) with Docker + Compose v2 installed.
- A domain pointing at the VM (for Caddy TLS).
- `docker` available to the deploying user, or run systemd units as root.

## 1. Secrets

Copy `deploy/.env.production.example` to your secret location and fill it in:

```bash
sudo mkdir -p /etc/sri-mathru /var/lib/sri-mathru/data
sudo cp deploy/.env.production.example /etc/sri-mathru/sri-mathru.env
sudo nano /etc/sri-mathru/sri-mathru.env   # fill SESSION_SECRET, CRON_SECRET, Razorpay keys, NEXT_PUBLIC_SITE_URL
sudo chmod 600 /etc/sri-mathru/sri-mathru.env
```

Generate secrets with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

`NEXT_PUBLIC_SITE_URL` must be the public HTTPS origin — it is baked into
absolute links (certificate verification, emails). If you change it later,
rebuild/restart so the value takes effect.

## 2. Option A — Docker Compose

```bash
# from the repo root, with your .env present
./deploy/deploy.sh                 # build + up (web + scheduler)
# or pull the released image instead of building:
./deploy/deploy.sh --release
```

Then front it with Caddy (see step 4). Check:

```bash
docker compose ps
curl -fsS http://127.0.0.1:3000/api/health
```

The database lives in the named volume `smds-data` (`/app/data/db.sqlite` inside
the container). Never delete it unless you want to start fresh.

> Hardening: the compose file publishes `3000:3000` for local testing. In
> production, change it to `127.0.0.1:3000:3000` (or edit the systemd unit) so
> only Caddy on the same host can reach the app, and block 3000 in the firewall.

## 3. Option B — systemd + Docker image

```bash
sudo mkdir -p /etc/sri-mathru /var/lib/sri-mathru/data
# fill /etc/sri-mathru/sri-mathru.env as in step 1

sudo cp deploy/sri-mathru.service /etc/systemd/system/
sudo cp deploy/sri-mathru-cron.service deploy/sri-mathru-cron.timer /etc/systemd/system/

sudo systemctl daemon-reload
sudo systemctl enable --now sri-mathru
sudo systemctl enable --now sri-mathru-cron.timer

# verify
sudo systemctl status sri-mathru
curl -fsS http://127.0.0.1:3000/api/health
systemctl list-timers | grep sri-mathru
```

Data is a bind mount at `/var/lib/sri-mathru/data`. The unit pulls the `:latest`
GHCR image on every start, so a release + `sudo systemctl restart sri-mathru`
is all an upgrade needs.

## 4. TLS with Caddy

```bash
sudo apt install caddy
sudo cp deploy/Caddyfile /etc/caddy/Caddyfile
sudo nano /etc/caddy/Caddyfile   # set your real domain
sudo systemctl reload caddy
```

Caddy obtains and renews Let's Encrypt certificates automatically. Open ports
80 and 443 in the firewall. Point the Razorpay webhook at:

```
https://your-domain.example.com/api/payments/webhook
```

## 5. Scheduler (do not skip)

`/api/cron` rolls the booking slot window forward and runs due automations. It
is protected by `CRON_SECRET` (`Authorization: Bearer <secret>`).

- **Compose:** the `scheduler` sidecar already curls it every 30 minutes.
- **systemd:** the `sri-mathru-cron.timer` does the same.
- **Elsewhere:** any external uptime/cron service works too — just hit
  `/api/cron` with the bearer token (e.g. UptimeRobot every 30 min).

If `CRON_SECRET` is empty the endpoint returns 503 and nothing runs.

## 6. Backups

```bash
# bare-metal / bind-mount installs:
sudo /opt/sri-mathru/deploy/backup.sh

# docker compose named volume:
docker run --rm -v smds-data:/data -v "$PWD/backups:/backup" \
  alpine sh -c 'mkdir -p /backup && cp -a /data/db.sqlite "/backup/db-$(date -u +%Y%m%dT%H%M%SZ).sqlite"'
```

Schedule nightly via cron (root):

```
17 2 * * * /opt/sri-mathru/deploy/backup.sh >> /var/log/sri-mathru-backup.log 2>&1
```

Backups land in `/var/lib/sri-mathru/backups` (14-day rotation). Copy them off
the box (object storage, another disk) for real safety. Restore = stop the app,
put the file back as `db.sqlite`, start it.

## 7. Monitoring

- **Health:** `GET /api/health` returns `{ ok: true }` (or `mode` info). Use it
  with UptimeRobot/Healthchecks as an external ping.
- **Container healthchecks:** compose and the systemd unit both run
  `/api/health` every 30s with 3 retries.
- **Logs:** `docker compose logs -f web scheduler` or
  `journalctl -u sri-mathru -f`.
- **Alerting:** wire the health ping to a Slack/Discord webhook; the scheduler
  logs `[scheduler] cron run failed` if a run errors.

## 8. First run / smoke test

```bash
# health + demo mode (Razorpay keys absent → demo payments)
curl -fsS https://your-domain.example.com/api/health

# booking smoke test on a clean box:
curl -fsS https://your-domain.example.com/     # home loads
```

Then log in as the seeded admin (`admin@srimathru.in` / `admin123`), change the
password, and run one real (test-key) payment end-to-end. If you keep test
Razorpay keys, payments are sandbox-only; swap to live keys when ready — only
the env values change.

## 9. Upgrading

- **Compose:** `./deploy/deploy.sh --release` (pulls `latest`, recreates web).
- **systemd:** `sudo systemctl restart sri-mathru` (pulls the new image).
- Data (volume/bind mount) persists across both.

The release pipeline (`v*` tags) rebuilds `ghcr.io/adarshkakarla-ak/sri-mathru:<tag>`
plus `:latest`, so `--release`/restart always gets the latest released build.
