#!/usr/bin/env bash
# Sri Mathru — database backup with rotation.
#
# Bare-metal / bind-mount path: backs up /var/lib/sri-mathru/data.
#   sudo CRON_SECRET=... sri-mathru.env  (not needed here)
#   sudo ./deploy/backup.sh
#
# For a docker compose named volume (smds-data), use instead:
#   docker run --rm -v smds-data:/data -v "$PWD/backups:/backup" \
#     alpine sh -c 'mkdir -p /backup && cp -a /data/db.sqlite "/backup/db-$(date -u +%Y%m%dT%H%M%SZ).sqlite" && echo backed up'
#
# Recommended cron entry (as root):
#   17 2 * * * /opt/sri-mathru/deploy/backup.sh >> /var/log/sri-mathru-backup.log 2>&1

set -euo pipefail

SRC="${SRI_MATHRU_DATA_DIR:-/var/lib/sri-mathru/data}"
BACKUP_DIR="${SRI_MATHRU_BACKUP_DIR:-/var/lib/sri-mathru/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
TS="$(date -u +%Y%m%dT%H%M%SZ)"

mkdir -p "$BACKUP_DIR"
mkdir -p "$SRC"

for f in db.sqlite db.json secret.key; do
  if [ -f "$SRC/$f" ]; then
    cp -a "$SRC/$f" "$BACKUP_DIR/${f%.*}-$TS.${f##*.}"
  fi
done

find "$BACKUP_DIR" \( -name 'db-*.sqlite' -o -name 'db-*.json' -o -name 'secret-*.key' \) -mtime +"$RETENTION_DAYS" -delete

echo "[backup] $TS -> $BACKUP_DIR (retention ${RETENTION_DAYS}d)"
