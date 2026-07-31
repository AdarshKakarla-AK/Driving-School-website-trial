"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Menu, X, LayoutDashboard, LogOut, Phone } from "lucide-react";
import { Logo } from "./Logo";
import { buttonClasses } from "@/components/ui";
import { useSession } from "@/lib/client";

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

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  return (
    <header className="no-print fixed inset-x-0 top-0 z-40">
      <div className={scrolled ? "border-b border-ink-100 bg-white/85 backdrop-blur-xl" : "bg-transparent"}>
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" aria-label="Home">
            <Logo />
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  pathname === l.href ? "text-brand-600" : "text-ink-600 hover:text-ink-900"
                }`}
              >
                {l.label}
              </Link>
            ))}
            <Link href="/courses" className={buttonClasses("primary", "sm", "ml-2")}>
              <Phone className="size-3.5" /> Book Now
            </Link>
          </nav>

          <div className="hidden items-center gap-2 md:flex">
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
                <Link href="/login" className={buttonClasses("ghost", "sm")}>
                  Login
                </Link>
                <Link href="/register" className={buttonClasses("primary", "sm")}>
                  Get Started
                </Link>
              </>
            )}
          </div>

          <button className="rounded-lg p-2 text-ink-700 md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      {open && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="border-b border-ink-100 bg-white shadow-lg md:hidden">
          <nav className="flex flex-col gap-1 px-4 py-3">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`rounded-lg px-3 py-2.5 text-sm font-medium ${pathname === l.href ? "bg-brand-50 text-brand-700" : "text-ink-700"}`}
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
