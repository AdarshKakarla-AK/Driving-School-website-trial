import { test, expect } from "@playwright/test";

test.describe("role-based portal access", () => {
  test("instructor password login lands on the instructor portal", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("9000000010 or rahul.sharma@gmail.com").fill("ravi@srimathru.in");
    await page.getByPlaceholder("••••••••").fill("demo123");
    await page.getByRole("button", { name: "Login" }).click();
    await page.waitForURL("**/portal/instructor");
    await expect(page.getByText("Instructor Portal", { exact: false }).first()).toBeVisible();
  });

  test("instructor is bounced away from the student dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Instructor", exact: true }).click();
    await page.waitForURL("**/portal/instructor");
    await page.goto("/portal/dashboard");
    await page.waitForURL("**/portal/instructor");
  });

  test("student is bounced away from the instructor portal", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Student", exact: true }).click();
    await page.waitForURL("**/portal/dashboard");
    await page.goto("/portal/instructor");
    await page.waitForURL("**/portal/dashboard");
  });

  test("admin demo button lands on the admin portal", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Admin", exact: true }).click();
    await page.waitForURL("**/portal/admin");
    await expect(page.getByText("Admin Console", { exact: false }).first()).toBeVisible();
  });
});
