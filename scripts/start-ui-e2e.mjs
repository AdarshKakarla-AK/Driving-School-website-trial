// Standalone UI-e2e server for Playwright. Runs a production build on a fixed
// port with a fresh throwaway database so tests never touch real data.
// Razorpay keys come from .env when present (checkout modal tests) and are
// empty otherwise (demo mode, modal tests self-skip).
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const PORT = 3112;
const ROOT = path.resolve(process.cwd());
const NEXT_BIN = path.join(ROOT, "node_modules", "next", "dist", "bin", "next");
const DATA_DIR = path.join(os.tmpdir(), `smds-ui-e2e-${process.pid}`);
const DB_FILE = path.join(DATA_DIR, "db.sqlite");
fs.rmSync(DATA_DIR, { recursive: true, force: true });
fs.mkdirSync(DATA_DIR, { recursive: true });

const child = spawn(process.execPath, [NEXT_BIN, "start", "-p", String(PORT)], {
  cwd: ROOT,
  stdio: "inherit",
  env: {
    ...process.env,
    PORT: undefined,
    DATABASE_PATH: DB_FILE,
    CRON_SECRET: process.env.CRON_SECRET ?? "ui-e2e-cron-secret",
    RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET ?? "ui-e2e-webhook-secret",
  },
});

let exiting = false;
function shutdown() {
  if (exiting) return;
  exiting = true;
  if (!child.killed) child.kill("SIGKILL");
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
child.on("exit", (code) => process.exit(code ?? 1));
