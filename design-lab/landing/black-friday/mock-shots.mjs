// Screenshots and measures card-mock.html in the three states at 1440x900, 1024x768 and 390x844.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { fileURLToPath } from 'node:url';
const here = fileURLToPath(new URL('./', import.meta.url));
const out = process.argv[2] || here;
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/usr/local/bin/chrome', args: ['--allow-file-access-from-files'] });
for (const [w, h] of [[1440, 900], [1024, 768], [390, 844]]) {
  for (const st of ['sale', 'teaser', 'ended']) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await page.goto(`file://${here}card-mock.html?bf=${st}#join`);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(200);
    await page.evaluate(() => document.getElementById('join').scrollIntoView());
    await page.waitForTimeout(100);
    const m = await page.evaluate(() => {
      const r = s => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return [Math.round(b.top), Math.round(b.bottom)]; };
      return { card: r('#join'), price: r('.price-row'), cta: r('#cta') || r('.opens'), how: r('.how'), cardH: Math.round(document.getElementById('join').getBoundingClientRect().height), bar: Math.round(document.querySelector('.bf-bar').getBoundingClientRect().height) };
    });
    console.log(`${w}x${h} ${st}`, JSON.stringify(m), m.cta[1] <= h ? 'button in view' : 'BUTTON BELOW FOLD');
    await page.screenshot({ path: `${out}/mock-${st}-${w}.png` });
    if (st === 'sale') { await page.evaluate(() => scrollTo(0, 0)); await page.screenshot({ path: `${out}/mock-bar-${w}.png`, clip: { x: 0, y: 0, width: w, height: 140 } }); }
    await ctx.close();
  }
}
await browser.close();
