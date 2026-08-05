const { chromium } = require("@playwright/test");

(async () => {
  const browser = await chromium.launch();
  const base = "http://localhost:3000";
  const report = {};

  const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  desktop.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 160)); });
  desktop.on("pageerror", (e) => errors.push("PAGEERROR: " + String(e).slice(0, 200)));

  // API payload check
  const apiResp = await desktop.request.get(base + "/api/public/site");
  const api = await apiResp.json();
  report["api"] = {
    status: apiResp.status(),
    statsKeys: Object.keys(api.stats ?? {}),
    seats: api.seats,
    vehicles: api.vehicles?.length,
    instructors: api.instructors?.length,
  };

  // Homepage
  await desktop.goto(base + "/", { waitUntil: "networkidle" });
  await desktop.waitForTimeout(1500);
  report["home"] = await desktop.evaluate(() => {
    const doc = document.documentElement;
    const imgs = [...document.querySelectorAll("main img, section img")];
    const ld = [...document.querySelectorAll("script[type='application/ld+json']")].map((s) => s.textContent);
    const body = document.body.innerText;
    return {
      hScroll: doc.scrollWidth > doc.clientWidth + 1,
      heroImg: imgs.some((i) => i.getAttribute("src")?.includes("hero-car")),
      fleetImgs: imgs.filter((i) => /(car-road|hero-car|steering)/.test(i.getAttribute("src") || "")).length,
      brokenImgs: imgs.filter((i) => i.complete && i.naturalWidth === 0).length,
      seatsBadge: /slots? (left|remaining)/i.test(body) || /free slots/i.test(body),
      jsonLdCount: ld.length,
      jsonLdHasVehicle: ld.some((s) => s.includes('"Vehicle"')),
      jsonLdHasLocalBusiness: ld.some((s) => s.includes("LocalBusiness")),
      navLinks: [...document.querySelectorAll("nav a")].map((a) => a.textContent.trim()).filter(Boolean).slice(0, 12),
    };
  });

  // Courses page
  await desktop.goto(base + "/courses", { waitUntil: "networkidle" });
  await desktop.waitForTimeout(1000);
  report["courses"] = await desktop.evaluate(() => ({
    hScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    hasCompareTable: document.body.innerText.includes("Side-by-side comparison"),
    hasFleetBand: document.body.innerText.includes("exact cars you"),
    waLinks: [...document.querySelectorAll("a[href*='wa.me']")].length,
    waGood: [...document.querySelectorAll("a[href*='wa.me']")].every((a) => a.getAttribute("href").startsWith("https://wa.me/919000090000")),
  }));

  // Contact page
  await desktop.goto(base + "/contact", { waitUntil: "networkidle" });
  await desktop.waitForTimeout(1000);
  report["contact"] = await desktop.evaluate(() => ({
    hScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    hasMap: [...document.querySelectorAll("iframe")].some((f) => f.src.includes("google.com/maps")),
    hasGetDirections: document.body.innerText.includes("Get Directions"),
  }));

  // About page images
  await desktop.goto(base + "/about", { waitUntil: "networkidle" });
  await desktop.waitForTimeout(1000);
  report["about"] = await desktop.evaluate(() => {
    const imgs = [...document.querySelectorAll("img")];
    return { heroImg: imgs.some((i) => i.getAttribute("src")?.includes("team")), broken: imgs.filter((i) => i.complete && i.naturalWidth === 0).length };
  });

  report["desktopErrors"] = errors;

  // Mobile audit + chat open
  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
  const mErr = [];
  mobile.on("console", (m) => { if (m.type() === "error") mErr.push(m.text().slice(0, 120)); });
  const mobileReport = {};
  for (const r of ["/", "/courses", "/about", "/contact", "/book?pkg=pkg_beginner"]) {
    await mobile.goto(base + r, { waitUntil: "networkidle" });
    await mobile.waitForTimeout(900);
    mobileReport[r] = await mobile.evaluate(() => {
      const doc = document.documentElement;
      const sticky = !!document.querySelector("header") || !!document.querySelector("nav");
      return { hScroll: doc.scrollWidth > doc.clientWidth + 1, scrollW: doc.scrollWidth, clientW: doc.clientWidth };
    });
  }
  // chat widget open on homepage
  await mobile.goto(base + "/", { waitUntil: "networkidle" });
  await mobile.waitForTimeout(900);
  const chatBtn = mobile.locator('button[aria-label="Open AI assistant"]');
  if (await chatBtn.count()) {
    await chatBtn.click();
    await mobile.waitForTimeout(500);
    mobileReport["chat-open"] = await mobile.evaluate(() => {
      const doc = document.documentElement;
      const panel = [...document.querySelectorAll("div")].find((d) => d.className && typeof d.className === "string" && d.className.includes("h-[70vh]") || d.className?.includes && d.className.includes("max-h-[600px]"));
      return { hScroll: doc.scrollWidth > doc.clientWidth + 1, scrollW: doc.scrollWidth, clientW: doc.clientWidth };
    });
  } else {
    mobileReport["chat-open"] = "no chat button found";
  }
  mobileReport["errors"] = mErr;
  report["MOBILE"] = mobileReport;

  console.log(JSON.stringify(report, null, 2));
  await browser.close();
})();
