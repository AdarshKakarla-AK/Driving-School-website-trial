import "server-only";
import { nowISO, today } from "./db/store";
import { notify } from "./notify";
import { paymentRemindersDue } from "./payments";
import { weeklyReport, weeklySummaryText } from "./weekly";
import type { DB, User } from "./db/types";

export interface AutomationRunSummary {
  paymentReminders: number;
  lessonReminders: number;
  licenseReminders: number;
  birthdays: number;
  weeklyDigest: number;
}

const DAY_MS = 86400000;
const HOUR_MS = 3600000;

function activeStudent(db: DB, userId: string): User | undefined {
  const user = db.users.find((u) => u.id === userId);
  return user && user.active && user.role === "student" ? user : undefined;
}

function startOfDayUtc(date: string): number {
  return Date.parse(`${date}T00:00:00Z`);
}

export function runPaymentReminders(db: DB): number {
  let sent = 0;
  for (const payment of paymentRemindersDue(db)) {
    if (payment.reminderSentAt) continue;
    const student = activeStudent(db, payment.studentId);
    if (!student) continue;
    notify(db, student, "payment_reminder", "Payment Reminder 💳",
      `Your payment of ₹${payment.amount} for ${payment.ref} is due. Complete it to keep your lessons uninterrupted.`,
      { channels: ["app", "whatsapp"], meta: "/portal/dashboard?tab=payments" });
    payment.reminderSentAt = nowISO();
    sent += 1;
  }
  return sent;
}

export function runLessonReminders(db: DB, hoursAhead = 24, now: number = Date.now()): number {
  let sent = 0;
  const horizon = now + hoursAhead * HOUR_MS;
  for (const booking of db.bookings) {
    if (booking.reminderSentAt) continue;
    if (booking.status !== "confirmed" && booking.status !== "upcoming") continue;
    const start = Date.parse(`${booking.date}T${booking.time}:00`);
    if (Number.isNaN(start) || start < now || start > horizon) continue;
    const student = activeStudent(db, booking.studentId);
    if (!student) continue;
    const instructor = db.users.find((u) => u.id === booking.instructorId);
    notify(db, student, "lesson_reminder", "Lesson Reminder 🔔",
      `Your lesson with ${instructor?.name ?? "your instructor"} is scheduled for ${booking.date} at ${booking.time}. See you there!`,
      { channels: ["app", "whatsapp", "email"], meta: "/portal/dashboard" });
    booking.reminderSentAt = nowISO();
    sent += 1;
  }
  return sent;
}

export function runLicenseReminders(db: DB, daysBefore = 30): number {
  let sent = 0;
  const todayStart = startOfDayUtc(today());
  const horizon = todayStart + daysBefore * DAY_MS;
  for (const user of db.users) {
    if (!user.active || user.role !== "student") continue;
    for (const doc of user.documents) {
      if (doc.reminderSentAt || !doc.expiry) continue;
      const expiry = startOfDayUtc(doc.expiry);
      if (Number.isNaN(expiry) || expiry < todayStart || expiry > horizon) continue;
      const daysLeft = Math.round((expiry - todayStart) / DAY_MS);
      notify(db, user, "license_reminder", "Document Expiry Soon ⚠️",
        `${doc.type} on file expires in ${Math.max(0, daysLeft)} day(s). Renew it so your classes stay on track.`,
        { channels: ["app", "whatsapp"], meta: "/portal/dashboard?tab=documents" });
      doc.reminderSentAt = nowISO();
      sent += 1;
    }
  }
  return sent;
}

export function runBirthdayReminders(db: DB): number {
  let sent = 0;
  const now = new Date();
  const month = now.getUTCMonth() + 1;
  const day = now.getUTCDate();
  const year = now.getUTCFullYear();
  for (const user of db.users) {
    if (!user.dob || !user.active || user.role !== "student") continue;
    if (user.birthdayRemindedYear === year) continue;
    const dob = new Date(`${user.dob}T00:00:00Z`);
    if (Number.isNaN(dob.getTime())) continue;
    if (dob.getUTCMonth() + 1 !== month || dob.getUTCDate() !== day) continue;
    notify(db, user, "birthday", "Happy Birthday! 🎂",
      `Wishing you a fantastic day from the ${db.settings.schoolName} family! Ask us about your special referral offer.`,
      { channels: ["app", "whatsapp"], meta: "/portal/dashboard" });
    user.birthdayRemindedYear = year;
    sent += 1;
  }
  return sent;
}

export function runWeeklyDigest(db: DB, now: number = Date.now()): number {
  const nowDate = new Date(now);
  if (nowDate.getUTCDay() !== 1) return 0;
  const report = weeklyReport(db, 1, nowDate);
  const alreadySent = db.automationLogs.some(
    (l) => l.type === "weekly_report" && l.summary.includes(report.current.start)
  );
  if (alreadySent) return 0;
  const admins = db.users.filter((u) => u.role === "admin" && u.active);
  let sent = 0;
  for (const admin of admins) {
    notify(db, admin, "weekly_report", "Weekly Report 📊",
      `${db.settings.schoolName} — ${report.current.start} to ${report.current.end}\n\n${weeklySummaryText(report)}\n\nOpen the Reports tab in the Admin Console for the full breakdown and downloads.`,
      { channels: ["email", "app"], meta: "/portal/admin?tab=reports" });
    sent += 1;
  }
  return sent;
}

export function runDueAutomations(db: DB, now: number = Date.now()): AutomationRunSummary {
  return {
    paymentReminders: runPaymentReminders(db),
    lessonReminders: runLessonReminders(db, 24, now),
    licenseReminders: runLicenseReminders(db),
    birthdays: runBirthdayReminders(db),
    weeklyDigest: runWeeklyDigest(db, now),
  };
}
