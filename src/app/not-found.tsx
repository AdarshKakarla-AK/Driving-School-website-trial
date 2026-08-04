import Link from "next/link";
import { SteeringWheel } from "@/components/site/Logo";

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-night-950 px-6 text-center text-white">
      <div className="bg-grid-dark absolute inset-0" aria-hidden />
      <div className="absolute -top-32 left-1/2 h-72 w-[30rem] -translate-x-1/2 rounded-full bg-brand-500/20 blur-3xl" aria-hidden />

      <div className="relative">
        <div className="mx-auto flex size-20 items-center justify-center rounded-3xl bg-gradient-to-b from-brand-400 to-brand-600 shadow-glow">
          <SteeringWheel className="size-11" />
        </div>
        <p className="font-display mt-8 bg-gradient-to-br from-brand-300 to-brand-600 bg-clip-text text-[7rem] font-extrabold leading-none tracking-tight text-transparent">
          404
        </p>
        <h1 className="font-display mt-4 text-2xl font-bold sm:text-3xl">Looks like you took a wrong turn</h1>
        <p className="mx-auto mt-3 max-w-md text-white/55">
          The page you&apos;re looking for doesn&apos;t exist or has moved. Don&apos;t worry — every great driver has missed a turn.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-brand-400 to-brand-600 px-6 text-base font-semibold text-white shadow-[0_8px_20px_-10px_rgba(245,158,11,0.6)] transition hover:from-brand-500 hover:to-brand-700 active:scale-[0.98]"
          >
            Back to Home
          </Link>
          <Link
            href="/book"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 text-base font-semibold text-white backdrop-blur-sm transition hover:border-white/30 hover:bg-white/10 active:scale-[0.98]"
          >
            Book a Free Demo
          </Link>
        </div>
      </div>
    </main>
  );
}
