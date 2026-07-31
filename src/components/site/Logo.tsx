import { cn } from "@/lib/utils";

export function SteeringWheel({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden>
      <circle cx="24" cy="24" r="21" stroke="currentColor" strokeWidth="3.2" />
      <circle cx="24" cy="24" r="5.5" stroke="currentColor" strokeWidth="3.2" />
      <path d="M24 18.5V9M24 29.5V39M24 9c-2.4.4-4.6 1.4-6.4 2.8M24 9c2.4.4 4.6 1.4 6.4 2.8M24 39c-2.4-.4-4.6-1.4-6.4-2.8M24 39c2.4-.4 4.6-1.4 6.4-2.8" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ dark, className, compact }: { dark?: boolean; className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="relative flex size-10 items-center justify-center rounded-xl bg-gradient-to-b from-brand-400 to-brand-600 text-white shadow-sm">
        <SteeringWheel className="size-6" />
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className={cn("font-display block text-lg font-bold tracking-tight", dark ? "text-white" : "text-ink-900")}>
            Sri Mathru
          </span>
          <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-600">Driving School</span>
        </span>
      )}
    </span>
  );
}
