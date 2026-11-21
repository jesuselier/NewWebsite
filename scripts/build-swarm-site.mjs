// Builds the static joinswarm.ai page in public/swarm-site/ from the design lab copy in
// design-lab/landing/a-core-glow/. next.config.ts serves it at / on joinswarm.ai.
// Usage: node scripts/build-swarm-site.mjs [--refetch]
// Fonts and Three.js are fetched once into public/swarm-site/{fonts,vendor} and kept between runs
// (pass --refetch to download them again), so the page loads nothing from third parties until a
// visitor presses play on the video.
import { createHash } from "node:crypto";
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
// Served with a 404 status by app/(swarm)/swarm/page-not-found/route.ts for unknown joinswarm.ai paths:
// built like the legal pages, but with no canonical and never in the sitemap.
const NOT_FOUND = "404.html";
// Sitemap dates for app/(swarm)/swarm/sitemap.xml/route.ts, kept true by this script (see writeSitemapDates).
const SITEMAP_DATES = `${root}lib/swarm-pages.json`;
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

// The Whop Pixel (Jesus, November 20, 2026), pasted exactly as Whop's dashboard gives it for account biz_qENtbnvHPGkjkS.
// Whop's guide (docs.whop.com/developer/ads/pixel) puts it inside the <head> of every page, so every built page gets
// it, the 404 page included. It goes on the production build only: the lab copy is a design preview and must not
// send page views to Whop. Don't reformat it; the check at the end of this script compares it character for character.
const WHOP_PIXEL = "<script>!function(w,d,s,u,n,a,b){if(w[n])return;a=w[n]={q:[],t:+new Date,s:[],o:u,track:function(){a.q.push([+new Date].concat([].slice.call(arguments)))},setScope:function(){a.s=[].slice.call(arguments).filter(function(x){return typeof x===\"string\"});a.q.push([+new Date,\"setScope\"].concat(a.s))},scope:function(){var c=[].slice.call(arguments);return{track:function(){a.q.push([+new Date].concat([].slice.call(arguments)).concat([{__scope:c}]))}}}};b=d.createElement(s);b.async=1;b.src=u+\"/s.js\";d.getElementsByTagName(s)[0].parentNode.insertBefore(b,d.getElementsByTagName(s)[0])}(window,document,\"script\",\"https://t.whop.tw\",\"whop\");whop.setScope(\"biz_qENtbnvHPGkjkS\");whop.track(\"page\");</script>";

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
  if (name !== NOT_FOUND && !html.includes('rel="canonical"')) {
    html = replaceOnce(html, "</title>\n", `</title>\n<link rel="canonical" href="${ORIGIN}${path}">\n`, `${name} title`);
  }
  if (name === "index.html") {
    html = replaceOnce(html, "</head>", `<link rel="stylesheet" href="${BASE}/swarm-site.css">\n${structuredData(html)}\n</head>`, "index head");
    html = inlineHeroMark(html);
  }
  if (name === "privacy.html") html = fixPrivacy(html);
  // The [CONFIRM ...] and [Data needed ...] notes and the legal pages' draft badge are for Jesus; they stay in the lab copy and never show on the live
  // site (Jesus, October 17). The build still lists them below, read from the lab copy.
  // A note may only follow wording that is complete without it, never stand in for a missing value: once stripped,
  // "no more than [CONFIRM: usage limit] of Swarm" went live as "no more than of Swarm".
  for (const [, before] of html.matchAll(/\b(\w+)\s*<span class="(?:cf|dn)">\[(?:CONFIRM|DATA NEEDED)/gi)) {
    if (/^(?:than|of|within|the|a|an|to|by|for|is|are|at|about|under|over|least|most|up|and|or)$/i.test(before)) {
      fail(`${name}: a [CONFIRM] or [Data needed] note stands in for a missing value after "${before}"`);
    }
  }
  html = html.replace(/ ?<span class="(?:cf|dn)">\[(?:CONFIRM|DATA NEEDED)[^\]]*\]<\/span>/gi, "");
  html = html.replace(/\s*<span class="lg-draft">[^<]*<\/span>/g, "");
  html = replaceOnce(html, "</head>", `${WHOP_PIXEL}\n</head>`, `${name} head (Whop Pixel)`);
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
  html = replaceOnce(html, "\n        <li><strong>jsDelivr</strong> for a code library the website loads.</li>", "", "privacy jsDelivr list item");
  return replaceOnce(
    html,
    "<li><strong>Google</strong> for fonts, and YouTube for the intro video after you press play.</li>",
    "<li><strong>Google</strong> for YouTube, which plays the intro video after you press play.</li>",
    "privacy Google list item",
  );
}

// JSON-LD for search engines, home page only, from design-lab/landing/swarm-site/structured-data.json.
// JSON.parse fails the build on a broken edit; the WebPage node must repeat the page's own title and description.
function structuredData(html) {
  const data = JSON.parse(readFileSync(`${root}design-lab/landing/swarm-site/structured-data.json`, "utf8"));
  const text = (s) => s.replaceAll("&quot;", '"').replaceAll("&#39;", "'").replaceAll("&amp;", "&");
  const title = text(html.match(/<title>([^<]*)<\/title>/)[1]);
  const description = text(html.match(/<meta name="description" content="([^"]*)">/)[1]);
  const page = data["@graph"].find((node) => node["@type"] === "WebPage");
  if (!page || page.name !== title || page.description !== description) {
    fail("structured-data.json: the WebPage name and description must match index.html's <title> and meta description");
  }
  // Real data only: no ratings, reviews or product listings (none exist).
  if (/"@type":"(?:AggregateRating|Review|Product)"/.test(JSON.stringify(data))) fail("structured-data.json: rating, review or product markup");
  return `<script type="application/ld+json">${JSON.stringify(data).replaceAll("<", "\\u003c")}</script>`;
}

// The hero mark fades in at the hero's ignition, about 2 s after first paint. As an <img> it was the page's Largest
// Contentful Paint, so LCP measured the animation instead of the headline. The same file inlined as <svg> is never an
// LCP candidate. Same bytes, same id, same CSS and hero.js animation: nothing on screen changes.
function inlineHeroMark(html) {
  const svg = readFileSync(`${root}public/brand/swarm/logo/swarm-mark.svg`, "utf8").trim();
  const open = svg.match(/^<svg[^>]*>/);
  const viewBox = open && open[0].match(/viewBox="([^"]+)"/);
  if (!viewBox || !svg.endsWith("</svg>")) fail("swarm-mark.svg: expected one <svg> element with a viewBox");
  const inline = `<svg id="hero-mark" xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox[1]}" aria-hidden="true" focusable="false">${svg.slice(open[0].length)}`;
  return replaceOnce(html, '<img id="hero-mark" src="/brand/swarm/logo/swarm-mark.svg" alt="" aria-hidden="true">', inline, "hero mark");
}

// lastmod moves only when a page really changes: the legal pages use their visible "Last updated" date, and the home
// page gets today's date only when its built HTML differs from the last build. Google trusts lastmod only while it is accurate.
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
function writeSitemapDates() {
  const previous = existsSync(SITEMAP_DATES) ? JSON.parse(readFileSync(SITEMAP_DATES, "utf8")) : [];
  const today = new Date().toISOString().slice(0, 10);
  const pages = Object.entries(PAGES).map(([name, path]) => {
    const html = readFileSync(`${out}${name}`, "utf8");
    const hash = createHash("sha256").update(html).digest("hex").slice(0, 16);
    const shown = html.match(/<span class="lg-date">Last updated (\w+) (\d{1,2}), (\d{4})<\/span>/);
    if (name !== "index.html" && !shown) fail(`${name}: no "Last updated" date for the sitemap`);
    const before = previous.find((p) => p.path === path);
    let lastmod = before && before.hash === hash ? before.lastmod : today;
    if (shown) {
      const month = MONTHS.indexOf(shown[1]) + 1;
      if (!month) fail(`${name}: unreadable "Last updated" month ${shown[1]}`);
      lastmod = `${shown[3]}-${String(month).padStart(2, "0")}-${shown[2].padStart(2, "0")}`;
    }
    return { path, lastmod, hash };
  });
  writeFileSync(SITEMAP_DATES, `${JSON.stringify(pages, null, 2)}\n`);
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

for (const name of [...Object.keys(PAGES), NOT_FOUND]) {
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

// Checks: nothing points back at the lab, the old site or a CDN, no internal note shows, and every local file exists.
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
  if (!entry.endsWith(".css") && /\[(?:CONFIRM|DATA NEEDED)|review before launch/i.test(text)) problems.push(`${entry}: shows an internal [CONFIRM] or [Data needed] note`);
  // The founding offer (50 seats at $49) is gone (later the Black Friday launch, dropped too): no page or script may
  // still carry it, and no page shows an em or en dash.
  if (!entry.endsWith(".css") && /\b50 (?:founding )?seats\b|founding (?:seats?|members?|price|monthly)|\$49(?!\.99)\b/i.test(text)) {
    problems.push(`${entry}: still mentions the old founding offer (50 seats, founding members or $49 without .99)`);
  }
  if (entry.endsWith(".html") && /[\u2013\u2014]/.test(text)) problems.push(`${entry}: has an em or en dash`);
  if (entry.endsWith(".html") && /href="[^"]*[?&]bf(?:now)?=/.test(text)) problems.push(`${entry}: links a ?bf= or ?bfnow= preview URL`);
  // Share images on this site's origin must exist (the img copy step above serves /swarm-site/img/ from assets/).
  for (const [, ref] of text.matchAll(/<meta (?:property|name)="(?:og:image|twitter:image)" content="https:\/\/www\.joinswarm\.ai(\/[^"#?]+)"/g)) {
    if (!existsSync(`${root}public${decodeURIComponent(ref)}`)) problems.push(`${entry}: share image ${ref} is missing`);
  }
}
// The Whop early bird (Jesus, November 20, 2026): "https://whop.com/swarmai/earlybirdvip/ is the link for the sale product
// page. it has a wait list and will start on monday". The early bird is $49.99 every 30 days, from Mon Nov 23, 12:00 AM ET
// through Tue Dec 1, 11:59 PM ET. After that, in his words: "price goes to 99.99 after". He chose: early birds keep $49.99
// as long as they stay subscribed, the page shows $99.99 now ("After that, new members pay $99.99/mo") and by itself from
// Dec 2, and the link stays the same (on Dec 2 he adds a $99.99 plan to earlybirdvip on Whop and stops selling the $49.99 one).
// So $49.99 and $99.99 are the only prices any built page, script or stylesheet may show: any other "$" amount fails
// (a near miss such as $99.98, Whop's struck-through display price, $99.9, $9.99, $199.99 or $49.990 included; the old
// $99/$990 ladder and the $49 founding offer were never true), and so do the dropped Black Friday sale, a "locked in"
// price and a "Coming soon" checkout.
const EARLY_BIRD_URL = "https://whop.com/swarmai/earlybirdvip/";
const PRICES = ["$49.99", "$99.99"];
// The page joins words with &nbsp; to control wraps, so a space here may also be written as an entity.
const SP = String.raw`(?:\s|&nbsp;|&#0*160;|&#x0*a0;)+`;
const NO_PRICE = [
  ['"Black Friday"', new RegExp(`black${SP}friday`, "i")],
  ['"locked in"', new RegExp(`locked${SP}in`, "i")],
  ['"Coming soon"', new RegExp(`coming${SP}soon`, "i")],
];
// The scripts and styles count too, since page.js once wrote the prices into the card. Their comments may still
// mention the dropped sale, so they are stripped first.
const stripComments = (code) => code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
const noPriceFiles = [...Object.keys(PAGES), NOT_FOUND, ...readdirSync(out).filter((f) => /\.(js|css)$/.test(f))];
const near = (text, index) => text.slice(Math.max(0, index - 40), index + 40).replace(/\s+/g, " ");
for (const name of noPriceFiles) {
  const raw = readFileSync(`${out}${name}`, "utf8");
  const text = name.endsWith(".html") ? raw : stripComments(raw);
  // The whole amount is compared, so "$49.990" or "$199.99" can't pass on a prefix or suffix of an allowed price.
  for (const hit of text.matchAll(/\$\s?\d(?:[\d.,]*\d)?/g)) {
    if (!PRICES.includes(hit[0])) {
      problems.push(`${name}: shows the dollar amount ${hit[0]} ("${near(text, hit.index)}"); the only prices are ${PRICES.join(" and ")}`);
    }
  }
  for (const [label, re] of NO_PRICE) {
    const hit = text.match(re);
    if (hit) problems.push(`${name}: shows ${label} ("${near(text, hit.index)}")`);
  }
}
// Every gold button and the nav button go to the early bird on Whop, in the same tab: it is the checkout, and the Whop
// Pixel tags whop.com links on click to credit the sale. The Keychain updates sign-up it replaced is gone from the page.
{
  const home = readFileSync(`${out}index.html`, "utf8");
  if (!home.includes(`href="${EARLY_BIRD_URL}"`)) problems.push(`index.html: no link to the early bird on Whop ${EARLY_BIRD_URL}`);
  const buttons = [...home.matchAll(/<a\b[^>]*\bclass="[^"]*\bbtn-(?:gold|line)\b[^"]*"[^>]*>/g)].map((m) => m[0]);
  if (!buttons.length) problems.push("index.html: no gold or nav button found");
  for (const tag of buttons) {
    if (!tag.includes(` href="${EARLY_BIRD_URL}"`) || /\btarget=/.test(tag)) {
      problems.push(`index.html: a gold or nav button does not open ${EARLY_BIRD_URL} in the same tab: ${tag.slice(0, 120)}`);
    }
  }
  if (/keychain\.club/i.test(home)) problems.push("index.html: still mentions keychain.club (the buttons go to Whop now)");
  if (existsSync(`${out}img/swarm-og-black-friday-1200x630.png`)) problems.push("img/swarm-og-black-friday-1200x630.png is still published");
}
// The early bird clock: index.html's first script sets html[data-eb] before any stylesheet, from exactly two instants,
// OPEN (Mon Nov 23, 12:00 AM ET) and END (Wed Dec 2, 12:00 AM ET, so all of Tue Dec 1 is still open). A typo in either
// would flip every label on the wrong day, so they are checked here as instants, not as text.
const EARLY_BIRD = { OPEN: "2026-11-23T05:00:00.000Z", END: "2026-12-02T05:00:00.000Z" };
{
  const home = readFileSync(`${out}index.html`, "utf8");
  const head = home.slice(0, home.indexOf("</head>"));
  const first = head.match(/<script\b[^>]*>([\s\S]*?)<\/script>/);
  const sheet = head.indexOf('<link rel="stylesheet"');
  if (!first || !/dataset\.eb\s*=/.test(first[1])) problems.push("index.html: the first script in <head> must be the early bird clock (it sets html[data-eb])");
  else {
    if (sheet !== -1 && first.index > sheet) problems.push("index.html: the early bird clock must run before the first stylesheet");
    const calls = [...first[1].matchAll(/\b(\w+)\s*=\s*Date\.UTC\(([^)]*)\)/g)];
    const found = Object.fromEntries(calls.map(([, k, a]) => [k, new Date(Date.UTC(...a.split(",").map(Number))).toISOString()]));
    if (calls.length !== 2 || /Date\.(?:parse|now\(\)\s*[+-])|new Date\(/.test(first[1])) {
      problems.push("index.html: the early bird clock must hold exactly two Date.UTC instants, OPEN and END, and nothing else that sets a time");
    }
    for (const [k, iso] of Object.entries(EARLY_BIRD)) {
      if (found[k] !== iso) problems.push(`index.html: the early bird clock's ${k} is ${found[k] || "missing"}, expected ${iso}`);
    }
  }
  for (const [, v] of home.matchAll(/\bdata-eb-show="([^"]*)"/g)) {
    if (!v.split(/\s+/).every((s) => ["waitlist", "open", "ended"].includes(s))) problems.push(`index.html: unknown early bird state in data-eb-show="${v}"`);
  }
}
for (const name of Object.keys(PAGES)) {
  for (const [chip] of readFileSync(`${src}${name}`, "utf8").matchAll(/\[(?:CONFIRM|DATA NEEDED)[^\]]*\]/gi)) {
    if (!chip.includes("youtube-nocookie")) blockers.push(`${name}: ${chip}`); // resolved by swarm-site.js
  }
}
// The production-only styles must not touch the page's own elements: a class they style may not already be used by
// the lab page or its scripts (a shared ".yt" once stretched the curve's YOU tag to the full height of the figure).
const labText = ["index.html", ...readdirSync(src).filter((f) => /\.(css|js)$/.test(f))].map((f) => readFileSync(`${src}${f}`, "utf8")).join("\n");
const prodSelectors = stripCssComments(readFileSync(`${out}swarm-site.css`, "utf8")).replace(/\{[^}]*\}/g, " ");
for (const [, cls] of prodSelectors.matchAll(/\.([a-z][\w-]*)/gi)) {
  if (new RegExp(`(class="[^"]*\\b|['"\\s.])${cls}(\\b|['"\\s])`).test(labText)) problems.push(`swarm-site.css: class .${cls} is also used by the lab page`);
}
// Structured data: only the home page carries it, the built block still parses, it has no rating, review or product
// type at any depth, and every image it names on this site exists. The 404 page stays out of the index.
for (const name of [...Object.keys(PAGES), NOT_FOUND]) {
  const blocks = [...readFileSync(`${out}${name}`, "utf8").matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  if (blocks.length !== (name === "index.html" ? 1 : 0)) problems.push(`${name}: ${blocks.length} JSON-LD blocks`);
  for (const [, json] of blocks) {
    let data;
    try {
      data = JSON.parse(json);
    } catch (error) {
      problems.push(`${name}: JSON-LD does not parse (${error.message})`);
      continue;
    }
    const types = [];
    const walk = (node) => {
      if (Array.isArray(node)) node.forEach(walk);
      else if (node && typeof node === "object") {
        if (node["@type"]) types.push(...[node["@type"]].flat());
        Object.values(node).forEach(walk);
      }
    };
    walk(data);
    for (const type of types) if (/^(?:AggregateRating|Review|Product)$/.test(type)) problems.push(`${name}: JSON-LD has a ${type}`);
    for (const [, ref] of json.matchAll(new RegExp(`"${ORIGIN.replaceAll(".", "\\.")}(/(?:swarm-site|brand)/[^"#?]+)"`, "g"))) {
      if (!existsSync(`${root}public${decodeURIComponent(ref)}`)) problems.push(`${name}: JSON-LD names missing ${ref}`);
    }
  }
}
{
  const notFound = readFileSync(`${out}${NOT_FOUND}`, "utf8");
  if (!notFound.includes('<meta name="robots" content="noindex">') || notFound.includes('rel="canonical"')) {
    problems.push(`${NOT_FOUND}: must be noindex with no canonical`);
  }
}
// Every built page carries the Whop Pixel exactly once, unaltered, inside its <head>.
for (const name of [...Object.keys(PAGES), NOT_FOUND]) {
  const html = readFileSync(`${out}${name}`, "utf8");
  const count = html.split(WHOP_PIXEL).length - 1;
  if (count !== 1) problems.push(`${name}: has the Whop Pixel ${count} times; it needs it exactly once`);
  else if (html.indexOf(WHOP_PIXEL) > html.indexOf("</head>")) problems.push(`${name}: the Whop Pixel is outside <head>`);
}
if (problems.length) fail(`\n  ${problems.join("\n  ")}`);
writeSitemapDates();
console.log(`Built ${out}`);
if (blockers.length) {
  console.log(`\nOpen items, hidden on the live site until resolved (${blockers.length}):\n  ${blockers.join("\n  ")}`);
}
// After the early bird the page reads ENDED by itself ($99.99/mo, "Join Swarm", the same Whop link), so nothing has to
// ship that day. The warning is a reminder: the WAITLIST and OPEN spans can go at the next edit, and Whop must be selling
// the $99.99 plan. Loud, never a failure: a fix must still ship.
if (Date.now() >= Date.parse(EARLY_BIRD.END)) {
  const bar = "!".repeat(96);
  console.warn(
    `\n${bar}\n  THE EARLY BIRD HAS ENDED (${EARLY_BIRD.END}). The page shows its ENDED state by itself: $99.99/mo, "Join Swarm",\n` +
      `  the same Whop link. At the next edit, the WAITLIST and OPEN spans and the $49.99 copy only they use can be retired\n` +
      `  (keep the ENDED FAQ line and the Terms: early bird members keep $49.99/mo).\n` +
      `  Check that ${EARLY_BIRD_URL} sells the $99.99/mo plan and that the $49.99 plan no longer\n` +
      `  sells, by its direct link too: a hidden Whop plan still sells by its direct link (see a-core-glow/NOTES.md,\n` +
      `  "What Jesus must do").\n${bar}\n`,
  );
}
