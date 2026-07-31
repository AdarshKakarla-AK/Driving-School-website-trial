"use client";

import { useState } from "react";
import { MapPin, Phone, Clock, Send, CheckCircle2 } from "lucide-react";
import { Button, Card, Input, Textarea } from "@/components/ui";
import { api, type ApiData } from "@/lib/client";

export function Contact({ settings }: { settings: ApiData }) {
  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api("/api/public/site", { method: "POST", body: JSON.stringify(form) });
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600">Contact Us</span>
            <h2 className="font-display mt-3 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">Book your free demo session today</h2>
            <p className="mt-3 max-w-md text-ink-500">Leave your number and our team will call you within 24 hours. Prefer instant? WhatsApp us or chat with the AI assistant.</p>

            <div className="mt-8 space-y-4">
              {settings?.branches?.map((b: ApiData) => (
                <div key={b.id} className="card-shadow flex items-start gap-4 rounded-2xl border border-ink-100 bg-paper p-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <MapPin className="size-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-ink-900">{b.name}</p>
                    <p className="mt-0.5 text-sm text-ink-500">{b.address}</p>
                    <p className="mt-1 text-sm font-medium text-brand-600">{b.phone}</p>
                  </div>
                </div>
              ))}
              <div className="flex gap-4">
                <div className="flex items-center gap-2 text-sm text-ink-500">
                  <Phone className="size-4 text-brand-500" /> {settings?.phone}
                </div>
                <div className="flex items-center gap-2 text-sm text-ink-500">
                  <Clock className="size-4 text-brand-500" /> {settings?.openingHours}
                </div>
              </div>
            </div>
          </div>

          <Card className="p-6 sm:p-8">
            {sent ? (
              <div className="flex h-full flex-col items-center justify-center py-12 text-center">
                <CheckCircle2 className="size-14 text-go-500" />
                <h3 className="font-display mt-4 text-xl font-bold text-ink-900">Request received!</h3>
                <p className="mt-2 max-w-xs text-sm text-ink-500">We&apos;ve logged your enquiry and our team will call you within 24 hours. Meanwhile, explore our courses.</p>
                <Button variant="outline" className="mt-6" onClick={() => setSent(false)}>
                  Send another request
                </Button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <h3 className="font-display text-lg font-bold text-ink-900">Request a callback</h3>
                <Input label="Full name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Rahul Sharma" />
                <Input label="Mobile number" required type="tel" pattern="[0-9]{10}" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="10-digit mobile number" />
                <Input label="Email (optional)" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
                <Textarea label="What would you like to learn?" rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="I'm a beginner and want automatic car training..." />
                <Button type="submit" loading={loading} className="w-full" size="lg">
                  {!loading && <Send className="size-4" />} Request Callback
                </Button>
                <p className="text-center text-xs text-ink-400">Your enquiry enters our CRM instantly — we never miss a lead.</p>
              </form>
            )}
          </Card>
        </div>
      </div>
    </section>
  );
}
