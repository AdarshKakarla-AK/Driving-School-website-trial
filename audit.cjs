const { chromium } = require("@playwright/test");

(async () => {
  const browser = await chromium.launch();
  const base = "http://localhost:3000";
  const routes = [
    "/", "/courses", "/instructors", "/about", "/contact",
    "/login", "/register", "/book?pkg=pkg_beginner", "/not-a-real-page",
  ];
  const report = {};

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  for (const r of routes) {
    const errors = [];
    const failed = [];
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 160)); });
    page.on("pageerror", (e) => errors.push("PAGEERROR: " + String(e).slice(0, 240)));
    page.on("requestfailed", (req) => { if (!req.url().includes("localhost:3000")) return; failed.push(req.url().slice(0, 120)); });

    const resp = await page.goto(base + r, { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);

    const data = await page.evaluate(() => {
      const doc = document.documentElement;
      return {
        status: "ok",
        hScroll: doc.scrollWidth > doc.clientWidth + 1,
        scrollW: doc.scrollWidth,
        clientW: doc.clientWidth,
        h1: document.querySelector("h1")?.textContent?.trim().slice(0, 60) ?? null,
        h2count: document.querySelectorAll("h2").length,
        imgs: [...document.querySelectorAll("img")].map((i) => ({ src: i.getAttribute("src")?.slice(0, 40), broken: i.complete && i.naturalWidth === 0 })),
        bg: getComputedStyle(document.body).backgroundColor,
      };
    });
    report[r] = { data, errors, failed, status: resp?.status() };
    page.removeAllListeners("console");
    page.removeAllListeners("pageerror");
    page.removeAllListeners("requestfailed");
  }

  // mobile overflow scan across the long pages
  const mob = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
  const mobileReport = {};
  for (const r of ["/", "/courses", "/about", "/contact", "/login", "/register", "/book?pkg=pkg_beginner"]) {
    await mob.goto(base + r, { waitUntil: "networkidle" });
    await mob.waitForTimeout(1000);
    mobileReport[r] = await mob.evaluate(() => {
      const doc = document.documentElement;
      const offenders = [];
      document.querySelectorAll("body *").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width > doc.clientWidth + 4 && el.tagName !== "HTML" && el.tagName !== "BODY") {
          offenders.push({ tag: el.tagName, cls: (el.className || "").toString().slice(0, 50), w: Math.round(r.width) });
        }
      });
      return { hScroll: doc.scrollWidth > doc.clientWidth + 1, scrollW: doc.scrollWidth, clientW: doc.clientWidth, offenders: offenders.slice(0, 6) };
    });
  }
  report["MOBILE"] = mobileReport;

  console.log(JSON.stringify(report, null, 2));
  await browser.close();
})();
