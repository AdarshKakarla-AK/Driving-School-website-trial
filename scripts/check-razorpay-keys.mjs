import fs from "node:fs";
import path from "node:path";
import https from "node:https";

// Loads RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET from the environment or .env and
// verifies them against the Razorpay API. Never prints the secret. Exit codes:
//   0  keys valid (or absent -> demo mode, nothing to verify)
//   1  credentials present but rejected by Razorpay (401)
//   2  other failure (network, parsing, etc.)

function loadEnvFile() {
  const file = path.join(process.cwd(), ".env");
  if (!fs.existsSync(file)) return {};
  const out = {};
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !out[m[1]]) out[m[1]] = m[2].replace(/^"|"$/g, "");
  }
  return out;
}

const fileEnv = loadEnvFile();
const keyId = process.env.RAZORPAY_KEY_ID ?? fileEnv.RAZORPAY_KEY_ID ?? "";
const keySecret = process.env.RAZORPAY_KEY_SECRET ?? fileEnv.RAZORPAY_KEY_SECRET ?? "";

if (!keyId || !keySecret) {
  console.log("Razorpay keys are not configured — the app runs in demo mode. Nothing to verify.");
  process.exit(0);
}

const mode = keyId.startsWith("rzp_live_") ? "LIVE" : keyId.startsWith("rzp_test_") ? "TEST" : "UNKNOWN";
console.log(`Verifying ${mode} Razorpay credentials (key id ends ...${keyId.slice(-4)}):`);

try {
  const auth = "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const req = https.request(
    {
      host: "api.razorpay.com",
      path: "/v1/orders?count=1",
      method: "GET",
      headers: { authorization: auth },
      timeout: 15000,
    },
    (res) => {
      let raw = "";
      res.setEncoding("utf8");
      res.on("data", (c) => (raw += c));
      res.on("end", () => {
        if (res.statusCode && res.statusCode < 400) {
          console.log("OK — credentials accepted by the Razorpay API.");
          process.exit(0);
        }
        const body = JSON.parse(raw || "{}");
        const desc = body?.error?.description ?? `HTTP ${res.statusCode}`;
        console.error(`INVALID — Razorpay rejected the credentials: ${desc}`);
        console.error("Check RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET in .env against the Razorpay dashboard.");
        process.exit(1);
      });
    },
  );
  req.on("timeout", () => req.destroy(new Error("request timed out")));
  req.on("error", (e) => {
    console.error(`ERROR — could not reach the Razorpay API: ${e.message}`);
    process.exit(2);
  });
  req.end();
} catch (e) {
  console.error(`ERROR — could not reach the Razorpay API: ${e.message}`);
  process.exit(2);
}
