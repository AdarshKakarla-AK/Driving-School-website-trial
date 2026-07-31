import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.sqlite");
const BACKUP_DIR = path.join(DATA_DIR, "backups");

function listBackups() {
  if (!fs.existsSync(BACKUP_DIR)) return [];
  return fs.readdirSync(BACKUP_DIR).filter((f) => /^db-.*\.sqlite$/.test(f)).sort();
}

function stamp() {
  const d = new Date();
  const p = (n, l = 2) => String(n).padStart(l, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

const arg = process.argv[2];
if (!arg) {
  console.error("Usage: npm run restore -- <backup-file>");
  console.error("Available backups:");
  const backups = listBackups();
  if (backups.length === 0) console.error("  (none yet — run npm run backup first)");
  else for (const b of backups.slice(-10)) console.error(`  ${b}`);
  process.exit(1);
}

const src = path.isAbsolute(arg) ? arg : path.join(process.cwd(), arg);
if (!fs.existsSync(src)) {
  console.error(`Backup not found: ${src}`);
  process.exit(1);
}

let check;
try {
  check = new DatabaseSync(src, { readOnly: true });
  const cols = check.prepare("SELECT COUNT(*) AS n FROM collections").get();
  check.close();
  if (!cols || (cols.n ?? 0) === 0) throw new Error("no collections rows");
} catch (err) {
  console.error(`Not a valid database backup: ${src}`);
  console.error(String(err));
  process.exit(1);
}

if (!fs.existsSync(DB_FILE)) {
  console.error(`No database found at ${DB_FILE}. Nothing to restore over.`);
  process.exit(1);
}

// Safety: snapshot the current database before overwriting it.
fs.mkdirSync(BACKUP_DIR, { recursive: true });
const pre = path.join(BACKUP_DIR, `db-${stamp()}-pre-restore.sqlite`);
fs.copyFileSync(DB_FILE, pre);

// WAL sidecars must be removed or they may replay stale data over the restore.
for (const side of ["-wal", "-shm"]) {
  const f = `${DB_FILE}${side}`;
  if (fs.existsSync(f)) fs.rmSync(f, { force: true });
}

fs.copyFileSync(src, DB_FILE);

console.log(`Restored ${path.basename(src)} -> ${DB_FILE}`);
console.log(`Previous database snapshotted to ${pre}`);
console.log("Start the app to verify, then delete the snapshot once you're happy.");
