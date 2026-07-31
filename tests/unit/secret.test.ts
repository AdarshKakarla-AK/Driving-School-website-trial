import crypto from "node:crypto";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createSessionToken, verifySessionToken, getSecret } from "@/lib/secret";

describe("session tokens", () => {
  const SECRET = "unit-test-secret";

  beforeEach(() => {
    process.env.SESSION_SECRET = SECRET;
  });

  afterEach(() => {
    delete process.env.SESSION_SECRET;
  });

  it("createSessionToken and verifySessionToken round-trip", () => {
    const token = createSessionToken({ id: "stu_1", role: "student" });
    const payload = verifySessionToken(token);
    expect(payload).toMatchObject({ userId: "stu_1", role: "student" });
    expect(payload!.exp).toBeGreaterThan(Date.now());
  });

  it("rejects a tampered payload even with a valid-looking signature", () => {
    const token = createSessionToken({ id: "stu_1", role: "student" });
    const [, sig] = token.split(".");
    const forged = Buffer.from(
      JSON.stringify({ userId: "adm_1", role: "admin", exp: Date.now() + 100000 })
    ).toString("base64url");
    expect(verifySessionToken(`${forged}.${sig}`)).toBeNull();
  });

  it("rejects a tampered signature", () => {
    const token = createSessionToken({ id: "stu_1", role: "student" });
    const [body] = token.split(".");
    expect(verifySessionToken(`${body}.deadbeef`)).toBeNull();
  });

  it("rejects expired tokens", () => {
    const body = Buffer.from(
      JSON.stringify({ userId: "stu_1", role: "student", exp: Date.now() - 1000 })
    ).toString("base64url");
    const sig = crypto.createHmac("sha256", getSecret()).update(body).digest("hex");
    expect(verifySessionToken(`${body}.${sig}`)).toBeNull();
  });

  it("rejects malformed tokens", () => {
    expect(verifySessionToken("")).toBeNull();
    expect(verifySessionToken("onlyonepart")).toBeNull();
    expect(verifySessionToken("a.b.c")).toBeNull();
    expect(verifySessionToken("not-base64.!")).toBeNull();
  });

  it("getSecret prefers SESSION_SECRET", () => {
    expect(getSecret()).toBe(SECRET);
  });
});
