"use client";

import * as React from "react";
import { FileUp, FileText, ShieldCheck } from "lucide-react";
import { Badge, Button, Card, Input, Select } from "@/components/ui";
import { api, useToast, type ApiData } from "@/lib/client";
import { formatDate } from "@/lib/utils";

const DOC_TYPES = ["Aadhaar", "Learner's License", "Driving License", "Medical Certificate", "Passport Photo"];

export function Documents({ data, refresh }: { data: ApiData; refresh: () => void }) {
  const toast = useToast();
  const docs = data.profile.documents ?? [];
  const [type, setType] = React.useState("Aadhaar");
  const [number, setNumber] = React.useState("");
  const [expiry, setExpiry] = React.useState("");
  const [fileName, setFileName] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const upload = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api("/api/documents", { method: "POST", body: JSON.stringify({ type, number, expiry, fileName }) });
      toast.push("Document uploaded & stored securely 🔒");
      setNumber("");
      setExpiry("");
      setFileName("");
      refresh();
    } catch (e: ApiData) {
      toast.push(e.message, "error");
    } finally {
      setBusy(false);
    }
  };

  // Date.now() is impure, but this is an ephemeral render-time display snapshot.
  // eslint-disable-next-line react-hooks/purity
  const daysLeft = (exp: string) => Math.round((new Date(exp).getTime() - Date.now()) / 86400000);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-900">Documents</h1>
        <p className="text-sm text-ink-500">Upload securely. We remind you automatically before anything expires.</p>
      </div>

      <Card className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-4 p-5 sm:border-r sm:border-ink-100">
          <h3 className="font-display flex items-center gap-2 font-bold text-ink-900">
            <FileUp className="size-5 text-brand-500" /> Upload document
          </h3>
          <form onSubmit={upload} className="space-y-3">
            <Select label="Document type" value={type} onChange={(e) => setType(e.target.value)}>
              {DOC_TYPES.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </Select>
            <Input label="Document number" value={number} onChange={(e) => setNumber(e.target.value)} placeholder="e.g. 2345 6789 0123" />
            <Input label="File name (optional)" value={fileName} onChange={(e) => setFileName(e.target.value)} placeholder="aadhaar.jpg" />
            <Input label="Expiry date (if applicable)" type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
            <Button type="submit" loading={busy} className="w-full">
              Upload securely
            </Button>
          </form>
          <p className="flex items-center gap-1.5 text-xs text-ink-400">
            <ShieldCheck className="size-3.5 text-go-600" /> Encrypted storage · only you and the admin can view
          </p>
        </div>

        <div className="p-5">
          <h3 className="font-display mb-4 font-bold text-ink-900">Your documents ({docs.length})</h3>
          <div className="space-y-2.5">
            {docs.map((d: ApiData) => (
              <div key={d.id} className="flex items-center justify-between rounded-2xl border border-ink-100 p-3.5">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-brand-50 p-2 text-brand-600">
                    <FileText className="size-4.5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink-800">{d.type}</p>
                    <p className="text-xs text-ink-400">
                      {d.fileName || "File"} · {formatDate(d.uploadedAt)}
                    </p>
                  </div>
                </div>
                {d.expiry ? (
                  daysLeft(d.expiry) < 0 ? (
                    <Badge tone="red">Expired</Badge>
                  ) : daysLeft(d.expiry) < 45 ? (
                    <Badge tone="brand">{daysLeft(d.expiry)}d left</Badge>
                  ) : (
                    <Badge tone="green">Valid</Badge>
                  )
                ) : (
                  <Badge tone="ink">Verified</Badge>
                )}
              </div>
            ))}
            {docs.length === 0 && <p className="py-8 text-center text-sm text-ink-400">No documents uploaded yet.</p>}
          </div>
        </div>
      </Card>
    </div>
  );
}
