import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import type { DB } from "./types";

export interface DatabaseHandle {
  get(): DB;
  mutate<T>(fn: (db: DB) => T): T;
  reset(seed: () => DB): DB;
  version(): number;
  close(): void;
}

// Bump SCHEMA_VERSION when a migration below is added. Migrations run in order
// on boot against any database that predates the current version, then the
// stored schema_version is advanced.
export const SCHEMA_VERSION = 1;

// Versioned, forward-only data migrations. The index matches the version this
// migration upgrades FROM (migrations[0] upgrades a v0 database to v1).
export const MIGRATIONS: ((db: DB) => void)[] = [];

const ARRAY_COLLECTIONS: (keyof DB)[] = [
  "users",
  "packages",
  "vehicles",
  "slots",
  "bookings",
  "lessonNotes",
  "progresses",
  "payments",
  "invoices",
  "notifications",
  "automationLogs",
  "leads",
  "expenses",
  "payroll",
  "coupons",
  "reviews",
  "certificates",
  "waitlist",
  "otps",
  "auditLogs",
];

function isValidDB(value: unknown): value is DB {
  if (!value || typeof value !== "object") return false;
  const db = value as Record<string, unknown>;
  for (const key of ARRAY_COLLECTIONS) {
    if (!Array.isArray(db[key])) return false;
  }
  if (!db.settings || typeof db.settings !== "object") return false;
  if (!db.counters || typeof db.counters !== "object") return false;
  return true;
}

// Backfills collection keys that are missing from older payloads so upgrades
// never lose data to validation. Returns null when the payload is unsalvageable.
function finalize(out: Record<string, unknown>): DB | null {
  if (!out.settings || typeof out.settings !== "object") return null;
  if (!out.counters || typeof out.counters !== "object") out.counters = {};
  for (const key of ARRAY_COLLECTIONS) {
    if (!Array.isArray(out[key])) out[key] = [];
  }
  return out as unknown as DB;
}

function parseRow(row: unknown): DB | null {
  if (!row) return null;
  try {
    const parsed = JSON.parse((row as { value: string }).value) as unknown;
    if (isValidDB(parsed)) return parsed;
    return parsed && typeof parsed === "object" ? finalize(parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

const COLLECTION_KEYS: (keyof DB)[] = [...ARRAY_COLLECTIONS, "settings", "counters"];

function loadCollections(rows: { name: string; value: string }[] | unknown): DB | null {
  if (!rows || !Array.isArray(rows) || rows.length === 0) return null;
  const out: Record<string, unknown> = {};
  for (const row of rows) {
    try {
      out[row.name] = JSON.parse(row.value);
    } catch {
      return null;
    }
  }
  if (isValidDB(out)) return out as DB;
  return finalize(out);
}

export function openDatabase(opts: {
  file: string;
  seed: () => DB;
  importJson?: string;
}): DatabaseHandle {
  if (opts.file !== ":memory:") {
    fs.mkdirSync(path.dirname(opts.file), { recursive: true });
  }
  const sqlite = new DatabaseSync(opts.file);

  const BUSY_CODES = [5, 6, 261, 262];

  function sleepSync(ms: number): void {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
  }

  function isBusy(err: unknown): boolean {
    return BUSY_CODES.includes((err as { errcode?: number }).errcode ?? -1);
  }

  function withRetry<T>(fn: () => T, what: string): T {
    for (let attempt = 0; attempt < 60; attempt++) {
      try {
        return fn();
      } catch (err) {
        if (!isBusy(err)) throw err;
        sleepSync(20 * (attempt + 1));
      }
    }
    throw new Error(`database is locked (${what} timed out)`);
  }

  withRetry(() => sqlite.exec("PRAGMA busy_timeout = 15000;"), "busy_timeout");
  withRetry(() => sqlite.exec("PRAGMA journal_mode = WAL;"), "wal");
  withRetry(() => sqlite.exec("PRAGMA synchronous = NORMAL;"), "synchronous");
  withRetry(() => sqlite.exec("CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT NOT NULL);"), "kv-schema");
  withRetry(() => sqlite.exec("CREATE TABLE IF NOT EXISTS collections (name TEXT PRIMARY KEY, value TEXT NOT NULL);"), "collections-schema");
  withRetry(() => sqlite.exec("CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);"), "meta-schema");
  const legacyStmt = sqlite.prepare("SELECT value FROM kv WHERE key = ?");
  const dropLegacyStmt = sqlite.prepare("DELETE FROM kv WHERE key = ?");
  const readAllStmt = sqlite.prepare("SELECT name, value FROM collections");
  const clearColsStmt = sqlite.prepare("DELETE FROM collections");
  const writeColStmt = sqlite.prepare(
    "INSERT INTO collections (name, value) VALUES (?, ?) ON CONFLICT(name) DO UPDATE SET value = excluded.value"
  );
  const getMetaStmt = sqlite.prepare("SELECT value FROM meta WHERE key = ?");
  const setMetaStmt = sqlite.prepare(
    "INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
  );

  let cache: DB | null = null;
  let needsPersist = false;

  function persist(): void {
    if (!cache) return;
    withRetry(() => {
      sqlite.exec("BEGIN IMMEDIATE");
      try {
        clearColsStmt.run();
        for (const key of COLLECTION_KEYS) {
          writeColStmt.run(key, JSON.stringify(cache![key]));
        }
        dropLegacyStmt.run("db");
        sqlite.exec("COMMIT");
      } catch (err) {
        try {
          sqlite.exec("ROLLBACK");
        } catch {
          /* no active transaction */
        }
        throw err;
      }
    }, "persist");
  }

  cache = withRetry(() => loadCollections(readAllStmt.all()), "read-collections");
  if (cache) {
    needsPersist = false;
  } else {
    const legacy = withRetry(() => parseRow(legacyStmt.get("db")), "read-legacy");
    if (legacy) {
      cache = legacy;
      needsPersist = true;
    } else if (opts.importJson && fs.existsSync(opts.importJson)) {
      try {
        cache = parseRow({ value: fs.readFileSync(opts.importJson, "utf8") });
      } catch {
        cache = null;
      }
      needsPersist = !!cache;
    }
  }
  if (!cache) {
    cache = opts.seed();
    needsPersist = true;
  }

  // Advance the stored schema version, applying any pending migrations first.
  const storedVersion = Number((getMetaStmt.get("schema_version") as { value: string } | undefined)?.value ?? 0) || 0;
  const needsMigration = storedVersion < SCHEMA_VERSION;
  if (needsMigration) {
    for (let v = storedVersion; v < SCHEMA_VERSION; v++) {
      MIGRATIONS[v]?.(cache!);
    }
  }
  if (needsPersist || needsMigration) persist();
  if (needsMigration) setMetaStmt.run("schema_version", String(SCHEMA_VERSION));

  return {
    get(): DB {
      return cache!;
    },
    mutate<T>(fn: (db: DB) => T): T {
      const out = fn(cache!);
      persist();
      return out;
    },
    reset(seed: () => DB): DB {
      cache = seed();
      persist();
      return cache;
    },
    version(): number {
      return SCHEMA_VERSION;
    },
    close(): void {
      try {
        sqlite.exec("PRAGMA wal_checkpoint(TRUNCATE);");
      } catch {
        /* checkpoint is best-effort */
      }
      sqlite.close();
    },
  };
}
