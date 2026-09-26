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

Browser checks should cover desktop and phone navigation, every page, video images and links, the homepage Start here links and Attention Cycle disclosure, reduced-motion behavior, email copy feedback, and the tier-list flows below. The core pages are server rendered; the home and video pages refresh their YouTube feed every 30 minutes.

## Branding and content

`app/globals.css` owns the soft charcoal, slate, and muted JM cyan palette and responsive layouts. Jesus rejected the bright page background as uncomfortable on September 23, 2026; keep the site dark by default, including panels and hover states, with readable off-white and grey text. This website preference does not change thumbnail styling. Inter is the main font. The homepage adds Newsreader as an editorial display face for its headlines, loaded only on the homepage through `components/home/fonts.ts`; body text stays in Inter. The site focuses on JM Crypto; The Attention Cycle is currently paused. `/channels` redirects to `/latest` for older bookmarks.

`lib/site.ts` centralizes public links and dated audience statistics. The current business/contact email is `jesus@martinezaccess.com`, updated at Jesus's request on September 25, 2026. The September 23, 2026 public profile checks returned 40,000 JM Crypto subscribers (YouTube's rounded public count) and 322,735 X followers. These are dated snapshots, not live counters. Instagram is `@jesusmartinezbuilds`. Every page has its own canonical URL and metadata.

The story is grounded in Jesus's supplied video captions: his brother's leveraged-trading loss, the $700 Axie Infinity start, and mid-five figures through its breeding market. Do not imply those earnings happened in a week or generalize the personal outcome into a return promise.

The original press-kit Google Drive folder was unavailable. `/press-kit` now hosts four downloadable portraits, copyable bios, channel artwork, dated audience figures, contact details, a one-page PDF, and an all-in-one ZIP. `public/media/jesus-martinez-studio.jpg` and `jesus-martinez-portrait.jpg` are Jesus's original 1920x1080 studio photographs from his Camera Roll.

The landing-page introduction uses `jesus-martinez-city-portrait.png`, an AI-assisted crop and restrained color correction of Jesus's supplied New York nighttime photograph. Jesus requested a tighter crop and color correction after choosing the camera-facing city portrait. Keep the natural smile, eye contact, and visible skyline. The studio originals remain available. The candid professional portrait sits to the left of the homepage story text and also appears on `/about`, so his gaze leads toward the story on desktop.

`public/media/jesus-martinez-professional.jpg` is the original `C2_09680.JPG` selected from Jesus's supplied professional shoot folder on September 23, 2026. Source: https://drive.google.com/file/d/1zlg4FdtsuWOLd5-gnTlpZhqzc1W-z0cz/view (folder `16j5_T-xpDHJVKr27UzPVgFS5amWheSMw`). Original photographs are preserved; Next Image handles orientation and optimized responsive delivery. Check both portrait crops at desktop, tablet, and phone widths when changing their containers.

## Homepage

`components/JesusHome.tsx` sets the pacing: an introduction that says who Jesus is and what JM Crypto offers, with a link that sends new visitors to Start here; a curated Start here path; the story; the Attention Cycle; the latest uploads; the tier-list tool; and contact. Homepage sections live in `components/home/` with their styles in `components/home/home.module.css`. `ContactStrip` in `components/SiteSections.tsx` is shared with `/about`.

`lib/start-here.ts` holds the three curated long-form videos (perspective, research, interview) with titles, durations, and publish dates checked against the public video pages on September 25, 2026, plus a short note on why each is a good starting point. Keep titles exactly as published and re-check them if a video is retitled or replaced. The Attention Cycle's video link points to the first entry. The latest-uploads grid still comes from `getFullLatest(4)`, so Shorts stay excluded.

Motion is limited to a short entrance in the hero, one-time reveals on scroll, hover states, and the disclosure. `components/home/ScrollReveal.tsx` only hides content after hydration, never for visitors who prefer reduced motion, and never for anything already on screen, so the page is fully readable without JavaScript. Homepage copy follows the house rule of no em or en dashes.

## Media kit downloads

`lib/media-kit.json` owns the bios, photo descriptions, usage notes, and channel details. The public YouTube profile returned 3,817,819 lifetime views on September 23, 2026. The banner in `public/media-kit/` is the current public artwork from `@jm_crypto`, retrieved that day. At Jesus's request, the public kit omits photo-treatment labels and editing notes. Source provenance stays in the internal content data. Photo metadata respects EXIF orientation; the professional portrait displays at 4000 x 6000 pixels.

After changing kit content or the public audience counts in `lib/site.ts`, regenerate the PDF, text files, ZIP, and `lib/media-kit-downloads.json` together:

```sh
npm run media-kit -- --python /path/to/python
```

The builder requires Node 24 (or 22.18+) and Python with Pillow and reportlab. Omit `--python` to use `PYTHON` or the `python` command. All generated downloads are committed, so Vercel does not require Python. The ZIP contains only the four listed photos, banner, PDF, bios, official links, dated facts, and usage notes. Review the rendered PDF, copy buttons, individual downloads, ZIP contents, and phone layout before publishing. Audience figures are dated snapshots and need a fresh public-profile check when updated.

## Website analytics

Vercel Web Analytics is enabled for `new-website`. Open the private dashboard at https://vercel.com/jesuseliers-projects/new-website/analytics to see visitors, page views, traffic sources, countries, and devices. Select Production and the desired date range; use Hostnames to distinguish www.martinezaccess.com from Vercel aliases.

`app/layout.tsx` mounts `@vercel/analytics/next` once for every Next.js page, including client-side route changes. The standalone tier-list document loads `/tier-list-analytics.js` because its rewrite bypasses the layout. That static Route Handler uses Vercel's deployment-provided analytics configuration so the tool follows the same script and collection endpoints as the Next.js SDK, rather than relying on the legacy collector. Preserve both integrations when changing layouts or replacing the tier-list HTML. Its `beforeSend` hook removes URL fragments so shared coin rankings are not included in page-view URLs; no custom events or visitor identity fields are sent by the application.

Collection began with this integration; visits from before it cannot be reconstructed by Web Analytics. The Hobby plan supports traffic analytics but not custom events. Its current allowance is 50,000 events per month across the team and a one-month reporting window; exceeding the allowance can pause collection. Recheck Vercel's current limits before changing plans. No paid upgrade is required for this setup.

To verify after deployment: visit the production homepage, follow an internal link, and open `/tier-list`. Confirm the tracking script loads, check for browser errors, and verify those page paths appear in the Analytics dashboard after processing. Local Next.js development uses the SDK's development mode and does not send production page views.

## YouTube feed

`lib/youtube.ts` fetches JM Crypto's Atom feed and its Videos tab in parallel. `lib/youtube-feed.ts` reads the Videos tab's data without executing page JavaScript, validates and decodes entries, builds safe watch/image URLs, deduplicates uploads, and formats dates in America/New_York. Only IDs verified on the Videos tab or in the long-form snapshot may appear. Shorts are excluded. If classification fails, unknown uploads are withheld; duration is never used to guess whether an upload is a Short. There are no per-video HEAD probes.

`lib/youtube-snapshot.json` contains verified JM Crypto upload metadata. The two newest entries were checked and added on September 25, 2026; the rest were checked on September 23, 2026. It provides a useful fallback during YouTube outages. Live entries take precedence; known durations are preserved. Refresh this snapshot periodically from the actual channel. Do not invent titles, dates, or statistics. Visitors can always open the channel directly for every upload.

## Attention Cycle explainer

The homepage's `#attention-cycle` section explains Jesus's research framework in two layers. The always-visible summary carries the definition, the quoted law, the five stages, the round trip, and the invalidation condition. A native `<details>` disclosure holds the interactive five-stage explorer and the gaming/AI pathway comparison, so it works without JavaScript and stays keyboard accessible. Stage copy lives in `components/attention-cycle-stages.ts`, shared by both layers. It is grounded in his August 7, 2026 X Article: https://x.com/JesusMartinez/status/2085797626448896297. It does not restart or promote the paused second channel.

At Jesus's request, the website explainer uses the site's own typography, slate surfaces, and muted teal accents rather than the channel's gold branding. On the homepage redesign that means the homepage type system (Newsreader headings, Inter text); set `--cycle-display` in `AttentionCycle.module.css` to `inherit` to return its headings to Inter. Its central diagram uses text rather than the separate channel's gold aperture. This site-specific adaptation does not change the Attention Cycle's canonical standalone branding. Both the round trip and the invalidation condition stay visible. The AI-crypto handoff is labeled as a thesis, and the diagrams contain no fabricated prices, measured flows, or undated market statistics.

The opening portrait uses the edited city photograph with responsive CSS framing. The shared footer has an oversized outlined JESUS MARTINEZ signature and a back-to-top link; check the full name at phone and wide desktop sizes when changing typography.

Check the disclosure with mouse and keyboard, all five stage buttons, keyboard activation, the next-stage wrap, responsive diagrams, the article and video links, and the footer anchor after changes.

## Crypto tier lists

`/tier-list` serves the standalone ClassyCrypto builder adapted for Martinez Access. Its HTML, styles, JavaScript, local coin index, and bundled html2canvas 1.4.1 are in `public/tier-list-assets/`. A rewrite in `next.config.ts` gives it a clean URL and a separate document so its CSS cannot affect the site. Use regular anchors when linking to this route. The image renderer loads only when export or image sharing is requested.

Rankings save under `martinezAccessTierListState` in the visitor's browser. Share links encode rankings in the URL fragment; there is no server-side portfolio database. Logo and extended search requests use CoinGecko, with a bundled index for local search. Exports carry Martinez Access branding. The original ClassyCrypto project is maintained separately.

Verify coin search, ranking, custom labels, immediate-reload persistence, shared links, image export, and mobile navigation after changes. The standalone JavaScript is excluded from the Next.js ESLint rules and checked separately with `node --check`.
