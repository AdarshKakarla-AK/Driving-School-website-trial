"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Gift, ShieldCheck, UserPlus } from "lucide-react";
import { Button, Card, Input, Select } from "@/components/ui";
import { api, useToast, type ApiData } from "@/lib/client";

export default function RegisterPage() {
  return (
    <React.Suspense fallback={null}>
      <RegisterInner />
    </React.Suspense>
  );
}

function RegisterInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const [packages, setPackages] = React.useState<ApiData[]>([]);

  const [form, setForm] = React.useState({
    name: "",
    phone: searchParams.get("phone") ?? "",
    email: "",
    password: "",
    age: "",
    gender: "Female",
    city: "Bengaluru",
    vehiclePreference: "automatic",
    batchPreference: "Morning (6-11 AM)",
    packageId: "",
    referralCode: "",
  });
  const [loading, setLoading] = React.useState(false);
  const [done, setDone] = React.useState<{ name: string; studentId: string } | null>(null);

  React.useEffect(() => {
    api("/api/public/packages").then((d: ApiData) => {
      setPackages(d.packages);
      if (d.packages[0]) setForm((f) => ({ ...f, packageId: d.packages[0].id, vehiclePreference: d.packages[0].vehicleType === "both" ? "automatic" : d.packages[0].vehicleType }));
    });
  }, []);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api<{ redirect: string; user: { name: string; studentId?: string } }>("/api/auth/register", { method: "POST", body: JSON.stringify(form) });
      setDone({ name: res.user.name, studentId: res.user.studentId ?? "SMD" });
      toast.push("Account created! Welcome to Sri Mathru 🚗");
      setTimeout(() => {
        router.push("/portal/dashboard");
        router.refresh();
      }, 1200);
    } catch (e: ApiData) {
      toast.push(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <Card className="p-8 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-go-500/10 text-go-600">
          <CheckCircle2 className="size-8" />
        </div>
        <h2 className="font-display mt-4 text-2xl font-bold text-ink-900">Account created, {done.name}!</h2>
        <p className="mt-2 text-sm text-ink-500">
          Your Student ID is <span className="font-bold text-ink-800">{done.studentId}</span>. Welcome email, WhatsApp message and invoice are on their way to you.
        </p>
        <p className="mt-3 text-xs text-ink-400">Taking you to your dashboard…</p>
      </Card>
    );
  }

  return (
    <Card className="p-6 sm:p-8">
      <h1 className="font-display text-2xl font-bold text-ink-900">Create your student account</h1>
      <p className="mt-1 text-sm text-ink-500">Free registration · 60 seconds · no paperwork</p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <Input label="Full name *" required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Rahul Sharma" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Mobile number *" required type="tel" pattern="[0-9]{10}" maxLength={10} value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="10-digit mobile" />
          <Input label="Email (optional)" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@example.com" />
        </div>
        <Input label="Password *" required type="password" minLength={6} value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="At least 6 characters" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Input label="Age" type="number" min={16} max={80} value={form.age} onChange={(e) => set("age", e.target.value)} placeholder="21" />
          <Select label="Gender" value={form.gender} onChange={(e) => set("gender", e.target.value)}>
            {["Female", "Male", "Other"].map((g) => (
              <option key={g}>{g}</option>
            ))}
          </Select>
          <Input label="City" value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="Bengaluru" />
        </div>

        <Select label="Course *" value={form.packageId} onChange={(e) => set("packageId", e.target.value)}>
          {packages.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — ₹{p.price.toLocaleString("en-IN")}
            </option>
          ))}
        </Select>

        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Vehicle preference" value={form.vehiclePreference} onChange={(e) => set("vehiclePreference", e.target.value)}>
            <option value="automatic">Automatic</option>
            <option value="manual">Manual</option>
            <option value="both">No preference</option>
          </Select>
          <Select label="Batch preference" value={form.batchPreference} onChange={(e) => set("batchPreference", e.target.value)}>
            <option>Morning (6-11 AM)</option>
            <option>Evening (4-8 PM)</option>
            <option>Weekend only</option>
          </Select>
        </div>

        <div>
          <Input label="Referral code (optional)" value={form.referralCode} onChange={(e) => set("referralCode", e.target.value)} placeholder="e.g. SMABC123" />
          <p className="mt-1 flex items-center gap-1 text-xs text-ink-400">
            <Gift className="size-3.5" /> Your friend earns ₹500 credit when you join with their code
          </p>
        </div>

        <label className="flex items-start gap-2 text-xs text-ink-500">
          <input type="checkbox" required className="mt-0.5 accent-brand-500" />
          <span>
            I agree to the <span className="font-semibold text-brand-600">Terms & Conditions</span>,{" "}
            <span className="font-semibold text-brand-600">Liability Waiver</span> and{" "}
            <span className="font-semibold text-brand-600">Refund Policy</span>. This serves as my digital e-signature.
          </span>
        </label>

        <Button type="submit" loading={loading} className="w-full" size="lg">
          {!loading && <UserPlus className="size-4" />} Create Account — Free
        </Button>
        <p className="flex items-center justify-center gap-1 text-center text-xs text-ink-400">
          <ShieldCheck className="size-3.5" /> OTP-verified · secure documents · no spam
        </p>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-700">
          Login
        </Link>
      </p>
    </Card>
  );
}
