const path = require("path");
const { chromium } = require("playwright");

const root = path.resolve(__dirname, "..");
const source = `file:///${path.join(root, "assets", "resume-print.html").replace(/\\/g, "/")}`;
const output = path.join(root, "assets", "resume.pdf");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 794, height: 1123 } });

  await page.goto(source, { waitUntil: "networkidle" });
  await page.emulateMedia({ media: "print" });
  await page.pdf({
    path: output,
    printBackground: true,
    preferCSSPageSize: true,
    margin: { top: "0", right: "0", bottom: "0", left: "0" },
  });

  await browser.close();
})();
