"use client";

import { useState } from "react";
import { MapPin, Phone, Clock, Send, CheckCircle2, MessageCircle } from "lucide-react";
import { Button, Card, Input, Textarea, Eyebrow } from "@/components/ui";
import { api, type ApiData } from "@/lib/client";
import { waLink } from "@/lib/contact";
import { useI18n } from "@/lib/i18n";
import { MapEmbed } from "@/components/site/MapEmbed";

export function Contact({ settings }: { settings: ApiData }) {
  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { t } = useI18n();

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
    <section id="contact" className="border-t border-ink-100 bg-card py-20 scroll-mt-24 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <Eyebrow>{t("contact.eyebrow")}</Eyebrow>
            <h2 className="font-display mt-3 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
              {t("contact.title")}
            </h2>
            <p className="mt-3 max-w-md text-ink-500">
              {t("contact.subtitle")}
            </p>

            <div className="mt-8 space-y-4">
              {settings?.branches?.map((b: ApiData) => (
                <div key={b.id} className="card-shadow group flex items-start gap-4 rounded-2xl border border-ink-100 bg-paper p-4 transition-all hover:border-brand-300">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 transition group-hover:bg-brand-500 group-hover:text-white dark:text-brand-400">
                    <MapPin className="size-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-ink-900">{b.name}</p>
                    <p className="mt-0.5 text-sm text-ink-500">{b.address}</p>
                    <p className="mt-1 text-sm font-semibold text-brand-600 dark:text-brand-400">{b.phone}</p>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${b.address}, Bengaluru`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-trust-600 hover:underline dark:text-trust-400"
                    >
                      <MapPin className="size-3.5" /> {t("contact.getDirections")}
                    </a>
                  </div>
                </div>
              ))}
              <div className="flex flex-wrap gap-x-6 gap-y-2 pt-1 text-sm text-ink-500">
                <span className="inline-flex items-center gap-2">
                  <Phone className="size-4 text-brand-500" /> {settings?.phone}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Clock className="size-4 text-brand-500" /> {settings?.openingHours}
                </span>
                <a href={waLink("Hi! I'd like a callback about learning to drive.")} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 font-semibold text-go-600 hover:underline">
                  <MessageCircle className="size-4" /> {t("contact.whatsappUs")}
                </a>
              </div>
            </div>

            <div className="mt-8">
              <MapEmbed query="Sri Mathru Driving School, Banashankari, Bengaluru" />
            </div>
          </div>

          <Card className="p-6 sm:p-8">
            {sent ? (
              <div className="flex h-full flex-col items-center justify-center py-12 text-center">
                <div className="flex size-14 items-center justify-center rounded-full bg-go-500/15 text-go-600">
                  <CheckCircle2 className="size-8" />
                </div>
                <h3 className="font-display mt-4 text-xl font-bold text-ink-900">{t("contact.sentTitle")}</h3>
                <p className="mt-2 max-w-xs text-sm text-ink-500">{t("contact.sentBody")}</p>
                <Button variant="outline" className="mt-6" onClick={() => setSent(false)}>
                  {t("contact.sendAnother")}
                </Button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <h3 className="font-display text-lg font-bold text-ink-900">{t("contact.requestCallback")}</h3>
                <Input label={t("contact.fullName")} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t("contact.phName")} />
                <Input label={t("contact.mobile")} required type="tel" pattern="[0-9]{10}" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder={t("contact.phPhone")} />
                <Input label={t("contact.emailOpt")} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder={t("contact.phEmail")} />
                <Textarea label={t("contact.learnWhat")} rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder={t("contact.phMsg")} />
                <Button type="submit" loading={loading} className="w-full" size="lg">
                  {!loading && <Send className="size-4" />} {t("contact.requestCallbackBtn")}
                </Button>
                <p className="text-center text-xs text-ink-400">{t("contact.crmNote")}</p>
              </form>
            )}
          </Card>
        </div>
      </div>
    </section>
  );
}
