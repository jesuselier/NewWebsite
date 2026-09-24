# Martinez Access

Personal website for Jesus Martinez, creator of JM Crypto. Built with Next.js 16 App Router, React 19, and TypeScript. Production deploys from `main` to the Vercel project `new-website` at https://www.martinezaccess.com.

## Develop and verify

Use Node 24 (or Node 22.18+ for the native TypeScript feed tests).

```sh
npm ci
npm run dev
npm test
npm run lint
npm run build
node --check public/tier-list-assets/script.js
```

Browser checks should cover desktop and phone navigation, every page, video images and links, email copy feedback, and the tier-list flows below. The core pages are server rendered; the home and video pages refresh their YouTube feed every 30 minutes.

## Branding and content

`app/globals.css` owns the paper, navy, and JM cyan palette and responsive layouts. Inter is the main font. The site focuses on JM Crypto; The Attention Cycle is currently paused. `/channels` redirects to `/latest` for older bookmarks.

`lib/site.ts` centralizes public links and dated audience statistics. The September 23, 2026 public profile checks returned 40,000 JM Crypto subscribers (YouTube's rounded public count) and 322,731 X followers. These are dated snapshots, not live counters. Instagram is `@jesusmartinezbuilds`. Every page has its own canonical URL and metadata.

The story is grounded in Jesus's supplied video captions: his brother's leveraged-trading loss, the $700 Axie Infinity start, and mid-five figures through its breeding market. Do not imply those earnings happened in a week or generalize the personal outcome into a return promise.

The original Google Drive folder was unavailable. `/press-kit` now hosts the bio, dated audience numbers, contact details, and a downloadable portrait. `public/media/jesus-martinez-studio.jpg` and `jesus-martinez-portrait.jpg` are Jesus's original 1920x1080 studio photographs from his Camera Roll; the originals are preserved and Next Image optimizes display sizes.

## YouTube feed

`lib/youtube.ts` fetches JM Crypto's Atom feed and its Videos tab in parallel. `lib/youtube-feed.ts` reads the Videos tab's data without executing page JavaScript, validates and decodes entries, builds safe watch/image URLs, deduplicates uploads, and formats dates in America/New_York. Only IDs verified on the Videos tab or in the long-form snapshot may appear. Shorts are excluded. If classification fails, unknown uploads are withheld; duration is never used to guess whether an upload is a Short. There are no per-video HEAD probes.

`lib/youtube-snapshot.json` contains verified JM Crypto upload metadata checked on September 23, 2026, and provides a useful fallback during YouTube outages. Live entries take precedence; known durations are preserved. Refresh this snapshot periodically from the actual channel. Do not invent titles, dates, or statistics. Visitors can always open the channel directly for every upload.

## Crypto tier lists

`/tier-list` serves the standalone ClassyCrypto builder adapted for Martinez Access. Its HTML, styles, JavaScript, local coin index, and bundled html2canvas 1.4.1 are in `public/tier-list-assets/`. A rewrite in `next.config.ts` gives it a clean URL and a separate document so its CSS cannot affect the site. Use regular anchors when linking to this route. The image renderer loads only when export or image sharing is requested.

Rankings save under `martinezAccessTierListState` in the visitor's browser. Share links encode rankings in the URL fragment; there is no server-side portfolio database. Logo and extended search requests use CoinGecko, with a bundled index for local search. Exports carry Martinez Access branding. The original ClassyCrypto project is maintained separately.

Verify coin search, ranking, custom labels, immediate-reload persistence, shared links, image export, and mobile navigation after changes. The standalone JavaScript is excluded from the Next.js ESLint rules and checked separately with `node --check`.
