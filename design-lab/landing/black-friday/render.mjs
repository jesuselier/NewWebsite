// Renders the Black Friday share image and the pricing card mock in Chrome (no image model, kit fonts only).
// Usage: node design-lab/landing/black-friday/render.mjs
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { fileURLToPath } from 'node:url';
const here = fileURLToPath(new URL('./', import.meta.url));
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/usr/local/bin/chrome', args: ['--allow-file-access-from-files'] });
const ctx = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.goto(`file://${here}share-og.html`);
await page.evaluate(() => document.fonts.ready);
const fonts = await page.evaluate(async () => [
  await document.fonts.load('600 36px Unbounded'), await document.fonts.load('500 20px "JetBrains Mono"')
].map(f => f.length));
if (fonts.some(n => !n)) throw new Error('kit fonts did not load');
await page.waitForTimeout(300);
await page.locator('#card').screenshot({ path: `${here}swarm-og-black-friday-1200x630.png` });
await browser.close();
console.log('rendered swarm-og-black-friday-1200x630.png');
