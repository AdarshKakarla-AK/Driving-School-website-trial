"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Phone, Power, Search, UserRound } from "lucide-react";
import { Avatar, Badge, Button, Card, Input } from "@/components/ui";
import { api, useToast, type ApiData } from "@/lib/client";
import { cn, formatINR } from "@/lib/utils";

export function AdminStudents({ data, refresh }: { data: ApiData; refresh: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const [q, setQ] = React.useState("");
  const students = data.students ?? [];

  const toggle = async (s: ApiData) => {
    try {
      await api("/api/admin/students", { method: "POST", body: JSON.stringify({ studentId: s.id, action: "toggle_active" }) });
      toast.push(`${s.name} ${s.active ? "deactivated" : "reactivated"}`, "info");
      refresh();
    } catch (e: ApiData) {
      toast.push(e.message, "error");
    }
  };

  const filtered = students.filter((s: ApiData) => (s.name + s.phone + s.package + s.studentId).toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-900">Students</h1>
          <p className="text-sm text-ink-500">{students.length} enrolled · <span className="font-semibold text-ink-700">{students.filter((s: ApiData) => s.active).length} active</span></p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-300" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search students..." className="pl-9" />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((s: ApiData) => (
          <Card key={s.id} className={cn("p-4", !s.active && "opacity-60")}>
            <div className="flex items-center gap-3">
              <Avatar name={s.name} size="md" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-ink-900">{s.name}</p>
                <p className="text-[11px] text-ink-400">{s.studentId}</p>
              </div>
              <Badge tone={s.active ? "green" : "red"}>{s.active ? "Active" : "Inactive"}</Badge>
            </div>
            <div className="mt-3 space-y-1 text-xs text-ink-500">
              <p className="flex items-center gap-1.5"><Phone className="size-3.5 text-brand-500" /> {s.phone}</p>
              <p><span className="text-ink-400">Package:</span> <span className="font-semibold text-ink-700">{s.package}</span></p>
              <p><span className="text-ink-400">Progress:</span> {s.progress?.lessonsCompleted ?? 0}/{s.progress?.lessonsTotal ?? "?"} · {s.progress ? Math.round((s.progress.lessonsCompleted / s.progress.lessonsTotal) * 100) : 0}%</p>
              <p><span className="text-ink-400">Paid:</span> <span className="font-semibold text-go-600">{formatINR(s.paid)}</span> · <span className="text-ink-400">Due:</span> <span className="font-semibold text-amber-600">{formatINR(s.pending)}</span></p>
              {s.nextLesson && <p><span className="text-ink-400">Next:</span> {s.nextLesson.date} {s.nextLesson.time} · {s.instructor}</p>}
            </div>
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="ghost" className="flex-1 border border-ink-200" onClick={() => router.push(`/portal/admin?tab=bookings&student=${s.id}`)}>
                <UserRound className="size-3.5" /> Lessons
              </Button>
              <Button size="sm" variant="ghost" className={cn("flex-1 border", s.active ? "border-stop-200 text-stop-500 hover:bg-stop-50" : "border-go-200 text-go-600 hover:bg-go-50")} onClick={() => toggle(s)}>
                <Power className="size-3.5" /> {s.active ? "Suspend" : "Reactivate"}
              </Button>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && <Card className="p-10 text-center text-sm text-ink-400 sm:col-span-2 xl:col-span-3">No students match your search.</Card>}
      </div>
    </div>
  );
}
