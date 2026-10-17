// Builds the static joinswarm.ai page in public/swarm-site/ from the design lab copy in
// design-lab/landing/a-core-glow/. next.config.ts serves it at / on joinswarm.ai.
// Usage: node scripts/build-swarm-site.mjs [--refetch]
// Fonts and Three.js are fetched once into public/swarm-site/{fonts,vendor} and kept between runs
// (pass --refetch to download them again), so the page loads nothing from third parties until a
// visitor presses play on the video.
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const src = `${root}design-lab/landing/a-core-glow/`;
const photos = `${root}design-lab/landing/assets/`;
const out = `${root}public/swarm-site/`;
const BASE = "/swarm-site";
const ORIGIN = "https://www.joinswarm.ai";
const THREE_URL = "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
const FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Unbounded:wght@600&family=Hanken+Grotesk:wght@400;600&family=JetBrains+Mono:wght@500&display=swap";
// Google serves woff2 only to browsers it recognises.
const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const PAGES = { "index.html": "/", "terms.html": "/terms", "privacy.html": "/privacy", "refunds.html": "/refunds" };
const refetch = process.argv.includes("--refetch");

function fail(message) {
  throw new Error(`build-swarm-site: ${message}`);
}

function replaceOnce(text, find, replacement, label) {
  if (!text.includes(find)) fail(`expected text not found (${label}); update this script to match the page.`);
  return text.replace(find, replacement);
}

async function download(url, file) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) fail(`${url} returned ${res.status}`);
  writeFileSync(file, Buffer.from(await res.arrayBuffer()));
}

async function fetchFonts() {
  const dir = `${out}fonts/`;
  if (!refetch && existsSync(`${out}fonts.css`) && existsSync(dir)) return;
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const res = await fetch(FONTS_URL, { headers: { "User-Agent": UA } });
  if (!res.ok) fail(`Google Fonts returned ${res.status}`);
  const css = await res.text();
  const files = new Map();
  const faces = [];
  for (const [, subset, body] of css.matchAll(/\/\* ([\w-]+) \*\/\s*@font-face \{([^}]+)\}/g)) {
    const family = body.match(/font-family: '([^']+)'/)[1];
    const weight = body.match(/font-weight: (\d+)/)[1];
    const url = body.match(/url\((https:[^)]+\.woff2)\)/)[1];
    const range = body.match(/unicode-range: ([^;]+);/)[1];
    // One variable file serves several weights; download it once.
    if (!files.has(url)) files.set(url, `${family.toLowerCase().replace(/ /g, "-")}-${subset}.woff2`);
    const display = family === "Unbounded" ? "block" : "swap";
    faces.push(
      `@font-face{font-family:'${family}';font-style:normal;font-weight:${weight};font-display:${display};` +
        `src:url(${BASE}/fonts/${files.get(url)}) format('woff2');unicode-range:${range}}`,
    );
  }
  if (!faces.length) fail("no @font-face rules in the Google Fonts response");
  for (const [url, name] of files) await download(url, `${dir}${name}`);
  writeFileSync(`${out}fonts.css`, `/* Unbounded, Hanken Grotesk and JetBrains Mono (SIL Open Font License), self-hosted. */\n${faces.join("\n")}\n`);
}

async function fetchThree() {
  const file = `${out}vendor/three.module.min.js`;
  if (!refetch && existsSync(file)) return;
  mkdirSync(`${out}vendor`, { recursive: true });
  await download(THREE_URL, file);
}

// Fonts the hero waits for, preloaded so the headline never shows a fallback face.
const PRELOADS = ["unbounded-latin.woff2", "hanken-grotesk-latin.woff2", "jetbrains-mono-latin.woff2"]
  .map((name) => `<link rel="preload" as="font" type="font/woff2" crossorigin href="${BASE}/fonts/${name}">`)
  .join("\n");

const ANALYTICS = `<!-- This standalone page bypasses the Next.js layout and needs its own tracker. -->
<script>
  window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
  window.va("beforeSend", function (event) {
    const url = new URL(event.url);
    url.hash = "";
    url.search = "";
    return { ...event, url: url.href };
  });
</script>
<script defer src="/swarm-analytics.js"></script>
<script defer src="${BASE}/swarm-site.js"></script>`;

function transformPage(name, html) {
  const path = PAGES[name];
  html = html.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>\n/, "");
  html = html.replace(/<link rel="preconnect" href="https:\/\/fonts\.g[^"]*"[^>]*>\n/g, "");
  const hadPreloads = /<link rel="preload" as="font"[^>]*fonts\.gstatic\.com[^>]*>/.test(html);
  html = html.replace(/<link rel="preload" as="font"[^>]*fonts\.gstatic\.com[^>]*>\n/g, "");
  let fontsLinked = false;
  html = html.replace(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^"]*">\n/g, () => {
    if (fontsLinked) return "";
    fontsLinked = true;
    return `${hadPreloads ? `${PRELOADS}\n` : ""}<link rel="stylesheet" href="${BASE}/fonts.css">\n`;
  });
  if (!fontsLinked) fail(`${name}: no Google Fonts stylesheet to replace`);
  html = html.replaceAll('href="../brand/swarm/swarm-tokens.css"', `href="${BASE}/swarm-tokens.css"`);
  html = html.replaceAll("../brand/", "/brand/");
  html = html.replaceAll("../assets/", `${BASE}/img/`);
  html = html.replace(/(href|src)="([\w-]+\.(?:css|js))"/g, `$1="${BASE}/$2"`);
  html = html.replace(/href="(index|terms|privacy|refunds)\.html(#[^"]*)?"/g, (_, page, hash = "") =>
    `href="${page === "index" ? "/" : `/${page}`}${hash}"`,
  );
  html = html.replaceAll(THREE_URL, `${BASE}/vendor/three.module.min.js`);
  if (!html.includes('rel="canonical"')) {
    html = replaceOnce(html, "</title>\n", `</title>\n<link rel="canonical" href="${ORIGIN}${path}">\n`, `${name} title`);
  }
  if (name === "index.html") {
    html = replaceOnce(html, "</head>", `<link rel="stylesheet" href="${BASE}/swarm-site.css">\n</head>`, "index head");
  }
  if (name === "privacy.html") html = fixPrivacy(html);
  return replaceOnce(html, "</body>", `${ANALYTICS}\n</body>`, `${name} body`);
}

// The lab copy loads fonts and Three.js from CDNs and links the video out to YouTube.
// Production self-hosts both and plays the video in a youtube-nocookie player after a click,
// so the policy says what the production page actually does.
function fixPrivacy(html) {
  html = html.replace(/ ?<span class="cf">\[CONFIRM: production embeds youtube-nocookie\]<\/span>/g, "");
  html = replaceOnce(
    html,
    "<p>The site loads its fonts from Google Fonts and a 3D graphics library from jsDelivr, so those services receive your IP address when the page loads.</p>",
    "<p>The site serves its fonts and its 3D graphics library from its own host, so no font or code service learns about your visit.</p>",
    "privacy fonts paragraph",
  );
  return replaceOnce(
    html,
    "<li><strong>Google</strong> for fonts, and YouTube for the intro video after you press play.</li>",
    "<li><strong>Google</strong> for YouTube, which plays the intro video after you press play.</li>",
    "privacy Google list item",
  );
}

function stripCssComments(css) {
  return `${css.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\n\s*\n+/g, "\n").trim()}\n`;
}

mkdirSync(out, { recursive: true });
// Everything except the downloaded fonts and Three.js is rebuilt from the lab copy on every run.
for (const entry of readdirSync(out)) {
  if (!["fonts", "fonts.css", "vendor"].includes(entry)) rmSync(`${out}${entry}`, { recursive: true, force: true });
}
await fetchFonts();
await fetchThree();

for (const name of Object.keys(PAGES)) {
  writeFileSync(`${out}${name}`, transformPage(name, readFileSync(`${src}${name}`, "utf8")));
}
for (const entry of readdirSync(src)) {
  if (/\.(css|js)$/.test(entry)) cpSync(`${src}${entry}`, `${out}${entry}`);
}
for (const entry of ["swarm-site.js", "swarm-site.css"]) cpSync(`${root}design-lab/landing/swarm-site/${entry}`, `${out}${entry}`);
writeFileSync(
  `${out}swarm-tokens.css`,
  stripCssComments(readFileSync(`${root}public/brand/swarm/swarm-tokens.css`, "utf8")),
);

mkdirSync(`${out}img`);
const used = new Set();
for (const name of Object.keys(PAGES)) {
  for (const [, file] of readFileSync(`${out}${name}`, "utf8").matchAll(/\/swarm-site\/img\/([\w.-]+)/g)) used.add(file);
}
for (const file of used) cpSync(`${photos}${file}`, `${out}img/${file}`);

// Checks: nothing points back at the lab, the old site or a CDN, and every local file exists.
const problems = [];
const blockers = [];
for (const entry of readdirSync(out, { recursive: true })) {
  if (!/\.(html|css|js)$/.test(entry) || entry.startsWith("vendor")) continue;
  const text = readFileSync(`${out}${entry}`, "utf8");
  if (/martinezaccess/i.test(text)) problems.push(`${entry}: mentions martinezaccess`);
  if (text.includes("../")) problems.push(`${entry}: still has a ../ path`);
  if (/fonts\.g(oogleapis|static)\.com|cdn\.jsdelivr\.net|unpkg\.com|cdnjs\.cloudflare\.com/.test(text)) {
    problems.push(`${entry}: still loads from a CDN`);
  }
  for (const [, ref] of text.matchAll(/(?:href|src)="(\/(?:swarm-site|brand)\/[^"#?]+)"/g)) {
    const file = `${root}public${decodeURIComponent(ref)}`;
    if (!existsSync(file)) problems.push(`${entry}: missing ${ref}`);
  }
  if (entry.endsWith(".html")) {
    for (const [chip] of text.matchAll(/\[(?:CONFIRM|DATA NEEDED)[^\]]*\]/gi)) blockers.push(`${entry}: ${chip}`);
  }
}
if (problems.length) fail(`\n  ${problems.join("\n  ")}`);
console.log(`Built ${out}`);
if (blockers.length) {
  console.log(`\nOpen items to resolve before launch (${blockers.length}):\n  ${blockers.join("\n  ")}`);
}
