"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs } from "@/components/ui";
import { useDashboard } from "@/components/portal/useDashboard";
import { PortalSkeleton, PortalError } from "@/components/portal/states";
import { Overview } from "@/components/portal/student/Overview";
import { Bookings } from "@/components/portal/student/Bookings";
import { ProgressView } from "@/components/portal/student/ProgressView";
import { Payments } from "@/components/portal/student/Payments";
import { Documents } from "@/components/portal/student/Documents";
import { Certificates } from "@/components/portal/student/Certificates";
import { Reviews } from "@/components/portal/student/Reviews";

export default function StudentDashboard() {
  return (
    <React.Suspense fallback={null}>
      <StudentDashboardInner />
    </React.Suspense>
  );
}

function StudentDashboardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") ?? "overview";
  const { data, loading, error, refresh } = useDashboard();

  const setTab = (t: string) => router.replace(`/portal/dashboard${t === "overview" ? "" : `?tab=${t}`}`);

  const TABS = [
    { id: "overview", label: "Overview" },
    { id: "bookings", label: "My Lessons" },
    { id: "progress", label: "Progress" },
    { id: "payments", label: "Payments" },
    { id: "documents", label: "Documents" },
    { id: "certificates", label: "Certificates" },
    { id: "reviews", label: "Reviews" },
  ];

  if (loading) return <PortalSkeleton />;
  if (error || !data) return <PortalError onRetry={refresh} />;

  return (
    <div className="space-y-6">
      <div className="lg:hidden">
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
      </div>
      <div className="hidden lg:block">
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
      </div>

      {tab === "overview" && <Overview data={data} refresh={refresh} onBook={() => setTab("bookings")} onTab={setTab} />}
      {tab === "bookings" && <Bookings data={data} refresh={refresh} />}
      {tab === "progress" && <ProgressView data={data} refresh={refresh} />}
      {tab === "payments" && <Payments data={data} refresh={refresh} />}
      {tab === "documents" && <Documents data={data} refresh={refresh} />}
      {tab === "certificates" && <Certificates data={data} />}
      {tab === "reviews" && <Reviews data={data} refresh={refresh} />}
    </div>
  );
}
