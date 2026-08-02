import { test, expect } from "@playwright/test";

test.describe("instructor schedule and earnings", () => {
  test("schedule tab shows a calendar and earnings tab shows the payout breakdown", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("9000000010 or rahul.sharma@gmail.com").fill("ravi@srimathru.in");
    await page.getByPlaceholder("••••••••").fill("demo123");
    await page.getByRole("button", { name: "Login" }).click();
    await page.waitForURL("**/portal/instructor");

    await page.getByRole("button", { name: "Schedule", exact: true }).click();
    await expect(page.getByText(/lessons?/i).first()).toBeVisible();

    await page.getByRole("button", { name: "Earnings", exact: true }).click();
    await expect(page.getByText("Payroll history", { exact: true })).toBeVisible();
    await expect(page.getByText("Earnings trend", { exact: false })).toBeVisible();
    await expect(page.getByText("Total earnings", { exact: true })).toBeVisible();
  });
});
