"use client";

import * as React from "react";

export interface SafeUser {
  id: string;
  name: string;
  email?: string;
  phone: string;
  role: "admin" | "instructor" | "student";
  studentId?: string;
  packageId?: string;
  packageName?: string;
  referralCode?: string;
  avatarColor?: string;
  [key: string]: unknown;
}

// ApiData is the fallback type for untyped API payloads. Deliberately kept as
// `any` so loosely-typed client components can read arbitrary JSON fields.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ApiData = any;

export function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : typeof e === "string" ? e : "Something went wrong";
}

export async function api<T = ApiData>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  const data = await res.json();
  if (!res.ok) throw new Error((data as { error?: string }).error || "Request failed");
  return data as T;
}

export function useSession() {
  const [user, setUser] = React.useState<SafeUser | null>(null);
  const [loading, setLoading] = React.useState(true);
  const refresh = React.useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = await res.json();
      setUser(data.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);
  React.useEffect(() => {
    let mounted = true;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (mounted) setUser(data.user ?? null);
      })
      .catch(() => {
        if (mounted) setUser(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);
  return { user, setUser, refresh, loading };
}

interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

type ToastType = "success" | "error" | "info";

interface ToastCtx {
  push: (message: string, type?: ToastType) => void;
}

const ToastContext = React.createContext<ToastCtx>({ push: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const push = React.useCallback((message: string, type: ToastType = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);
  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="no-print pointer-events-none fixed bottom-4 right-4 z-[100] flex w-80 flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={
              "card-shadow pointer-events-auto rounded-xl border px-4 py-3 text-sm font-medium shadow-lg " +
              (t.type === "success"
                ? "border-go-500/20 bg-card text-ink-900"
                : t.type === "error"
                  ? "border-stop-500/30 bg-card text-stop-500"
                  : "border-ink-200 bg-card text-ink-700")
            }
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return React.useContext(ToastContext);
}
