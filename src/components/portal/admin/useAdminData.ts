"use client";

import * as React from "react";
import { api, type ApiData } from "@/lib/client";

export function useAdminData() {
  const [data, setData] = React.useState<ApiData>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [dash, students, bookings, vehicles, leads, expenses, payroll, analytics] = await Promise.all([
        api<ApiData>("/api/dashboard"),
        api<ApiData>("/api/admin/students"),
        api<ApiData>("/api/bookings"),
        api<ApiData>("/api/vehicles"),
        api<ApiData>("/api/admin/leads"),
        api<ApiData>("/api/admin/expenses"),
        api<ApiData>("/api/admin/payroll"),
        api<ApiData>("/api/admin/analytics"),
      ]);
      setData({ ...dash, ...students, ...bookings, ...vehicles, ...leads, ...expenses, ...payroll, ...analytics });
    } catch {
      setData(null);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    let mounted = true;
    Promise.all([
      api<ApiData>("/api/dashboard"),
      api<ApiData>("/api/admin/students"),
      api<ApiData>("/api/bookings"),
      api<ApiData>("/api/vehicles"),
      api<ApiData>("/api/admin/leads"),
      api<ApiData>("/api/admin/expenses"),
      api<ApiData>("/api/admin/payroll"),
      api<ApiData>("/api/admin/analytics"),
    ])
      .then(([dash, students, bookings, vehicles, leads, expenses, payroll, analytics]) => {
        if (mounted) setData({ ...dash, ...students, ...bookings, ...vehicles, ...leads, ...expenses, ...payroll, ...analytics });
      })
      .catch(() => {
        if (mounted) {
          setData(null);
          setError(true);
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return { data, loading, error, refresh };
}
