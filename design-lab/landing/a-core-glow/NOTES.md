# Direction A: Core Glow

Picked by Jesus on October 16, 2026 ("Core glow definitely"), with one note: the agents' head-and-tapering-tail look read as sperm and did not make sense. Every agent on the page now uses one language: a small pointy-top hexagonal node that hops corner to corner along the honeycomb's own channels, lighting the edge it crosses for about 600ms. No tails, trails, glows or curved paths anywhere.

**The idea.** The joinasymmetric.xyz flow (fact chips, a two-line two-tone headline, tilted floating cards, pill eyebrows, a product-mock grid, one centered pricing card) rebuilt inside the Swarm kit, with the Hive Core as the hero's light from above. The honeycomb fills the first screen; agents work it as a network, agree, route along shared paths to the core, the six neighbours light as they arrive, and the official mark lands as its warm light opens.

## Files

- `index.html`: the page (CSP meta, kit tokens, `.swarm` on body, Swarm icons and og:image).
- `core-glow.css`: all styles.
- `lattice.js`: the shared honeycomb lattice (cells at pitch 1.95R, copied from the mark) and the agent engine: corridor-lattice graph, hop scheduling, lit edges, hexagonal node drawing. Used by every animated piece.
- `hero.js`: the hero (field canvas, a static glow layer and a static warm-tint canvas the compositor fades in, the agent canvas, and the official `swarm-mark.svg` on the core cell). Drives the SCOUT 03 card.
- `crowd.js`: "The crowd" curve with hexagonal nodes; runs two cycles (about 15s) then settles and stops.
- `page.js`: motion toggle, nav, the four mocks, the scout-field model for the tools card, the why-now strip, the pricing core, the final field, the pricing switch, `PLANS` and `mountCheckout(planKey)`.
- `tools3d.js`: Three.js r160 renderer for the tools card's scout field (lazy import, 2D still fallback).
- `media/`: `fold-desktop.png`, `fold-phone.png`, `hero-desktop.mp4`, `hero-phone.mp4`, `scroll-desktop.mp4` (recorded with `rec.mjs`), plus `hero-desktop-frames.mp4` and `hero-phone-frames.mp4` (frame-accurate renders, see Known issues).

URL switches: `?t=<ms>` freezes the hero at that time and shows every mock settled; `?reduce=1` forces the reduced-motion still.

## Hero timeline (desktop; phone uses fewer agents)

- 0 to 1.2s: the field boots ring by ring from the core (a #55555B wave that settles to #1C1C21), seen as a receding plane (CSS 3D tilt from 40 degrees) that straightens out by 2.35s. The core cell shows as a dim 1.5px gold outline from about 0.2s.
- 0.2 to 1.4s: 196 agents wake across the whole screen (thinner toward the edges and at 13% behind the copy, never on a glyph at full strength) and scan: each hop is 175 to 260ms with an ease, each crossed edge lights (scouts #8E8A80, committed #EEEBE4, 1.5px) and fades over 600ms, visited cells brighten briefly.
- 1.0 to 2.8s: 70% commit and route along a shared tree of paths toward the core (paths prefer the six arteries leaving the cluster, so they merge into trunks). Each arrival lights the neighbour cells at that corner in #55555B; agents then enter the core.
- About 2.75s: the official mark lands (opacity and a 0.93 to 1 scale over 380ms), its warm light opens over 1s (radius 640px, 1.5 times wider than tall, reaching the chips), one ring wave runs out across the field, scouts fade where they stand.
- About 4.3s: everything is settled and the loop stops. The settled frame is the honeycomb, the warm light and the one lit cell, and it is pixel-identical to `?t=4800` and to the reduced-motion still.

## Placeholders, [DATA NEEDED] and [CONFIRM]

Visible as dashed mono chips, now only in the FAQ, the checkout slot and the footer (none on the hero or the members cards):

- Whop plan IDs (checkout slot). `PLANS` in `page.js` holds `whopPlanId: null` for founding, standard and yearly; adding the IDs and the Elements mount in `mountCheckout()` is the only change needed.
- Weekly call day and time; guest traders; refund policy; where Swarm lives; launch date; Terms, Privacy and Refund URLs and the legal entity.
- [CONFIRM] the AI tools do not place trades; [CONFIRM] what happens to $49 if a founder cancels and rejoins.
- Mocks are illustrations: names, reasons and messages are word-shaped redaction bars, with one "Members only" lock chip per mock. Agent states use only SCANNING, WATCHING, FLAGGED FOR REVIEW, IDLE and SYNCING; watch-list chips only WATCHING, NEW THIS WEEK and REMOVED. Every mock and the scout card carry "Illustration · not live data".
- The video is the founder card's poster and opens https://youtu.be/n15W6X84IGg in a new tab; production should use a youtube-nocookie click-to-load embed.

## Quotes on the page (all from FOUNDER-DOSSIER.md section 3 or Draft A)

- Hero card: Q09, 3:51 (?t=231).
- Why this cycle chips: Q04, 2:23 (?t=143).
- Founder transcript: Draft A word for word, 2:33, 2:48 and 3:02, source line "Jesus Martinez, "Welcome To Swarm", JM Crypto on YouTube, October 16, 2026." Only "I stayed through the bear market when everyone else left." is set bright; "It wasn't luck" sits unemphasized inside its passage (C2).
- Who it's for: one transcript card stamped with the passage start, 3:39, holding both of his lines from that passage verbatim.
- Before you join: Q15, labeled "The Attention Cycle, Aug 7, 2026", linking to the X Article.
- FAQ: Q20 as the disclaimer line.
- Nothing from section 10 is used.

## Copy I wrote around his lines (to check with Jesus)

"I'm Jesus Martinez of JM Crypto." at the start of the hero sub; the curve definitions; the why-now lede; the headlines "Two cycles behind me. / This one is my third.", "No more believing and hoping. / Here's what you get instead.", "Your first cycle or your second. / Either way, this is where you start.", "Not financial advice. Not a promise. / Here's exactly what you're joining." and "Be on the right side of this cycle. / I'll see you inside."; the three check lines under each benefit; the FAQ answers; the line "Education and research, not financial advice. You make your own decisions."

## Known issues

- Headless Chrome here renders with software GL, so the live hero manages only a few frames a second and `hero-desktop.mp4` (rec.mjs) has about 10 distinct frames in 8 seconds. Timing is still right because the simulation runs on wall-clock time. `hero-desktop-frames.mp4` and `hero-phone-frames.mp4` are frame-accurate 30fps renders of the same sequence (made by stepping the frozen hero with `?t` and `window.__heroSeek`), so the motion can be judged properly. Not yet checked on an iPhone 12-class device.
- Full-page screenshots taller than about 8,192px wrap in this Chrome build, so the `d-NN`/`p-NN` tiles past that point repeat the top of the page. The round 2 capture adds `vp-d-NN.png` and `vp-p-NN.png`, one screenshot per viewport down the whole page.
- The hero uses three canvases plus one CSS gradient layer (RESEARCH-NOTES suggests two canvases). The extra canvas and the gradient are drawn once and only faded by the compositor, so per-frame cost is two canvases.
- Page length: 10,766px on desktop (11.96 viewports at 1440x900), 13,968px on phone.
- The founder card crops the landscape studio photo to a tall frame, so his face is large.
- The why-now strip labels games "2021 Games" (his first cycle); the video's games example starts in 2020.

## Review history

### First look

Scores from the screenshot review: reference fit 6.5, agentic feel 6, premium 6.5, clarity and trust 6, kit compliance 7, phone 7. Fixes then: verbatim quotes, no repeated lines, hero proportions, the official mark in an `<img>`, solid redaction blocks, static phone chips, the compact lockup in the footer.

### Round 1 (October 16, 2026)

Review averages: reference 6.5, motion 5.2, buyer 6.5; the code audit raised 3 blocking items (an unverified hero quote, a wrong 2:15 stamp, two lit cores in one view).

What changed:

- **Agents (Jesus's note, the top priority).** New shared engine (`lattice.js`): every agent is a hexagonal node (5 to 6px desktop, 4px phone) hopping along the corridor lattice with a 175 to 260ms eased hop; crossed edges light and fade over 600ms; sensed cells brighten. Applied to the hero, the curve beeswarm, the why-now strip, the tools card (3D and still), the pricing core and the final field. No head-and-tail marks remain anywhere.
- **Hero owns the first screen.** The field covers the full viewport; agents work all of it, around and behind the cards and faintly behind the copy; the mark is 210px (the cluster is 150px tall) on desktop and 142px (102px) on phone, with a 640px warm light; a receding-plane opening (CSS 3D tilt) gives the depth the brief asks for; convergence reads by 2.8s and everything stops by 4.3s. No specks, no floating outlines, no resting agents at rest. The hero HUD and its pause pill are gone (the sequence ends before 5s).
- **Brand.** `swarm-wordmark-for-dark-bg.svg` (no gold) is in the nav from the first frame at 136px (118px on phone); no typed SWARM labels; the footer uses the horizontal lockup at 260px. A scan every 120px at 1440, 820 and 390 wide finds at most one gold button, one lit core and one gold number per view.
- **Quotes.** Hero card is Q09 (3:51); the real-things chips are 2:23; the transcript is Draft A; the bold on "It wasn't luck" is gone.
- **Mocks.** Flush app windows (no double border) with title bars: the agent console (3D scout field with four labelled scouts on leader lines, four scout rows, a five-line event log), the watch list (tabs, lock chip, five rows of word-shaped redaction, an expanded "Jesus's note" row, three state changes then rest), the live call (shared portfolio review, host tile, two members, an audio strip and controls) and the trader room (rooms rail, messages with avatars and role tags, replies, typing, composer). Three check lines under each benefit. No prices, tickers, results or counts.
- **Trust.** The hero sub names him; "Education and research, not financial advice. You make your own decisions." under the members grid; a "Before you join" block with Q15 right above pricing; [DATA NEEDED] chips moved off the launch cards into the FAQ.
- **Layout and type.** H1 64px over 44px section heads (33px over 27px on phone); chips unified; the intro video merged into the founder section; the Hive Core and a small field above the pricing switch, where 34 agents route in and the mark lights; a quiet honeycomb behind the founder and members sections; Whop slot reserved at 560px; the scout card's height reserved (no layout shift); tap targets of 28px or more for timestamps and 44px for the nav button.
- **Code audit items.** The crowd's YOU tick is fixed under reduced motion and the loop settles; WebGL is only probed when the tools card nears the viewport; the tools card rebuilds on resize; `aria-live` covers only the price and note; plan chips no longer repeat the note; "Reviewing" is gone; dead CSS removed; the title is "Swarm: AI Crypto Trading Community".

Calls where reviewers disagreed (the creative director notes decided where they spoke):

- Core timing: the reference review wanted the core lit by 1.5s, the motion review and the director wanted convergence as the climax. The core's gold outline shows dim from 0.2s and the mark lands at about 2.75s.
- Text clearance: the motion review asked for a 24px exclusion zone; the director asked for agents faintly behind the copy. Agents, edges and pings drop to 13% inside the copy's line boxes with a soft 22px edge.
- Two-tone headlines on most sections are kept (the brief asks for them; the motion review wanted them on two sections only).
- H1 at 64px rather than 80px (80px breaks the headline into four lines at 1440); 33px on phone rather than 44px ("Most people need" does not fit 358px at 44px).
- The receding plane is the opening camera of the whole field rather than a permanent plane under the headline, so the mark lands on a flat field registered to its cells.

Skipped, and why:

- The buyer review's line "No trade signals. No copy trading. No automated trading for you." is not on the page: none of it is confirmed, dossier section 9 lists those phrases as claims not to make, and the FAQ keeps [CONFIRM: the tools do not place trades].
- Q17 ("How do I continue to provide value...") is not used until Jesus checks the audio, as the dossier asks.
- The icon-only hero pause button: the hero now stops by itself in about 4.3s, under WCAG 2.2.2's 5 seconds; the crowd, which runs longer, keeps its pause control until it settles.
- The how-joining steps section stays out (removed earlier to keep the page within length); its three facts live in the pricing card, the checkout slot and the FAQ.
