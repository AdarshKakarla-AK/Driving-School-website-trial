"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, CalendarDays, CreditCard, LineChart, Users, Car, Bell, LogOut, Menu, X, Bot, Wallet, FileText, MessageSquareText, Building2, Settings, TimerReset, BadgeCheck } from "lucide-react";
import { Logo } from "@/components/site/Logo";
import { Avatar } from "@/components/ui";
import { ThemeToggle } from "@/components/ThemeToggle";
import { api, useSession, type ApiData } from "@/lib/client";
import { cn } from "@/lib/utils";

const NAV: Record<string, { href: string; label: string; icon: React.ComponentType<{ className?: string }> }[]> = {
  student: [
    { href: "/portal/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/portal/dashboard?tab=bookings", label: "My Lessons", icon: CalendarDays },
    { href: "/portal/dashboard?tab=progress", label: "Progress", icon: LineChart },
    { href: "/portal/dashboard?tab=payments", label: "Payments", icon: CreditCard },
    { href: "/portal/dashboard?tab=documents", label: "Documents", icon: FileText },
    { href: "/portal/dashboard?tab=certificates", label: "Certificates", icon: BadgeCheck },
    { href: "/portal/dashboard?tab=reviews", label: "Reviews", icon: MessageSquareText },
  ],
  instructor: [
    { href: "/portal/instructor", label: "Today", icon: LayoutDashboard },
    { href: "/portal/instructor?tab=upcoming", label: "Upcoming", icon: CalendarDays },
    { href: "/portal/instructor?tab=students", label: "My Students", icon: Users },
    { href: "/portal/instructor?tab=earnings", label: "Earnings", icon: Wallet },
  ],
  admin: [
    { href: "/portal/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/portal/admin?tab=bookings", label: "Bookings", icon: CalendarDays },
    { href: "/portal/admin?tab=students", label: "Students", icon: Users },
    { href: "/portal/admin?tab=vehicles", label: "Vehicles", icon: Car },
    { href: "/portal/admin?tab=leads", label: "Leads / CRM", icon: Bot },
    { href: "/portal/admin?tab=analytics", label: "Analytics", icon: LineChart },
    { href: "/portal/admin?tab=expenses", label: "Expenses & Payroll", icon: Wallet },
    { href: "/portal/admin?tab=automation", label: "Automations", icon: TimerReset },
    { href: "/portal/admin?tab=settings", label: "Settings", icon: Settings },
  ],
};

export function PortalShell({ children, initialRole }: { children: React.ReactNode; initialRole: string }) {
  const { user } = useSession();
  const role = user?.role ?? initialRole;
  const [open, setOpen] = React.useState(false);
  const [notifsOpen, setNotifsOpen] = React.useState(false);
  const [notifs, setNotifs] = React.useState<ApiData[]>([]);
  const pathname = usePathname();
  const router = useRouter();

  React.useEffect(() => {
    api("/api/notifications").then((d: ApiData) => setNotifs(d.notifications)).catch(() => {});
  }, [pathname]);

  const logout = async () => {
    await api("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const markRead = async (id?: string) => {
    await api("/api/notifications", { method: "POST", body: JSON.stringify({ id: id ?? null, all: !id }) });
    setNotifs((n) => n.map((x) => ({ ...x, read: true })));
  };

  const items = NAV[role] ?? NAV.student;
  const unread = notifs.filter((n) => !n.read).length;

  return (
    <div className="flex min-h-screen bg-paper">
      {/* Sidebar */}
      <aside className={cn("no-print fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-ink-100 bg-card transition-transform lg:translate-x-0", open ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex h-16 items-center justify-between border-b border-ink-100 px-4">
          <Link href="/">
            <Logo compact />
          </Link>
          <button className="rounded-lg p-1.5 text-ink-400 lg:hidden" onClick={() => setOpen(false)}>
            <X className="size-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {items.map((item) => {
            const active = pathname === item.href.split("?")[0] && (item.href.includes("?") ? pathname + (pathname.includes("?") ? "" : "") === item.href.split("?")[0] : true);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  active ? "bg-gradient-to-r from-brand-50 to-transparent text-brand-700" : "text-ink-500 hover:bg-ink-50 hover:text-ink-900"
                )}
              >
                <item.icon className="size-4.5" /> {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-ink-100 p-3">
          <Link href="/" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-ink-500 hover:bg-ink-50">
            <Building2 className="size-4.5" /> Public site
          </Link>
          <Link href="/book" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-ink-500 hover:bg-ink-50">
            <CalendarDays className="size-4.5" /> Book a lesson
          </Link>
        </div>
      </aside>
      {open && <div className="no-print fixed inset-0 z-30 bg-night-950/60 lg:hidden" onClick={() => setOpen(false)} />}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="no-print sticky top-0 z-20 flex h-16 items-center justify-between border-b border-ink-100 bg-card/85 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-3">
            <button className="rounded-lg p-2 text-ink-600 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
              <Menu className="size-5" />
            </button>
            <div>
              <p className="text-xs text-ink-400">
                {role === "admin" ? "Admin Console" : role === "instructor" ? "Instructor Portal" : "Student Portal"}
              </p>
              <p className="text-sm font-bold capitalize text-ink-900">{user?.name ?? "Loading…"}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="relative">
              <button
                onClick={() => setNotifsOpen(!notifsOpen)}
                className="relative rounded-xl border border-ink-200 bg-card p-2.5 text-ink-600 hover:bg-ink-50"
                aria-label="Notifications"
              >
                <Bell className="size-4.5" />
                {unread > 0 && (
                  <span className="absolute -right-1 -top-1 flex size-4.5 items-center justify-center rounded-full bg-stop-500 text-[10px] font-bold text-white">
                    {unread}
                  </span>
                )}
              </button>
              {notifsOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setNotifsOpen(false)} />
                  <div className="absolute right-0 z-40 mt-2 w-80 overflow-hidden rounded-2xl border border-ink-100 bg-card shadow-xl">
                    <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
                      <p className="text-sm font-bold text-ink-900">Notifications</p>
                      <button onClick={() => markRead()} className="text-xs font-semibold text-brand-600">
                        Mark all read
                      </button>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifs.slice(0, 12).map((n) => (
                        <div key={n.id} className={cn("border-b border-ink-50 px-4 py-3", !n.read && "bg-brand-50/50")}>
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-bold text-ink-900">{n.title}</p>
                            <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-ink-500">{n.channel}</span>
                          </div>
                          <p className="mt-0.5 text-xs text-ink-500">{n.body}</p>
                        </div>
                      ))}
                      {!notifs.length && <p className="px-4 py-8 text-center text-sm text-ink-400">No notifications yet</p>}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Avatar name={user?.name ?? "U"} color={user?.avatarColor} size="sm" />
              <button onClick={logout} className="rounded-xl border border-ink-200 bg-card p-2.5 text-ink-600 hover:bg-ink-50" title="Logout">
                <LogOut className="size-4.5" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
