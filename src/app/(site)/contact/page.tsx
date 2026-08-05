"use client";

import * as React from "react";
import { Clock, Mail, MapPin, MessageCircle, Phone, Send } from "lucide-react";
import { Button, Card, Input, Textarea } from "@/components/ui";
import { PageHero } from "@/components/site/PageHero";
import { MapEmbed } from "@/components/site/MapEmbed";
import { api, useToast, type ApiData } from "@/lib/client";
import { PHONE_TEL, waLink } from "@/lib/contact";
import { useI18n } from "@/lib/i18n";

export default function ContactPage() {
  const toast = useToast();
  const { t } = useI18n();
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
      toast.push(res.message ?? t("contactPage.callBackThanks"));
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
        eyebrow={t("contactPage.eyebrow")}
        title={<>{t("contactPage.title")}</>}
        subtitle={t("contactPage.subtitle")}
      />

      <div className="mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <Card className="p-6 sm:p-8">
            <h2 className="font-display text-xl font-bold text-ink-900">{t("contactPage.sendTitle")}</h2>
            <p className="mt-1 text-sm text-ink-500">{t("contactPage.sendSub")}</p>
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label={t("contactPage.yourName")} required placeholder={t("contactPage.phName")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <Input label={t("contactPage.phone")} required placeholder={t("contactPage.phPhone")} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <Input label={t("contactPage.emailOpt")} type="email" placeholder={t("contactPage.phEmail")} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <Textarea label={t("contactPage.message")} required rows={4} placeholder={t("contactPage.phMsg")} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
              <Button type="submit" size="lg" loading={busy} className="w-full sm:w-auto">
                {!busy && <Send className="size-4" />} {t("contactPage.sendMsg")}
              </Button>
            </form>
          </Card>

          <div className="space-y-4">
            <Card className="p-6">
              <h3 className="font-display font-bold text-ink-900">{t("contactPage.callUs")}</h3>
              <div className="mt-3 space-y-2.5">
                <a href={PHONE_TEL} className="flex items-center gap-2 text-sm font-semibold text-go-600 hover:underline">
                  <Phone className="size-4" /> +91 90000 90000
                </a>
                <a href={waLink()} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm font-semibold text-go-600 hover:underline">
                  <MessageCircle className="size-4" /> {t("contactPage.whatsappUs")}
                </a>
                <a href="mailto:hello@srimathru.in" className="flex items-center gap-2 text-sm font-semibold text-go-600 hover:underline">
                  <Mail className="size-4" /> hello@srimathru.in
                </a>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-display font-bold text-ink-900">{t("contactPage.branchHours")}</h3>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-ink-500">
                    <Clock className="size-4 text-brand-500" /> {t("contactPage.monSat")}
                  </span>
                  <span className="font-semibold text-ink-800 dark:text-ink-100">6:00 AM – 8:00 PM</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-ink-500">
                    <Clock className="size-4 text-brand-500" /> {t("contactPage.sunday")}
                  </span>
                  <span className="font-semibold text-ink-800 dark:text-ink-100">7:00 AM – 1:00 PM</span>
                </div>
              </div>
            </Card>

            {data?.settings?.branches && (
              <Card className="p-6">
                <h3 className="font-display font-bold text-ink-900">{t("contactPage.visit")}</h3>
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

        <div className="mt-8">
          <MapEmbed query="Sri Mathru Driving School, Banashankari, Bengaluru" />
        </div>
      </div>
    </>
  );
}
