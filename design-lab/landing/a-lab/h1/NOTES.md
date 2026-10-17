# Direction A: Core Glow

Picked by Jesus on October 16, 2026 ("Core glow definitely"), with one note: the agents' head-and-tapering-tail look read as sperm and did not make sense. Every agent on the page now uses one language: a small pointy-top hexagonal node that hops corner to corner along the honeycomb's own channels, lighting the edge it crosses for about 600ms. No tails, trails or curved paths anywhere. The only glows are the core's own light and, since round 3, the revolving light on the gold Join Swarm buttons that Jesus asked for.

**The idea.** The joinasymmetric.xyz flow (fact chips, a two-line two-tone headline, tilted floating cards, pill eyebrows, a product-mock grid, one centered pricing card) rebuilt inside the Swarm kit, with the Hive Core as the hero's light from above. The honeycomb fills the first screen; agents work it as a network, agree, route along shared paths to the core, the six neighbours light as they arrive, and the official mark lands as its warm light opens.

## Files

- `index.html`: the page (CSP meta, kit tokens, `.swarm` on body, Swarm icons and og:image). Each gold button carries its ring as inline SVG (`.ring`).
- `core-glow.css`: all styles.
- `lattice.js`: the shared honeycomb lattice (cells at pitch 1.95R, copied from the mark) and the agent engine: corridor-lattice graph, hop scheduling, lit edges, hexagonal node drawing. Used by every animated piece.
- `hero.js`: the hero (field canvas, a static glow layer and a static warm-tint canvas the compositor fades in, the agent canvas, and the official `swarm-mark.svg` on the core cell). Drives the SCOUT 03 card (Scanning, Analyzing, Reporting) and keeps agents above the members rail.
- `crowd.js`: "The crowd" curve with hexagonal nodes; runs two cycles (about 15s) then settles and stops.
- `page.js`: motion toggle, nav, the Join Swarm ring's offscreen pause, the four mocks, the scout-field model for the tools card, the why-now strip, the pricing core, the final field, the pricing switch, `PLANS` and `mountCheckout(planKey)`.
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
- Mocks are illustrations: watch-list rows read Asset 01 to Asset 05 (never a real ticker, price or percentage); reasons, names and messages are word-shaped redaction bars, with one "Members only" lock chip per mock. Scout states use only SCANNING, ANALYZING and REPORTING (lines like "Scanning the market", "Analyzing a setup", "Reporting to the watch list"); watch-list chips only WATCHING, NEW THIS WEEK and REMOVED. Every mock and the scout card carry "Illustration · not live data".
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

"I'm Jesus Martinez of JM Crypto." at the start of the hero sub; the curve definitions; the why-now lede; the headlines "Two cycles behind me. / This one is my third.", "No more believing and hoping. / Here's what you get instead.", "Your first cycle or your second. / Either way, this is where you start.", "Not financial advice. Not a promise. / Here's exactly what you're joining." and "Be on the right side of this cycle. / I'll see you inside."; the three check lines under each benefit; the FAQ answers; the line "Education and research, not financial advice. You make your own decisions." Added in round 3: the hero rail's short lines ("Built and maintained by me", "What I'm looking at", "Live portfolio reviews", "How they see the market now"); the tools card line "I'm still building them. Join early and you get each one as it's finished."; the pricing note "The custom AI tools are still being built. Join now and you get each one as it ships, at the founding price. Prices go up as they're completed."; the FAQ "Are the AI tools ready?"; the scout lines.

## Known issues

- Headless Chrome here renders with software GL, so the live hero manages only a few frames a second and `hero-desktop.mp4` (rec.mjs) has about 10 distinct frames in 8 seconds. Timing is still right because the simulation runs on wall-clock time. `hero-desktop-frames.mp4` and `hero-phone-frames.mp4` are frame-accurate 30fps renders of the same sequence (made by stepping the frozen hero with `?t` and `window.__heroSeek`), so the motion can be judged properly. Not yet checked on an iPhone 12-class device.
- Full-page screenshots taller than about 8,192px wrap in this Chrome build, so the `d-NN`/`p-NN` tiles past that point repeat the top of the page. The round 2 capture adds `vp-d-NN.png` and `vp-p-NN.png`, one screenshot per viewport down the whole page.
- The hero uses three canvases plus one CSS gradient layer (RESEARCH-NOTES suggests two canvases). The extra canvas and the gradient are drawn once and only faded by the compositor, so per-frame cost is two canvases.
- Page length: 11,063px on desktop (12.3 viewports at 1440x900), 14,340px on phone.
- The hero rail shows from 641px up (on tablets it sits under the stacked quote cards, in a smaller type size). On phones the stacked quote card already fills the bottom of the first screen, so there is no rail and the chip strip keeps Custom AI tools.
- Below 900px tall the hero shrinks to fit, down to 800px (1280x800 fits exactly). At 1366x768 the rail's line sits at 713px and is cut by the fold, with its titles still visible.
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

### Jesus's notes, round 3 (October 16, 2026)

Jesus reviewed round 2 and sent seven notes. All seven are in; they outrank the kit and the earlier reviews (except the honesty rules).

1. **Photo.** `jesus-studio-smile.jpg` is gone from the page. The founder card uses the professional portrait from martinezaccess.com (`../assets/jesus-interview.jpg`, `object-position: 50% 12%`), and the name tag now sits with the Watch the intro bar as a lower third, so neither covers his face (checked at 1440, 820 and 390 wide; the phone frame is now 4:5, the tablet frame 1:1). The two small avatars (hero quote card, trader room host) use the New York portrait (`../assets/jesus-city.jpg`) cropped to his face. They keep the kit's hexagon clip instead of a circle, to match the other avatars in the mocks. The live call's host tile keeps `jesus-interview.jpg`, since it shows him at a microphone. The city photo is never captioned as a place.
2. **Watch list.** Each row reads Asset 01 to Asset 05 in mono instead of a redaction bar. The state chips (Watching, New this week, Removed) and the members-only reasons stay as they were. No tickers, prices or percentages.
3. **Empty space.** From 641px up the hero is now at least one screen tall and ends on a members rail: Inside Swarm, then 01 Custom AI tools, 02 My watch list, 03 Weekly live calls, 04 Multi-cycle traders, each a link to its card. The core height, the cell size, the spacing and the floating cards follow the screen height (`--vs`, from -100px to +300px around 900px), so the rail closes the first screen at 1280x800, 1536x864, 1440x900, 1512x982, 1440x1000 and 1920x1080 without a dead band. On tablets the quote cards stack under the CTA and the rail closes the screen under them (820x1180 ends exactly on it, where round 2 had a 160px empty band). The two benefit chips the rail repeats step out of the chip strip on those screens. `--R` is registered with `@property` so `hero.js` reads the resolved size and the lattice still registers with the mark. Agents stay above the rail line. On phones the stacked quote card already fills the bottom of the first screen, so the phone hero is unchanged.
4. **Join Swarm highlight.** Every gold Join Swarm button (hero, curve, founder, members, pricing card, final) has a thin light that travels its outline, one lap every 3.6s: a ring 4px outside the button (a 1px gold track at 22%), a 2px light-gold head with a four-step fading tail, and a soft gold halo (8px stroke, 5px blur) that follows the head. It is drawn with SVG dashes on a `pathLength="100"` rounded rect, so the light moves at an even speed on the straight edges and the corners alike, which keeps it from reading as a loading spinner. Pure CSS animation (stroke-dashoffset), no JS loop; an IntersectionObserver only pauses rings that are offscreen. Under `prefers-reduced-motion` and `?reduce=1` it is a still 1.5px gold ring. With `?t=` the light rests at the top right and `window.__heroSeek` moves it in step with the hero, so the frame renders show it travelling. The focus outline moved out to 9px so it stays visible outside the ring. This is the one exception to the kit's no-glow and no-gradient rule, made at Jesus's request; there are no other new glows. A scan every 120px still finds at most one gold button, one lit core and one gold number per view.
5. **Scout states.** "Flagged for review" is gone everywhere. The scouts use SCANNING, ANALYZING and REPORTING only. The hero's Scout 03 card follows the hero's phases (Scanning the market, then Analyzing a setup while consensus forms, then Reporting to the watch list once the mark lands) and gains a three-step track (Scan, Analyze, Report) so the meaning reads at a glance. The agent console starts with Scanning and Analyzing rows and settles with all three states on screen (Scout 03 Reporting to the watch list); the log and the replay use the same three words, and the scout field's label highlight follows the Reporting row. Watching, Syncing and Idle are no longer scout states.
6. **Tools still being built.** Said in three places, in his voice, with no dates and no named tools: the Custom AI tools card has an "In active development" chip and the line "I'm still building them. Join early and you get each one as it's finished."; the pricing section has a note right under the founding line, "The custom AI tools are still being built. Join now and you get each one as it ships, at the founding price. Prices go up as they're completed."; and the FAQ has "Are the AI tools ready?" ("Not all of them yet. I'm still building them, and I'm not going to put dates on them. That's a perk of being early: you get each tool as it's finished, and a founding seat keeps the founding price. Prices go up as the tools are completed.").
7. **Footer.** The martinezaccess.com link is gone; JM Crypto on YouTube and @JesusMartinez on X remain.

Checked with renders at 1440x900, 1440x1000, 1920x1080, 1280x800, 1366x768, 1536x864, 1512x982, 820x1180 and 390x844 (settled, t1500, t2200, t3000, reduced). No horizontal overflow, no console errors, no em or en dashes, hosts unchanged. Media re-recorded: `hero-desktop.mp4`, `hero-phone.mp4`, `scroll-desktop.mp4` (rec.mjs) and `hero-desktop-frames.mp4`, `hero-phone-frames.mp4` (frames.mjs, `?t=0` stepped with `window.__heroSeek` at 30fps); folds from the r3 capture.
