"use client";

import * as React from "react";
import { CreditCard, Download, FileText, Receipt } from "lucide-react";
import { Badge, Button, Card } from "@/components/ui";
import { api, useToast, type ApiData } from "@/lib/client";
import { formatDate, formatINR } from "@/lib/utils";

export function Payments({ data, refresh }: { data: ApiData; refresh: () => void }) {
  const toast = useToast();
  const payments = data.payments ?? [];

  const payNow = async (p: ApiData) => {
    try {
      const order = await api<{ payments?: ApiData[]; payment?: ApiData }>("/api/payments/order", {
        method: "POST",
        body: JSON.stringify({ packageId: data.profile.packageId, amount: p.amount, plan: p.installment ? "emi" : "full", method: "upi" }),
      });
      const payment = order.payments?.[0] ?? order.payment;
      await api("/api/payments/verify", { method: "POST", body: JSON.stringify({ paymentId: payment.id }) });
      toast.push("Payment successful — receipt sent ✅");
      refresh();
    } catch (e: ApiData) {
      toast.push(e.message, "error");
    }
  };

  const pending = payments.filter((p: ApiData) => p.status === "pending");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-900">Payments & invoices</h1>
        <p className="text-sm text-ink-500">UPI, cards, net banking or EMI — everything tracked with GST invoices.</p>
      </div>

      {pending.length > 0 && (
        <Card className="border-warn-500/40 bg-brand-50/60 p-5">
          <h3 className="font-display flex items-center gap-2 font-bold text-ink-900">
            <CreditCard className="size-5 text-brand-600" /> Due payments
          </h3>
          <div className="mt-3 space-y-2">
            {pending.map((p: ApiData) => (
              <div key={p.id} className="flex items-center justify-between rounded-xl bg-white p-3">
                <div>
                  <p className="text-sm font-semibold text-ink-800">
                    {p.installment ? `EMI installment ${p.installment}` : "Course payment"} · {formatINR(p.amount)}
                  </p>
                  <p className="text-xs text-ink-400">{p.dueDate ? `Due ${formatDate(p.dueDate)}` : "Due now"}</p>
                </div>
                <Button size="sm" onClick={() => payNow(p)}>
                  Pay {formatINR(p.amount)}
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <h3 className="border-b border-ink-100 px-5 py-4 font-display font-bold text-ink-900">Payment history</h3>
        <div className="divide-y divide-ink-50">
          {payments.map((p: ApiData) => (
            <div key={p.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-ink-50 p-2 text-ink-500">
                  <Receipt className="size-4.5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink-800">
                    {p.installment ? `EMI #${p.installment}` : "Course fee"} · {formatINR(p.amount)}
                  </p>
                  <p className="text-xs text-ink-400">
                    {formatDate(p.createdAt)} · {String(p.method).toUpperCase()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={p.status === "paid" ? "green" : p.status === "refunded" ? "blue" : "brand"} className="capitalize">
                  {p.status}
                </Badge>
                {p.status === "paid" && p.invoiceNo && (
                  <Button size="sm" variant="ghost" onClick={() => toast.push(`Invoice ${p.invoiceNo} downloaded`)}>
                    <Download className="size-3.5" /> {p.invoiceNo}
                  </Button>
                )}
              </div>
            </div>
          ))}
          {payments.length === 0 && <p className="px-5 py-8 text-center text-sm text-ink-400">No payments yet.</p>}
        </div>
      </Card>

      <Card>
        <h3 className="flex items-center gap-2 border-b border-ink-100 px-5 py-4 font-display font-bold text-ink-900">
          <FileText className="size-5 text-brand-500" /> GST invoices
        </h3>
        <div className="divide-y divide-ink-50">
          {data.invoices.map((i: ApiData) => (
            <div key={i.id} className="flex items-center justify-between px-5 py-3.5 text-sm">
              <div>
                <p className="font-semibold text-ink-800">{i.number}</p>
                <p className="text-xs text-ink-400">Issued {formatDate(i.issuedAt)}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-ink-900">{formatINR(i.total)}</p>
                <p className="text-xs text-ink-400">GST ₹{Math.round(i.gst)} · {i.items?.[0]?.name}</p>
              </div>
            </div>
          ))}
          {data.invoices.length === 0 && <p className="px-5 py-8 text-center text-sm text-ink-400">No invoices yet.</p>}
        </div>
      </Card>
    </div>
  );
}
