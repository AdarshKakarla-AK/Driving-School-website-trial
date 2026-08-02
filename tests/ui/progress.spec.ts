import { test, expect } from "@playwright/test";

test.describe("student skill-tracking dashboard", () => {
  test("progress tab shows the radar, progression chart and feedback", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Student", exact: true }).click();
    await page.waitForURL("**/portal/dashboard");

    await page.getByRole("button", { name: "Progress", exact: true }).click();
    await expect(page.getByText("Skill radar", { exact: true })).toBeVisible();
    await expect(page.getByText("Skill progression over time", { exact: true })).toBeVisible();
    await expect(page.getByText("License preparation checklist", { exact: true })).toBeVisible();
  });
});
