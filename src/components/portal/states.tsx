"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button, Card, Skeleton } from "@/components/ui";

export function PortalSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
      <Skeleton className="h-24" />
    </div>
  );
}

export function PortalError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Card className="max-w-sm p-8 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-stop-500/10 text-stop-500">
          <AlertTriangle className="size-6" />
        </div>
        <h3 className="font-display mt-4 text-lg font-bold text-ink-900">Couldn&apos;t load your dashboard</h3>
        <p className="mt-1 text-sm text-ink-500">Something went wrong while fetching your data. Check your connection and try again.</p>
        <Button className="mt-5" variant="dark" onClick={onRetry}>
          <RefreshCw className="size-4" /> Retry
        </Button>
      </Card>
    </div>
  );
}
