"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { CalendarDays, CarFront, CreditCard, FileWarning, Bell, MessageSquareText, Phone, Star, TrendingUp, User } from "lucide-react";
import { Avatar, Button, Card, ProgressBar, Stars, Stat } from "@/components/ui";
import { api, useToast, type ApiData } from "@/lib/client";
import { dayLabel, formatINR, formatTime, greeting } from "@/lib/utils";
import { SKILL_LABELS } from "@/lib/db/seed";

export function Overview({ data, refresh, onBook, onTab }: { data: ApiData; refresh: () => void; onBook: () => void; onTab: (t: string) => void }) {
  const toast = useToast();
  const next = data.nextLesson;
  const prog = data.progress;
  const pending = data.pendingPayments ?? [];
  const skillAvg = (prog as ApiData)?.skills ? Math.round((Object.values((prog as ApiData).skills).reduce((a: number, s: ApiData) => a + Number(s.value ?? 0), 0) / Math.max(1, Object.keys((prog as ApiData).skills).length)) * 10) / 10 : null;
  // Date.now() is impure, but this is an ephemeral render-time display snapshot.
  // eslint-disable-next-line react-hooks/purity
  const expiringDoc = data.profile.documents?.some((d: ApiData) => d.expiry && new Date(d.expiry).getTime() - Date.now() < 45 * 86400000);

  const payNow = async (p: ApiData) => {
    try {
      const order = await api<{ payment: ApiData; demo: boolean }>("/api/payments/order", { method: "POST", body: JSON.stringify({ packageId: data.profile.packageId, amount: p.amount, plan: p.installment ? "emi" : "full", method: "upi" }) });
      const payment = order.payment;
      await api("/api/payments/verify", { method: "POST", body: JSON.stringify({ paymentId: payment.id }) });
      toast.push("Payment successful ✅");
      refresh();
    } catch (e: ApiData) {
      toast.push(e.message, "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-900">
            {greeting()}, {data.profile.name.split(" ")[0]} 👋
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Student ID: <span className="font-semibold text-ink-700">{data.profile.studentId}</span> · {data.package?.name}
          </p>
        </div>
        <Button onClick={onBook} size="lg">
          <CalendarDays className="size-4.5" /> Book a Lesson
        </Button>
      </div>

      {pending.length > 0 && (
        <Card className="border-stop-500/30 bg-stop-500/5 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-stop-500/10 text-stop-500">
                <CreditCard className="size-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-ink-900">
                  {pending.length} pending {pending.length === 1 ? "payment" : "payments"} · {formatINR(pending.reduce((a: number, p: ApiData) => a + p.amount, 0))}
                </p>
                <p className="text-xs text-ink-500">Keep your course on track — pay online in seconds.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => payNow(pending[0])}>
                Pay {formatINR(pending[0].amount)}
              </Button>
              <Button size="sm" variant="outline" onClick={() => onTab("payments")}>
                View all
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Lessons completed" value={`${data.stats.completed}/${data.stats.total}`} sub={`${data.stats.total - data.stats.completed} remaining`} icon={<TrendingUp className="size-5" />} />
        <Stat label="Next lesson" value={next ? dayLabel(next.date) : "—"} sub={next ? `${formatTime(next.time)} · ${next.instructor}` : "Book your first lesson"} icon={<CalendarDays className="size-5" />} />
        <Stat label="Overall skill" value={skillAvg != null ? `${skillAvg}/5` : "—"} sub="Averaged across skills" icon={<Star className="size-5" />} />
      </div>

      {next && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="overflow-hidden">
            <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <Avatar name={next.instructor ?? "I"} size="lg" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">Up next</p>
                  <p className="font-display text-lg font-bold text-ink-900">{dayLabel(next.date)} · {formatTime(next.time)}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-500">
                    <span className="inline-flex items-center gap-1">
                      <User className="size-3.5" /> {next.instructor} {next.instructorRating ? `(${next.instructorRating}★)` : ""}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <CarFront className="size-3.5" /> {next.vehicle}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => onTab("bookings")}>
                  Reschedule
                </Button>
                <a href={`tel:+91${next.instructorPhone}`} className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-go-600 px-3 text-xs font-semibold text-white hover:bg-go-500">
                  <Phone className="size-3.5" /> Call
                </a>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-ink-900">Skill progress</h3>
            <button onClick={() => onTab("progress")} className="text-xs font-semibold text-brand-600">
              View all
            </button>
          </div>
          <div className="mt-4 space-y-3.5">
            {Object.entries(SKILL_LABELS)
              .slice(0, 5)
              .map(([key, label]) => {
                const s = prog?.skills?.[key];
                return (
                  <div key={key}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-medium text-ink-700">{label}</span>
                      <Stars rating={s?.value ?? 0} size={12} />
                    </div>
                    <ProgressBar value={((s?.value ?? 0) / 5) * 100} />
                  </div>
                );
              })}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-display font-bold text-ink-900">Recent notifications</h3>
          <div className="mt-4 space-y-3">
            {data.notifications.slice(0, 5).map((n: ApiData) => (
              <div key={n.id} className="flex items-start gap-3">
                <div className={`mt-0.5 rounded-lg p-1.5 ${n.channel === "whatsapp" ? "bg-go-500/10 text-go-600" : n.channel === "email" ? "bg-blue-100 text-blue-600" : "bg-brand-50 text-brand-600"}`}>
                  {n.channel === "whatsapp" ? <MessageSquareText className="size-4" /> : n.channel === "email" ? <TrendingUp className="size-4" /> : <Bell className="size-4" />}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink-800">{n.title}</p>
                  <p className="line-clamp-2 text-xs text-ink-500">{n.body}</p>
                </div>
              </div>
            ))}
            {data.notifications.length === 0 && <p className="text-sm text-ink-400">No notifications yet.</p>}
          </div>
        </Card>
      </div>

      {expiringDoc && (
        <Card className="flex items-center gap-3 border-warn-500/40 bg-brand-50 p-4">
          <FileWarning className="size-5 shrink-0 text-warn-500" />
          <p className="text-sm text-ink-700">
            <span className="font-bold">Document expiring soon!</span> Upload a renewed document to avoid interruptions.
          </p>
          <Button size="sm" variant="outline" className="ml-auto" onClick={() => onTab("documents")}>
            Upload
          </Button>
        </Card>
      )}
    </div>
  );
}
