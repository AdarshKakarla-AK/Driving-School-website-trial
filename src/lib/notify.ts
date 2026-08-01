import "server-only";
import { uid, nowISO } from "./db/store";
import type { AutomationType, DB, NotifChannel, User, Notification, AutomationLog } from "./db/types";

export interface SendOptions {
  channels?: NotifChannel[];
  meta?: string;
  attachments?: { filename: string; contentType: string; data: string }[];
}

export interface NotificationAttachment {
  filename: string;
  contentType: string;
  data: string;
}

function whatsappRecipient(user: User): string {
  return user.phone ? `+91 ${user.phone.slice(0, 5)} *****` : "unknown";
}

function emailRecipient(user: User): string {
  return user.email ?? `${user.name} (no email)`;
}

function postWebhook(url: string, payload: Record<string, unknown>) {
  // Fire-and-forget with a hard timeout: delivery failures must never block a request.
  void fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(5000),
  }).catch(() => {});
}

function postJson(url: string, payload: Record<string, unknown>, extraHeaders: Record<string, string> = {}) {
  void fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...extraHeaders },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(5000),
  }).catch(() => {});
}

function postForm(url: string, fields: Record<string, string>, auth: string) {
  void fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(auth).toString("base64")}`,
    },
    body: new URLSearchParams(fields),
    signal: AbortSignal.timeout(5000),
  }).catch(() => {});
}

// Direct provider adapters. Enable by setting the provider env vars; the
// generic webhook contract above remains available as a fallback.
function sendResend(to: string, subject: string, body: string, attachments?: NotificationAttachment[]) {
  const from = process.env.RESEND_FROM ?? "Sri Mathru Driving School <onboarding@resend.dev>";
  const payload: Record<string, unknown> = { from, to, subject, text: body };
  if (attachments?.length) {
    payload.attachments = attachments.map((a) => ({ filename: a.filename, content: a.data }));
  }
  postJson("https://api.resend.com/emails", payload, { Authorization: `Bearer ${process.env.RESEND_API_KEY}` });
}

function sendTwilio(to: string, title: string, body: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return;
  let digits = to.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length === 10) digits = `91${digits}`;
  const toE164 = `+${digits}`;
  const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM;
  const smsFrom = process.env.TWILIO_SMS_FROM;
  const text = `${title} — ${body}`;

  if (whatsappFrom) {
    postForm(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      From: whatsappFrom.startsWith("whatsapp:") ? whatsappFrom : `whatsapp:${whatsappFrom}`,
      To: `whatsapp:${toE164}`,
      Body: text,
    }, `${sid}:${token}`);
  } else if (smsFrom) {
    postForm(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      From: smsFrom,
      To: toE164,
      Body: text,
    }, `${sid}:${token}`);
  }
}

/**
 * Sends a notification across channels and logs the automation.
 * Uses simulated providers by default; set env vars to enable real ones.
 */
export function notify(db: DB, user: User, type: AutomationType, title: string, body: string, opts: SendOptions = {}) {
  const channels: NotifChannel[] = opts.channels ?? ["app", "whatsapp"];
  const created: Notification[] = [];
  const logs: AutomationLog[] = [];

  for (const channel of channels) {
    created.push({
      id: uid("notif"), userId: user.id, channel, title, body, read: false, createdAt: nowISO(), link: opts.meta,
    });
    const recipient = channel === "email" ? emailRecipient(user) : whatsappRecipient(user);
    logs.push({
      id: uid("auto"), type, channel, recipient,
      summary: `${title} — ${body}`,
      status: "simulated" as const,
      createdAt: nowISO(),
    });
  }

  db.notifications.push(...created);
  db.automationLogs.push(...logs);

  // Real provider hooks (fire-and-forget, never block the request).
  // Contract: POST JSON to the configured URL — see DEPLOYMENT.md "Notifications".
  if (process.env.WHATSAPP_WEBHOOK_URL && channels.includes("whatsapp")) {
    postWebhook(process.env.WHATSAPP_WEBHOOK_URL, { to: user.phone, title, body, type, meta: opts.meta });
  }
  if (process.env.EMAIL_WEBHOOK_URL && channels.includes("email")) {
    postWebhook(process.env.EMAIL_WEBHOOK_URL, { to: user.email ?? "", subject: title, body, type, meta: opts.meta, attachments: opts.attachments });
  }

  // Direct provider adapters (Resend for email, Twilio for WhatsApp/SMS).
  if (process.env.RESEND_API_KEY && channels.includes("email") && user.email) {
    sendResend(user.email, title, body, opts.attachments);
  }
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && channels.includes("whatsapp")) {
    sendTwilio(user.phone, title, body);
  }

  return created;
}

export function logAutomation(db: DB, recipient: string, type: AutomationType, channel: NotifChannel, summary: string, status: AutomationLog["status"] = "simulated") {
  db.automationLogs.push({ id: uid("auto"), type, channel, recipient, summary, status, createdAt: nowISO() });
}

export function audit(db: DB, actorId: string, action: string, targetId?: string, meta?: string) {
  db.auditLogs.push({ id: uid("audit"), actorId, action, targetId, meta, createdAt: nowISO() });
}
