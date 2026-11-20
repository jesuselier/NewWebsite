// Ships the ENDED static text of the Swarm page (BLACK-FRIDAY-PLAN.md section 1, "The Dec 2 rebuild").
// JavaScript switches visitors to ENDED by itself at Dec 2, 12:00 AM ET, but crawlers, link previews and visitors
// without JavaScript read the static HTML, which holds the SALE text. Run this once the window has ended, then rebuild:
//   node design-lab/landing/black-friday/ship-ended.mjs && node scripts/build-swarm-site.mjs
// It edits the lab copy in place (a-core-glow/index.html and swarm-site/structured-data.json):
//   - <html data-bf-default="ended" data-bf="ended">, so the page without JavaScript is styled as ENDED too;
//   - the meta description, og:description, share image and its alt text go back to the evergreen versions;
//   - every element marked data-bf-sale-only (the bar, the struck $99, the ladder's Black Friday row) is removed;
//   - every leaf element with data-bf-ended gets that text, and keeps its SALE text in data-bf-sale for ?bf= previews;
//   - the card loses is-gold (ENDED has no gold number);
//   - the JSON-LD WebPage description repeats the new meta description (the build checks they match).
// Safe to run twice (the second run says it has nothing to do). It refuses to run before the window ends (BF_END in the
// head script) unless given --early, for preparing the change on a branch; the build refuses ENDED text before the end
// too. --root <dir> runs on a copy of the repo.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const arg = process.argv.indexOf("--root");
const root = arg > 0 ? `${process.argv[arg + 1].replace(/\/$/, "")}/` : fileURLToPath(new URL("../../../", import.meta.url));
const pagePath = `${root}design-lab/landing/a-core-glow/index.html`;
const dataPath = `${root}design-lab/landing/swarm-site/structured-data.json`;

const ENDED = {
  description:
    "Swarm is an AI crypto trading community on Discord by Jesus Martinez of JM Crypto: custom AI tools, his watch list, weekly live calls. $99/mo or $990/yr.",
  ogDescription:
    "Most people need three cycles and a lot of pain to get there. I want to get you there in one. Custom AI tools, my watch list and weekly live calls, on Discord.",
  image: "https://www.joinswarm.ai/brand/swarm/social/swarm-og-1200x630.png",
  imageAlt: "The Swarm wordmark and the words AI crypto trading beside one glowing gold hexagon in a dark honeycomb",
};

function fail(message) {
  console.error(`ship-ended: ${message}`);
  process.exit(1);
}

let html = readFileSync(pagePath, "utf8");
if (/<html[^>]* data-bf-default="ended"/.test(html)) {
  console.log("ship-ended: index.html already has the ENDED text; nothing to do.");
  process.exit(0);
}
if (!/<html[^>]* data-bf-default="sale"/.test(html)) fail('index.html has no data-bf-default="sale" on <html>');
const endM = html.match(/\bBF_END\s*=\s*Date\.parse\('(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z)'\)/);
if (!endM) fail("no BF_END=Date.parse('...Z') in the head script of index.html");
if (Date.now() < Date.parse(endM[1]) && !process.argv.includes("--early")) {
  fail(`the Black Friday window runs until ${endM[1]}; pass --early only to prepare the change on a branch`);
}

function setMeta(attr, name, value) {
  const re = new RegExp(`(<meta ${attr}="${name.replaceAll(".", "\\.")}" content=")[^"]*(">)`);
  if (!re.test(html)) fail(`no <meta ${attr}="${name}"> in index.html`);
  html = html.replace(re, `$1${value}$2`);
}
const attr = (s) => s.replaceAll("&", "&amp;").replaceAll('"', "&quot;");

html = html.replace(/<html([^>]*) data-bf-default="sale"/, '<html$1 data-bf-default="ended" data-bf="ended"');
setMeta("name", "description", attr(ENDED.description));
setMeta("property", "og:description", attr(ENDED.ogDescription));
setMeta("property", "og:image", ENDED.image);
setMeta("property", "og:image:alt", attr(ENDED.imageAlt));
setMeta("name", "twitter:image", ENDED.image);
setMeta("name", "twitter:image:alt", attr(ENDED.imageAlt));

// Sale-only elements. The match runs to the first closing tag of the same name, so the element may not hold another
// element of its own tag (checked).
let dropped = 0;
html = html.replace(/^[ \t]*<(\w+)\b[^>]*\sdata-bf-sale-only\b[^>]*>[\s\S]*?<\/\1>\n?/gm, (whole, tag) => {
  if (new RegExp(`<${tag}\\b`, "g").test(whole.trimStart().slice(1))) fail(`a data-bf-sale-only <${tag}> holds another <${tag}>; remove it by hand`);
  dropped++;
  return "";
});
if (dropped !== 3) fail(`expected 3 data-bf-sale-only elements (bar, struck price, ladder row), found ${dropped}`);

// Leaf elements: the ENDED words become the static text; the SALE words stay in data-bf-sale for ?bf=sale previews.
const total = (html.match(/\sdata-bf-ended="/g) || []).length;
let swapped = 0;
html = html.replace(/<(\w+)((?:\s[^>]*?)?\sdata-bf-ended="([^"]*)"[^>]*)>([^<]*)<\/\1>/g, (whole, tag, attrs, ended, text) => {
  swapped++;
  const keep = /\sdata-bf-sale="/.test(attrs) ? attrs : `${attrs} data-bf-sale="${text.replaceAll('"', "&quot;")}"`;
  return `<${tag}${keep}>${ended}</${tag}>`;
});
if (total !== swapped) fail(`${total - swapped} element(s) with data-bf-ended are not leaf elements; swap them by hand`);

if (!html.includes('<div class="pcard is-gold" id="join">')) fail('no <div class="pcard is-gold" id="join"> in index.html');
html = html.replace('<div class="pcard is-gold" id="join">', '<div class="pcard" id="join">');

const data = JSON.parse(readFileSync(dataPath, "utf8"));
const page = data["@graph"].find((node) => node["@type"] === "WebPage");
if (!page) fail("structured-data.json has no WebPage node");
page.description = ENDED.description;

writeFileSync(pagePath, html);
writeFileSync(dataPath, `${JSON.stringify(data, null, 2)}\n`);
console.log(`ship-ended: ENDED text in place (${swapped} words swapped, ${dropped} sale-only elements removed). Now run node scripts/build-swarm-site.mjs`);
