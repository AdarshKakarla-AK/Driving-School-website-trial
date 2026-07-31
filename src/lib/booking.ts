import "server-only";
import { uid, nowISO, nextCounter } from "./db/store";
import { notify } from "./notify";
import type { Booking, DB, Slot, WaitlistEntry } from "./db/types";
import { isPast, timeToMinutes } from "./utils";

export interface DayAvailability {
  date: string;
  slots: { time: string; status: "available" | "booked" | "blocked" | "maintenance"; instructorId?: string; vehicleId?: string }[];
}

export function getAvailability(db: DB, instructorId?: string, vehicleType?: string, days = 14): DayAvailability[] {
  const out: DayAvailability[] = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(Date.now() + i * 86400000).toISOString().slice(0, 10);
    const times = new Set<string>();
    const byTime = new Map<string, { status: Slot["status"]; instructorId: string; vehicleId: string }>();
    for (const slot of db.slots) {
      if (slot.date !== date) continue;
      if (instructorId && slot.instructorId !== instructorId) continue;
      const v = db.vehicles.find((x) => x.id === slot.vehicleId);
      if (vehicleType && v && v.type !== vehicleType && vehicleType !== "both") continue;
      const cur = byTime.get(slot.time);
      if (!cur) byTime.set(slot.time, { status: slot.status, instructorId: slot.instructorId, vehicleId: slot.vehicleId });
      else if (slot.status === "available") byTime.set(slot.time, { status: "available", instructorId: slot.instructorId, vehicleId: slot.vehicleId });
      times.add(slot.time);
    }
    out.push({
      date,
      slots: [...times]
        .sort((a, b) => timeToMinutes(a) - timeToMinutes(b))
        .map((time) => ({ time, ...(byTime.get(time) ?? { status: "booked" as const }) })),
    });
  }
  return out;
}

export interface BookingInput {
  studentId: string;
  packageId?: string;
  date: string;
  time: string;
  instructorId?: string;
  durationMin?: number;
  amount?: number;
}

export function findSlot(db: DB, date: string, time: string, instructorId?: string, vehicleType?: string, excludeBookingId?: string): Slot | null {
  const candidates = db.slots.filter((s) => s.date === date && s.time === time && s.status === "available");
  if (excludeBookingId) {
    const booking = db.bookings.find((b) => b.id === excludeBookingId);
    if (booking) {
      // a slot is occupied by this booking itself
    }
  }
  if (instructorId) {
    return candidates.find((s) => s.instructorId === instructorId) ?? null;
  }
  if (vehicleType && vehicleType !== "both") {
    const match = candidates.find((s) => db.vehicles.find((v) => v.id === s.vehicleId)?.type === vehicleType);
    if (match) return match;
  }
  return candidates[0] ?? null;
}

export function createBooking(db: DB, input: BookingInput): { booking: Booking; error?: string } {
  if (isPast(input.date, input.time)) return { booking: null as unknown as Booking, error: "Cannot book a past slot." };
  const pkg = db.packages.find((p) => p.id === input.packageId);
  const slot = findSlot(db, input.date, input.time, input.instructorId, pkg?.vehicleType);
  if (!slot) return { booking: null as unknown as Booking, error: "That slot is no longer available. Please pick another." };

  const conflict = db.bookings.find(
    (b) => b.studentId === input.studentId && b.date === input.date && b.time === input.time && !["cancelled", "no_show"].includes(b.status)
  );
  if (conflict) return { booking: null as unknown as Booking, error: "You already have a lesson at this time." };

  const student = db.users.find((u) => u.id === input.studentId);
  if (!student) return { booking: null as unknown as Booking, error: "Student not found." };

  const ref = `BK${String(nextCounter(db, "booking")).padStart(4, "0")}`;
  const totalPaid = db.payments.filter((p) => p.studentId === input.studentId && p.status === "paid").reduce((a, p) => a + p.paidAmount, 0);
  const hasPending = db.payments.some((p) => p.studentId === input.studentId && p.status === "pending");
  const covered = totalPaid > 0 && !hasPending;
  const booking: Booking = {
    id: uid("bk"),
    ref,
    studentId: input.studentId,
    instructorId: slot.instructorId,
    vehicleId: slot.vehicleId,
    packageId: input.packageId,
    date: input.date,
    time: input.time,
    durationMin: input.durationMin ?? pkg?.sessionMin ?? 60,
    status: covered ? "confirmed" : "pending_payment",
    amount: input.amount ?? pkg?.price ?? 0,
    paid: covered ? totalPaid : 0,
    attendance: "na",
    createdAt: nowISO(),
  };
  db.bookings.push(booking);
  const slotIdx = db.slots.findIndex((s) => s.id === slot.id);
  if (slotIdx >= 0) db.slots[slotIdx] = { ...db.slots[slotIdx], status: "booked" };

  // slot may not have been in generated list (e.g. weekend) — add a booked marker slot
  if (!db.slots.find((s) => s.date === input.date && s.time === input.time && s.instructorId === slot.instructorId && s.vehicleId === slot.vehicleId)) {
    db.slots.push({ id: uid("slot"), date: input.date, time: input.time, instructorId: slot.instructorId, vehicleId: slot.vehicleId, status: "booked" });
  }

  const instructor = db.users.find((u) => u.id === slot.instructorId);
  notify(
    db,
    student,
    "booking_confirmed",
    "Lesson Booked 🎉",
    `Your ${pkg?.name ?? "driving"} lesson is confirmed with ${instructor?.name ?? "your instructor"} on ${input.date} at ${input.time}. Complete payment to lock your slot.`,
    { channels: ["app", "whatsapp", "email"], meta: "/portal/dashboard" }
  );
  if (instructor) {
    notify(
      db,
      instructor,
      "booking_confirmed",
      "New Lesson Assigned",
      `${student.name} booked a lesson on ${input.date} at ${input.time}. Vehicle #${slot.vehicleId}.`,
      { channels: ["app"] }
    );
  }
  return { booking };
}

export function confirmBooking(db: DB, bookingId: string, paymentRef?: string) {
  const b = db.bookings.find((x) => x.id === bookingId);
  if (!b) return;
  b.status = "confirmed";
  b.paymentRef = paymentRef;
  b.updatedAt = nowISO();
  const student = db.users.find((u) => u.id === b.studentId);
  if (student) {
    notify(db, student, "booking_confirmed", "Payment Successful ✅", `Your lesson on ${b.date} at ${b.time} is confirmed. See you there!`, { channels: ["app", "whatsapp", "email"] });
  }
}

export function cancelBooking(db: DB, bookingId: string, reason?: string): { error?: string; refund?: number } {
  const b = db.bookings.find((x) => x.id === bookingId);
  if (!b) return { error: "Booking not found." };
  if (["cancelled", "no_show", "completed"].includes(b.status)) return { error: "This booking can't be cancelled." };

  const hoursLeft = (new Date(`${b.date}T${b.time}:00`).getTime() - Date.now()) / 3600000;
  const policyHours = db.settings.cancellationPolicyHours;
  const feePct = db.settings.cancellationFeePct;
  const charged = hoursLeft >= policyHours ? 0 : (b.amount * feePct) / 100;
  const refund = Math.max(0, b.paid - charged);

  const bk = db.bookings.find((x) => x.id === bookingId)!;
  bk.status = "cancelled";
  bk.cancelledReason = reason ?? (hoursLeft >= policyHours ? "Cancelled within free window" : `Cancellation fee applied (${feePct}%)`);
  bk.updatedAt = nowISO();
  // reopen slot
  db.slots.forEach((s) => {
    if (s.date === bk.date && s.time === bk.time && s.instructorId === bk.instructorId && s.status === "booked") s.status = "available";
  });
  // refund payment record if paid
  if (refund > 0) {
    db.payments.push({
      id: uid("pay"), ref: `REF${Date.now().toString(36).toUpperCase()}`, studentId: bk.studentId, bookingId: bk.id,
      amount: refund, paidAmount: refund, method: "card", status: "refunded", createdAt: nowISO(),
    });
  }
  const student = db.users.find((u) => u.id === bk.studentId);
  if (student) {
    notify(db, student, "lesson_cancelled", "Lesson Cancelled", `Your lesson on ${bk.date} at ${bk.time} was cancelled.${refund > 0 ? ` ₹${Math.round(refund)} will be refunded.` : ""}`, { channels: ["app", "whatsapp", "email"] });
  }
  const instructor = db.users.find((u) => u.id === bk.instructorId);
  if (instructor) notify(db, instructor, "lesson_cancelled", "Lesson Cancelled", `A lesson on ${bk.date} at ${bk.time} was cancelled. Slot reopened.`, { channels: ["app"] });

  // offer slot to waiting list
  const wl = db.waitlist.find((w) => w.instructorId === bk.instructorId && w.date === bk.date && w.time === bk.time);
  if (wl) {
    const wlStudent = db.users.find((u) => u.id === wl.studentId);
    if (wlStudent) {
      notify(db, wlStudent, "booking_confirmed", "Slot Open! ⏰", `A slot just opened with your preferred instructor on ${bk.date} at ${bk.time}. Grab it before it's gone!`, { channels: ["app", "whatsapp"], meta: "/portal/dashboard?book=1" });
    }
    db.waitlist = db.waitlist.filter((w) => w.id !== wl.id);
  }
  return { refund };
}

export function rescheduleBooking(db: DB, bookingId: string, newDate: string, newTime: string): { booking?: Booking; error?: string } {
  const b = db.bookings.find((x) => x.id === bookingId);
  if (!b) return { error: "Booking not found." };
  if (isPast(newDate, newTime)) return { error: "Cannot move to a past slot." };
  const slot = findSlot(db, newDate, newTime, b.instructorId);
  if (!slot) return { error: "Selected slot is not available." };

  const bk = db.bookings.find((x) => x.id === bookingId)!;
  const oldDate = bk.date, oldTime = bk.time;
  const ref = `BK${String(nextCounter(db, "booking")).padStart(4, "0")}`;
  const newBooking: Booking = {
    ...bk,
    id: uid("bk"),
    ref,
    date: newDate,
    time: newTime,
    status: "confirmed",
    rescheduledFrom: bk.ref,
    instructorId: slot.instructorId,
    vehicleId: slot.vehicleId,
    cancelledReason: undefined,
    createdAt: nowISO(),
  };
  db.bookings.push(newBooking);
  bk.status = "cancelled";
  bk.cancelledReason = "Rescheduled";
  db.slots.forEach((s) => {
    if (s.date === oldDate && s.time === oldTime && s.instructorId === bk.instructorId && s.status === "booked") s.status = "available";
    if (s.date === newDate && s.time === newTime && s.instructorId === slot.instructorId && s.status === "available") s.status = "booked";
  });
  const student = db.users.find((u) => u.id === bk.studentId);
  if (student) notify(db, student, "rescheduled", "Lesson Rescheduled 🔄", `Your lesson moved to ${newDate} at ${newTime}.`, { channels: ["app", "whatsapp", "email"] });
  const instructor = db.users.find((u) => u.id === slot.instructorId);
  if (instructor) notify(db, instructor, "rescheduled", "Lesson Rescheduled 🔄", `A lesson moved to ${newDate} at ${newTime}.`, { channels: ["app"] });
  return { booking: newBooking };
}

export function joinWaitingList(db: DB, studentId: string, instructorId: string, date: string, time: string): WaitlistEntry {
  const entry: WaitlistEntry = { id: uid("wl"), studentId, instructorId, date, time, createdAt: nowISO() };
  db.waitlist.push(entry);
  const student = db.users.find((u) => u.id === studentId);
  if (student) notify(db, student, "booking_confirmed", "You're on the waitlist ⏳", `We'll notify you the moment ${date} ${time} opens up.`, { channels: ["app", "whatsapp"] });
  return entry;
}

export function bookingIsPast(b: Booking): boolean {
  return isPast(b.date, b.time);
}
