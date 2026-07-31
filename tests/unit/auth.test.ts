import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getSession, getCurrentUser, requireUser, createSessionToken } from "@/lib/auth";
import type { User } from "@/lib/db/types";
import { makeSeed } from "../helpers/seed";

const state = vi.hoisted(() => ({
  cookieValue: null as string | null,
  users: [] as User[],
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: () => (state.cookieValue ? { value: state.cookieValue } : undefined),
  }),
}));

vi.mock("@/lib/db/store", () => ({
  getDB: () => ({ users: state.users }),
}));

describe("auth session", () => {
  beforeEach(() => {
    process.env.SESSION_SECRET = "auth-test-secret";
    state.users = makeSeed().users;
    state.cookieValue = null;
  });

  afterEach(() => {
    delete process.env.SESSION_SECRET;
  });

  it("getSession returns null without a cookie", async () => {
    expect(await getSession()).toBeNull();
  });

  it("getSession verifies a valid token", async () => {
    state.cookieValue = createSessionToken({ id: "stu_1", role: "student" });
    const session = await getSession();
    expect(session).toMatchObject({ userId: "stu_1", role: "student" });
  });

  it("getSession rejects a tampered token", async () => {
    const token = createSessionToken({ id: "stu_1", role: "student" });
    state.cookieValue = `${token.split(".")[0]}.forged`;
    expect(await getSession()).toBeNull();
  });

  it("getCurrentUser resolves the session user", async () => {
    state.cookieValue = createSessionToken({ id: "stu_1", role: "student" });
    const user = await getCurrentUser();
    expect(user?.name).toBe("Arun");
  });

  it("getCurrentUser returns null for an unknown session user", async () => {
    state.cookieValue = createSessionToken({ id: "nobody", role: "student" });
    expect(await getCurrentUser()).toBeNull();
  });

  it("requireUser returns the user when their role is allowed", async () => {
    state.cookieValue = createSessionToken({ id: "adm_1", role: "admin" });
    const user = await requireUser(["admin"]);
    expect(user.role).toBe("admin");
  });

  it("requireUser throws UNAUTHORIZED without a session", async () => {
    await expect(requireUser()).rejects.toThrow("UNAUTHORIZED");
  });

  it("requireUser throws FORBIDDEN on a role mismatch", async () => {
    state.cookieValue = createSessionToken({ id: "stu_1", role: "student" });
    await expect(requireUser(["admin"])).rejects.toThrow("FORBIDDEN");
  });
});
