"use client";

import * as React from "react";
import { Clock, Mail, MapPin, MessageCircle, Phone, Send } from "lucide-react";
import { Button, Card, Input, Textarea } from "@/components/ui";
import { PageHero } from "@/components/site/PageHero";
import { api, useToast, type ApiData } from "@/lib/client";

export default function ContactPage() {
  const toast = useToast();
  const [data, setData] = React.useState<ApiData>(null);
  const [form, setForm] = React.useState({ name: "", phone: "", email: "", message: "" });
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    api("/api/public/site").then(setData).catch(() => {});
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api<{ message: string }>("/api/public/site", { method: "POST", body: JSON.stringify({ ...form, source: "contact_page" }) });
      toast.push(res.message ?? "Thanks! We'll call you back.");
      setForm({ name: "", phone: "", email: "", message: "" });
    } catch (err: ApiData) {
      toast.push(err.message, "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHero
        eyebrow="Get in touch"
        title={<>We&apos;re here to help</>}
        subtitle="Questions about courses, timings or the license process? Drop a message — a real human replies within a few hours, or call us directly."
      />

      <div className="mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <Card className="p-6 sm:p-8">
            <h2 className="font-display text-xl font-bold text-ink-900">Send us a message</h2>
            <p className="mt-1 text-sm text-ink-500">We&apos;ll call you back within 24 hours. This also adds you to our CRM so we remember your preferences.</p>
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Your name" required placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <Input label="Phone" required placeholder="10-digit mobile" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <Input label="Email (optional)" type="email" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <Textarea label="Message" required rows={4} placeholder="I want to learn driving, preferably evening slots..." value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
              <Button type="submit" size="lg" loading={busy} className="w-full sm:w-auto">
                {!busy && <Send className="size-4" />} Send message
              </Button>
            </form>
          </Card>

          <div className="space-y-4">
            <Card className="p-6">
              <h3 className="font-display font-bold text-ink-900">Call us</h3>
              <div className="mt-3 space-y-2.5">
                <a href="tel:+919000000001" className="flex items-center gap-2 text-sm font-semibold text-go-600 hover:underline">
                  <Phone className="size-4" /> +91 90000 00001
                </a>
                <a href="https://wa.me/919000000001" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm font-semibold text-go-600 hover:underline">
                  <MessageCircle className="size-4" /> WhatsApp us
                </a>
                <a href="mailto:hello@srimathru.in" className="flex items-center gap-2 text-sm font-semibold text-go-600 hover:underline">
                  <Mail className="size-4" /> hello@srimathru.in
                </a>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-display font-bold text-ink-900">Branch hours</h3>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-ink-500">
                    <Clock className="size-4 text-brand-500" /> Mon – Sat
                  </span>
                  <span className="font-semibold text-ink-800 dark:text-ink-100">6:00 AM – 8:00 PM</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-ink-500">
                    <Clock className="size-4 text-brand-500" /> Sunday
                  </span>
                  <span className="font-semibold text-ink-800 dark:text-ink-100">7:00 AM – 1:00 PM</span>
                </div>
              </div>
            </Card>

            {data?.settings?.branches && (
              <Card className="p-6">
                <h3 className="font-display font-bold text-ink-900">Visit a branch</h3>
                <div className="mt-3 space-y-3">
                  {data.settings.branches.map((b: ApiData) => (
                    <div key={b.id} className="flex gap-2 text-sm">
                      <MapPin className="mt-0.5 size-4 shrink-0 text-brand-500" />
                      <span className="text-ink-600 dark:text-ink-300">
                        <span className="font-semibold text-ink-800 dark:text-ink-100">{b.name}:</span> {b.address}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
