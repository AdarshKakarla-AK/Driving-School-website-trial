"use client";

import * as React from "react";
import { CarFront, Fuel, Gauge, ShieldAlert, Sparkles } from "lucide-react";
import { Badge, Button, Card, EmptyState, Modal } from "@/components/ui";
import { api, useToast, type ApiData } from "@/lib/client";


const STATUS_TONE: Record<string, "green" | "amber" | "red" | "ink" | "blue"> = {
  available: "green",
  in_use: "blue",
  maintenance: "red",
  retired: "ink",
};

export function AdminVehicles({ data, refresh }: { data: ApiData; refresh: () => void }) {
  const toast = useToast();
  const [vehicle, setVehicle] = React.useState<ApiData | null>(null);
  const vehicles = data.vehicles ?? [];

  const update = async (status: string) => {
    try {
      await api("/api/vehicles", { method: "POST", body: JSON.stringify({ vehicleId: vehicle.id, status }) });
      toast.push(`${vehicle.name} → ${status}`);
      setVehicle(null);
      refresh();
    } catch (e: ApiData) {
      toast.push(e.message, "error");
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-900">Fleet</h1>
        <p className="text-sm text-ink-500">Vehicles with live status for the booking engine.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {vehicles.map((v: ApiData) => (
          <Card key={v.id} className="overflow-hidden">
            <div className="relative h-32 bg-gradient-to-br from-ink-800 to-ink-900">
              <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_50%,#14b8a6_0,transparent_50%),radial-gradient(circle_at_80%_50%,#f59e0b_0,transparent_40%)]" />
              <div className="absolute bottom-3 left-4 flex items-center gap-3 text-white">
                <CarFront className="size-8 text-brand-300" />
                <div>
                  <p className="font-display font-bold">{v.name}</p>
                  <p className="text-[11px] text-white/60">{v.regNumber}</p>
                </div>
              </div>
              <div className="absolute right-3 top-3">
                <Badge tone={STATUS_TONE[v.status] ?? "ink"} className="capitalize">{v.status.replace("_", " ")}</Badge>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 p-4 text-center text-xs">
              <div className="rounded-xl bg-ink-50 p-2.5">
                <Fuel className="mx-auto size-4 text-brand-500" />
                <p className="mt-1 font-semibold text-ink-800">{v.fuelLevel ?? 0}%</p>
                <p className="text-[10px] text-ink-400">Fuel</p>
              </div>
              <div className="rounded-xl bg-ink-50 p-2.5">
                <Gauge className="mx-auto size-4 text-brand-500" />
                <p className="mt-1 font-semibold text-ink-800">{(v.odometer ?? 0).toLocaleString("en-IN")} km</p>
                <p className="text-[10px] text-ink-400">Odometer</p>
              </div>
              <div className="rounded-xl bg-ink-50 p-2.5">
                <Sparkles className="mx-auto size-4 text-brand-500" />
                <p className="mt-1 font-semibold text-ink-800">{v.lastServicedAt ?? "—"}</p>
                <p className="text-[10px] text-ink-400">Serviced</p>
              </div>
            </div>
            <div className="border-t border-ink-100 p-3">
              <Button size="sm" variant="outline" className="w-full" onClick={() => setVehicle(v)}>
                <ShieldAlert className="size-3.5" /> Update status
              </Button>
            </div>
          </Card>
        ))}
        {vehicles.length === 0 && (
          <div className="sm:col-span-2 xl:col-span-3">
            <EmptyState icon={<CarFront className="size-6" />} title="No vehicles yet" subtitle="Add vehicles to start assigning them to lessons and bookings." />
          </div>
        )}
      </div>

      <Modal open={!!vehicle} onClose={() => setVehicle(null)} title={`${vehicle?.name} · ${vehicle?.regNumber}`}>
        {vehicle && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Button variant="success" disabled={vehicle.status === "available"} onClick={() => update("available")}>Available</Button>
              <Button variant="primary" disabled={vehicle.status === "in_use"} onClick={() => update("in_use")}>In use</Button>
            </div>
            <Button variant="danger" className="w-full" disabled={vehicle.status === "maintenance"} onClick={() => update("maintenance")}>Send to maintenance</Button>
            <p className="text-xs text-ink-400">
              {vehicle.status === "maintenance" ? "Maintenance mode blocks new bookings and notifies affected students." : "Sending to maintenance notifies students with upcoming bookings and opens the slot."}
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
