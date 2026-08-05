"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, LayoutDashboard, LogOut, CalendarCheck, ArrowRight } from "lucide-react";
import { Logo } from "./Logo";
import { LanguageToggle } from "./LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { buttonClasses } from "@/components/ui";
import { useSession } from "@/lib/client";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/courses", key: "nav.courses" },
  { href: "/#pricing", key: "nav.pricing" },
  { href: "/#fleet", key: "nav.vehicles" },
  { href: "/instructors", key: "nav.instructors" },
  { href: "/#reviews", key: "nav.reviews" },
  { href: "/about", key: "nav.about" },
  { href: "/contact", key: "nav.contact" },
];

export function Navbar() {
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useSession();
  const { t } = useI18n();

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const portalFor = user?.role === "admin" ? "/portal/admin" : user?.role === "instructor" ? "/portal/instructor" : "/portal/dashboard";

  // Over the dark homepage hero the nav is transparent with light text;
  // everywhere else it gets a frosted glass surface once scrolled.
  const overHero = pathname === "/" && !scrolled;
  const isActive = (href: string) => {
    const path = href.split("#")[0];
    if (pathname === "/" && !path) return false;
    return pathname === path;
  };

  const linkClass = (href: string) =>
    cn(
      "relative rounded-lg px-3 py-2 text-sm font-medium transition-colors",
      overHero
        ? isActive(href)
          ? "text-brand-400"
          : "text-white/80 hover:text-white"
        : isActive(href)
          ? "text-brand-600 dark:text-brand-400"
          : "text-ink-600 hover:text-ink-900 dark:text-ink-300 dark:hover:text-white"
    );

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  return (
    <header className="no-print fixed inset-x-0 top-0 z-40">
      <div
        className={cn(
          "transition-all duration-300",
          overHero ? "bg-transparent" : scrolled ? "border-b border-ink-100/80 bg-card/80 backdrop-blur-xl card-shadow" : "bg-transparent"
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" aria-label="Sri Mathru Driving School — Home" className="shrink-0">
            <Logo dark={overHero} />
          </Link>

          <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Main">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className={linkClass(l.href)}>
                {t(l.key)}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <ThemeToggle className={overHero ? "border-white/20 bg-white/10 text-white hover:border-white/40 hover:text-white" : undefined} />
            <LanguageToggle className={overHero ? "border-white/20 bg-white/10 text-white" : undefined} />
            {loading ? null : user ? (
              <>
                <Link href={portalFor} className={buttonClasses("outline", "sm")}>
                  <LayoutDashboard className="size-3.5" /> {t("common.dashboard")}
                </Link>
                <button onClick={logout} className={buttonClasses("ghost", "sm")} title={t("common.logout")} aria-label={t("common.logout")}>
                  <LogOut className="size-3.5" />
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className={cn(buttonClasses("ghost", "sm"), overHero && "text-white/85 hover:bg-white/10 hover:text-white")}>
                  {t("common.login")}
                </Link>
                <Link href="/register" className={buttonClasses("primary", "sm")}>
                  {t("common.getStarted")}
                </Link>
              </>
            )}
            <Link href="/book" className={buttonClasses("dark", "sm", "ml-1")}>
              <CalendarCheck className="size-3.5" /> {t("common.bookLesson")}
            </Link>
          </div>

          <div className="flex items-center gap-1 lg:hidden">
            <ThemeToggle className={overHero ? "border-white/20 bg-white/10 text-white hover:border-white/40 hover:text-white" : undefined} />
            <LanguageToggle className={overHero ? "border-white/20 bg-white/10 text-white" : undefined} />
            <button
              className={cn("rounded-xl p-2", overHero ? "text-white hover:bg-white/10" : "text-ink-700 hover:bg-ink-100 dark:text-ink-200")}
              onClick={() => setOpen(!open)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
            >
              {open ? <X className="size-6" /> : <Menu className="size-6" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="border-b border-ink-100 bg-card shadow-xl lg:hidden"
          >
            <nav className="flex flex-col gap-1 px-4 py-4" aria-label="Mobile">
              {LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium transition-colors",
                    isActive(l.href) ? "bg-brand-500/10 text-brand-700 dark:text-brand-400" : "text-ink-700 hover:bg-ink-50 dark:text-ink-200 dark:hover:bg-white/5"
                  )}
                >
                  {t(l.key)}
                  <ArrowRight className="size-4 text-ink-300" />
                </Link>
              ))}
              <div className="mt-3 flex gap-2 border-t border-ink-100 pt-4">
                {user ? (
                  <>
                    <Link href={portalFor} className={buttonClasses("primary", "md", "flex-1")}>
                      <LayoutDashboard className="size-4" /> {t("common.dashboard")}
                    </Link>
                    <button onClick={logout} className={buttonClasses("outline", "md", "flex-1")}>
                      {t("common.logout")}
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login" className={buttonClasses("outline", "md", "flex-1")}>
                      {t("common.login")}
                    </Link>
                    <Link href="/register" className={buttonClasses("primary", "md", "flex-1")}>
                      {t("common.getStarted")}
                    </Link>
                  </>
                )}
              </div>
              <Link href="/book" className={buttonClasses("dark", "lg", "mt-2 w-full")}>
                <CalendarCheck className="size-4" /> {t("common.bookFreeDemo")}
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
