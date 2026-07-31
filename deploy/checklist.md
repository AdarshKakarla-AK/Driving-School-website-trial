# Production launch checklist

Work through this before (and after) going live. Tick items as you complete them.

## Before launch

- [ ] **Domain & DNS** — point the domain's A/AAAA record at the server.
- [ ] **HTTPS** — install Certbot (`sudo certbot --nginx -d <domain>`) so HSTS in the
      app actually takes effect.
- [ ] **Secrets** — generate strong values for `SESSION_SECRET` and `CRON_SECRET`:
      `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
      Store them in `.env.production` (or the platform secret manager). Never commit them.
- [ ] **Payments** — set `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` and verify a live
      test payment. Check `GET /api/health` reports `"mode":"live"`.
- [ ] **Site URL** — set `NEXT_PUBLIC_SITE_URL` to the public HTTPS origin so
      sitemap, canonical links, and certificate URLs are absolute.
- [ ] **Notifications** — set `EMAIL_WEBHOOK_URL`/`WHATSAPP_WEBHOOK_URL`, or the
      direct `RESEND_*`/`TWILIO_*` vars. Confirm at least one simulated+real path
      works via the admin broadcast.
- [ ] **Scheduled jobs** — add a cron line calling `/api/cron` hourly with the
      bearer token (see DEPLOYMENT.md "Scheduled jobs"). Verify a manual run
      returns `{"ok":true,...}`.
- [ ] **Reverse proxy** — install `deploy/nginx.conf` (or your LB) and confirm
      headers: `curl -I https://<domain>` shows `Strict-Transport-Security`,
      `Content-Security-Policy`, and no `X-Powered-By`.
- [ ] **Service supervisor** — either `docker compose up -d --build`
      (with `docker-compose.yml`) or the systemd unit `deploy/sri-mathru-driving.service`.
- [ ] **Data persistence** — confirm the SQLite file lives on durable storage
      (Docker volume `smds-data` or a real disk path) and that `data/` is writable.
- [ ] **Test accounts** — log in as admin, an instructor, and a student on the
      live URL. Delete or reset demo passwords afterwards.

## After launch

- [ ] **Health monitoring** — point an uptime monitor at `https://<domain>/api/health`
      (200 = healthy). Set an alert.
- [ ] **Backups** — schedule `npm run backup` (writes `data/backups/*.json`), e.g.
      daily, and copy backups off the server. Test `npm run restore` on a scratch copy.
- [ ] **Watch logs** — the app logs startup info and request errors via
      `src/instrumentation.ts`; route them to a log collector (`journalctl -u
      sri-mathru-driving`, `docker compose logs -f`, etc.).
- [ ] **Rate-limit sanity** — after load testing, confirm 429 responses surface in
      logs (per-process buckets reset on restart; plan Redis if scaling horizontally).
- [ ] **SEO verification** — submit `https://<domain>/sitemap.xml` in Google
      Search Console and check `robots.txt` allows the public pages.

## First-issue playbook

| Symptom | Check |
| --- | --- |
| 500 on `/` | `docker compose logs` / `journalctl`; DB corrupt or unwritable? |
| Health `503` | Is `data/` mounted and writable? Is the volume attached? |
| Payments stuck pending | Razorpay keys set? `health` shows `live`? Webhook config? |
| No notifications | Webhook/provider env vars set? Logs show simulated status? |
| 429 spam | Legit users behind one NAT IP — raise the limit in `src/lib/rate-limit.ts` usage or move to Redis. |
