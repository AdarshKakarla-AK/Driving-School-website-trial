"use client";

import * as React from "react";
import { CalendarPlus, CheckCircle2, Clock, XCircle, RotateCcw } from "lucide-react";
import { Badge, Button, Card, EmptyState, Modal, Spinner } from "@/components/ui";
import { api, useToast, type ApiData } from "@/lib/client";
import { cn, dayLabel, formatINR, formatTime, isPast } from "@/lib/utils";

export function Bookings({ data, refresh }: { data: ApiData; refresh: () => void }) {
  const [open, setOpen] = React.useState(false);
  const [avail, setAvail] = React.useState<ApiData[]>([]);
  const [date, setDate] = React.useState<string | null>(null);
  const [time, setTime] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [resched, setResched] = React.useState<ApiData | null>(null);
  const toast = useToast();

  const load = React.useCallback(async () => {
    const res = await api<{ days: ApiData[] }>(`/api/availability?vehicleType=${data.profile.vehiclePreference ?? "both"}&days=14`);
    setAvail(res.days);
  }, [data.profile.vehiclePreference]);

  const openBook = () => {
    setOpen(true);
    load();
  };

  const confirm = async () => {
    if (!date || !time) return;
    setLoading(true);
    try {
      await api("/api/bookings", { method: "POST", body: JSON.stringify({ packageId: data.profile.packageId, date, time }) });
      toast.push("Lesson booked & confirmed on WhatsApp ✅");
      setOpen(false);
      setDate(null);
      setTime(null);
      refresh();
    } catch (e: ApiData) {
      toast.push(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const cancel = async (b: ApiData) => {
    if (!window.confirm(`Cancel lesson on ${dayLabel(b.date)} at ${formatTime(b.time)}?`)) return;
    try {
      const res = await api<{ refund?: number }>(`/api/bookings/${b.id}`, { method: "PATCH", body: JSON.stringify({ action: "cancel" }) });
      toast.push(res.refund ? `Cancelled. Refund of ${formatINR(res.refund)} initiated.` : "Lesson cancelled.");
      refresh();
    } catch (e: ApiData) {
      toast.push(e.message, "error");
    }
  };

  const doReschedule = async () => {
    if (!resched || !date || !time) return;
    setLoading(true);
    try {
      await api(`/api/bookings/${resched.id}`, { method: "PATCH", body: JSON.stringify({ action: "reschedule", date, time }) });
      toast.push("Lesson rescheduled 🔄");
      setResched(null);
      setDate(null);
      setTime(null);
      refresh();
    } catch (e: ApiData) {
      toast.push(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const upcoming = data.upcoming ?? [];
  const all = (data.bookings ?? []).filter((b: ApiData) => b.status !== "cancelled");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-900">My lessons</h1>
          <p className="text-sm text-ink-500">Book, reschedule or cancel — live availability, instant confirmation.</p>
        </div>
        <Button onClick={openBook}>
          <CalendarPlus className="size-4.5" /> Book new lesson
        </Button>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-ink-400">Upcoming ({upcoming.length})</h2>
        {upcoming.length === 0 ? (
          <EmptyState icon={<CalendarPlus className="size-6" />} title="No upcoming lessons" subtitle="Book one now to keep your progress rolling!" />
        ) : (
          <div className="space-y-3">
            {upcoming.map((b: ApiData) => {
              const cancellable = !isPast(b.date, b.time);
              return (
                <Card key={b.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex size-12 flex-col items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                      <span className="text-[10px] font-bold uppercase">{new Date(b.date + "T00:00:00").toLocaleDateString("en-IN", { month: "short" })}</span>
                      <span className="font-display text-lg font-bold leading-none">{new Date(b.date + "T00:00:00").getDate()}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-ink-900">
                        {dayLabel(b.date)} · {formatTime(b.time)}
                      </p>
                      <p className="text-xs text-ink-500">
                        {b.instructor} · {b.vehicle}
                      </p>
                      <div className="mt-1">
                        {b.status === "confirmed" || b.status === "upcoming" ? (
                          <Badge tone="green">
                            <CheckCircle2 className="size-3" /> Confirmed
                          </Badge>
                        ) : (
                          <Badge tone="red">
                            <Clock className="size-3" /> Payment pending
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {cancellable && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => { setResched(b); setDate(null); setTime(null); load(); }}>
                          <RotateCcw className="size-3.5" /> Reschedule
                        </Button>
                        <Button size="sm" variant="ghost" className="text-stop-500" onClick={() => cancel(b)}>
                          <XCircle className="size-3.5" /> Cancel
                        </Button>
                      </>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-ink-400">Completed lessons ({all.filter((b: ApiData) => b.status === "completed").length})</h2>
        <Card className="divide-y divide-ink-50">
          {all.filter((b: ApiData) => b.status === "completed").slice(0, 10).map((b: ApiData) => (
            <div key={b.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <span className="text-ink-700">
                {dayLabel(b.date)} · {formatTime(b.time)}
              </span>
              <span className="text-ink-400">{b.instructor}</span>
              <Badge tone={b.attendance === "absent" ? "red" : b.attendance === "late" ? "brand" : "green"} className="capitalize">
                {b.attendance}
              </Badge>
            </div>
          ))}
          {all.filter((b: ApiData) => b.status === "completed").length === 0 && <p className="px-4 py-6 text-center text-sm text-ink-400">No completed lessons yet.</p>}
        </Card>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={resched ? "Reschedule lesson" : "Book a new lesson"} wide>
        <SlotPicker avail={avail} date={date} setDate={setDate} time={time} setTime={setTime} />
        <div className="mt-5 flex gap-2">
          <Button className="flex-1" size="lg" disabled={!date || !time} loading={loading} onClick={resched ? doReschedule : confirm}>
            {resched ? "Confirm reschedule" : "Confirm booking"}
          </Button>
          <Button variant="outline" size="lg" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export function SlotPicker({ avail, date, setDate, time, setTime }: { avail: ApiData[]; date: string | null; setDate: (d: string | null) => void; time: string | null; setTime: (t: string | null) => void }) {
  if (!avail.length) {
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    );
  }
  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {avail.map((d) => {
          const free = d.slots.some((s: ApiData) => s.status === "available");
          return (
            <button
              key={d.date}
              onClick={() => {
                setDate(d.date);
                setTime(null);
              }}
              className={cn(
                "shrink-0 rounded-xl border px-3 py-2 text-center",
                date === d.date ? "border-brand-500 bg-brand-500/10" : "border-ink-200 bg-card hover:border-brand-300",
                !free && "opacity-40"
              )}
            >
              <p className="text-[10px] font-semibold uppercase text-ink-400">{new Date(d.date + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short" })}</p>
              <p className={cn("text-sm font-bold", date === d.date ? "text-brand-700" : "text-ink-800")}>{new Date(d.date + "T00:00:00").getDate()}</p>
              <p className="text-[10px] text-ink-400">{new Date(d.date + "T00:00:00").toLocaleDateString("en-IN", { month: "short" })}</p>
            </button>
          );
        })}
      </div>
      {date && (
        <div className="mt-4 grid grid-cols-4 gap-2">
          {avail.find((d) => d.date === date)?.slots.map((s: ApiData) => (
            <button
              key={s.time}
              disabled={s.status !== "available"}
              onClick={() => setTime(s.time)}
              className={cn(
                "rounded-xl border px-2 py-2 text-sm font-semibold",
                time === s.time
                  ? "border-brand-500 bg-gradient-to-b from-brand-400 to-brand-600 text-white"
                  : s.status === "available"
                    ? "border-ink-200 bg-card text-ink-700 hover:border-brand-300"
                    : "border-ink-100 bg-ink-50 text-ink-300 line-through"
              )}
            >
              {formatTime(s.time)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
