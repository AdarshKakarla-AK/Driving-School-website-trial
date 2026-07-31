import { describe, it, expect } from "vitest";
import { makeSeed, seedIds, futureDate } from "../helpers/seed";
import { createBooking, cancelBooking, rescheduleBooking, joinWaitingList, getAvailability, findSlot, bookingIsPast } from "@/lib/booking";

describe("booking", () => {
  it("creates a pending_payment booking and marks the slot booked", () => {
    const db = makeSeed();
    const date = futureDate(3);
    const { booking, error } = createBooking(db, { studentId: seedIds.student1, date, time: "09:00" });
    expect(error).toBeUndefined();
    expect(booking!.status).toBe("pending_payment");
    expect(booking!.ref).toMatch(/^BK\d{4}$/);
    expect(db.slots.find((s) => s.id === "slot_1")!.status).toBe("booked");
    expect(db.notifications.length).toBeGreaterThan(0);
  });

  it("rejects a past slot", () => {
    const db = makeSeed();
    const past = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const { error } = createBooking(db, { studentId: seedIds.student1, date: past, time: "09:00" });
    expect(error).toBe("Cannot book a past slot.");
  });

  it("rejects a double booking for the same student at the same time", () => {
    const db = makeSeed();
    const date = futureDate(3);
    createBooking(db, { studentId: seedIds.student1, date, time: "09:00" });
    db.slots.find((s) => s.id === "slot_1")!.status = "available";
    const { error } = createBooking(db, { studentId: seedIds.student1, date, time: "09:00" });
    expect(error).toBe("You already have a lesson at this time.");
  });

  it("rejects when no slot is available", () => {
    const db = makeSeed();
    const date = futureDate(3);
    db.slots.forEach((s) => (s.status = "blocked"));
    const { error } = createBooking(db, { studentId: seedIds.student1, date, time: "09:00" });
    expect(error).toBe("That slot is no longer available. Please pick another.");
  });

  it("cancelBooking within the free window refunds fully and reopens the slot", () => {
    const db = makeSeed();
    const date = futureDate(3);
    const { booking } = createBooking(db, { studentId: seedIds.student1, date, time: "09:00" });
    db.bookings[0].paid = 1000;

    const { refund } = cancelBooking(db, booking!.id, "Changed my mind");
    expect(refund).toBe(1000);
    const bk = db.bookings.find((b) => b.id === booking!.id)!;
    expect(bk.status).toBe("cancelled");
    expect(db.slots.find((s) => s.id === "slot_1")!.status).toBe("available");
    expect(db.payments.some((p) => p.status === "refunded" && p.amount === 1000)).toBe(true);
  });

  it("cancelBooking applies a fee inside the policy window", () => {
    const db = makeSeed();
    const today = new Date().toISOString().slice(0, 10);
    const bk = {
      id: "bk_fee",
      ref: "BK0001",
      studentId: seedIds.student1,
      instructorId: seedIds.instructor,
      vehicleId: seedIds.vehicle,
      date: today,
      time: "00:00",
      durationMin: 60,
      status: "confirmed" as const,
      amount: 1000,
      paid: 1000,
      attendance: "na" as const,
      createdAt: new Date().toISOString(),
    };
    db.bookings.push(bk);

    const { refund } = cancelBooking(db, bk.id);
    expect(refund).toBe(900);
  });

  it("cancelBooking notifies a waiting student and clears the waitlist entry", () => {
    const db = makeSeed();
    const date = futureDate(3);
    const { booking } = createBooking(db, { studentId: seedIds.student1, date, time: "09:00" });
    db.bookings[0].paid = 0;
    joinWaitingList(db, seedIds.student2, seedIds.instructor, date, "09:00");

    cancelBooking(db, booking!.id);
    expect(db.waitlist).toHaveLength(0);
    const notified = db.notifications.some((n) => n.userId === seedIds.student2 && /Slot Open/.test(n.title));
    expect(notified).toBe(true);
  });

  it("rescheduleBooking moves the booking to a new slot", () => {
    const db = makeSeed();
    const date = futureDate(3);
    const { booking } = createBooking(db, { studentId: seedIds.student1, date, time: "09:00" });
    const res = rescheduleBooking(db, booking!.id, date, "10:00");
    expect(res.error).toBeUndefined();
    expect(db.bookings.find((b) => b.id === booking!.id)!.status).toBe("cancelled");
    expect(db.bookings).toHaveLength(2);
    expect(db.slots.find((s) => s.id === "slot_1")!.status).toBe("available");
    expect(db.slots.find((s) => s.id === "slot_2")!.status).toBe("booked");
    expect(db.bookings.find((b) => b.id === res.booking!.id)!.rescheduledFrom).toBe(booking!.ref);
  });

  it("getAvailability lists future days with slot status", () => {
    const db = makeSeed();
    const availability = getAvailability(db);
    expect(availability).toHaveLength(14);
    const day = availability.find((d) => d.date === futureDate(3))!;
    expect(day.slots.some((s) => s.time === "09:00" && s.status === "available")).toBe(true);
  });

  it("findSlot filters by instructor", () => {
    const db = makeSeed();
    const date = futureDate(3);
    expect(findSlot(db, date, "09:00", "ins_1")?.id).toBe("slot_1");
    expect(findSlot(db, date, "09:00", "nobody")).toBeNull();
  });

  it("findSlot filters by vehicle type", () => {
    const db = makeSeed();
    const date = futureDate(3);
    expect(findSlot(db, date, "09:00", undefined, "automatic")?.id).toBe("slot_1");
    expect(findSlot(db, date, "09:00", undefined, "manual")).toBeNull();
  });

  it("createBooking rejects an unknown student", () => {
    const db = makeSeed();
    const { error } = createBooking(db, { studentId: "nope", date: futureDate(3), time: "09:00" });
    expect(error).toBe("Student not found.");
  });

  it("cancelBooking returns an error for a missing booking", () => {
    expect(cancelBooking(makeSeed(), "nope").error).toBe("Booking not found.");
  });

  it("cancelBooking rejects an already-cancelled booking", () => {
    const db = makeSeed();
    const date = futureDate(3);
    const { booking } = createBooking(db, { studentId: seedIds.student1, date, time: "09:00" });
    cancelBooking(db, booking!.id);
    expect(cancelBooking(db, booking!.id).error).toBe("This booking can't be cancelled.");
  });

  it("rescheduleBooking rejects a missing booking", () => {
    expect(rescheduleBooking(makeSeed(), "nope", futureDate(5), "10:00").error).toBe("Booking not found.");
  });

  it("rescheduleBooking rejects a past date", () => {
    const db = makeSeed();
    const date = futureDate(3);
    const { booking } = createBooking(db, { studentId: seedIds.student1, date, time: "09:00" });
    expect(rescheduleBooking(db, booking!.id, "2020-01-01", "10:00").error).toBe("Cannot move to a past slot.");
  });

  it("rescheduleBooking rejects an unavailable slot", () => {
    const db = makeSeed();
    const date = futureDate(3);
    const { booking } = createBooking(db, { studentId: seedIds.student1, date, time: "09:00" });
    db.slots.forEach((s) => {
      if (s.time === "10:00") s.status = "blocked";
    });
    expect(rescheduleBooking(db, booking!.id, date, "10:00").error).toBe("Selected slot is not available.");
  });

  it("bookingIsPast reports on past dates", () => {
    const db = makeSeed();
    const past = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const { booking } = createBooking(db, { studentId: seedIds.student1, date: futureDate(3), time: "09:00" });
    expect(bookingIsPast(booking!)).toBe(false);
    expect(bookingIsPast({ ...booking!, date: past })).toBe(true);
  });
});
