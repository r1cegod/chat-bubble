import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

const input = process.argv[2];
const output = resolve(process.argv[3] ?? "tests/screenshots/page.png");
const browserLibraryPath = resolve(".browser-libs/root/usr/lib/x86_64-linux-gnu");

if (!input) {
  console.error("Usage: node tools/render-page.mjs <url> [output.png]");
  process.exit(1);
}

const url = /^[a-z]+:\/\//i.test(input)
  ? input
  : pathToFileURL(resolve(input)).href;

await mkdir(dirname(output), { recursive: true });

const browser = await chromium.launch({
  headless: true,
  env: {
    ...process.env,
    LD_LIBRARY_PATH: [
      browserLibraryPath,
      process.env.LD_LIBRARY_PATH,
    ].filter(Boolean).join(":"),
  },
});
const page = await browser.newPage({
  viewport: { width: 1600, height: 900 },
  deviceScaleFactor: 1,
});

await page.goto(url, { waitUntil: "networkidle" });
await page.screenshot({ path: output, fullPage: true });
await browser.close();

console.log(output);
