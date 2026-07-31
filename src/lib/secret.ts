import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { Role } from "./db/types";

export interface SessionPayload {
  userId: string;
  role: Role;
  exp: number;
}

export function getSecret(): string {
  const fromEnv = process.env.SESSION_SECRET;
  if (fromEnv) return fromEnv;
  const keyPath = path.join(process.cwd(), "data", "secret.key");
  try {
    if (fs.existsSync(keyPath)) return fs.readFileSync(keyPath, "utf8").trim();
  } catch {
    /* ignore */
  }
  const generated = crypto.randomBytes(32).toString("hex");
  try {
    const dir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(keyPath, generated);
  } catch {
    /* ignore */
  }
  return generated;
}

function sign(data: string): string {
  return crypto.createHmac("sha256", getSecret()).update(data).digest("hex");
}

export function createSessionToken(user: { id: string; role: Role }): string {
  const payload: SessionPayload = { userId: user.id, role: user.role, exp: Date.now() + 1000 * 60 * 60 * 24 * 30 };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = sign(body);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as SessionPayload;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
