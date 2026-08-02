import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getDB, today } from "@/lib/db/store";
import { analytics } from "@/lib/analytics";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireUser();
  const db = getDB();
  const todayStr = today();

  if (user.role === "student") {
    const prog = db.progresses.find((p) => p.studentId === user.id);
    const upcoming = db.bookings
      .filter((b) => b.studentId === user.id && b.date >= todayStr && !["cancelled", "no_show", "completed"].includes(b.status))
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
    const completedCount = db.bookings.filter((b) => b.studentId === user.id && b.status === "completed").length;
    const pkg = db.packages.find((p) => p.id === user.packageId);
    const payments = db.payments
      .filter((p) => p.studentId === user.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const pendingPayments = payments.filter((p) => p.status === "pending");
    const invoices = db.invoices.filter((i) => i.studentId === user.id).sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
    const notes = db.lessonNotes
      .filter((n) => n.studentId === user.id)
      .sort((a, b) => b.date.localeCompare(a.date));
    const certificate = db.certificates.find((c) => c.studentId === user.id);
    const reviews = db.reviews.filter((r) => r.studentId === user.id);
    const notifications = db.notifications
      .filter((n) => n.userId === user.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 20);
    const unread = db.notifications.filter((n) => n.userId === user.id && !n.read).length;

    const nextLesson = upcoming[0];
    const nextInstructor = nextLesson ? db.users.find((u) => u.id === nextLesson.instructorId) : undefined;
    const nextVehicle = nextLesson ? db.vehicles.find((v) => v.id === nextLesson.vehicleId) : undefined;

    return NextResponse.json({
      profile: user,
      package: pkg ? { ...pkg, remaining: Math.max(0, pkg.sessions - completedCount), completedCount } : undefined,
      bookings: db.bookings
        .filter((b) => b.studentId === user.id)
        .map((b) => ({
          ...b,
          instructor: db.users.find((u) => u.id === b.instructorId)?.name,
          vehicle: db.vehicles.find((v) => v.id === b.vehicleId)?.name,
          vehicleType: db.vehicles.find((v) => v.id === b.vehicleId)?.type,
        })),
      upcoming: upcoming.map((b) => ({
        ...b,
        instructor: db.users.find((u) => u.id === b.instructorId)?.name,
        vehicle: db.vehicles.find((v) => v.id === b.vehicleId)?.name,
        vehicleType: db.vehicles.find((v) => v.id === b.vehicleId)?.type,
      })),
      nextLesson: nextLesson
        ? { ...nextLesson, instructor: nextInstructor?.name, vehicle: nextVehicle?.name, instructorPhone: nextInstructor?.phone, instructorRating: nextInstructor?.rating }
        : undefined,
      progress: prog,
      payments,
      pendingPayments,
      invoices,
      notes,
      certificate,
      hasReviewed: reviews.length > 0,
      notifications,
      unread,
      stats: { completed: completedCount, total: pkg?.sessions ?? 0, next: upcoming.length },
    });
  }

  if (user.role === "instructor") {
    const lessonsToday = db.bookings
      .filter((b) => b.instructorId === user.id && b.date === todayStr && !["cancelled", "no_show"].includes(b.status))
      .sort((a, b) => a.time.localeCompare(b.time));
    const upcoming = db.bookings
      .filter((b) => b.instructorId === user.id && b.date > todayStr && !["cancelled", "no_show", "completed"].includes(b.status))
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
      .slice(0, 10);
    const completedThisMonth = db.bookings.filter((b) => b.instructorId === user.id && b.status === "completed" && b.date.slice(0, 7) === todayStr.slice(0, 7));
    const salaryPerLesson = user.salaryPerLesson ?? 500;
    const commissionPct = user.commissionPct ?? 0;
    const earningsBase = completedThisMonth.length * salaryPerLesson;
    const myBookingIds = new Set(db.bookings.filter((b) => b.instructorId === user.id).map((b) => b.id));
    const commissionThisMonth = Math.round(
      db.payments
        .filter((p) => p.status === "paid" && p.createdAt.slice(0, 7) === todayStr.slice(0, 7) && p.bookingId && myBookingIds.has(p.bookingId))
        .reduce((a, p) => a + (p.paidAmount * commissionPct) / 100, 0)
    );
    const schedule = db.bookings
      .filter((b) => b.instructorId === user.id && !["cancelled", "no_show"].includes(b.status))
      .map((b) => ({
        id: b.id,
        date: b.date,
        time: b.time,
        status: b.status,
        student: db.users.find((u) => u.id === b.studentId)?.name,
        package: db.packages.find((p) => p.id === b.packageId)?.name,
      }));
    const payroll = db.payroll.filter((p) => p.instructorId === user.id).sort((a, b) => b.month.localeCompare(a.month));
    const earningsTrend = Array.from({ length: 6 }, (_, i) => 5 - i).map((back) => {
      const d = new Date(new Date().getFullYear(), new Date().getMonth() - back, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const rec = db.payroll.find((p) => p.instructorId === user.id && p.month === key);
      const lessons = db.bookings.filter((b) => b.instructorId === user.id && b.status === "completed" && b.date.slice(0, 7) === key).length;
      const base = lessons * salaryPerLesson;
      const commission = Math.round(
        db.payments
          .filter((p) => p.status === "paid" && p.createdAt.slice(0, 7) === key && p.bookingId && myBookingIds.has(p.bookingId))
          .reduce((a, p) => a + (p.paidAmount * commissionPct) / 100, 0)
      );
      return { month: d.toLocaleDateString("en-IN", { month: "short" }), lessons, base, commission, total: rec ? rec.total : base + commission };
    });
    const myStudents = [...new Set(db.bookings.filter((b) => b.instructorId === user.id && !["cancelled", "no_show"].includes(b.status)).map((b) => b.studentId))];
    const notifications = db.notifications.filter((n) => n.userId === user.id && !n.read).slice(0, 10);
    const attendance = db.bookings
      .filter((b) => b.instructorId === user.id && b.status === "completed")
      .reduce((acc, b) => {
        acc[b.attendance] = (acc[b.attendance] ?? 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    const recentNotes = db.lessonNotes.filter((n) => n.instructorId === user.id).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);

    return NextResponse.json({
      profile: user,
      today: lessonsToday.map((b) => ({
        ...b,
        student: db.users.find((u) => u.id === b.studentId)?.name,
        studentPhone: db.users.find((u) => u.id === b.studentId)?.phone,
        vehicle: db.vehicles.find((v) => v.id === b.vehicleId)?.name,
        package: db.packages.find((p) => p.id === b.packageId)?.name,
      })),
      upcoming: upcoming.map((b) => ({ ...b, student: db.users.find((u) => u.id === b.studentId)?.name, vehicle: db.vehicles.find((v) => v.id === b.vehicleId)?.name })),
      students: myStudents.map((id) => {
        const s = db.users.find((u) => u.id === id)!;
        return { id: s.id, name: s.name, phone: s.phone, studentId: s.studentId, nextLesson: db.bookings.find((b) => b.studentId === id && b.date >= todayStr && !["cancelled", "no_show", "completed"].includes(b.status)) };
      }),
      earnings: earningsBase + commissionThisMonth,
      earningsBase,
      commissionThisMonth,
      salaryPerLesson,
      commissionPct,
      schedule,
      payroll,
      earningsTrend,
      lessonsThisMonth: completedThisMonth.length,
      attendance,
      recentNotes,
      notifications,
      unread: notifications.length,
    });
  }

  // admin
  const a = analytics(db);
  const recentBookings = db.bookings
    .sort((x, y) => y.createdAt.localeCompare(x.createdAt))
    .slice(0, 8)
    .map((b) => ({ ...b, student: db.users.find((u) => u.id === b.studentId)?.name, instructor: db.users.find((u) => u.id === b.instructorId)?.name }));
  const recentLeads = [...db.leads].sort((x, y) => y.createdAt.localeCompare(x.createdAt)).slice(0, 8);
  const notifications = db.notifications.filter((n) => !n.read).slice(0, 10);
  const automationLogs = [...db.automationLogs].sort((x, y) => y.createdAt.localeCompare(x.createdAt)).slice(0, 15);

  return NextResponse.json({
    profile: user,
    analytics: a,
    recentBookings,
    recentLeads,
    notifications,
    automationLogs,
    unread: notifications.length,
  });
}
