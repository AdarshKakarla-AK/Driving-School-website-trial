"use client";

import * as React from "react";
import { api, type ApiData } from "@/lib/client";

export function useDashboard() {
  const [data, setData] = React.useState<ApiData>(null);
  const [loading, setLoading] = React.useState(true);
  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const d = await api("/api/dashboard");
      setData(d);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);
  React.useEffect(() => {
    let mounted = true;
    api("/api/dashboard")
      .then((d) => {
        if (mounted) setData(d);
      })
      .catch(() => {
        if (mounted) setData(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);
  return { data, loading, refresh };
}
