import type { ApiData } from "@/lib/client";

export function loadRazorpay(timeoutMs = 10000): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if ((window as ApiData).Razorpay) return resolve();
    const s = document.createElement("script");
    let timer = 0;
    const cleanup = () => {
      window.clearTimeout(timer);
      s.onload = null;
      s.onerror = null;
    };
    timer = window.setTimeout(() => {
      cleanup();
      reject(new Error("Razorpay checkout timed out. Check your network or browser console."));
    }, timeoutMs);
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => {
      cleanup();
      resolve();
    };
    s.onerror = () => {
      cleanup();
      reject(new Error("Razorpay checkout failed to load. A content policy may be blocking it."));
    };
    document.body.appendChild(s);
  });
}

export interface RazorpayCheckoutOptions {
  keyId: string;
  orderId: string;
  amountPaise: number;
  name: string;
  description?: string;
  contact?: string;
  email?: string;
  onSuccess: (razorpayPaymentId: string) => void;
  onDismiss: () => void;
}

export async function startRazorpayCheckout(opts: RazorpayCheckoutOptions): Promise<void> {
  await loadRazorpay();
  const Rz = (window as ApiData).Razorpay;
  if (!Rz) throw new Error("Razorpay checkout failed to load.");
  const rzp = new Rz({
    key: opts.keyId,
    amount: opts.amountPaise,
    currency: "INR",
    name: opts.name,
    description: opts.description,
    order_id: opts.orderId,
    prefill: opts.contact || opts.email ? { contact: opts.contact, email: opts.email } : undefined,
    handler: (res: ApiData) => opts.onSuccess(String(res.razorpay_payment_id ?? "")),
    modal: { ondismiss: opts.onDismiss },
  });
  rzp.open();
}
