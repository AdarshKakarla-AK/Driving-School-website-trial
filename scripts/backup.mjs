import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.sqlite");
const BACKUP_DIR = path.join(DATA_DIR, "backups");
const KEEP = 14;

function timestamp() {
  const d = new Date();
  const p = (n, l = 2) => String(n).padStart(l, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

if (!fs.existsSync(DB_FILE)) {
  console.error(`No database found at ${DB_FILE}. Run the app once so it can be created.`);
  process.exit(1);
}

fs.mkdirSync(BACKUP_DIR, { recursive: true });

const sqlite = new DatabaseSync(DB_FILE);
try {
  sqlite.exec("PRAGMA busy_timeout = 15000;");
  sqlite.exec("PRAGMA wal_checkpoint(TRUNCATE);");
} finally {
  sqlite.close();
}

const dest = path.join(BACKUP_DIR, `db-${timestamp()}.sqlite`);
fs.copyFileSync(DB_FILE, dest);

const backups = fs.readdirSync(BACKUP_DIR).filter((f) => /^db-.*\.sqlite$/.test(f)).sort();
const stale = backups.slice(0, Math.max(0, backups.length - KEEP));
for (const f of stale) fs.rmSync(path.join(BACKUP_DIR, f), { force: true });

const kb = (fs.statSync(dest).size / 1024).toFixed(0);
console.log(`Backup written: ${dest} (${kb} KB)`);
console.log(`Kept ${Math.min(backups.length, KEEP)} of ${backups.length} backup(s).`);
