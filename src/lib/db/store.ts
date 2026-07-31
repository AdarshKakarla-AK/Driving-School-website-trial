import "server-only";
import path from "node:path";
import type { DB } from "./types";
import { buildSeed, rollWindowForward } from "./seed";
import { openDatabase, type DatabaseHandle } from "./database";

const DATA_DIR = path.join(process.cwd(), "data");
// DATABASE_PATH lets tests (and ops) point the app at an alternate database.
const DB_FILE = process.env.DATABASE_PATH ? path.resolve(process.env.DATABASE_PATH) : path.join(DATA_DIR, "db.sqlite");
const LEGACY_JSON = path.join(DATA_DIR, "db.json");

const handle: DatabaseHandle = openDatabase({
  file: DB_FILE,
  seed: buildSeed,
  importJson: LEGACY_JSON,
});

// Demo data regenerates relative dates on boot: the slot window rolls forward
// so availability never runs dry as real days pass. Safe for production data
// too (only adds missing future slots, never deletes).
if (handle.get().settings.demoMode) {
  handle.mutate((db) => rollWindowForward(db));
}

export function getDB(): DB {
  return handle.get();
}

export function saveDB() {
  // Persistence happens on every mutate(); kept for API compatibility.
}

export function mutate<T>(fn: (db: DB) => T): T {
  return handle.mutate(fn);
}

export function resetDB(): DB {
  return handle.reset(buildSeed);
}

export function getVersion(): number {
  return handle.version();
}

export function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function nowISO(): string {
  return new Date().toISOString();
}

export function nextCounter(db: DB, key: string): number {
  const n = (db.counters[key] ?? 0) + 1;
  db.counters[key] = n;
  return n;
}
