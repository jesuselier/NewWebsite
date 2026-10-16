// Screenshot a page at desktop and phone sizes.
// usage: node shot.mjs <url-or-file> <outPrefix> [waitMs] [--fold-only] [--reduce]
// --reduce emulates prefers-reduced-motion: reduce. Prints horizontal overflow and page errors.
// writes <outPrefix>-desktop-fold.png, -desktop-full.png, -phone-fold.png, -phone-full.png
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');

const args = process.argv.slice(2);
const foldOnly = args.includes('--fold-only');
const reduce = args.includes('--reduce');
const [url, out, wait = '2500'] = args.filter(a => !a.startsWith('--'));
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || '/usr/local/bin/chrome',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'],
});
const errors = [];
for (const [name, vp] of [['desktop', { width: 1440, height: 900 }], ['phone', { width: 390, height: 844 }]]) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1, colorScheme: 'dark', reducedMotion: reduce ? 'reduce' : 'no-preference' });
  const p = await ctx.newPage();
  p.on('pageerror', e => errors.push(`${name} pageerror: ${e.message}`));
  p.on('console', m => { if (m.type() === 'error') errors.push(`${name} console: ${m.text()}`); });
  try { await p.goto(url, { waitUntil: 'networkidle', timeout: 45000 }); }
  catch (e) { errors.push(`${name} goto: ${e.message}`); }
  await p.waitForTimeout(+wait);
  const ov = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, h: document.documentElement.scrollHeight }));
  console.log(`${name}: scrollWidth ${ov.sw} vs viewport ${ov.cw}${ov.sw > ov.cw ? '  <-- HORIZONTAL OVERFLOW' : ''}; page height ${ov.h}px`);
  await p.screenshot({ path: `${out}-${name}-fold.png` });
  if (!foldOnly) {
    const h = await p.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < Math.min(h, 30000); y += vp.height * 0.7) {
      await p.evaluate(y => window.scrollTo(0, y), y);
      await p.waitForTimeout(220);
    }
    await p.evaluate(() => window.scrollTo(0, 0));
    await p.waitForTimeout(700);
    try { await p.screenshot({ path: `${out}-${name}-full.png`, fullPage: true }); }
    catch (e) { errors.push(`${name} fullpage: ${e.message}`); }
  }
  await ctx.close();
}
await browser.close();
console.log(errors.length ? errors.slice(0, 15).join('\n') : 'no errors');
console.log('done', out);
