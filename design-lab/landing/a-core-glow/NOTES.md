# Direction A: Core Glow

**The idea.** The joinasymmetric.xyz flow (centered two-line headlines, fact chips, floating quote cards, pill eyebrows, product-mock grid, one centered pricing card) rebuilt inside the Swarm kit, where the hero's "light from above" is the Hive Core itself: hundreds of independent agents scan the honeycomb, reach consensus and stream into one cell at the top of the page, and the official mark lands there as its glow opens over the field. Every other motion piece repeats that idea at a smaller scale: the crowd under the crypto curve, the crowd's attention moving from games to AI, and a 3D hex patch in the Custom AI tools card that settles flat with one lit cell.

## Files

- `index.html`: the page (CSP meta, kit tokens, `.swarm` on body, Swarm icons and og:image).
- `core-glow.css`: all styles.
- `hero.js`: hero swarm (Canvas 2D, two canvases, mark SVG registered on the core cell).
- `crowd.js`: "The crowd" curve piece with the scroll-driven YOU tick.
- `page.js`: motion toggle, nav, chip marquee, the four mocks, why-now strip, final field, pricing switch, `PLANS` map and `mountCheckout(planKey)` stub.
- `tools3d.js`: Three.js r160 hex patch for the Custom AI tools card, lazy-loaded through the import map.
- `media/`: `fold-desktop.png`, `fold-phone.png`, `hero-desktop.mp4`, `hero-phone.mp4`, `scroll-desktop.mp4`.

URL switches: `?t=<ms>` freezes the hero at that time and shows every mock in its settled state; `?reduce=1` forces the reduced-motion still.

## Placeholders, [DATA NEEDED] and [CONFIRM]

All of these show on the page as dashed mono chips.

- Whop checkout: a dashed placeholder slot under the pricing card. `PLANS` in `page.js` holds `whopPlanId: null` for founding, standard and yearly; adding the three `plan_` IDs and the Elements mount in `mountCheckout()` is the only change needed. [DATA NEEDED: Whop plan IDs]
- Weekly live call day and time. [DATA NEEDED]
- Where Swarm lives (Whop app, Discord or other). [DATA NEEDED]
- Guest traders for the multi-cycle traders card. [DATA NEEDED]
- Refund policy. [DATA NEEDED]
- Launch date. [DATA NEEDED]
- Terms, Privacy and Refund policy URLs and the legal entity name. [DATA NEEDED]
- The AI tools do not place trades. [CONFIRM]
- What happens to the $49 founding price if a founder cancels and rejoins. [CONFIRM]
- Transcript wording and timestamps (00:40, 02:34, 02:50, 03:05, 03:51) come from a watch-through, not official captions. [CONFIRM]
- Mocks are illustrations: watch list asset names and trader names and messages are redaction bars, agent states use only SCANNING, WATCHING, FLAGGED FOR REVIEW, IDLE and SYNCING, and every mock carries "Illustration · not live data".
- The footer disclosure leaves out the two unconfirmed lines (adviser registration, holdings) until Jesus confirms them.
- The video is a composed poster that opens https://youtu.be/n15W6X84IGg in a new tab; production should swap in a youtube-nocookie click-to-load embed.

## Known issues

- Page length is about 11,990px on desktop (about 13 screens), over the 7 to 10 screen target in RESEARCH-NOTES.md but well under joinasymmetric.xyz. The easiest trims are the why-now strip and the how-joining steps.
- There are six gold "Join Swarm" stops (hero, curve, founder, members, the pricing button, final), not the five in RESEARCH-NOTES.md. I followed the brief ("repeated after most sections") and DIRECTIONS.md (CTAs after the curve and the founder). An automated check confirms no 1440x900, 390x844 or 820x1180 viewport ever shows two gold buttons, two gold numbers or two lit cores.
- Section order follows DIRECTIONS.md (curve, why now, video, founder, members, who it's for, pricing), which differs from the order in RESEARCH-NOTES.md.
- Copy I wrote around his lines, to check with Jesus: "In my first cycle, that was games. Since 2023, it's been AI.", "It isn't chasing stories. It wants real things.", the curve definitions (paraphrased from the brief), the who-it's-for headline "Your first cycle or your second. Either way, get there in one." and the how-joining headline. The why-now strip labels games as "2021 · Games" (his first cycle); the video's games example is 2020 to 2021.
- Performance was measured only in headless Chrome with software GL: script time is 1 to 5ms a frame, but compositing runs at 3 to 8 fps there, so the recordings are choppy. The hero, crowd and 3D timelines run on wall-clock time, so they still settle in about 5 seconds at low frame rates. Not yet checked on an iPhone 12-class device.
- Full-page screenshots taller than about 8,192px wrap around in this Chrome build, so the full-page review images were captured in segments and stitched.
- Under `?t` and reduced motion (and if WebGL fails) the Custom AI tools card shows a 2D still that matches the 3D scene's final frame, so the tilted 3D moment only appears live and in `scroll-desktop.mp4`.
- Under reduced motion on a phone the five fact chips wrap into four rows instead of a marquee; the gold CTA stays in the first screen.
- The live-call mock uses `jesus-interview.jpg`, desaturated, because its background is blue.
- The Whop placeholder reserves 400px; the real embed may need the 560px that RESEARCH-NOTES.md suggests.
- Motion that keeps running (hero scouts, the crowd, the phone chip marquee) shares one pause state with buttons in the hero and under the curve. The mocks and the why-now strip play once, within 5 seconds, when first seen.
