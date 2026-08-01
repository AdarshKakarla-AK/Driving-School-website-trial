"use client";

import * as React from "react";
import { Phone, Plus, Search, Send } from "lucide-react";
import { Avatar, Badge, Button, Card, Input, Modal, Select } from "@/components/ui";
import { api, useToast, type ApiData } from "@/lib/client";
import { cn } from "@/lib/utils";

const STATUS_TONE: Record<string, "amber" | "blue" | "green" | "ink" | "red"> = {
  new: "amber",
  contacted: "blue",
  demo: "blue",
  registered: "green",
  active: "green",
  lost: "red",
};

export function AdminCrm({ data, refresh }: { data: ApiData; refresh: () => void }) {
  const toast = useToast();
  const [q, setQ] = React.useState("");
  const [filter, setFilter] = React.useState("all");
  const [lead, setLead] = React.useState<ApiData | null>(null);
  const [showNew, setShowNew] = React.useState(false);

  const leads = (data.leads ?? []).filter((l: ApiData) => (filter === "all" || l.status === filter) && (l.name + l.phone + (l.packageInterested ?? "")).toLowerCase().includes(q.toLowerCase()));

  const update = async (action: string, extra: ApiData = {}) => {
    try {
      await api("/api/admin/leads", { method: "POST", body: JSON.stringify({ action, leadId: lead.id, ...extra }) });
      toast.push("Lead updated");
      setLead(null);
      refresh();
    } catch (e: ApiData) {
      toast.push(e.message, "error");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-900">CRM · Leads</h1>
          <p className="text-sm text-ink-500">{leads.length} leads · auto-logged from the website contact forms</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-300" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search..." className="w-44 pl-9" />
          </div>
          <Button onClick={() => setShowNew(true)}><Plus className="size-4" /> Add lead</Button>
        </div>
      </div>

      <div className="flex gap-1.5">
        {["all", "new", "contacted", "demo", "registered", "active", "lost"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn("rounded-full border px-3 py-1.5 text-xs font-semibold capitalize", filter === s ? "border-night-900 bg-night-900 text-white" : "border-ink-200 bg-card text-ink-500 hover:border-ink-300")}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {leads.map((l: ApiData) => (
          <Card key={l.id} className="p-4">
            <div className="flex items-center gap-3">
              <Avatar name={l.name} size="md" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-ink-900">{l.name}</p>
                <a href={`tel:${l.phone}`} className="flex items-center gap-1 text-xs text-ink-400 hover:text-go-600">
                  <Phone className="size-3" /> {l.phone}
                </a>
              </div>
              <Badge tone={STATUS_TONE[l.status] ?? "ink"} className="capitalize">{l.status}</Badge>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-ink-400">
              <span className="capitalize">{l.source}</span>
              <span>{l.packageInterested ?? "—"}</span>
            </div>
            <Button size="sm" variant="outline" className="mt-3 w-full" onClick={() => setLead(l)}>
              <Send className="size-3.5" /> Update status
            </Button>
          </Card>
        ))}
        {leads.length === 0 && <Card className="p-10 text-center text-sm text-ink-400 sm:col-span-2 xl:col-span-3">No leads in this view.</Card>}
      </div>

      <Modal open={!!lead} onClose={() => setLead(null)} title={`${lead?.name}`}>
        {lead && (
          <div className="space-y-3">
            <div className="rounded-xl bg-ink-50 p-3 text-sm">
              <p className="font-semibold text-ink-800">{lead.name} · {lead.phone}</p>
              <p className="text-xs text-ink-500">{lead.source} · {lead.packageInterested ?? "No package"} · created {lead.createdAt?.slice(0, 10)}</p>
              {lead.followUpAt && <p className="mt-1 text-xs font-medium text-brand-600">Follow-up: {lead.followUpAt}</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              {["new", "contacted", "demo", "registered", "active", "lost"].map((s) => (
                <button key={s} onClick={() => update("status", { status: s })} className={cn("rounded-full border px-3 py-1.5 text-xs font-semibold capitalize", lead.status === s ? "border-night-900 bg-night-900 text-white" : "border-ink-200 text-ink-500")}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </Modal>

      <Modal open={showNew} onClose={() => setShowNew(false)} title="Add lead">
        <NewLeadForm onDone={() => { setShowNew(false); refresh(); }} />
      </Modal>
    </div>
  );
}

function NewLeadForm({ onDone }: { onDone: () => void }) {
  const toast = useToast();
  const [form, setForm] = React.useState({ name: "", phone: "", email: "", source: "manual", packageInterested: "" });
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api("/api/admin/leads", { method: "POST", body: JSON.stringify({ action: "create", ...form }) });
      toast.push("Lead added to CRM");
      onDone();
    } catch (err: ApiData) {
      toast.push(err.message, "error");
    }
  };
  return (
    <form onSubmit={submit} className="space-y-3">
      <Input required placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <Input required placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      <Input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <Select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
        <option value="manual">Manual entry</option>
        <option value="instagram">Instagram</option>
        <option value="referral">Referral</option>
        <option value="walkin">Walk-in</option>
        <option value="google">Google</option>
        <option value="website">Website</option>
      </Select>
      <Input placeholder="Package interested" value={form.packageInterested} onChange={(e) => setForm({ ...form, packageInterested: e.target.value })} />
      <Button type="submit" className="w-full">Save lead</Button>
    </form>
  );
}
