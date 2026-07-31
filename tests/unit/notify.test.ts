import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { notify, logAutomation, audit } from "@/lib/notify";
import { makeSeed, seedIds } from "../helpers/seed";
import type { User } from "@/lib/db/types";

vi.mock("@/lib/db/store", () => ({
  uid: (prefix: string) => `${prefix}_test`,
  nowISO: () => "2026-01-01T00:00:00.000Z",
}));

describe("notify", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue(new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    delete process.env.WHATSAPP_WEBHOOK_URL;
    delete process.env.EMAIL_WEBHOOK_URL;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("records a notification and automation log per channel", () => {
    const db = makeSeed();
    const student = db.users.find((u) => u.id === seedIds.student1)!;
    const created = notify(db, student, "booking_confirmed", "Lesson Booked", "Your lesson is confirmed.", {
      channels: ["app", "whatsapp"],
    });

    expect(created).toHaveLength(2);
    expect(db.notifications).toHaveLength(2);
    expect(db.automationLogs).toHaveLength(2);
    expect(created[0]).toMatchObject({ userId: seedIds.student1, channel: "app", read: false, title: "Lesson Booked" });
    expect(db.automationLogs[0].recipient).toBe("+91 90000 *****");
    expect(db.automationLogs[0].status).toBe("simulated");
  });

  it("uses the email address as the recipient for email-channel notifications", () => {
    const db = makeSeed();
    const student = db.users.find((u) => u.id === seedIds.student1)!;
    const withEmail: User = { ...student, email: "arun@example.com" };
    notify(db, withEmail, "welcome", "Welcome", "Hi", { channels: ["email"] });
    expect(db.automationLogs[0].recipient).toBe("arun@example.com");
  });

  it("POSTs the whatsapp webhook payload when configured", async () => {
    process.env.WHATSAPP_WEBHOOK_URL = "https://hooks.example/whatsapp";
    const db = makeSeed();
    const student = db.users.find((u) => u.id === seedIds.student1)!;
    notify(db, student, "lesson_reminder", "Reminder", "Tomorrow 9 AM", {
      channels: ["whatsapp"],
      meta: "/portal/dashboard",
    });

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, opts] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://hooks.example/whatsapp");
    expect(opts.method).toBe("POST");
    expect(JSON.parse(opts.body as string)).toEqual({
      to: student.phone,
      title: "Reminder",
      body: "Tomorrow 9 AM",
      type: "lesson_reminder",
      meta: "/portal/dashboard",
    });
  });

  it("POSTs the email webhook payload when configured", async () => {
    process.env.EMAIL_WEBHOOK_URL = "https://hooks.example/email";
    const db = makeSeed();
    const student = db.users.find((u) => u.id === seedIds.student1)!;
    const withEmail: User = { ...student, email: "arun@example.com" };
    notify(db, withEmail, "invoice", "Invoice", "New invoice", { channels: ["email"], meta: "/portal/dashboard" });

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, opts] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://hooks.example/email");
    expect(JSON.parse(opts.body as string)).toEqual({
      to: "arun@example.com",
      subject: "Invoice",
      body: "New invoice",
      type: "invoice",
      meta: "/portal/dashboard",
    });
  });

  it("does not POST a webhook for channels that are not enabled", () => {
    process.env.WHATSAPP_WEBHOOK_URL = "https://hooks.example/whatsapp";
    const db = makeSeed();
    const student = db.users.find((u) => u.id === seedIds.student1)!;
    notify(db, student, "welcome", "Welcome", "Hi", { channels: ["app"] });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("never throws when the webhook fails", async () => {
    process.env.WHATSAPP_WEBHOOK_URL = "https://hooks.example/whatsapp";
    fetchMock.mockRejectedValue(new Error("network down"));
    const db = makeSeed();
    const student = db.users.find((u) => u.id === seedIds.student1)!;
    expect(() => notify(db, student, "welcome", "Welcome", "Hi")).not.toThrow();
    expect(db.notifications.length).toBeGreaterThan(0);
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  });

  it("logAutomation and audit append records", () => {
    const db = makeSeed();
    logAutomation(db, "+91 90000 *****", "otp", "sms", "OTP sent: 123456", "sent");
    audit(db, "adm_1", "settings.updated", undefined, "demoMode=true");
    expect(db.automationLogs[0]).toMatchObject({ type: "otp", channel: "sms", status: "sent" });
    expect(db.auditLogs[0]).toMatchObject({ actorId: "adm_1", action: "settings.updated" });
  });
});
