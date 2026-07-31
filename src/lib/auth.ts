import "server-only";
import { cookies } from "next/headers";
import { createSessionToken, verifySessionToken } from "./secret";
import { getDB } from "./db/store";
import type { Role, User } from "./db/types";

const SESSION_KEY = "smds_session";

export const sessionKey = SESSION_KEY;

export { createSessionToken };

export async function getSession() {
  const store = await cookies();
  const token = store.get(SESSION_KEY)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession();
  if (!session) return null;
  const db = getDB();
  return db.users.find((u) => u.id === session.userId) ?? null;
}

export async function requireUser(roles?: Role[]): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  if (roles && !roles.includes(user.role)) throw new Error("FORBIDDEN");
  return user;
}
