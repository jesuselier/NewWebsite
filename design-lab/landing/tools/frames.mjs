// node frames.mjs <pageUrl> <desktop|phone> <out.mp4> [endMs=5200] [fps=30]: deterministic hero render via ?t=0 and window.__heroSeek(ms)
import { createRequire } from 'module';
import { execFileSync } from 'child_process';
import { mkdtempSync, rmSync } from 'fs';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const [url, kind, out, end = '5200', fps = '30'] = process.argv.slice(2);
const vp = kind === 'phone' ? { width: 390, height: 844 } : { width: 1440, height: 900 };
const dir = mkdtempSync('/tmp/claude-0/frames-');
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/usr/local/bin/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: kind === 'phone' ? 2 : 1, colorScheme: 'dark' });
const p = await ctx.newPage();
await p.goto(url + (url.includes('?') ? '&' : '?') + 't=0', { waitUntil: 'networkidle' });
await p.waitForTimeout(800);
const n = Math.round(+end / 1000 * +fps);
for (let i = 0; i <= n; i++) {
  await p.evaluate(t => window.__heroSeek(t), i * 1000 / +fps);
  await p.screenshot({ path: `${dir}/f${String(i).padStart(4, '0')}.png`, type: 'png' });
}
await browser.close();
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', fps, '-i', `${dir}/f%04d.png`, '-vf', `tpad=stop_mode=clone:stop_duration=1.5,scale=trunc(iw/2)*2:trunc(ih/2)*2`, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '22', '-preset', 'veryfast', '-movflags', '+faststart', out]);
rmSync(dir, { recursive: true, force: true });
console.log('wrote', out, n + 1, 'frames');
