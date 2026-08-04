const { chromium } = require("@playwright/test");

(async () => {
  const browser = await chromium.launch();
  const out = "C:\\Users\\allst\\AppData\\Local\\Temp\\opencode";

  let p = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await p.evaluate(() => localStorage.setItem("theme", "light"));
  await p.reload({ waitUntil: "networkidle" });
  await p.waitForTimeout(2500);
  await p.screenshot({ path: out + "\\home-light-full.png", fullPage: true });
  await p.screenshot({ path: out + "\\home-light-top.png" });
  await p.close();

  p = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await p.evaluate(() => localStorage.setItem("theme", "dark"));
  await p.reload({ waitUntil: "networkidle" });
  await p.waitForTimeout(2500);
  await p.screenshot({ path: out + "\\home-dark-top.png" });
  await p.close();

  p = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
  await p.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await p.waitForTimeout(2500);
  await p.screenshot({ path: out + "\\home-mobile-top.png" });
  await p.screenshot({ path: out + "\\home-mobile-full.png", fullPage: true });
  await p.close();

  p = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto("http://localhost:3000/courses", { waitUntil: "networkidle" });
  await p.waitForTimeout(2000);
  await p.screenshot({ path: out + "\\courses-top.png" });
  await p.close();

  p = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto("http://localhost:3000/about", { waitUntil: "networkidle" });
  await p.waitForTimeout(2000);
  await p.screenshot({ path: out + "\\about-top.png" });
  await p.close();

  await browser.close();
  console.log("done");
})();
