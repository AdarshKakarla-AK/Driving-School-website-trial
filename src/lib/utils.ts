import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

export function formatDate(iso: string): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function formatTime(time: string): string {
  if (!time) return "-";
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${String(m).padStart(2, "0")} ${ampm}`;
}

export function dayLabel(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

export function fullDayLabel(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function isPast(date: string, time: string): boolean {
  const now = new Date();
  const d = new Date(`${date}T${time}:00`);
  return d.getTime() < now.getTime();
}

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}
