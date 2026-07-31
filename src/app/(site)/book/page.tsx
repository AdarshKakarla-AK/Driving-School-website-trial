"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, Check, CreditCard, ShieldCheck, Smartphone, Wallet } from "lucide-react";
import { Badge, Button, Card, Input } from "@/components/ui";
import { api, useSession, useToast, type ApiData } from "@/lib/client";
import { cn, formatINR, fullDayLabel, formatTime } from "@/lib/utils";

type Pkg = { id: string; name: string; slug: string; price: number; sessions: number; durationWeeks: number; vehicleType: string; emi?: { downPayment: number; months: number; monthly: number } };

export default function BookPage() {
  return (
    <React.Suspense fallback={null}>
      <BookInner />
    </React.Suspense>
  );
}

function BookInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useSession();
  const toast = useToast();

  const [packages, setPackages] = React.useState<Pkg[]>([]);
  const [avail, setAvail] = React.useState<ApiData[]>([]);
  const [step, setStep] = React.useState(1);
  const [pkg, setPkg] = React.useState<Pkg | null>(null);
  const [date, setDate] = React.useState<string | null>(searchParams.get("date"));
  const [time, setTime] = React.useState<string | null>(searchParams.get("time"));
  const [method, setMethod] = React.useState<"upi" | "card" | "netbanking" | "wallet">("upi");
  const [plan, setPlan] = React.useState<"full" | "emi">("full");
  const [coupon, setCoupon] = React.useState("");
  const [couponApplied, setCouponApplied] = React.useState<{ discount: number; code: string } | null>(null);
  const [paying, setPaying] = React.useState(false);
  const [success, setSuccess] = React.useState<{ booking: ApiData; payment: ApiData; invoice?: ApiData } | null>(null);

  React.useEffect(() => {
    let mounted = true;
    api("/api/public/packages").then((d: ApiData) => {
      if (!mounted) return;
      setPackages(d.packages);
      const slug = searchParams.get("pkg");
      if (slug) {
        const found = d.packages.find((p: ApiData) => p.slug === slug);
        if (found) setPkg(found);
      }
    });
    return () => {
      mounted = false;
    };
  }, [searchParams]);

  const activePkg = pkg ?? packages.find((p) => p.slug === searchParams.get("pkg")) ?? null;

  React.useEffect(() => {
    if (!activePkg || step < 2) return;
    let mounted = true;
    const pk = packages.find((p) => p.id === activePkg.id);
    api<{ days: ApiData[] }>(`/api/availability?vehicleType=${pk?.vehicleType ?? "both"}&days=14`).then((res) => {
      if (mounted) setAvail(res.days);
    });
    return () => {
      mounted = false;
    };
  }, [activePkg, step, packages]);

  const amount = activePkg ? activePkg.price : 0;
  const emiDown = activePkg?.emi?.downPayment ?? 0;
  const payAmount = plan === "emi" ? emiDown : amount;
  const finalAmount = Math.max(0, payAmount - (couponApplied?.discount ?? 0));

  const applyCoupon = async () => {
    try {
      const res = await api<{ discount: number; error?: string }>("/api/coupons", { method: "POST", body: JSON.stringify({ code: coupon, amount: payAmount }) });
      if (res.error) return toast.push(res.error, "error");
      setCouponApplied({ discount: res.discount, code: coupon.toUpperCase() });
      toast.push(`Coupon applied: −${formatINR(res.discount)}`);
    } catch (e: ApiData) {
      toast.push(e.message, "error");
    }
  };

  const proceedToPayment = () => {
    if (!user) {
      const params = new URLSearchParams();
      if (activePkg) params.set("pkg", activePkg.slug);
      if (date) params.set("date", date);
      if (time) params.set("time", time);
      params.set("step", "3");
      router.push(`/login?next=/book?${params.toString()}`);
      return;
    }
    setStep(3);
  };

  const confirmPayment = async () => {
    if (!activePkg || !date || !time || !user) return;
    setPaying(true);
    try {
      const b = await api<{ booking: ApiData }>("/api/bookings", {
        method: "POST",
        body: JSON.stringify({ packageId: activePkg.id, date, time }),
      });
      const order = await api<{ payment: ApiData; razorpayOrderId: string | null; keyId?: string; amountPaise: number; demo: boolean }>("/api/payments/order", {
        method: "POST",
        body: JSON.stringify({
          bookingId: b.booking.id,
          packageId: activePkg.id,
          method,
          amount: finalAmount,
          plan,
          couponCode: couponApplied?.code,
        }),
      });

      if (!order.demo && order.razorpayOrderId && order.keyId && typeof window !== "undefined") {
        await loadRazorpay();
        const rzp = new (window as ApiData).Razorpay({
          key: order.keyId,
          amount: order.amountPaise,
          currency: "INR",
          name: "Sri Mathru Driving School",
          description: activePkg.name,
          order_id: order.razorpayOrderId,
          prefill: { contact: user.phone, email: user.email },
          handler: async (res: ApiData) => {
            const verified = await api<ApiData>("/api/payments/verify", { method: "POST", body: JSON.stringify({ paymentId: order.payment.id, razorpayPaymentId: res.razorpay_payment_id }) });
            setSuccess({ booking: b.booking, payment: verified.payment, invoice: verified.invoice });
            setStep(4);
          },
          modal: { ondismiss: () => setPaying(false) },
        });
        rzp.open();
      } else {
        // demo checkout
        const verified = await api<ApiData>("/api/payments/verify", { method: "POST", body: JSON.stringify({ paymentId: order.payment.id }) });
        await new Promise((r) => setTimeout(r, 800));
        setSuccess({ booking: b.booking, payment: verified.payment, invoice: verified.invoice });
        setStep(4);
      }
    } catch (e: ApiData) {
      toast.push(e.message || "Booking failed", "error");
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-28 sm:px-6">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-b from-brand-400 to-brand-600 text-white">
          <CalendarDays className="size-5" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-900 sm:text-3xl">Book Your Course</h1>
          <p className="text-sm text-ink-500">Live availability · instant confirmation · secure payment</p>
        </div>
      </div>

      <div className="mt-8 flex items-center gap-2 text-xs font-semibold sm:text-sm">
        {["1. Course", "2. Pick a slot", "3. Payment", "4. Confirmed"].map((s, i) => (
          <React.Fragment key={s}>
            <div className={cn("flex items-center gap-2", step === i + 1 ? "text-brand-600" : step > i + 1 ? "text-go-600" : "text-ink-400")}>
              <span className={cn("flex size-6 items-center justify-center rounded-full text-[11px] font-bold", step > i + 1 ? "bg-go-500 text-white" : step === i + 1 ? "bg-brand-500 text-white" : "bg-ink-100")}>
                {step > i + 1 ? <Check className="size-3.5" /> : i + 1}
              </span>
              {s}
            </div>
            {i < 3 && <div className="h-px w-6 bg-ink-200 sm:w-10" />}
          </React.Fragment>
        ))}
      </div>

      {success && step === 4 ? (
        <SuccessScreen result={success} onDone={() => router.push("/portal/dashboard")} />
      ) : (
        <div className="mt-8">
          {step === 1 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {packages.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setPkg(p);
                    setDate(null);
                    setTime(null);
                    setStep(2);
                  }}
                  className={cn(
                    "card-shadow rounded-2xl border bg-white p-5 text-left transition hover:-translate-y-0.5",
                    activePkg?.id === p.id ? "border-brand-400 ring-2 ring-brand-100" : "border-ink-100"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display font-bold text-ink-900">{p.name}</h3>
                    {p.vehicleType !== "both" && <Badge tone="blue">{p.vehicleType}</Badge>}
                  </div>
                  <p className="mt-1 text-xs text-ink-400">
                    {p.sessions} sessions · {p.durationWeeks} weeks
                  </p>
                  <p className="font-display mt-3 text-2xl font-bold text-ink-900">
                    {formatINR(p.price)}
                    {p.emi && <span className="ml-2 text-xs font-medium text-ink-400">EMI from {formatINR(p.emi.downPayment)}</span>}
                  </p>
                </button>
              ))}
            </div>
          )}

          {step === 2 && activePkg && (
            <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
              <Card className="p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-display font-bold text-ink-900">Pick a date & time</h2>
                  <Badge tone="green">
                    {avail.filter((d) => d.date >= (new Date().toISOString().slice(0, 10))).reduce((a, d) => a + d.slots.filter((s: ApiData) => s.status === "available").length, 0)} free slots this week
                  </Badge>
                </div>
                <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
                  {avail.map((d) => {
                    const free = d.slots.some((s: ApiData) => s.status === "available");
                    return (
                      <button
                        key={d.date}
                        onClick={() => setDate(d.date)}
                        className={cn(
                          "shrink-0 rounded-xl border px-3 py-2.5 text-center transition",
                          date === d.date ? "border-brand-500 bg-brand-50" : "border-ink-200 bg-white hover:border-brand-300",
                          !free && "opacity-40"
                        )}
                      >
                        <p className="text-[10px] font-semibold uppercase text-ink-400">{new Date(d.date + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short" })}</p>
                        <p className={cn("text-sm font-bold", date === d.date ? "text-brand-700" : "text-ink-800")}>{new Date(d.date + "T00:00:00").getDate()}</p>
                        <p className="text-[10px] text-ink-400">{new Date(d.date + "T00:00:00").toLocaleDateString("en-IN", { month: "short" })}</p>
                      </button>
                    );
                  })}
                </div>
                {date ? (
                  <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {avail.find((d) => d.date === date)?.slots.map((s: ApiData) => (
                      <button
                        key={s.time}
                        disabled={s.status !== "available"}
                        onClick={() => setTime(s.time)}
                        className={cn(
                          "rounded-xl border px-2 py-2.5 text-sm font-semibold transition",
                          time === s.time
                            ? "border-brand-500 bg-gradient-to-b from-brand-400 to-brand-600 text-white"
                            : s.status === "available"
                              ? "border-ink-200 bg-white text-ink-700 hover:border-brand-300"
                              : "border-ink-100 bg-ink-50 text-ink-300 line-through"
                        )}
                      >
                        {formatTime(s.time)}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="mt-6 text-center text-sm text-ink-400">Select a date to see available times.</p>
                )}
              </Card>

              <div className="space-y-4">
                <Card className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Your selection</p>
                  <p className="font-display mt-2 font-bold text-ink-900">{activePkg.name}</p>
                  {date && time && (
                    <div className="mt-3 rounded-xl bg-brand-50 p-3 text-sm">
                      <p className="font-semibold text-brand-800">{fullDayLabel(date)}</p>
                      <p className="text-brand-700">at {formatTime(time!)} · 60 min</p>
                    </div>
                  )}
                  <div className="mt-4 space-y-1.5 text-xs text-ink-500">
                    <p className="flex items-center gap-1.5">
                      <Check className="size-3.5 text-go-600" /> Instructor & car auto-assigned
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Check className="size-3.5 text-go-600" /> WhatsApp + email confirmation
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Check className="size-3.5 text-go-600" /> Free reschedule 24h before
                    </p>
                  </div>
                </Card>
                <Button size="lg" className="w-full" disabled={!date || !time} onClick={proceedToPayment}>
                  Continue to Payment
                </Button>
              </div>
            </div>
          )}

          {step === 3 && activePkg && (
            <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
              <Card className="p-6">
                <h2 className="font-display font-bold text-ink-900">Payment method</h2>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {[
                    { id: "upi", label: "UPI", desc: "GPay, PhonePe, Paytm", icon: <Smartphone className="size-5" /> },
                    { id: "card", label: "Card", desc: "Credit / Debit", icon: <CreditCard className="size-5" /> },
                    { id: "netbanking", label: "Net Banking", desc: "All major banks", icon: <Wallet className="size-5" /> },
                    { id: "wallet", label: "Wallets", desc: "Paytm, Amazon Pay", icon: <Wallet className="size-5" /> },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setMethod(m.id as ApiData)}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl border p-4 text-left transition",
                        method === m.id ? "border-brand-400 bg-brand-50 ring-1 ring-brand-200" : "border-ink-200 hover:border-ink-300"
                      )}
                    >
                      <span className={cn("rounded-xl p-2", method === m.id ? "bg-brand-500 text-white" : "bg-ink-100 text-ink-500")}>{m.icon}</span>
                      <span>
                        <span className="block text-sm font-semibold text-ink-900">{m.label}</span>
                        <span className="block text-xs text-ink-400">{m.desc}</span>
                      </span>
                    </button>
                  ))}
                </div>

                {activePkg.emi && (
                  <div className="mt-5">
                    <p className="text-sm font-medium text-ink-700">Payment plan</p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      <button
                        onClick={() => setPlan("full")}
                        className={cn("rounded-2xl border p-4 text-left", plan === "full" ? "border-brand-400 bg-brand-50" : "border-ink-200")}
                      >
                        <p className="text-sm font-bold text-ink-900">Pay in full</p>
                        <p className="text-xs text-ink-400">{formatINR(activePkg.price)}</p>
                      </button>
                      <button
                        onClick={() => setPlan("emi")}
                        className={cn("rounded-2xl border p-4 text-left", plan === "emi" ? "border-brand-400 bg-brand-50" : "border-ink-200")}
                      >
                        <p className="text-sm font-bold text-ink-900">EMI plan</p>
                        <p className="text-xs text-ink-400">
                          {formatINR(activePkg.emi.downPayment)} now + {activePkg.emi.months} × {formatINR(activePkg.emi.monthly)}
                        </p>
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-5">
                  <p className="text-sm font-medium text-ink-700">Coupon code</p>
                  <div className="mt-2 flex gap-2">
                    <Input value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder="e.g. FIRST100, SUMMER25" className="flex-1" />
                    <Button variant="dark" onClick={applyCoupon} disabled={!coupon}>
                      Apply
                    </Button>
                  </div>
                  {couponApplied && (
                    <p className="mt-2 text-sm font-semibold text-go-600">
                      {couponApplied.code} applied: −{formatINR(couponApplied.discount)}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-ink-400">Try: FIRST100 (₹1,000 off) or SUMMER25 (25% off)</p>
                </div>
              </Card>

              <div className="space-y-4">
                <Card className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Order summary</p>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between text-ink-600">
                      <span>{activePkg.name}</span>
                      <span>{formatINR(activePkg.price)}</span>
                    </div>
                    <div className="flex justify-between text-ink-600">
                      <span>Plan</span>
                      <span className="capitalize">{plan}</span>
                    </div>
                    {couponApplied && (
                      <div className="flex justify-between font-medium text-go-600">
                        <span>Coupon</span>
                        <span>−{formatINR(couponApplied.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-ink-100 pt-2 font-bold text-ink-900">
                      <span>Due now</span>
                      <span>{formatINR(finalAmount)}</span>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-ink-400">Incl. 18% GST. Full invoice + receipt on payment.</p>
                  <Button size="lg" className="mt-4 w-full" loading={paying} onClick={confirmPayment}>
                    {!paying && <ShieldCheck className="size-4" />} Pay {formatINR(finalAmount)} Securely
                  </Button>
                  <p className="mt-3 text-center text-[11px] text-ink-400">Secured by Razorpay · UPI · Cards · NetBanking · EMI</p>
                </Card>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SuccessScreen({ result, onDone }: { result: { booking: ApiData; payment: ApiData; invoice?: ApiData }; onDone: () => void }) {
  return (
    <div className="mx-auto mt-10 max-w-lg">
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-b from-go-500 to-go-600 px-8 py-10 text-center text-white">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-white/20">
            <Check className="size-9" />
          </div>
          <h2 className="font-display mt-4 text-2xl font-bold">Booking Confirmed!</h2>
          <p className="mt-1 text-sm text-white/85">Invoice {result.invoice?.number ?? result.payment?.invoiceNo}</p>
        </div>
        <div className="space-y-3 p-6 text-sm">
          <Row label="Booking ref" value={result.booking.ref} />
          <Row label="Date & time" value={`${fullDayLabel(result.booking.date)} · ${formatTime(result.booking.time)}`} />
          <Row label="Paid" value={formatINR(result.payment?.paidAmount ?? 0)} />
          <Row label="Method" value={String(result.payment?.method ?? "upi").toUpperCase()} />
          <div className="rounded-xl bg-brand-50 p-3 text-xs text-brand-800">
            Confirmations sent via WhatsApp & email. A receipt is in your dashboard under Payments.
          </div>
        </div>
      </Card>
      <div className="mt-6 flex gap-3">
        <Button className="flex-1" size="lg" onClick={onDone}>
          Go to My Dashboard
        </Button>
        <Button variant="outline" size="lg" className="flex-1">
          <Link href="/courses" onClick={onDone}>
            Book Another
          </Link>
        </Button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-500">{label}</span>
      <span className="font-semibold text-ink-900">{value}</span>
    </div>
  );
}

function loadRazorpay() {
  return new Promise<void>((resolve) => {
    if ((window as ApiData).Razorpay) return resolve();
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve();
    document.body.appendChild(s);
  });
}
