const { chromium } = require("@playwright/test");

(async () => {
  const browser = await chromium.launch();
  const base = "http://localhost:3000";
  const report = {};

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 200)); });

  // Contact page: Maps iframe should load with NO CSP console errors
  await page.goto(base + "/contact", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  report["contactCSPErrors"] = errors.filter((e) => /Content-Security-Policy|frame-src|Refused to frame/i.test(e));
  report["allContactErrors"] = errors;

  // Home page: language toggle behaviour
  await page.goto(base + "/", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);

  const toggle = page.locator('[role="group"][aria-label="Select language"]');
  report["togglePresent"] = (await toggle.count()) >= 1;

  const navEn = (await page.locator("nav a").allTextContents()).map((s) => s.trim()).filter(Boolean);
  report["navEN"] = navEn.slice(0, 7);
  report["htmlLangEN"] = await page.evaluate(() => document.documentElement.lang);

  // Click Kannada
  await toggle.getByRole("button", { name: "ಕನ್ನಡ" }).click();
  await page.waitForTimeout(300);
  report["htmlLangKN"] = await page.evaluate(() => document.documentElement.lang);
  const navKn = (await page.locator("nav a").allTextContents()).map((s) => s.trim()).filter(Boolean);
  report["navKN"] = navKn.slice(0, 7);
  report["heroKN"] = (await page.locator("h1").first().innerText()).slice(0, 120);
  report["faqKN"] = await page.evaluate(() => document.body.innerText.includes("ಸಾಮಾನ್ಯ ಪ್ರಶ್ನೆಗಳು"));

  // Persistence: reload keeps locale
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  report["htmlLangAfterReload"] = await page.evaluate(() => document.documentElement.lang);

  // Switch to Hindi
  await toggle.getByRole("button", { name: "हिंदी" }).click();
  await page.waitForTimeout(300);
  const navHi = (await page.locator("nav a").allTextContents()).map((s) => s.trim()).filter(Boolean);
  report["navHI"] = navHi.slice(0, 7);
  report["heroHI"] = (await page.locator("h1").first().innerText()).slice(0, 120);

  // Reset to English
  await toggle.getByRole("button", { name: "EN" }).click();
  await page.waitForTimeout(200);

  // Mobile: toggle visible in navbar without overflow
  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
  await mobile.goto(base + "/", { waitUntil: "networkidle" });
  await mobile.waitForTimeout(800);
  const mToggle = mobile.locator('[role="group"][aria-label="Select language"]');
  report["mobileTogglePresent"] = (await mToggle.count()) >= 1;
  report["mobileHScroll"] = await mobile.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  await mToggle.getByRole("button", { name: "ಕನ್ನಡ" }).click();
  await mobile.waitForTimeout(200);
  report["mobileNavKN"] = (await mobile.locator("nav a").allTextContents()).map((s) => s.trim()).filter(Boolean).slice(0, 7);
  report["mobileHScrollAfterLang"] = await mobile.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);

  // Auth layout: toggle present
  await mobile.goto(base + "/login", { waitUntil: "networkidle" });
  await mobile.waitForTimeout(800);
  report["authTogglePresent"] = (await mobile.locator('[role="group"][aria-label="Select language"]').count()) >= 1;
  report["authHScroll"] = await mobile.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);

  console.log(JSON.stringify(report, null, 2));
  await browser.close();
})();
