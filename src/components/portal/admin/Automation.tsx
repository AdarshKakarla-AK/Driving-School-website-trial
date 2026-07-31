"use client";

import * as React from "react";
import { Megaphone, MessageSquareText, RefreshCcw, Zap } from "lucide-react";
import { Badge, Button, Card, Input, Select, Textarea } from "@/components/ui";
import { api, useToast, type ApiData } from "@/lib/client";
import { cn } from "@/lib/utils";

export function AdminAutomation({ data, refresh }: { data: ApiData; refresh: () => void }) {
  const toast = useToast();
  const [showBroadcast, setShowBroadcast] = React.useState(false);

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-900">Automation studio</h1>
          <p className="text-sm text-ink-500">Every reminder, campaign and trigger in one place.</p>
        </div>
        <Button onClick={() => setShowBroadcast(true)}><Megaphone className="size-4" /> Send campaign</Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h3 className="flex items-center gap-2 font-display font-bold text-ink-900">
            <Zap className="size-4 text-brand-500" /> Activity log ({data.totalAutomations ?? data.automation?.length ?? 0})
          </h3>
          <div className="mt-3 max-h-[28rem] space-y-2 overflow-auto pr-1">
            {(data.automation ?? []).map((l: ApiData) => (
              <div key={l.id} className="flex items-start gap-3 rounded-xl border border-ink-100 p-3">
                <div className={cn("mt-1.5 size-2 shrink-0 rounded-full", l.channel === "whatsapp" ? "bg-go-500" : l.channel === "app" ? "bg-brand-500" : l.channel === "email" ? "bg-amber-500" : "bg-ink-300")} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-ink-800">{l.title}</p>
                    <Badge tone="ink" className="capitalize">{l.type}</Badge>
                    <Badge tone={l.channel === "whatsapp" ? "green" : "blue"} className="capitalize">{l.channel}</Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-ink-500">{l.body}</p>
                  <p className="mt-1 text-[11px] text-ink-300">{l.createdAt?.slice(0, 16).replace("T", " ")} · {l.meta}</p>
                </div>
              </div>
            ))}
            {(data.automation ?? []).length === 0 && <p className="py-8 text-center text-sm text-ink-400">No automation events yet.</p>}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="font-display text-sm font-bold text-ink-900">By channel</h3>
            <div className="mt-3 space-y-2.5">
              {Object.entries(data.byChannel ?? {}).map(([ch, n]) => (
                <div key={ch}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="capitalize text-ink-600">{ch}</span>
                    <span className="font-semibold text-ink-800">{n as number}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-ink-100">
                    <div className="h-full rounded-full bg-brand-500" style={{ width: `${data.totalAutomations ? ((n as number) / data.totalAutomations) * 100 : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-5">
            <h3 className="font-display text-sm font-bold text-ink-900">Reset demo data</h3>
            <p className="mt-1 text-xs text-ink-500">Restores the demo database to its original seeded state. All bookings, payments and leads will be reset.</p>
            <Button
              variant="danger"
              size="sm"
              className="mt-3 w-full"
              onClick={async () => {
                if (!confirm("Reset ALL data to demo seed? This cannot be undone.")) return;
                await api("/api/admin/settings", { method: "POST" });
                toast.push("Demo data reset ✨");
                refresh();
              }}
            >
              <RefreshCcw className="size-3.5" /> Reset everything
            </Button>
          </Card>
        </div>
      </div>

      {showBroadcast && <BroadcastModal onClose={() => setShowBroadcast(false)} onDone={() => refresh()} />}
    </div>
  );
}

function BroadcastModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const [form, setForm] = React.useState({ audience: "all", channel: "app", title: "", body: "" });
  const [busy, setBusy] = React.useState(false);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api<{ sent: number }>("/api/admin/broadcast", { method: "POST", body: JSON.stringify(form) });
      toast.push(`Campaign sent to ${res.sent} students 📣`);
      onClose();
      onDone();
    } catch (err: ApiData) {
      toast.push(err.message, "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="fixed inset-x-4 bottom-6 z-50 mx-auto max-w-lg p-5 card-shadow sm:inset-auto sm:right-6 sm:top-1/2 sm:left-auto sm:-translate-y-1/2">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-ink-900">Send campaign</h3>
        <button onClick={onClose} className="text-ink-400 hover:text-ink-700">✕</button>
      </div>
      <form onSubmit={send} className="mt-4 space-y-3">
        <Select value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}>
          <option value="all">All active students</option>
          <option value="pending_payment">Students with pending payments</option>
          <option value="incomplete">Students behind on lessons</option>
        </Select>
        <Select value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })}>
          <option value="app">In-app</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="email">Email</option>
          <option value="sms">SMS</option>
        </Select>
        <Input required placeholder="Subject" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <Textarea required rows={3} placeholder="Message body..." value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
        <Button type="submit" loading={busy} className="w-full"><MessageSquareText className="size-4" /> Send</Button>
      </form>
    </Card>
  );
}
