// Record a page's motion to MP4 (H.264) for review on a phone.
// Uses Chrome's screencast frames (CDP) and the system ffmpeg, so no Playwright ffmpeg download is needed.
// usage: node rec.mjs <url> <out.mp4> [seconds=10] [desktop|phone] [scroll=0|1]
// With scroll=1 the page holds on the hero for 40% of the time, then scrolls smoothly to the end.
import { createRequire } from 'module';
import { execFileSync } from 'child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');

const [url, out, secs = '10', kind = 'desktop', scroll = '0'] = process.argv.slice(2);
const vp = kind === 'phone' ? { width: 390, height: 844 } : { width: 1440, height: 900 };
const dir = mkdtempSync('/tmp/claude-0/rec-');
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || '/usr/local/bin/chrome',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'],
});
const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: kind === 'phone' ? 2 : 1, colorScheme: 'dark' });
const p = await ctx.newPage();
const errors = [];
p.on('pageerror', e => errors.push(e.message));
await p.goto(url, { waitUntil: 'load', timeout: 45000 }).catch(e => errors.push(e.message));

const cdp = await ctx.newCDPSession(p);
const frames = [];
cdp.on('Page.screencastFrame', async f => {
  const i = frames.length;
  const file = join(dir, `f${String(i).padStart(5, '0')}.jpg`);
  writeFileSync(file, Buffer.from(f.data, 'base64'));
  frames.push({ file, t: f.metadata.timestamp });
  await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {});
});
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 85, maxWidth: vp.width * (kind === 'phone' ? 2 : 1), maxHeight: vp.height * (kind === 'phone' ? 2 : 1), everyNthFrame: 1 });

const total = +secs * 1000;
if (scroll === '1') {
  await p.waitForTimeout(total * 0.4);
  const h = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  const steps = 60, dt = (total * 0.6) / steps;
  for (let i = 1; i <= steps; i++) {
    await p.evaluate(y => window.scrollTo(0, y), Math.round((h * i) / steps));
    await p.waitForTimeout(dt);
  }
} else {
  await p.waitForTimeout(total);
}
await cdp.send('Page.stopScreencast').catch(() => {});
await browser.close();

if (frames.length < 2) { console.log('not enough frames captured:', frames.length); process.exit(1); }
// concat list with real frame durations (screencast only emits frames when something changes)
let list = '';
for (let i = 0; i < frames.length; i++) {
  const d = i < frames.length - 1 ? Math.max(0.001, frames[i + 1].t - frames[i].t) : 0.1;
  list += `file '${frames[i].file}'\nduration ${d.toFixed(4)}\n`;
}
list += `file '${frames[frames.length - 1].file}'\n`;
writeFileSync(join(dir, 'list.txt'), list);
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', join(dir, 'list.txt'),
  '-vf', 'fps=30,scale=trunc(iw/2)*2:trunc(ih/2)*2', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '23', '-preset', 'veryfast', '-movflags', '+faststart', out]);
rmSync(dir, { recursive: true, force: true });
console.log(`${frames.length} frames captured`);
console.log(errors.length ? 'page errors:\n' + errors.slice(0, 10).join('\n') : 'no page errors');
console.log('wrote', out);
