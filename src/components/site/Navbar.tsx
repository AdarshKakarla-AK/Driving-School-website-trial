"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Menu, X, LayoutDashboard, LogOut, CalendarCheck } from "lucide-react";
import { Logo } from "./Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { buttonClasses } from "@/components/ui";
import { useSession } from "@/lib/client";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/courses", label: "Courses" },
  { href: "/instructors", label: "Instructors" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Navbar() {
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useSession();

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const portalFor = user?.role === "admin" ? "/portal/admin" : user?.role === "instructor" ? "/portal/instructor" : "/portal/dashboard";

  // Over the dark homepage hero the nav is transparent with light text;
  // everywhere else it gets a frosted card surface once scrolled.
  const overHero = pathname === "/" && !scrolled;
  const linkClass = (href: string) =>
    cn(
      "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
      overHero
        ? pathname === href
          ? "text-brand-400"
          : "text-white/80 hover:text-white"
        : pathname === href
          ? "text-brand-600 dark:text-brand-400"
          : "text-ink-600 hover:text-ink-900"
    );

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  return (
    <header className="no-print fixed inset-x-0 top-0 z-40">
      <div className={overHero ? "bg-transparent" : scrolled ? "border-b border-ink-100 bg-card/85 backdrop-blur-xl card-shadow" : "bg-transparent"}>
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" aria-label="Home">
            <Logo dark={overHero} />
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className={linkClass(l.href)}>
                {l.label}
              </Link>
            ))}
            <Link href="/courses" className={buttonClasses("primary", "sm", "ml-2")}>
              <CalendarCheck className="size-3.5" /> Book Now
            </Link>
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <ThemeToggle className={overHero ? "border-white/20 bg-white/10 text-white hover:border-white/40 hover:text-white" : undefined} />
            {loading ? null : user ? (
              <>
                <Link href={portalFor} className={buttonClasses("outline", "sm")}>
                  <LayoutDashboard className="size-3.5" /> Dashboard
                </Link>
                <button onClick={logout} className={buttonClasses("ghost", "sm")} title="Logout">
                  <LogOut className="size-3.5" />
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className={cn(buttonClasses("ghost", "sm"), overHero && "text-white/85 hover:bg-white/10 hover:text-white")}>
                  Login
                </Link>
                <Link href="/register" className={buttonClasses("primary", "sm")}>
                  Get Started
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center gap-1 md:hidden">
            <ThemeToggle className={overHero ? "border-white/20 bg-white/10 text-white hover:border-white/40 hover:text-white" : undefined} />
            <button className={cn("rounded-lg p-2", overHero ? "text-white" : "text-ink-700")} onClick={() => setOpen(!open)} aria-label="Menu">
              {open ? <X className="size-6" /> : <Menu className="size-6" />}
            </button>
          </div>
        </div>
      </div>

      {open && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="border-b border-ink-100 bg-card shadow-lg md:hidden">
          <nav className="flex flex-col gap-1 px-4 py-3">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`rounded-lg px-3 py-2.5 text-sm font-medium ${pathname === l.href ? "bg-brand-500/10 text-brand-700 dark:text-brand-400" : "text-ink-700"}`}
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-2 border-t border-ink-100 pt-3">
              {user ? (
                <>
                  <Link href={portalFor} className={buttonClasses("primary", "sm", "flex-1")}>
                    <LayoutDashboard className="size-3.5" /> Dashboard
                  </Link>
                  <button onClick={logout} className={buttonClasses("outline", "sm", "flex-1")}>
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className={buttonClasses("outline", "sm", "flex-1")}>
                    Login
                  </Link>
                  <Link href="/register" className={buttonClasses("primary", "sm", "flex-1")}>
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </nav>
        </motion.div>
      )}
    </header>
  );
}
