# Martinez Access

Personal website for Jesus Martinez, JM Crypto, and The Attention Cycle. Built with Next.js 16 App Router, React 19, and TypeScript. Production deploys from `main` to the Vercel project `new-website` at https://www.martinezaccess.com.

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

`app/globals.css` owns the site palette and responsive layouts. Inter is the main font. The Attention Cycle keeps its own ink and gold palette, approved aperture asset, actual GFS Didot Bold headlines, and JetBrains Mono labels. GFS Didot is distributed by the Greek Font Society via CTAN; the original font and its SIL license are in `public/fonts/`. The aperture asset is copied from the approved Attention Cycle brand folder.

`lib/site.ts` centralizes public channel, social, media-kit, and business-contact links. Every page has its own canonical URL and metadata. Avoid undated audience statistics. The second YouTube channel retains the legacy `@JesusMartinezTrades` handle but now describes The Attention Cycle; do not label its older trading uploads as new show episodes.

## YouTube feed

`lib/youtube.ts` fetches one Atom feed per requested channel. `lib/youtube-feed.ts` validates and decodes entries, builds safe watch/image URLs, deduplicates uploads, and formats dates in America/New_York. Videos may include Shorts. There are no per-video HEAD probes.

`lib/youtube-snapshot.json` contains verified JM Crypto upload metadata checked on September 23, 2026, and provides a useful fallback during YouTube outages. Live entries take precedence; known durations are preserved. Refresh this snapshot periodically from the actual channel. Do not invent titles, dates, or statistics. Visitors can always open the channel directly for every upload.

## Crypto tier lists

`/tier-list` serves the standalone ClassyCrypto builder adapted for Martinez Access. Its HTML, styles, JavaScript, local coin index, and bundled html2canvas 1.4.1 are in `public/tier-list-assets/`. A rewrite in `next.config.ts` gives it a clean URL and a separate document so its CSS cannot affect the site. Use regular anchors when linking to this route. The image renderer loads only when export or image sharing is requested.

Rankings save under `martinezAccessTierListState` in the visitor's browser. Share links encode rankings in the URL fragment; there is no server-side portfolio database. Logo and extended search requests use CoinGecko, with a bundled index for local search. Exports carry Martinez Access branding. The original ClassyCrypto project is maintained separately.

Verify coin search, ranking, custom labels, immediate-reload persistence, shared links, image export, and mobile navigation after changes. The standalone JavaScript is excluded from the Next.js ESLint rules and checked separately with `node --check`.
