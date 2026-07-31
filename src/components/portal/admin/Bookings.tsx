"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Filter, Phone } from "lucide-react";
import { Avatar, Badge, Button, Card, Select } from "@/components/ui";
import { api, useToast, type ApiData } from "@/lib/client";
import { formatINR, formatTime } from "@/lib/utils";

const STATUS_TONE: Record<string, "blue" | "green" | "amber" | "red" | "ink"> = {
  pending_payment: "amber",
  confirmed: "blue",
  in_progress: "blue",
  completed: "green",
  cancelled: "red",
  no_show: "red",
};

export function AdminBookings({ data, refresh }: { data: ApiData; refresh: () => void }) {
  const searchParams = useSearchParams();
  const toast = useToast();
  const studentFilter = searchParams.get("student");
  const [status, setStatus] = React.useState("all");
  const bookings = (data.bookings ?? []).filter((b: ApiData) => (status === "all" || b.status === status) && (!studentFilter || b.studentId === studentFilter));

  const cancel = async (b: ApiData) => {
    if (!confirm(`Cancel ${b.student}'s lesson on ${b.date}? A refund will be processed if applicable.`)) return;
    try {
      await api(`/api/bookings/${b.id}`, { method: "PATCH", body: JSON.stringify({ action: "cancel" }) });
      toast.push("Booking cancelled");
      refresh();
    } catch (e: ApiData) {
      toast.push(e.message, "error");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-900">All bookings</h1>
          <p className="text-sm text-ink-500">{bookings.length} shown{studentFilter ? " · filtered by student" : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-ink-300" />
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-44">
            <option value="all">All statuses</option>
            <option value="pending_payment">Pending payment</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_show">No-show</option>
          </Select>
        </div>
      </div>

      <div className="space-y-2.5">
        {bookings.map((b: ApiData) => (
          <Card key={b.id} className="p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <Avatar name={b.student ?? "S"} size="md" />
                <div>
                  <p className="font-semibold text-ink-900">{b.student}</p>
                  <p className="text-xs text-ink-500">
                    {b.date} · {formatTime(b.time)} · {b.vehicle}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 lg:gap-4">
                <a href={`tel:${b.studentPhone}`} className="flex items-center gap-1 text-xs font-semibold text-go-600 hover:underline">
                  <Phone className="size-3.5" /> {b.studentPhone}
                </a>
                <Badge tone={STATUS_TONE[b.status] ?? "ink"} className="capitalize">{b.status.replace("_", " ")}</Badge>
                <span className="text-xs text-ink-400">{b.package}</span>
                {b.paidAmount ? <span className="text-xs font-semibold text-ink-700">{formatINR(b.paidAmount)}</span> : null}
                {!["completed", "cancelled", "no_show"].includes(b.status) && (
                  <Button size="sm" variant="ghost" className="border-stop-200 text-stop-500 hover:bg-stop-50" onClick={() => cancel(b)}>
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
        {bookings.length === 0 && <Card className="p-10 text-center text-sm text-ink-400">No bookings here.</Card>}
      </div>
    </div>
  );
}
