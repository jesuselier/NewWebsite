# Swarm (joinswarm.ai) SEO plan

**Decision (Jesus, October 17, 2026): martinezaccess.com is not used for Swarm SEO at all.** Section 1.6 and the martinezaccess.com steps in Part 2 are dropped, and martinezaccess.com keeps its pages, structured data and redirects exactly as before.

Written October 17, 2026 by the SEO lead, from four audits run the same day (technical, speed, keywords, off-page; full reports in the session scratchpad `seo/` folder). Every code change below was applied to a scratch copy of this repo and checked there before it was written down: the Swarm build ran (twice, to confirm the output is the same both times), `next build` (Next.js 16.2.4) passed, `next start` was tested with joinswarm.ai and martinezaccess.com host headers, and the old and new pages were rendered in headless Chrome and pixel-compared. Nothing in the real repo has been changed except this file. No commits.

Rules this plan follows: real data only (no ratings, reviews, member counts, results, dates or prices beyond the brief); no martinezaccess.com anywhere on the Swarm pages or their metadata; Jesus's approved copy and design stay as they are unless a change is small and clearly needed for search (every visible change is listed in section 1.12); no em or en dashes.

## The short version

- **The biggest problems are outside the code.** Google has not indexed joinswarm.ai yet. Nothing links to it: not the launch video (which looks unlisted and has no description), not his YouTube channels, not his X bio. Part 2 is Jesus's list, and step 1 (Search Console) matters more than everything in Part 1 put together.
- **"Swarm" on its own will never rank.** At least nine crypto and AI projects already use the name (Swarms, Swarm Network, Swarm Markets, Ethereum Swarm, joinswarm.io and others). The page has to win the searches his viewers will type: "swarm jm crypto", "jesus martinez swarm", "joinswarm", "swarm ai crypto trading community", "jm crypto discord". None of those has a real owner today, so a correctly titled page should take them soon after it is indexed.
- **In code:** a title that says whose Swarm this is, a description that fits, structured data tying Swarm to Jesus and his real profiles, a real 404 instead of redirecting every unknown URL home, an LCP fix with no visible change, a smaller founder photo, and sitemap dates that stay true.

---

# Part 1. Code changes we make now

Listed in priority order. "Where" names the exact file. Lab files live in `design-lab/landing/a-core-glow/`. Never edit `public/swarm-site/` by hand: run `node scripts/build-swarm-site.mjs` after the lab edits.

## 1.1 Title tag (HIGH)

**Where:** lab `index.html`, line 6.

```html
<title>Swarm: AI Crypto Trading Community by JM Crypto</title>
```

47 characters, so it fits on phones without being cut. It keeps the approved brand line ("Swarm: AI Crypto Trading Community", the kit's own tagline) word for word and adds "by JM Crypto", the one term that separates this Swarm from all the others. People who watch his videos search "JM Crypto"; "Jesus Martinez" is too common a name to separate on its own.

Visible change: the browser tab and the blue link in Google. Nothing on the page.

Conflict resolved: the technical audit proposed "Swarm by JM Crypto: AI Crypto Trading Community on Discord" (58 characters). Rejected because it is close to the cut-off length and breaks up the approved brand line. "Discord" is carried by the description, the hero paragraph, the FAQ and the joining steps instead.

## 1.2 Meta description (HIGH)

**Where:** lab `index.html`, line 8.

```html
<meta name="description" content="Swarm is an AI crypto trading community on Discord by Jesus Martinez of JM Crypto: custom AI tools, his watch list, weekly live calls. Founding seats $49/mo.">
```

157 characters (the old one was 213, so Google cut it before the price). Every fact is in the brief and the video at 3:18. It names both Jesus Martinez and JM Crypto, says Discord, and ends with the real founding price. It drops "Pre-launch", which would go stale on launch day.

Conflict resolved: the technical audit's 149-character version left out JM Crypto, and the keywords audit's version was 160 characters. This merges the two.

Visible change: only the grey text under the Google result.

## 1.3 Structured data (JSON-LD) (HIGH)

**Why:** the page has none, so Google has no machine-readable link between a brand-new domain, the word "Swarm" and a known person. WebSite markup is Google's main signal for the site name shown above the result, and the Person `sameAs` list ties Swarm to his real YouTube, X and Instagram accounts.

**Where:** new file `design-lab/landing/swarm-site/structured-data.json` (the production-only folder, so the approved lab page stays as it is). The build injects it into the head of `index.html` only (section 1.4). Values checked October 17: thumbnails and the logo return 200, uploadDate and duration come from YouTube's own metadata, the profiles come from `FOUNDER-DOSSIER.md` (YT-JM, YT-2, X, IG).

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://www.joinswarm.ai/#website",
      "url": "https://www.joinswarm.ai/",
      "name": "Swarm",
      "alternateName": ["joinswarm.ai"],
      "inLanguage": "en",
      "publisher": { "@id": "https://www.joinswarm.ai/#organization" }
    },
    {
      "@type": "Organization",
      "@id": "https://www.joinswarm.ai/#organization",
      "name": "Swarm",
      "url": "https://www.joinswarm.ai/",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.joinswarm.ai/brand/swarm/icons/app-icon-512.png",
        "width": 512,
        "height": 512
      },
      "image": "https://www.joinswarm.ai/brand/swarm/social/swarm-og-1200x630.png",
      "description": "Swarm is an AI crypto trading community on Discord, founded by Jesus Martinez of JM Crypto. Education and research, not financial advice.",
      "founder": { "@id": "https://www.joinswarm.ai/#founder" }
    },
    {
      "@type": "WebPage",
      "@id": "https://www.joinswarm.ai/#webpage",
      "url": "https://www.joinswarm.ai/",
      "name": "Swarm: AI Crypto Trading Community by JM Crypto",
      "description": "Swarm is an AI crypto trading community on Discord by Jesus Martinez of JM Crypto: custom AI tools, his watch list, weekly live calls. Founding seats $49/mo.",
      "inLanguage": "en",
      "isPartOf": { "@id": "https://www.joinswarm.ai/#website" },
      "about": { "@id": "https://www.joinswarm.ai/#organization" },
      "primaryImageOfPage": {
        "@type": "ImageObject",
        "url": "https://www.joinswarm.ai/brand/swarm/social/swarm-og-1200x630.png",
        "width": 1200,
        "height": 630
      },
      "video": { "@id": "https://www.joinswarm.ai/#launch-video" }
    },
    {
      "@type": "Person",
      "@id": "https://www.joinswarm.ai/#founder",
      "name": "Jesus Martinez",
      "description": "Founder of Swarm and creator of the JM Crypto YouTube channel.",
      "image": "https://www.joinswarm.ai/swarm-site/img/jesus-interview.jpg",
      "sameAs": [
        "https://www.youtube.com/@jm_crypto",
        "https://www.youtube.com/@JesusMartinezTrades",
        "https://x.com/JesusMartinez",
        "https://www.instagram.com/jesusmartinezbuilds/"
      ]
    },
    {
      "@type": "VideoObject",
      "@id": "https://www.joinswarm.ai/#launch-video",
      "name": "Welcome To Swarm | AI Agentic Trading",
      "description": "Jesus Martinez of JM Crypto explains the crypto curve, why crypto cycles are about attention, and why he built Swarm, his AI crypto trading community for the new era.",
      "uploadDate": "2026-10-16T08:32:51-07:00",
      "duration": "PT4M5S",
      "thumbnailUrl": [
        "https://i.ytimg.com/vi/n15W6X84IGg/maxresdefault.jpg",
        "https://i.ytimg.com/vi/n15W6X84IGg/sddefault.jpg",
        "https://i.ytimg.com/vi/n15W6X84IGg/hqdefault.jpg"
      ],
      "embedUrl": "https://www.youtube-nocookie.com/embed/n15W6X84IGg",
      "url": "https://www.youtube.com/watch?v=n15W6X84IGg",
      "inLanguage": "en",
      "author": { "@id": "https://www.joinswarm.ai/#founder" }
    }
  ]
}
```

Decisions where the audits disagreed:
- **VideoObject: included.** The keywords audit wanted it out because the video only loads after a click. Google recommends structured data for exactly that case (a click-to-load video it cannot otherwise see). The video name is the real YouTube title. Do not expect a video rich result: the video is not the page's main content, and Search Console may say so. That message is informational and does no harm.
- **`email`: left out for now.** joinswarm.ai has no MX records (checked by DNS lookup on October 17), so support@joinswarm.ai cannot receive mail. Add `"email": "support@joinswarm.ai"` to the Organization node the day Jesus confirms the inbox works (Part 2, step 9).
- **Instagram in `sameAs`: included.** It is his account (dossier source IG, and martinezaccess.com's own Person markup already lists it). Only martinezaccess.com is off limits.
- **Logo: `app-icon-512.png`**, not `swarm-mark-1024.png`. It is square, opaque and readable on white, which is what Google asks for, and it is an unchanged kit file.
- **No `url` on the Person** (his only personal site is martinezaccess.com, which may not appear here), no `jobTitle` (none is stated on the page), no Organization `sameAs` (Swarm has no profiles of its own yet).
- **Never:** AggregateRating, Review, Product, FAQPage. The build refuses rating, review and product types (section 1.4).

Rich results this can earn today: the site name ("Swarm") and logo and knowledge signals. Not available, so not pursued: FAQ (Google shows those only for government and health sites since 2023), reviews, product or merchant listings, video, breadcrumbs, sitelinks search box (retired).

## 1.4 Build script changes (HIGH, carries 1.3, 1.5 and 1.8)

**Where:** `scripts/build-swarm-site.mjs`. Exact diff, tested:

```diff
--- a/scripts/build-swarm-site.mjs
+++ b/scripts/build-swarm-site.mjs
@@ -4,6 +4,7 @@
 // Fonts and Three.js are fetched once into public/swarm-site/{fonts,vendor} and kept between runs
 // (pass --refetch to download them again), so the page loads nothing from third parties until a
 // visitor presses play on the video.
+import { createHash } from "node:crypto";
 import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
 import { fileURLToPath } from "node:url";
 
@@ -19,6 +20,11 @@
 // Google serves woff2 only to browsers it recognises.
 const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
 const PAGES = { "index.html": "/", "terms.html": "/terms", "privacy.html": "/privacy", "refunds.html": "/refunds" };
+// Served with a 404 status by app/(swarm)/swarm/page-not-found/route.ts for unknown joinswarm.ai paths:
+// built like the legal pages, but with no canonical and never in the sitemap.
+const NOT_FOUND = "404.html";
+// Sitemap dates for app/(swarm)/swarm/sitemap.xml/route.ts, kept true by this script (see writeSitemapDates).
+const SITEMAP_DATES = `${root}lib/swarm-pages.json`;
 const refetch = process.argv.includes("--refetch");
 
 function fail(message) {
@@ -110,11 +116,12 @@
     `href="${page === "index" ? "/" : `/${page}`}${hash}"`,
   );
   html = html.replaceAll(THREE_URL, `${BASE}/vendor/three.module.min.js`);
-  if (!html.includes('rel="canonical"')) {
+  if (name !== NOT_FOUND && !html.includes('rel="canonical"')) {
     html = replaceOnce(html, "</title>\n", `</title>\n<link rel="canonical" href="${ORIGIN}${path}">\n`, `${name} title`);
   }
   if (name === "index.html") {
-    html = replaceOnce(html, "</head>", `<link rel="stylesheet" href="${BASE}/swarm-site.css">\n</head>`, "index head");
+    html = replaceOnce(html, "</head>", `<link rel="stylesheet" href="${BASE}/swarm-site.css">\n${structuredData(html)}\n</head>`, "index head");
+    html = inlineHeroMark(html);
   }
   if (name === "privacy.html") html = fixPrivacy(html);
   // The [CONFIRM ...] and [Data needed ...] notes and the legal pages' draft badge are for Jesus; they stay in the lab copy and never show on the live
@@ -143,6 +150,57 @@
   );
 }
 
+// JSON-LD for search engines, home page only, from design-lab/landing/swarm-site/structured-data.json.
+// JSON.parse fails the build on a broken edit; the WebPage node must repeat the page's own title and description.
+function structuredData(html) {
+  const data = JSON.parse(readFileSync(`${root}design-lab/landing/swarm-site/structured-data.json`, "utf8"));
+  const text = (s) => s.replaceAll("&quot;", '"').replaceAll("&#39;", "'").replaceAll("&amp;", "&");
+  const title = text(html.match(/<title>([^<]*)<\/title>/)[1]);
+  const description = text(html.match(/<meta name="description" content="([^"]*)">/)[1]);
+  const page = data["@graph"].find((node) => node["@type"] === "WebPage");
+  if (!page || page.name !== title || page.description !== description) {
+    fail("structured-data.json: the WebPage name and description must match index.html's <title> and meta description");
+  }
+  // Real data only: no ratings, reviews or product listings (none exist).
+  if (/"@type":"(?:AggregateRating|Review|Product)"/.test(JSON.stringify(data))) fail("structured-data.json: rating, review or product markup");
+  return `<script type="application/ld+json">${JSON.stringify(data).replaceAll("<", "\\u003c")}</script>`;
+}
+
+// The hero mark fades in at the hero's ignition, about 2 s after first paint. As an <img> it was the page's Largest
+// Contentful Paint, so LCP measured the animation instead of the headline. The same file inlined as <svg> is never an
+// LCP candidate. Same bytes, same id, same CSS and hero.js animation: nothing on screen changes.
+function inlineHeroMark(html) {
+  const svg = readFileSync(`${root}public/brand/swarm/logo/swarm-mark.svg`, "utf8").trim();
+  const open = svg.match(/^<svg[^>]*>/);
+  const viewBox = open && open[0].match(/viewBox="([^"]+)"/);
+  if (!viewBox || !svg.endsWith("</svg>")) fail("swarm-mark.svg: expected one <svg> element with a viewBox");
+  const inline = `<svg id="hero-mark" xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox[1]}" aria-hidden="true" focusable="false">${svg.slice(open[0].length)}`;
+  return replaceOnce(html, '<img id="hero-mark" src="/brand/swarm/logo/swarm-mark.svg" alt="" aria-hidden="true">', inline, "hero mark");
+}
+
+// lastmod moves only when a page really changes: the legal pages use their visible "Last updated" date, and the home
+// page gets today's date only when its built HTML differs from the last build. Google trusts lastmod only while it is accurate.
+const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
+function writeSitemapDates() {
+  const previous = existsSync(SITEMAP_DATES) ? JSON.parse(readFileSync(SITEMAP_DATES, "utf8")) : [];
+  const today = new Date().toISOString().slice(0, 10);
+  const pages = Object.entries(PAGES).map(([name, path]) => {
+    const html = readFileSync(`${out}${name}`, "utf8");
+    const hash = createHash("sha256").update(html).digest("hex").slice(0, 16);
+    const shown = html.match(/<span class="lg-date">Last updated (\w+) (\d{1,2}), (\d{4})<\/span>/);
+    if (name !== "index.html" && !shown) fail(`${name}: no "Last updated" date for the sitemap`);
+    const before = previous.find((p) => p.path === path);
+    let lastmod = before && before.hash === hash ? before.lastmod : today;
+    if (shown) {
+      const month = MONTHS.indexOf(shown[1]) + 1;
+      if (!month) fail(`${name}: unreadable "Last updated" month ${shown[1]}`);
+      lastmod = `${shown[3]}-${String(month).padStart(2, "0")}-${shown[2].padStart(2, "0")}`;
+    }
+    return { path, lastmod, hash };
+  });
+  writeFileSync(SITEMAP_DATES, `${JSON.stringify(pages, null, 2)}\n`);
+}
+
 function stripCssComments(css) {
   return `${css.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\n\s*\n+/g, "\n").trim()}\n`;
 }
@@ -155,7 +213,7 @@
 await fetchFonts();
 await fetchThree();
 
-for (const name of Object.keys(PAGES)) {
+for (const name of [...Object.keys(PAGES), NOT_FOUND]) {
   writeFileSync(`${out}${name}`, transformPage(name, readFileSync(`${src}${name}`, "utf8")));
 }
 for (const entry of readdirSync(src)) {
@@ -204,6 +262,7 @@
   if (new RegExp(`(class="[^"]*\\b|['"\\s.])${cls}(\\b|['"\\s])`).test(labText)) problems.push(`swarm-site.css: class .${cls} is also used by the lab page`);
 }
 if (problems.length) fail(`\n  ${problems.join("\n  ")}`);
+writeSitemapDates();
 console.log(`Built ${out}`);
 if (blockers.length) {
   console.log(`\nOpen items, hidden on the live site until resolved (${blockers.length}):\n  ${blockers.join("\n  ")}`);
```

The existing build checks (no martinezaccess, no CDN, no missing files, no internal notes) now also cover the JSON-LD and the 404 page. Also add one line to `design-lab/landing/swarm-site/README.md`: "`structured-data.json` is the home page's JSON-LD. The build injects it and fails if its WebPage name and description differ from the page's title and meta description."

## 1.5 Real 404 page instead of "everything redirects home" (MEDIUM)

**Why:** today every unknown joinswarm.ai path gets a temporary 307 to `/`. Google treats that as a soft 404, the 307 says "temporary" so it keeps re-checking, mistyped links silently bounce, and it blocks file-based checks. The fix keeps the reason the redirect exists: martinezaccess.com pages and files still never render on the Swarm domain.

**a) New lab file `design-lab/landing/a-core-glow/404.html`** (legal-page shell, no canonical, noindex). Full file:

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Swarm: Page not found</title>
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://unpkg.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com data:; img-src 'self' data: blob:; media-src 'self' data: blob:; connect-src 'self'">
<meta name="robots" content="noindex">
<meta name="theme-color" content="#0B0B0D">
<link rel="icon" type="image/png" sizes="32x32" href="../brand/swarm/icons/favicon-32.png">
<link rel="apple-touch-icon" sizes="180x180" href="../brand/swarm/icons/apple-touch-icon-180.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Unbounded:wght@600&display=block">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600&family=JetBrains+Mono:wght@500&display=swap">
<link rel="stylesheet" href="../brand/swarm/swarm-tokens.css">
<link rel="stylesheet" href="legal.css">
</head>
<body class="swarm">
<a class="skip" href="#main">Skip to content</a>
<header class="lg-bar">
  <div class="lg-bar-in">
    <a class="lg-logo" href="index.html"><img src="../brand/swarm/logo/swarm-wordmark-for-dark-bg.svg" alt="Swarm home" width="136" height="37"></a>
    <a class="lg-back" href="index.html">Back to Swarm</a>
  </div>
</header>
<main id="main" class="lg-main">
  <div class="lg-col">
    <header class="lg-head">
      <p class="lg-eyebrow">404</p>
      <h1>Page not found</h1>
      <p class="lg-intro">This page does not exist.</p>
    </header>
  </div>
</main>

<footer class="lg-foot">
  <div class="lg-col">
    <ul class="lg-foot-links">
      <li><a href="terms.html">Terms</a></li>
      <li><a href="privacy.html">Privacy</a></li>
      <li><a href="refunds.html">Refund policy</a></li>
      <li><a href="index.html">Back to Swarm</a></li>
    </ul>
    <p>Swarm is an educational community. Nothing in Swarm is financial, investment, tax or legal advice. Payments are processed by Whop.</p>
  </div>
</footer>
</body>
</html>
```

The header, footer links and footer sentence are copied from the approved legal pages. The only new words are "404", "Page not found" and "This page does not exist." The build (1.4) turns the relative links into `/`, `/terms` and so on, so they work at any URL.

**b) New route `app/(swarm)/swarm/page-not-found/route.ts`:**

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";

// next.config.ts rewrites every joinswarm.ai path that is not the Swarm page, its legal pages or their files to
// here, so a mistyped or retired URL gets a real 404 instead of a redirect to the home page. The page itself is
// built by scripts/build-swarm-site.mjs from design-lab/landing/a-core-glow/404.html.
export const dynamic = "force-static";

export function GET() {
  const html = readFileSync(join(process.cwd(), "public/swarm-site/404.html"), "utf8");
  return new Response(html, {
    status: 404,
    headers: { "Content-Type": "text/html; charset=utf-8", "X-Robots-Tag": "noindex" },
  });
}
```

Checked against this Next version: a static route handler may return 404 (`next/dist/export/routes/app-route.js` accepts status 404 for prerendering), and the scratch `next build` wrote `{"status":404,...,"x-robots-tag":"noindex"}` into the route's prerender metadata. It is named `page-not-found`, not `not-found`, to stay clear of Next's `not-found` file convention.

**c) `next.config.ts`, complete new file:**

```ts
import type { NextConfig } from "next";

// joinswarm.ai (with or without www) serves the static Swarm page in public/swarm-site
// (built by scripts/build-swarm-site.mjs). martinezaccess.com keeps every existing route.
const SWARM_HOST = [{ type: "host" as const, value: "(?:www\\.)?joinswarm\\.ai" }];
const SITE_HOST = [{ type: "host" as const, value: "(?:www\\.)?martinezaccess\\.com" }];

const nextConfig: NextConfig = {
  // The Swarm 404 route reads the built page; keep it in that route's server bundle.
  outputFileTracingIncludes: { "/swarm/page-not-found": ["./public/swarm-site/404.html"] },
  async redirects() {
    return [
      // Swarm has its own domain.
      {
        source: "/swarm",
        has: SITE_HOST,
        destination: "https://www.joinswarm.ai/",
        permanent: false,
      },
      { source: "/swarm-site/:path*", has: SITE_HOST, destination: "https://www.joinswarm.ai/", permanent: false },
      // On joinswarm.ai the page lives at / and the legal pages at /terms, /privacy and /refunds.
      { source: "/swarm", has: SWARM_HOST, destination: "/", permanent: true },
      { source: "/index.html", has: SWARM_HOST, destination: "/", permanent: true },
      { source: "/swarm-site/index.html", has: SWARM_HOST, destination: "/", permanent: true },
      { source: "/swarm-site/:page(terms|privacy|refunds).html", has: SWARM_HOST, destination: "/:page", permanent: true },
    ];
  },
  async rewrites() {
    return {
      // beforeFiles so these override the martinezaccess.com files at the same paths.
      beforeFiles: [
        { source: "/", has: SWARM_HOST, destination: "/swarm-site/index.html" },
        { source: "/:page(terms|privacy|refunds)", has: SWARM_HOST, destination: "/swarm-site/:page.html" },
        { source: "/robots.txt", has: SWARM_HOST, destination: "/swarm/robots.txt" },
        { source: "/sitemap.xml", has: SWARM_HOST, destination: "/swarm/sitemap.xml" },
        { source: "/favicon.ico", has: SWARM_HOST, destination: "/brand/swarm/icons/favicon.ico" },
        // Keep last. Every other joinswarm.ai path gets the Swarm 404 page with a real 404 status (not a redirect
        // home, which Google treats as a soft 404), so martinezaccess.com pages and files never render under the
        // Swarm domain. beforeFiles rewrites keep matching after a hit, so the destinations above are excluded too.
        {
          source:
            "/:path((?!_next/|_vercel/|brand/|swarm-site/|swarm/|swarm-analytics\\.js$|terms$|privacy$|refunds$|favicon\\.ico$|robots\\.txt$|sitemap\\.xml$).+)",
          has: SWARM_HOST,
          destination: "/swarm/page-not-found",
        },
      ],
      afterFiles: [
        { source: "/tier-list", destination: "/tier-list-assets/index.html" },
        // Preview deployments show the Swarm page at /swarm (the two production hosts redirect it).
        { source: "/swarm", destination: "/swarm-site/index.html" },
      ],
      fallback: [],
    };
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "i1.ytimg.com" },
      { protocol: "https", hostname: "i2.ytimg.com" },
      { protocol: "https", hostname: "i3.ytimg.com" },
      { protocol: "https", hostname: "i4.ytimg.com" },
    ],
  },
};

export default nextConfig;
```

What changed and why:
- The joinswarm.ai catch-all **redirect** is gone. The new last `beforeFiles` **rewrite** sends the same paths to the 404 route. It must be `beforeFiles` so it beats martinezaccess.com pages and public files at the same paths. The exclusions list both the original paths and the destinations of the earlier rewrites, because `beforeFiles` rewrites keep matching after a hit (`node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/rewrites.md`).
- The old exclusion `swarm` (any path starting with "swarm") is narrowed to `swarm-site/`, `swarm/` and `swarm-analytics.js`, so `/swarmfoo` now gets the Swarm 404 instead of Next's white one.
- `/swarm`, `/index.html` and the duplicate `/swarm-site/*.html` URLs are now **permanent** (308) redirects to the clean URLs. Redirects run before rewrites and only see the incoming URL, so the internal `/` to `/swarm-site/index.html` rewrite does not loop (tested).
- martinezaccess.com: no change. Its `/swarm` and `/swarm-site/*` redirects to joinswarm.ai stay as they were (307). Preview deployments still show the Swarm page at `/swarm`.
- Vercel Analytics is unaffected. Its script and beacons live at `/6834f4ff7adf1e4a/...`, which Vercel serves before Next routing (proof: the current catch-all redirect also matches that path, yet it returns 200 today).

Tested with `next start` and host headers:

| joinswarm.ai path | Result |
|---|---|
| `/`, `/terms`, `/privacy`, `/refunds`, `/robots.txt`, `/sitemap.xml`, `/favicon.ico`, `/swarm-analytics.js`, `/brand/...`, `/swarm-site/*.css`, `/swarm-site/img/*.webp` | 200 |
| `/swarm`, `/index.html`, `/swarm-site/index.html` | 308 to `/` |
| `/swarm-site/terms.html`, `/terms/` | 308 to `/terms` |
| `/doesnotexist`, `/blog/post`, `/about`, `/latest`, `/media/...jpg`, `/google1234.html`, `/BingSiteAuth.xml`, `/.well-known/security.txt`, `/swarmfoo` | 404, Swarm page, `X-Robots-Tag: noindex` |
| `/TERMS`, `/brand/nothing` | 404 (Next's default page, as today) |

| martinezaccess.com path | Result |
|---|---|
| `/`, `/about` | 200, unchanged |
| `/swarm`, `/swarm-site/index.html` | 307 to `https://www.joinswarm.ai/`, unchanged |

## 1.6 martinezaccess.com (dropped)

Dropped by Jesus on October 17: martinezaccess.com is not used for Swarm SEO. No footer link, no structured data change, no About page sentence and no redirect change there.

## 1.7 LCP fix: inline the hero mark at build time (MEDIUM, no visible change)

**Why:** the page's Largest Contentful Paint is the decorative `img#hero-mark`, which stays at opacity 0 until the hero ignites about 2 seconds in. So LCP measures the animation, not the content. The speed audit measured real LCP at about 2.9 s on desktop (over Google's 2.5 s "good" line) and 4.35 s on a throttled phone, while the headline was on screen about 2 seconds earlier. Core Web Vitals are a small ranking factor, and this one costs nothing to fix.

**Where:** `inlineHeroMark()` in the build diff (1.4). The lab copy keeps its `<img>`. Production gets the identical `swarm-mark.svg` file inlined, with the same id, CSS and hero.js animation. An inline `<svg>` made of paths is never an LCP candidate, so LCP falls back to the headline or hero paragraph.

Checked for this plan: on a 412 px phone, the old build's final LCP was `#hero-mark` at 2,168 ms; the new build's only LCP was `p.hero-sub` at 156 ms (local server, unthrottled). The mark's box is identical at 320, 412 and 1440 px. In frozen frames at `?t=2150` and `?t=2900`, no pixel differs by more than 5% at 1440 or 412 px (the 1440 px frame at 2900 ms is identical). At 320 px, the only differences are stroke anti-aliasing inside the mark's grey outlines, with the same average color to two decimals. Reduced motion still ends with the mark at full opacity.

Brand check: the kit (`docs/swarm-brand.md`) says "use the SVG files as they are; never rebuild the mark". This uses the file's own bytes, unchanged, so nothing is rebuilt or recolored. The brief's summary adds "in an `<img>`", so Jesus is told about this change (Part 2, "What changed") even though nothing looks different. If he objects, removing the one `inlineHeroMark(html)` line undoes it.

## 1.8 Sitemap dates that stay true (LOW)

**Why:** the four `lastmod` dates are hard-coded. They are right today but will be wrong after the next edit, and Google stops trusting `lastmod` once it catches it being wrong. `changefreq` and `priority` are dropped, because Google ignores them.

**Where:** `writeSitemapDates()` in the build (1.4) writes `lib/swarm-pages.json` (the legal pages take their visible "Last updated" date, and the home page's date moves only when its built HTML changes). Replace `app/(swarm)/swarm/sitemap.xml/route.ts` with:

```ts
import { SWARM_ORIGIN } from "@/lib/swarm";
import pages from "@/lib/swarm-pages.json";

// Served as joinswarm.ai/sitemap.xml through a host rewrite in next.config.ts. The dates come from
// lib/swarm-pages.json, which scripts/build-swarm-site.mjs updates only when a page really changes.
export const dynamic = "force-static";

export function GET() {
  const urls = pages
    .map((p) => `<url>\n<loc>${SWARM_ORIGIN}${p.path}</loc>\n<lastmod>${p.lastmod}</lastmod>\n</url>`)
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
```

`lib/swarm-pages.json` is generated by the first build. Commit it with the build output. robots.txt stays exactly as it is: it allows everything and points to the sitemap.

## 1.9 Social and robots tags (LOW, invisible)

**Where:** lab `index.html` head. Exact diff (it also contains 1.1 and 1.2):

```diff
-<title>Swarm: AI Crypto Trading Community</title>
+<title>Swarm: AI Crypto Trading Community by JM Crypto</title>
 <meta http-equiv="Content-Security-Policy" content="(unchanged)">
-<meta name="description" content="Swarm is Jesus Martinez's AI crypto trading community for the new era, on Discord: custom AI tools, his watch list, weekly live calls and multi-cycle traders. Pre-launch, $49/month for the first 50 founding seats.">
+<meta name="description" content="Swarm is an AI crypto trading community on Discord by Jesus Martinez of JM Crypto: custom AI tools, his watch list, weekly live calls. Founding seats $49/mo.">
+<meta name="robots" content="max-image-preview:large">
 <meta name="theme-color" content="#0B0B0D">
 <meta property="og:type" content="website">
+<meta property="og:site_name" content="Swarm">
+<meta property="og:locale" content="en_US">
 <meta property="og:title" content="Swarm: AI Crypto Trading Community">
 <meta property="og:description" content="Most people need three cycles and a lot of pain to get there. I want to get you there in one. Pre-launch, 50 founding seats.">
 <meta property="og:url" content="https://www.joinswarm.ai/">
 <meta property="og:image" content="https://www.joinswarm.ai/brand/swarm/social/swarm-og-1200x630.png">
+<meta property="og:image:type" content="image/png">
 <meta property="og:image:width" content="1200">
 <meta property="og:image:height" content="630">
+<meta property="og:image:alt" content="The Swarm wordmark and the words AI crypto trading beside one glowing gold hexagon in a dark honeycomb">
 <meta name="twitter:card" content="summary_large_image">
+<meta name="twitter:creator" content="@JesusMartinez">
 <meta name="twitter:image" content="https://www.joinswarm.ai/brand/swarm/social/swarm-og-1200x630.png">
+<meta name="twitter:image:alt" content="The Swarm wordmark and the words AI crypto trading beside one glowing gold hexagon in a dark honeycomb">
```

`og:title` and `og:description` stay exactly as approved (see 1.13). The alt text describes the real OG image (checked visually).

**Where:** the three lab legal pages (`terms.html`, `privacy.html`, `refunds.html`). Insert right after `<meta name="theme-color" content="#0B0B0D">`. The title and description repeat each page's own approved `<title>` and meta description. Terms shown; for the other two, swap in their own title, description and URL:

```html
<meta property="og:type" content="website">
<meta property="og:site_name" content="Swarm">
<meta property="og:title" content="Swarm: Terms of Service">
<meta property="og:description" content="The terms for joining and using Swarm, Jesus Martinez's AI crypto trading community on Discord.">
<meta property="og:url" content="https://www.joinswarm.ai/terms">
<meta property="og:image" content="https://www.joinswarm.ai/brand/swarm/social/swarm-og-1200x630.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="The Swarm wordmark and the words AI crypto trading beside one glowing gold hexagon in a dark honeycomb">
<meta name="twitter:card" content="summary_large_image">
```

- privacy: title `Swarm: Privacy Policy`, description `What Swarm collects, why, who it is shared with, and how to see or delete your information.`, URL `https://www.joinswarm.ai/privacy`
- refunds: title `Swarm: Refund and Cancellation Policy`, description `How to cancel a Swarm membership, what happens to your access, and when Swarm gives refunds.`, URL `https://www.joinswarm.ai/refunds`

## 1.10 Snippet hygiene and alt text (LOW, invisible)

**Where:** lab `index.html`.
- Add `data-nosnippet` to the four illustration mocks, so Google never builds a search snippet out of mock text such as "Asset 01" or "Illustration · not live data". Nothing changes on screen.
  ```html
  <div class="mock mock-tools" id="tools-mock" data-nosnippet>
  <div class="mock mock-watch" id="watch-mock" data-nosnippet role="img" aria-label="(unchanged)">
  <div class="mock mock-calls" id="calls-mock" data-nosnippet role="img" aria-label="(unchanged)">
  <div class="mock mock-room" id="room-mock" data-nosnippet role="img" aria-label="(unchanged)">
  ```
- Founder portrait alt (line 160): `Jesus Martinez seated at a podcast microphone` becomes `Jesus Martinez, founder of Swarm, seated at a podcast microphone`. That ties the face to the brand in image search. The keywords audit's longer version ("...and host of JM Crypto...") is rejected, because "Founder · JM Crypto" is already visible text inside the same link, and screen readers would read it twice.

## 1.11 Smaller founder photo (LOW, invisible)

**Why:** `jesus-interview.jpg` is 354 KB, 66% of the page's bytes, and every device gets the full 1200x1800 file. It is lazy-loaded below the fold, so it does not affect LCP, but on phones it is the biggest download.

**Step 1, once:** make WebP copies next to the original (sharp is already installed with Next; the source has no EXIF or location data, and none is copied):

```sh
node -e 'const sharp=require("sharp");for(const w of [400,640,800,1200])sharp("design-lab/landing/assets/jesus-interview.jpg").resize({width:w}).webp({quality:74,effort:6}).toFile(`design-lab/landing/assets/jesus-interview-${w}.webp`).then(i=>console.log(w,i.size))'
```

(Sizes from the test run: 32.5, 71.9, 99.5 and 179.1 KB.)

**Step 2, lab `index.html`:** a drop-in `srcset` on the same `<img>` elements. No `<picture>`, no CSS change, the same crop, and the JPEG kept as the fallback. The build already copies every referenced `/swarm-site/img/` file.

```html
<img src="../assets/jesus-interview.jpg" srcset="../assets/jesus-interview-400.webp 400w, ../assets/jesus-interview-640.webp 640w, ../assets/jesus-interview-800.webp 800w, ../assets/jesus-interview-1200.webp 1200w" sizes="(max-width: 640px) calc(100vw - 34px), (max-width: 1023px) min(720px, calc(100vw - 66px)), 650px" alt="Jesus Martinez, founder of Swarm, seated at a podcast microphone" width="1200" height="1800" loading="lazy" decoding="async">
```

and in the live-call tile (line 343):

```html
<div class="tile t-host"><img src="../assets/jesus-interview.jpg" srcset="../assets/jesus-interview-400.webp 400w, ../assets/jesus-interview-640.webp 640w" sizes="(max-width: 640px) 110px, 162px" alt="" width="1200" height="1800" loading="lazy" decoding="async"><span class="t-tag">Host · Jesus</span><span class="spk on"><i></i><i></i><i></i></span></div>
```

Measured in the render test (both images together): a 320 px phone loads about 104 KB, a 412 px phone at 2.6x density about 212 KB, and a 1440 px desktop about 132 KB, instead of 354 KB each.

## 1.12 Every visible change in Part 1

1. **Browser tab and Google title:** "Swarm: AI Crypto Trading Community" becomes "Swarm: AI Crypto Trading Community by JM Crypto". Nothing on the page.
2. **Google snippet text:** the new meta description. Nothing on the page.
3. **New 404 page**, seen only at bad URLs: "404", "Page not found", "This page does not exist.", with the existing legal-page header, footer links and footer sentence.
4. **Link previews of the three legal pages** now show the Swarm OG image and the page title instead of a bare link.

Not visible (checked): the inlined hero mark, JSON-LD, meta tags, `data-nosnippet`, alt text, WebP photo, redirects and the sitemap. Jesus's approved page copy, layout and motion are untouched.

## 1.13 Rejected or deferred, and why

| Proposal (audit) | Decision | Why |
|---|---|---|
| New og:title "Swarm: Jesus Martinez's AI Crypto Trading Community", Q01 in quotes as og/twitter description, twitter:title/description (keywords) | Rejected | Share-card copy is approved, Google does not rank on it, and X falls back to the og tags. Only "Pre-launch" changes, on launch day (1.14). |
| Footer disclosure "educational AI crypto trading community on Discord" (O1), founder pill "The founder · Jesus Martinez" (O2) (keywords) | Rejected | Not needed: the hero paragraph already has Jesus Martinez, JM Crypto, Swarm, "AI crypto trading community" and Discord in the first screen. Both would change approved copy. |
| Keywords in the H1 or hidden keyword headings | Rejected | Approved headline; hidden text written for ranking is spam. |
| 512 px `rel="icon"` link (technical, off-page) | Rejected | Google already reads the existing `apple-touch-icon` (180 px, a supported favicon source) and the 48 px frame in `/favicon.ico`. A 512 px icon could change the tab icon on high-density screens for no search gain. |
| `swarm-mark-1024.png` as the Organization logo (off-page) | Rejected | `app-icon-512.png` is square and opaque, so it reads better on Google's white surfaces. |
| FAQPage, Review, AggregateRating, Product markup | Rejected | Hard rule (no reviews or ratings exist), and FAQ rich results are limited to government and health sites. |
| Service plus Offers markup now | Deferred to launch day (1.14) | Checkout is not live; the markup must match what a visitor can buy. It earns no rich result either way. |
| `email` in the Organization | Deferred | No MX records, so the inbox cannot receive mail yet. |
| LinkedIn or TikTok in `sameAs` | Deferred | LinkedIn is private and unconfirmed; the TikTok handle is `[DATA NEEDED]`. |
| AVIF `<picture>` with a core-glow.css selector change (speed) | Replaced by the WebP `srcset` in 1.11 | Most of the saving with no CSS or markup structure change. |
| Long-cache headers with `?v=` content hashes (speed) | Deferred | Helps repeat visits only. It needs build rewrites of fonts.css, preloads and the import map, and a mismatch downloads fonts twice. Revisit if field data shows repeat-visit LCP problems. |
| Minifying JS and CSS with terser and lightningcss (speed) | Deferred | About 24 KB brotli, but it touches every approved animation script and adds two dependencies. Not worth the regression risk before launch. |
| Delaying crowd.js and page.js setup until after the first frame (speed) | Rejected for now | About 0.28 s on throttled phones only, with a real risk to the gold ring handoff timing. |
| Font gate changes (speed) | Rejected | Measured: the gate does not delay LCP today. |
| Loading three.js in parallel (speed) | Deferred | Below the fold; no search effect. |
| Capping hero canvas resolution at 1.5x, or showing the mark faintly from frame 0 (speed) | Rejected | Visible design changes. The inline SVG (1.7) fixes LCP with no visible change. |
| Critical-CSS split, `content-visibility`, web manifest, llms.txt, hreflang | Rejected | Large change for little gain, risky with canvas measurement, or no effect on Google (the site is English only). |
| Vercel Speed Insights | Not now | It adds a script to the page. The Search Console Core Web Vitals report will show field data once there is traffic. |

## 1.14 Launch-day and later code follow-ups (not now)

- **When Whop checkout is live:** add this node to the `@graph` in `structured-data.json` (real prices, no seat counts or availability claims):
  ```json
  {
    "@type": "Service",
    "@id": "https://www.joinswarm.ai/#membership",
    "name": "Swarm membership",
    "serviceType": "AI crypto trading community on Discord",
    "provider": { "@id": "https://www.joinswarm.ai/#organization" },
    "url": "https://www.joinswarm.ai/#join",
    "offers": [
      { "@type": "Offer", "name": "Founding Monthly", "description": "First 50 founding seats. Keeps $49 a month while subscribed.", "price": "49.00", "priceCurrency": "USD", "priceSpecification": { "@type": "UnitPriceSpecification", "price": "49.00", "priceCurrency": "USD", "billingDuration": "P1M" } },
      { "@type": "Offer", "name": "Standard Monthly", "price": "99.00", "priceCurrency": "USD", "priceSpecification": { "@type": "UnitPriceSpecification", "price": "99.00", "priceCurrency": "USD", "billingDuration": "P1M" } },
      { "@type": "Offer", "name": "Yearly", "description": "2 months free compared with Standard Monthly.", "price": "990.00", "priceCurrency": "USD", "priceSpecification": { "@type": "UnitPriceSpecification", "price": "990.00", "priceCurrency": "USD", "billingDuration": "P1Y" } }
    ]
  }
  ```
- **At launch:** og:description "...Pre-launch, 50 founding seats." becomes "...50 founding seats." (with Jesus's OK).
- **Contact email:** done October 26: `"email": "JMCrypto@wealthgardenent.com"` is on the Organization node.
- **If the 50 founding seats fill:** update the meta description and the WebPage description together (the build enforces the match), and drop the Founding offer. Never show a seats-left count.
- **When a Swarm X account, the Whop store page or a confirmed public LinkedIn exists:** add them to `sameAs` (Swarm's own accounts on the Organization, LinkedIn on the Person), and add `twitter:site` for a Swarm X account.
- **New pages later** (one per AI tool once it is live with real screenshots and no dates; a crypto curve explainer built on his verbatim lines from 0:00 to 0:34): add each to `PAGES` in the build (the sitemap follows automatically), add a `beforeFiles` rewrite before the 404 catch-all, and add its path to the catch-all exclusions.

## 1.15 How to ship Part 1 (order and checks)

1. Generate the WebP files (1.11, step 1).
2. Edit the lab files: `index.html` (1.1, 1.2, 1.9, 1.10, 1.11), the three legal pages (1.9), and add `404.html` (1.5 a).
3. Add `design-lab/landing/swarm-site/structured-data.json` (1.3) and the README line (1.4).
4. Apply the build diff (1.4), then run `node scripts/build-swarm-site.mjs`. It creates `public/swarm-site/404.html`, `public/swarm-site/img/*.webp` and `lib/swarm-pages.json`. Run it twice: the second run must change nothing.
5. Add `app/(swarm)/swarm/page-not-found/route.ts` (1.5 b), replace the sitemap route (1.8) and `next.config.ts` (1.5 c).
6. (Dropped: no martinezaccess.com changes.)
7. Run `npx tsc --noEmit`, `npm run lint`, `npm test` and `npx next build`. Then run `npx next start` and repeat the host-header curl table in 1.5 (`curl -sI -H "Host: www.joinswarm.ai" http://localhost:3000/doesnotexist` and so on).
8. Update `LAUNCH-CHECKLIST.md`: "Every other path goes back to `/`" becomes "Every other path gets the Swarm 404 page", and the inbox advice says Cloudflare Email Routing (DNS is on Cloudflare, not Namecheap).
9. Committing and deploying are a separate, approved step. This plan makes no commits.
10. After deploy:
    ```sh
    curl -sI https://www.joinswarm.ai/ | head -1                      # 200 (also /terms /privacy /refunds /robots.txt /favicon.ico)
    curl -sI https://www.joinswarm.ai/doesnotexist | grep -iE "^HTTP|x-robots"   # 404 and noindex
    curl -sI https://www.joinswarm.ai/swarm | grep -iE "^HTTP|location"          # 308 to /
    curl -s  https://www.joinswarm.ai/sitemap.xml                     # 4 URLs, no changefreq or priority
    curl -s  https://www.joinswarm.ai/ | grep -c 'application/ld+json'            # 1
    curl -sI https://www.joinswarm.ai/6834f4ff7adf1e4a/script.js | head -1        # 200 (Vercel Analytics)
    curl -sI https://www.martinezaccess.com/swarm | grep -iE "^HTTP|location"     # 307 to https://www.joinswarm.ai/, unchanged
    ```
    If the 404 comes back as 200 on Vercel, delete `export const dynamic = "force-static"` from the 404 route (the tracing include already bundles the file) and redeploy. Next day, confirm that Vercel Analytics still records joinswarm.ai views. Run Google's Rich Results Test and the Schema Markup Validator on `https://www.joinswarm.ai/` (expect Organization detected and 0 errors), and run PageSpeed Insights on mobile: the LCP element should be the headline or `p.hero-sub`, not `#hero-mark`.

Each item is independent: any one can be reverted on its own file without touching the others.

---

# Part 2. What Jesus does (in order)

Plain steps. None of this needs code. Steps 1 to 4 matter most. Google cannot rank a site it has not found, and right now nothing points to joinswarm.ai.

## What changed on the site (no action needed, just tell us if you want any of it undone)

- The title Google shows is now "Swarm: AI Crypto Trading Community by JM Crypto", and the grey text under it is shorter and mentions JM Crypto and the $49 founding price.
- A mistyped joinswarm.ai address now shows a small Swarm "Page not found" page instead of jumping to the home page.
- The glowing hive logo in the hero is now written into the page's code instead of placed as an image. It looks exactly the same (we compared screenshots), and Google's main loading-speed measurement for the page improves by about 2 seconds. It is the official logo file, unchanged.

## 1. Tell Google the site exists: Google Search Console (15 minutes)

Your domain's DNS is managed at Cloudflare (we checked), so you verify it there.

1. Go to https://search.google.com/search-console and sign in with your Google account.
2. Click the property picker at the top left, then **Add property**.
3. Choose the left box, **Domain**. Type `joinswarm.ai` (no www, no https) and click **Continue**.
4. If Google offers to verify through Cloudflare, click **Start verification** and approve it in the Cloudflare window. If it does not, copy the long code that starts with `google-site-verification=`.
5. In another tab, open https://dash.cloudflare.com, click **joinswarm.ai**, then **DNS**, then **Records**, then **Add record**. Set Type to `TXT`, Name to `@`, and paste the code into Content. Leave TTL on Auto and click **Save**.
6. Back in Search Console, click **Verify**. If it says it cannot find the record, wait an hour and try again (it can take up to a day).
7. Never delete that TXT record. Google checks it again from time to time.

## 2. Hand Google the page list and ask it to look (5 minutes, after we tell you the update is live)

1. In Search Console, click **Sitemaps** in the left menu. Type `https://www.joinswarm.ai/sitemap.xml` and click **Submit**. It should say "Success".
2. Click the search bar at the top, paste `https://www.joinswarm.ai/` and press Enter. When the result loads, click **Request indexing**.

## 3. Do the same for Bing (5 minutes)

Bing's index also feeds results to DuckDuckGo, Copilot and ChatGPT search.

1. Go to https://www.bing.com/webmasters and sign in (your Google account works).
2. Choose **Import from Google Search Console**, allow access, tick **joinswarm.ai** and click **Import**. Leave the connection in place.
3. Do not choose the "XML file" verification option if Bing ever offers it. Use the import or the DNS option.

## 4. Fix the launch video on YouTube (15 minutes)

The video looks unlisted (1 view, not in your public uploads list, and it does not come up when you search its title), and its description is empty. That makes it the biggest missed link.

1. Open https://studio.youtube.com, click **Content** and find "Welcome To Swarm | AI Agentic Trading".
2. **Visibility:** click the visibility cell and choose **Public**, unless you are holding it back on purpose. An unlisted video never shows up in YouTube or Google search.
3. **Description:** click the video's title to open Details. Paste the text below into Description (edit freely, but keep the link on the first line). Delete "Pre-launch: " on launch day.

   ```
   Join Swarm: https://www.joinswarm.ai

   Swarm is my AI crypto trading community for the new era, on Discord. You get custom AI tools that I build and maintain myself, my watch list so you always know what I'm looking at, weekly live calls where I do live portfolio reviews, and traders who have made it through several cycles sharing how they see the market. The AI tools are still being built, and founding members get each one as it's finished. Pre-launch: the first 50 founding seats are $49 a month.

   0:00 Three kinds of people every cycle
   0:40 Crypto cycles are about attention
   1:14 Since 2023, the attention is on AI
   1:37 The money is coming back
   2:00 The new era of crypto
   2:33 My first cycle
   3:02 Why I built Swarm
   3:18 What you get in Swarm
   3:39 Who Swarm is for
   3:51 Join Swarm

   JM Crypto: https://www.youtube.com/@jm_crypto
   X: https://x.com/JesusMartinez

   Nothing in this video is financial advice. Always do your own research.
   ```

4. **Tags:** click **Show more**, delete the old tags (Zcash, NEAR, Hyperliquid and so on are left over from other videos) and add: `Swarm, Join Swarm, JM Crypto, Jesus Martinez, AI crypto trading community, AI crypto, crypto trading community, crypto cycles`. Click **Save**.
5. **Pinned comment:** open the video on YouTube and post this comment: `Join Swarm here: https://www.joinswarm.ai The first 50 founding seats are $49 a month. I'll see you inside.` Then click the three dots on it and choose **Pin**.
6. Optional: share the video in a Community post with the link, and set it as the channel trailer for people who are not subscribed.

## 5. Put the link on every new video automatically (5 minutes per channel)

In YouTube Studio, click **Settings** (bottom left), then **Upload defaults**, then **Description**. Add this line at the top and click **Save**:
`Join Swarm, my AI crypto trading community: https://www.joinswarm.ai`
Do this on JM Crypto and again on More Jesus Martinez (switch channels with your profile picture, top right).

## 6. Add the link to both channel pages (5 minutes per channel)

In YouTube Studio, click **Customization**, then the **Profile** tab (some accounts call it Basic info). Under **Links**, click **Add link**, set Title to `Join Swarm` and URL to `https://www.joinswarm.ai`, drag it to the top so it shows in the channel header, and click **Publish**. Add this line to the channel description too: `Swarm, my AI crypto trading community: joinswarm.ai`. Do it on both channels.

## 7. X (5 minutes)

1. Profile, then **Edit profile**, then add `Building Swarm: joinswarm.ai` to your bio and save. Links in the bio are clickable, so the website field can stay as it is.
2. Post the launch video (or a clip) with `https://www.joinswarm.ai`, for example: "I built Swarm, an AI crypto trading community for the new era. Here's why." Then tap the three dots on the post and choose **Pin to your profile**.
3. Add the same bio line on @attentioncycle.

## 8. Instagram (2 minutes)

**Edit profile**, then **Links**, then **Add external link**. URL `https://www.joinswarm.ai`, title `Join Swarm`.

## 9. Contact address (done)

Jesus chose JMCrypto@wealthgardenent.com on October 26. It is on the page, the three legal pages and in the structured data, so the steps below are no longer needed.

### Old steps (for reference only)

The address is printed on the page and all three legal pages, but right now mail to it bounces (the domain has no mail records). Because your DNS is at Cloudflare, Namecheap forwarding will not work. Use Cloudflare instead:

1. In https://dash.cloudflare.com open **joinswarm.ai**, then **Email**, then **Email Routing**, then **Get started**.
2. Create the custom address `support`, and set the destination to the inbox you read (for example your Gmail).
3. Cloudflare sends a confirmation email to that inbox. Click the link in it. Then let Cloudflare **add the records** it suggests.
4. Send a test email to support@joinswarm.ai from another account. When it arrives, tell us, and we add the address to the site's structured data.

## 10. Later, as things go live

- **Whop:** when checkout is connected, name the store product "Swarm", put "AI crypto trading community" in its headline and link it back to https://www.joinswarm.ai. Tell us, so we add the prices to the site's structured data.
- **A Swarm X account**, if you want one: @joinswarm belongs to someone else; @joinswarmai was free when we checked. Set its website to https://www.joinswarm.ai and send us the handle.
- **LinkedIn:** if https://www.linkedin.com/in/0xjesusmartinez is yours, make it public, add Swarm under Experience and https://www.joinswarm.ai under Contact info, and tell us.
- **Podcasts and guest spots:** ask hosts to put https://www.joinswarm.ai in the show notes next to your channel links. Those are real links from other websites.
- **Directories:** free, honest listings (for example The Hive Index for Discord communities) help with "AI trading Discord" searches over time.
- **Always say whose Swarm it is:** "Swarm, my AI crypto trading community (joinswarm.ai)" or "Swarm by Jesus Martinez". Never just "Swarm".

## Do not

- Buy links, "best crypto Discord" placements dressed up as editorial picks, or reviews.
- Post or allow member counts, seats-left numbers, wins or testimonials until real, checkable ones exist. Google's spam rules and our real-data rule both forbid it.
- Use "agentic trading", "signals", "bot" or "copy trading" in titles and bios. Those searches are for AI that trades for you, which Swarm is not ("every decision stays yours").

## What to expect

- After steps 1 and 2, Google usually indexes the home page within a few days to two weeks. Check in Search Console under **Pages**.
- Once indexed, "swarm jm crypto", "jesus martinez swarm" and "joinswarm ai" should find the site quickly, because nobody owns those searches today.
- "AI crypto trading community" and "AI trading Discord" will take months and depend on the links in steps 4 to 8 and 12.
- "Swarm" on its own will not rank any time soon. Too many big projects share the name.

---

# Implemented

October 17, 2026, in the working tree of this repo. Not committed or deployed.

**Part 1, as written above:** title and meta description (1.1, 1.2), `swarm-site/structured-data.json` and the build changes that inject it, inline the hero mark and write the sitemap dates (1.3, 1.4, 1.7, 1.8), the 404 page, its route and the new routing in `next.config.ts` (1.5), social and robots tags (1.9), `data-nosnippet` and the founder alt text (1.10), the WebP founder photos (1.11), and the `LAUNCH-CHECKLIST.md` updates (1.15, step 8).

**Changed after review (where the code now differs from the snippets above):**
- `structured-data.json`: no `primaryImageOfPage`. It pointed to the social card, which never shows on the page. Organization `image` and og:image still use the card.
- Founder photo `sizes`: the last value is `455px`, not `650px`. Measured at 1024 to 1920 px, the photo renders 345 to 454 px wide, so a 1x desktop now loads the 640w WebP (74 KB) instead of the 800w (102 KB).
- `next.config.ts`: one more `beforeFiles` rewrite, `/swarm-site/404.html` to `/swarm/page-not-found`, so the built 404 file's own URL returns a real 404 with `X-Robots-Tag: noindex` instead of a 200 copy of the page.
- `LAUNCH-CHECKLIST.md`: the "Done" line now says which paths get Next's plain 404. Item 2 now says to keep the Vercel DNS records at Cloudflare as DNS only, so no second cache honors the one-year `s-maxage` on the sitemap, robots.txt and 404 responses.
- Part 2, "What changed": the hero logo line no longer suggests a file download was removed. `#final-mark` still loads `swarm-mark.svg`, so the request count is the same.

**Visible changes:** only the four in 1.12. The review fixes add none.

**Checks:** `node scripts/build-swarm-site.mjs` (run twice, second run identical), `npx tsc --noEmit`, `npm run lint`, `npm test` (23 of 23) and `npm run build` pass. On `next start` with host headers, every row of the 1.5 tables matches, plus `/swarm-site/404.html` returns 404 with noindex on joinswarm.ai (on martinezaccess.com it now redirects with a 307 to joinswarm.ai, as before). In headless Chrome the home page has one JSON-LD block that parses, no martinezaccess.com text, and no errors except Vercel Analytics' script, which exists only on Vercel.

**Removed on Jesus's decision (October 17):** the martinezaccess.com footer link, its structured data change and its permanent `/swarm` redirects were reverted, so `components/Footer.tsx`, `app/(site)/layout.tsx` and the martinezaccess.com redirects match `main`. Part 2 no longer has the martinezaccess.com Search Console, Vercel and About page steps.
