import "server-only";
import { uid, nowISO } from "./db/store";
import type { AutomationType, DB, NotifChannel, User, Notification, AutomationLog } from "./db/types";

export interface SendOptions {
  channels?: NotifChannel[];
  meta?: string;
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
    postWebhook(process.env.EMAIL_WEBHOOK_URL, { to: user.email ?? "", subject: title, body, type, meta: opts.meta });
  }

  return created;
}

export function logAutomation(db: DB, recipient: string, type: AutomationType, channel: NotifChannel, summary: string, status: AutomationLog["status"] = "simulated") {
  db.automationLogs.push({ id: uid("auto"), type, channel, recipient, summary, status, createdAt: nowISO() });
}

export function audit(db: DB, actorId: string, action: string, targetId?: string, meta?: string) {
  db.auditLogs.push({ id: uid("audit"), actorId, action, targetId, meta, createdAt: nowISO() });
}
