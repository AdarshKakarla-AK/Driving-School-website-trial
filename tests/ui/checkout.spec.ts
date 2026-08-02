import { test, expect } from "@playwright/test";

test("Razorpay checkout modal opens from the booking page", async ({ page }) => {
  const health = await (await page.request.get("/api/health")).json();
  test.skip(health.mode !== "live", "Razorpay checkout only appears in live/test mode");

  const cspErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") cspErrors.push(msg.text());
  });
  page.on("pageerror", (err) => cspErrors.push(err.message));

  await page.goto("/login");
  await page.getByRole("button", { name: "Student", exact: true }).click();
  await page.waitForURL("**/portal/dashboard");

  await page.goto("/book");
  await page.locator('button:has-text("sessions")').first().click();

  const dateButtons = page.locator("button", { hasText: /MON|TUE|WED|THU|FRI|SAT|SUN/i });
  const count = await dateButtons.count();
  expect(count).toBeGreaterThan(0);

  const timeSlots = () =>
    page.locator('button:not([disabled]):has-text("AM"), button:not([disabled]):has-text("PM")');

  let picked = false;
  for (let i = count - 1; i >= 0; i--) {
    await dateButtons.nth(i).click();
    if ((await timeSlots().count()) > 0) {
      picked = true;
      break;
    }
  }
  expect(picked).toBeTruthy();
  await timeSlots().first().click();
  await page.getByRole("button", { name: /continue to payment/i }).click();
  await page.getByRole("button", { name: /pay .* securely/i }).click();

  const frame = page.frameLocator("iframe.razorpay-checkout-frame").first();
  await expect(frame.locator("body")).toBeVisible({ timeout: 20000 });

  const blocked = cspErrors.filter(
    (m) => /refused to load/i.test(m) || /content security policy/i.test(m) || /razorpay/i.test(m)
  );
  expect(blocked).toEqual([]);

  await page.keyboard.press("Escape");
});
