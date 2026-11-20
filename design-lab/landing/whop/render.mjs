// node render.mjs [out.png] [layout-json] [layer]: renders banner.html at exactly 1920x1080, device scale 1, after the
// fonts and both SVGs have loaded. layer = mark | wm | tag renders that layer alone (for measuring).
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { fileURLToPath } from 'node:url';
const [out = 'swarm-whop-banner-1920x1080.png', layout = '{}', layer = ''] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/usr/local/bin/chrome' });
const p = await b.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
await p.addInitScript(`window.LAYOUT = ${layout};`);
await p.goto(new URL('banner.html', import.meta.url).href);
await p.evaluate(async (layer) => { if (layer) document.body.classList.add('only-' + layer); await document.fonts.ready; await Promise.all([...document.images].map(i => i.decode())); }, layer);
console.log(JSON.stringify(await p.evaluate(() => window.__layout)));
await p.locator('#stage').screenshot({ path: out });
await b.close();
