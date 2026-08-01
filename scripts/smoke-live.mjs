import fs from "node:fs";
import path from "node:path";
import { createHmac } from "node:crypto";

// Live Razorpay smoke test. Verifies the full payment path against the REAL
// Razorpay API: direct order creation, app order route, signed webhook,
// booking confirmation, and PDF invoice download.
//
// Usage:
//   1. Build + start the app in live mode (RAZORPAY_* keys set in .env):
//        npm run build && node .next/standalone/server.js
//      or point it at a running instance via SMOKE_BASE.
//   2. Use a scratch database so real data is never touched:
//        set DATABASE_PATH=... (the running server must use the same value)
//   3. Run:
//        npm run smoke:live
//      Optional: SMOKE_BASE=http://host:port (default http://localhost:3130)
//
// Exit code 0 = all checks pass, 1 = one or more failures.
// Never prints the Razorpay key secret.

const BASE = process.env.SMOKE_BASE ?? "http://localhost:3130";
const STUDENT_IDENTIFIER = process.env.SMOKE_STUDENT ?? "rahul.sharma@gmail.com";
const STUDENT_PASSWORD = process.env.SMOKE_STUDENT_PASSWORD ?? "demo123";

function loadEnv() {
  const out = {};
  const file = path.join(process.cwd(), ".env");
  if (!fs.existsSync(file)) return out;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2].replace(/^"|"$/g, "");
  }
  return out;
}

const env = loadEnv();
const KEY_ID = process.env.RAZORPAY_KEY_ID ?? env.RAZORPAY_KEY_ID ?? "";
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET ?? env.RAZORPAY_KEY_SECRET ?? "";
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET ?? env.RAZORPAY_WEBHOOK_SECRET ?? "";

const pass = [];
const fail = [];
const check = (name, ok, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
  (ok ? pass : fail).push(name);
};

async function jget(url, headers = {}) {
  const res = await fetch(url, { headers });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body, setCookie: res.headers.get("set-cookie") };
}

async function jpost(url, body, headers = {}) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
  const b = await res.json().catch(() => ({}));
  return { status: res.status, body: b, setCookie: res.headers.get("set-cookie") };
}

// 1. key sanity (print prefix only, never the secret)
check("keys present", Boolean(KEY_ID && KEY_SECRET && WEBHOOK_SECRET), `keyId=${KEY_ID.slice(0, 9)}...`);
check("webhook secret len", WEBHOOK_SECRET.length >= 32, `${WEBHOOK_SECRET.length} chars`);

// 2. direct Razorpay order creation (live/test API)
try {
  const auth = "Basic " + Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString("base64");
  const order = await jpost(
    "https://api.razorpay.com/v1/orders",
    { amount: 100, currency: "INR", receipt: `smoke-${Date.now()}` },
    { authorization: auth },
  );
  check("direct Razorpay order create", order.status === 200 && Boolean(order.body.id), `id=${order.body.id}`);
  check("direct order is not accepted", order.status === 200 && order.body.amount === 100 && order.body.status === "created", `status=${order.body.status}`);
} catch (e) {
  check("direct Razorpay order create", false, e.message);
}

// 3. health reports live mode
const health = await jget(`${BASE}/api/health`);
check("health mode=live", health.status === 200 && health.body.mode === "live", `mode=${health.body.mode}`);

// 4. login as student and pay via the app (live order + webhook)
const login = await jpost(`${BASE}/api/auth/login`, { identifier: STUDENT_IDENTIFIER, password: STUDENT_PASSWORD });
check("student login", login.status === 200, `status=${login.status}`);
const cookie = login.setCookie?.split(";")[0] ?? "";

const bookings = await jget(`${BASE}/api/bookings`, { cookie });
const target = bookings.body.bookings?.find((b) => ["confirmed", "pending_payment"].includes(b.status) && b.amount > 0);
check("found payable booking", Boolean(target), target ? `${target.id} ₹${target.amount}` : "");

const order = await jpost(
  `${BASE}/api/payments/order`,
  { bookingId: target.id, amount: target.amount, method: "upi" },
  { cookie },
);
const payment = order.body.payment;
check("app order route 200 (live)", order.status === 200, `status=${order.status}`);
check("app created live razorpay order", Boolean(order.body.razorpayOrderId), `razorpayOrderId=${order.body.razorpayOrderId}`);

// 5. signed webhook with the real secret -> should mark payment paid + confirm booking
const raw = JSON.stringify({
  event: "payment.captured",
  payload: { payment: { entity: { id: "pay_smoke_live", order_id: order.body.razorpayOrderId, status: "captured" } } },
});
const sig = createHmac("sha256", WEBHOOK_SECRET).update(raw).digest("hex");
const wh = await fetch(`${BASE}/api/payments/webhook`, {
  method: "POST",
  headers: { "content-type": "application/json", "x-razorpay-signature": sig },
  body: raw,
});
const whJson = await wh.json().catch(() => ({}));
check("webhook accepted + applied", wh.status === 200 && whJson.applied === true, `status=${wh.status} applied=${whJson.applied}`);

// 6. invoice exists and downloads as PDF
const after = await jget(`${BASE}/api/bookings`, { cookie });
const updated = after.body.bookings?.find((b) => b.id === target.id);
check("booking confirmed", updated?.status === "confirmed", `status=${updated?.status}`);

const inv = await jget(`${BASE}/api/dashboard`, { cookie });
const invoice = inv.body.invoices?.find((i) => i.paymentId === payment?.id);
check("invoice generated", Boolean(invoice), invoice ? invoice.number : "");

if (invoice) {
  const pdfRes = await fetch(`${BASE}/api/portal/invoices/${invoice.number}/download`, { headers: { cookie } });
  const buf = Buffer.from(await pdfRes.arrayBuffer());
  check("invoice PDF download", pdfRes.status === 200 && buf.subarray(0, 5).toString("latin1") === "%PDF-", `status=${pdfRes.status} bytes=${buf.length}`);
} else {
  check("invoice PDF download", false, "no invoice");
}

console.log(`\n${pass.length} passed, ${fail.length} failed`);
process.exit(fail.length ? 1 : 0);
