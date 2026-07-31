import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getDB, mutate, uid, nowISO } from "@/lib/db/store";
import { notify } from "@/lib/notify";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await requireUser(["student"]);
  const { rating, comment } = await req.json();
  if (!rating || rating < 1 || rating > 5) return NextResponse.json({ error: "Rating must be between 1 and 5." }, { status: 400 });
  const db = getDB();
  const existing = db.reviews.find((r) => r.studentId === user.id);
  if (existing) return NextResponse.json({ error: "You already submitted a review." }, { status: 409 });

  const isPositive = rating >= 5;
  const isLow = rating <= 3;
  mutate((db) => {
    db.reviews.push({
      id: uid("rev"),
      studentId: user.id,
      rating,
      comment,
      private: isLow || rating === 4,
      channel: isPositive ? "google" : "app",
      createdAt: nowISO(),
    });
  });

  if (isLow) {
    mutate((db) => notify(db, user, "feedback_request", "Thanks for your honesty 🙏", "We'd love to make it right. Our team will call you to resolve any issues personally.", { channels: ["app"] }));
    return NextResponse.json({ ok: true, channel: "app" });
  }
  mutate((db) => notify(db, user, "review", "5 Stars! ⭐", "Please share your experience on Google — it helps small businesses like ours a lot!", { channels: ["app", "whatsapp"] }));
  return NextResponse.json({ ok: true, channel: "google" });
}
