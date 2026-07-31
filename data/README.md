# Data layer

The app stores all state in a single SQLite database at `data/db.sqlite`, written
via Node's built-in `node:sqlite` (`DatabaseSync`). No external DB engine is needed.

## Files

| File | Purpose |
| --- | --- |
| `db.sqlite` | Main database (SQLite, WAL mode) |
| `db.sqlite-wal` / `db.sqlite-shm` | SQLite WAL sidecar files (auto-managed) |
| `secret.key` | Auto-generated `SESSION_SECRET` (created on first boot if `SESSION_SECRET` is unset) |
| `backups/` | Rotating snapshots written by `npm run backup` |

## Schema

The data is stored per-collection in a single `collections` table:

```sql
CREATE TABLE collections (
  name  TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

Each row holds one collection as JSON:

- `users`, `packages`, `vehicles`, `slots`, `bookings`, `lessonNotes`,
  `progresses`, `payments`, `invoices`, `notifications`, `automationLogs`,
  `leads`, `expenses`, `payroll`, `coupons`, `reviews`, `certificates`,
  `waitlist`, `otps`, `auditLogs` → JSON arrays
- `settings`, `counters` → JSON objects

The legacy single-blob layout (one `kv` row holding the whole database JSON) is
auto-migrated into `collections` on first open and the old row is removed.

## Backups

```bash
npm run backup
```

This checkpoints the WAL into the main file, copies `db.sqlite` to
`data/backups/db-<timestamp>.sqlite`, and prunes to the last 14 snapshots.
Schedule it with cron on a VPS:

```bash
0 2 * * * cd /path/to/app && npm run backup >> /var/log/smds-backup.log 2>&1
```

Because SQLite uses WAL journaling, `data/db.sqlite` is also safe to copy
manually while the app is running.

## Restore

```bash
npm run restore -- data/backups/db-<timestamp>.sqlite
```

The script validates that the file is a real backup (has the `collections`
table), snapshots the current database to `db-<timestamp>-pre-restore.sqlite`
first, removes stale `-wal`/`-shm` sidecars, then copies the backup over
`data/db.sqlite`. **Stop the app before restoring** so no process is writing.

Manual equivalent:

1. Stop the app.
2. Replace `data/db.sqlite` with a backup:
   ```bash
   cp data/backups/db-<timestamp>.sqlite data/db.sqlite
   ```
3. Delete stale `db.sqlite-wal` / `db.sqlite-shm` sidecars.
4. Start the app.

## Demo data

When `settings.demoMode` is true, the app regenerates relative dates on boot:
the slot availability window rolls forward to cover the next 14 days (Sundays
skipped, per-instructor shifts) without deleting or duplicating existing slots.
This keeps the demo dashboard and booking flow populated as real days pass.
