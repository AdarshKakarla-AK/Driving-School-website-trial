"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs } from "@/components/ui";
import { useAdminData } from "@/components/portal/admin/useAdminData";
import { PortalSkeleton, PortalError } from "@/components/portal/states";
import { AdminOverview } from "@/components/portal/admin/Overview";
import { AdminStudents } from "@/components/portal/admin/Students";
import { AdminBookings } from "@/components/portal/admin/Bookings";
import { AdminVehicles } from "@/components/portal/admin/Vehicles";
import { AdminFinance } from "@/components/portal/admin/Finance";
import { AdminCrm } from "@/components/portal/admin/Crm";
import { AdminAutomation } from "@/components/portal/admin/Automation";

export default function AdminPortal() {
  return (
    <React.Suspense fallback={null}>
      <AdminPortalInner />
    </React.Suspense>
  );
}

function AdminPortalInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") ?? "overview";
  const { data, loading, error, refresh } = useAdminData();

  const setTab = (t: string) => router.replace(`/portal/admin${t === "overview" ? "" : `?tab=${t}`}`);

  const TABS = [
    { id: "overview", label: "Overview" },
    { id: "bookings", label: "Bookings" },
    { id: "students", label: "Students" },
    { id: "vehicles", label: "Fleet" },
    { id: "finance", label: "Finance" },
    { id: "crm", label: "CRM" },
    { id: "automation", label: "Automation" },
  ];

  if (loading) return <PortalSkeleton />;
  if (error || !data) return <PortalError onRetry={refresh} />;

  return (
    <div className="space-y-6">
      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === "overview" && <AdminOverview data={data} />}
      {tab === "bookings" && <AdminBookings data={data} refresh={refresh} />}
      {tab === "students" && <AdminStudents data={data} refresh={refresh} />}
      {tab === "vehicles" && <AdminVehicles data={data} refresh={refresh} />}
      {tab === "finance" && <AdminFinance data={data} refresh={refresh} />}
      {tab === "crm" && <AdminCrm data={data} refresh={refresh} />}
      {tab === "automation" && <AdminAutomation data={data} refresh={refresh} />}
    </div>
  );
}
