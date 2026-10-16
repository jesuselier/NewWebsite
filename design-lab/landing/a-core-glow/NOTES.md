# Direction A: Core Glow

**The idea.** The joinasymmetric.xyz flow (fact chips, a compact two-line headline, floating cards, pill eyebrows, a product-mock grid, one centered pricing card) rebuilt inside the Swarm kit, with the Hive Core as the hero's "light from above". Agents run the honeycomb's corridors, sense cells, reach consensus and stream along the lattice to one core at the top of the page, where eighteen of them come to rest around it and the official mark lands as its glow opens.

## Files

- `index.html`: the page (CSP meta, kit tokens, `.swarm` on body, Swarm icons and og:image).
- `core-glow.css`: all styles.
- `hero.js`: hero swarm (Canvas 2D, two canvases, official `swarm-mark.svg` registered on the core cell, agents routed along the corridors between cells and around the copy). It also drives the hero's SCOUT 03 status card.
- `crowd.js`: "The crowd" curve piece with the scroll-driven YOU tick.
- `page.js`: motion toggle, nav state (the compact lockup appears once the hero mark has scrolled away), the four mocks, why-now strip, final field, pricing switch, `PLANS` map and `mountCheckout(planKey)` stub.
- `tools3d.js`: Three.js r160 hex patch for the Custom AI tools card, lazy-loaded through the import map. It ends as an unlit field with the scouts resting on it; no lit cell.
- `media/`: `fold-desktop.png`, `fold-phone.png`, `hero-desktop.mp4`, `hero-phone.mp4`, `scroll-desktop.mp4`.

URL switches: `?t=<ms>` freezes the hero at that time and shows every mock settled; `?reduce=1` forces the reduced-motion still.

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
- Mocks are illustrations: watch list names and reasons, and trader names and messages, are redaction blocks stamped MEMBERS ONLY. Agent states use only SCANNING, WATCHING, FLAGGED FOR REVIEW, IDLE and SYNCING. Every mock and the hero's scout card carry "Illustration · not live data".
- The footer disclosure leaves out the two unconfirmed lines (adviser registration, holdings) until Jesus confirms them.
- The video is a composed poster that opens https://youtu.be/n15W6X84IGg in a new tab; production should swap in a youtube-nocookie click-to-load embed.

Every quote on the page (hero card 0:09, why-this-cycle chips 2:15, both who-it's-for cards 3:39, transcript 2:33, 2:48 and 3:02) is copied word for word from `swarm-intro-transcript.md` and links to its timestamp, so the old wording chip is gone.

## Known issues

- Page length is about 11,730px on desktop (about 13 screens), over the 7 to 10 screen target in RESEARCH-NOTES.md but under joinasymmetric.xyz. The easiest trims are the why-now strip and the how-joining steps.
- Six gold "Join Swarm" stops (hero, curve, founder, members, the pricing button, final), not the five in RESEARCH-NOTES.md, following the brief and DIRECTIONS.md. An automated scroll check at 1440x900, 390x844 and 820x1180 finds at most one gold button, one gold number and one lit core per view.
- Section order follows DIRECTIONS.md, which differs from RESEARCH-NOTES.md.
- Copy I wrote around his lines, to check with Jesus: the why-now lede ("In my first cycle, that was games. Since 2023, it's been AI." and "It isn't looking for dog coins..."), the curve definitions, and the headlines for the founder ("Two cycles behind me. This one is my third."), who-it's-for, how-joining, the video and the FAQ. The why-now strip labels games "2021 · Games" (his first cycle); the video's games example starts in 2020.
- At the top of the page the nav shows no logo: the compact lockup fades in once the hero mark has scrolled out, so the first screen holds one lit core. When the poster or the footer is in view, the nav lockup and that lockup are both visible (logos only).
- The eighteen resting agents sit on the corridor corners just outside the mark's outer outline, about 1px from its stroke.
- Performance was measured only in headless Chrome with software GL. Compositing runs at a few frames per second there, so `hero-desktop.mp4` has 16 frames and `scroll-desktop.mp4` plays for about 49 seconds (the recorder keeps real capture timestamps). The hero, crowd and 3D timelines run on wall-clock time, so they still settle in about 5 seconds. Not yet checked on an iPhone 12-class device.
- Full-page screenshots taller than about 8,192px wrap in this Chrome build, so review images were captured in segments and stitched.
- Under `?t`, reduced motion or no WebGL, the Custom AI tools card shows a 2D still of the 3D scene's last frame, so the tilted 3D moment only appears live and in `scroll-desktop.mp4`.
- The live-call mock uses `jesus-interview.jpg`, desaturated, because its background is blue.
- The Whop placeholder reserves 400px; the real embed may need the 560px RESEARCH-NOTES.md suggests.

## Review

Scores from the screenshot review: reference fit 6.5, agentic feel 6, premium 6.5, clarity and trust 6, kit compliance 7, phone 7.

What I fixed:

- **Verbatim quotes.** Hero card is now "If it's your second cycle, you're probably mid-curve around this time. I know I was." (0:09). The why-this-cycle chips read "They want real things. They want real revenue. They want real users." (2:15) in sentence case. Both who-it's-for cards quote 3:39 word for word. The founder transcript card carries the full caption text at 2:33, 2:48 and 3:02. The [CONFIRM] wording chip is deleted, and a script check confirms every quoted string is a substring of the transcript at its stamp.
- **No repeats.** The right hero card is a live agent-status card (SCOUT 03, stepping SCANNING to WATCHING to FLAGGED FOR REVIEW with the hero phases, labelled as an illustration). The post-curve paragraph is gone (the CTA stands alone). The founder headline, the who-it's-for headline, the how-joining headline, the why-now lede and the FAQ answers were rewritten so no sentence appears twice from the fold to the final CTA.
- **Hero proportions.** At 1440x900 the cluster is about 118px tall (y 71 to 189), the chips sit at y 217, the headline is two balanced lines between y 262 and 377 (50px, about 910px wide), the CTA is at y 497 to 553, and the next section's pill (y 787) and first headline line (y 836 to 888) are in the first screen. The cards flank the headline's second line and the sub.
- **Hive Core.** The hero cluster is, and was, the official `swarm-mark.svg` in an `<img>`, now smaller and registered on a field of the same pitch. The Agent Console's 3D patch no longer lights a cell or shows a mark: the scouts move over an unlit #1C1C21 field and finish as resting dots.
- **Agents.** They now travel the corridors between cells (the honeycomb's own edges), route around the copy and cards, and are drawn at 12% opacity wherever they do cross the reading zone. Committed agents converge along the lattice; eighteen dock on the neighbour cells' outer corners and the rest are absorbed. Spawns are concentrated under the core, so the lower hero stays quiet. The reduced-motion still is the settled frame with no trails, pings or pulses.
- **Members grid.** Grey skeleton bars are replaced by solid redaction blocks stamped MEMBERS ONLY. Watch list row 03 cycles WATCHING, REVIEWING, NEW THIS WEEK. The live-call "Next call" row and the guest-traders chip moved into the card text, so the paired cards end at their content (largest gap under a last line is 38px desktop, 27px phone).
- **Phone.** The chip marquee is gone: two static centered rows (PRE-LAUNCH, $49/MO · 50 FOUNDING SEATS / CUSTOM AI TOOLS, CARD OR ACH THROUGH WHOP) with whole words only. The curve caption is shorter and stacks above the pause button.
- **Logos.** The footer uses the compact lockup (184px desktop, 156px phone). The nav uses the compact lockup per the kit, revealed on scroll as described above.
- **Clarity.** The FAQ headline is "Not financial advice. Not a promise. / Here's exactly what you're joining." The hero chip reads "$49/mo · 50 founding seats" in mono text color (not gold), so the price is in the first screen.

What I skipped or changed, and why:

- Headline at 50px rather than 52 to 56px, and the sub kept in the hero (so the CTA lands at y 497, not 430): at 52px and up the headline is too wide for the cards to sit beside it without touching, and the sub is the first screen's only plain statement of what Swarm is.
- Redaction blocks use the kit's raised surface (#16161A) with a 1px #232328 border instead of #1C1C21, because the kit reserves #1C1C21 for background honeycomb fields.
- FAQ setup line is "Not financial advice. Not a promise." rather than "No signals to copy", because whether Swarm shares signals is not confirmed.
- The hero mark stays the official SVG (the review's option a) rather than a 1.5px redraw, because the kit forbids redrawing the mark.
