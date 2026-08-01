"use client";

import * as React from "react";
import { MessageSquareText, Star } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { api, useToast, type ApiData } from "@/lib/client";
import { cn } from "@/lib/utils";

export function Reviews({ data, refresh }: { data: ApiData; refresh: () => void }) {
  const toast = useToast();
  const [rating, setRating] = React.useState(0);
  const [hover, setHover] = React.useState(0);
  const [comment, setComment] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) return;
    setBusy(true);
    try {
      const res = await api<{ channel: string }>("/api/reviews", { method: "POST", body: JSON.stringify({ rating, comment }) });
      if (res.channel === "google") {
        toast.push("Thanks! Please share on Google — here's the link 🎉");
        window.open("https://www.google.com/maps", "_blank");
      } else {
        toast.push("Thanks for the feedback — we'll make it right!", "info");
      }
      refresh();
    } catch (e: ApiData) {
      toast.push(e.message, "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-900">Rate your experience</h1>
        <p className="text-sm text-ink-500">Your feedback keeps our instructors sharp.</p>
      </div>

      {data.hasReviewed ? (
        <Card className="p-8 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-go-500/10 text-go-600">
            <Star className="size-7" fill="currentColor" />
          </div>
          <h3 className="font-display mt-4 font-bold text-ink-900">You&apos;ve already shared your review</h3>
          <p className="mx-auto mt-1 max-w-sm text-sm text-ink-500">Thanks for helping other students choose us. Refer a friend to earn ₹500 credit!</p>
        </Card>
      ) : (
        <Card className="max-w-xl p-6">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-medium text-ink-700">How many stars would you give us?</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button
                    type="button"
                    key={i}
                    onMouseEnter={() => setHover(i)}
                    onMouseLeave={() => setHover(0)}
                    onClick={() => setRating(i)}
                    className="transition-transform hover:scale-110"
                    aria-label={`${i} stars`}
                  >
                    <Star
                      className={cn("size-9", (hover || rating) >= i ? "text-brand-500" : "text-ink-200")}
                      fill={hover || rating >= i ? "currentColor" : "none"}
                    />
                  </button>
                ))}
              </div>
              {rating >= 5 && <p className="mt-2 text-xs font-medium text-go-600">5 stars! We&apos;d love a Google review 🎉</p>}
              {rating >= 1 && rating <= 3 && <p className="mt-2 text-xs font-medium text-brand-600">We&apos;re sorry — we&apos;ll reach out to fix this privately.</p>}
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder="Tell us about your experience..."
              className="w-full rounded-xl border border-ink-200 bg-card px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
            />
            <Button type="submit" disabled={!rating} loading={busy} size="lg" className="w-full">
              {!busy && <MessageSquareText className="size-4" />} Submit review
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
