# Direction A: Core Glow

Picked by Jesus on October 16, 2026 ("Core glow definitely"), with one note: the agents' head-and-tapering-tail look read as sperm and did not make sense. Every agent on the page now uses one language: a small pointy-top hexagonal node that hops corner to corner along the honeycomb's own channels, lighting the edge it crosses for about 600ms. No tails, trails or curved paths anywhere. The only glows are the core's own light and the revolving light on the gold Join Swarm buttons that Jesus asked for (kept crisp since round 4: no blur, no halo).

**The idea.** The joinasymmetric.xyz flow (fact chips, a two-line two-tone headline, tilted floating cards, pill eyebrows, a product-mock grid, one centered pricing card) rebuilt inside the Swarm kit, with the Hive Core as the hero's light from above. The honeycomb and the unlit core are there from the first frame; the swarm wakes, senses, and 18 chosen agents come in along six paths, one through each neighbour cell; each neighbour lights as its path lands, and the official mark ignites on the core as its warm light opens under the honeycomb.

## Files

- `index.html`: the page (CSP meta, kit tokens, `.swarm` on body, Swarm icons and og:image). The kit fonts load from Google Fonts in two requests (Unbounded with `display=block`, Hanken Grotesk and JetBrains Mono with `display=swap`), with their latin woff2 files preloaded. Each gold button carries its ring as inline SVG (`.ring`).
- `core-glow.css`: all styles, including an `Unbounded Fallback` face (Arial with size-adjust 130%, measured) so a late font never re-wraps the headings.
- `lattice.js`: the shared honeycomb lattice (cells at pitch 1.95R, copied from the mark) and the agent engine: corridor-lattice graph, hop scheduling, lit edges, hexagonal node drawing, optional per-edge and per-agent alpha multipliers. Used by every animated piece.
- `hero.js`: the hero (a static field canvas drawn at first paint, the agent canvas, the core's warm light as one CSS radial layer under the field, and the official `swarm-mark.svg` on the core cell). Drives the Scout 03 card (Scanning, Analyzing, Reporting).
- `crowd.js`: "The crowd" curve with hexagonal nodes; one pass that settles by 4.5s, then stops.
- `page.js`: nav, the revolving light on the gold buttons, the four mocks, the scout-field model for the tools card, the why-now band, the pricing core, the final field, the pricing switch, `PLANS` and `mountCheckout(planKey)`.
- `tools3d.js`: Three.js r160 renderer for the tools card's scout field (lazy import, 2D still fallback), in three draw calls.
- `media/`: `fold-desktop.png`, `fold-phone.png` (from the r4 capture), `hero-desktop.mp4`, `hero-phone.mp4`, `scroll-desktop.mp4` (recorded with `rec.mjs`), and `hero-desktop-frames.mp4`, `hero-phone-frames.mp4` (frame-accurate 30fps renders: `?t=0` stepped with `window.__heroSeek`).

URL switches: `?t=<ms>` freezes the hero at that time and shows every mock settled; `?reduce=1` forces the reduced-motion still.

## Hero timeline (ms after the fonts are in, plus 150ms; desktop, phone in brackets)

- First paint: the honeycomb (#1C1C21, fading to the edges, quieter behind the small copy) and the unlit Hive Core: a dim 1.5px gold outline on the core cell and #232328 outlines on its six neighbours. The headline waits for Unbounded (at most 2.5s), so it never shows in a fallback face.
- 150 to 1250: 72 agents (36) wake and wander corner to corner along the channels, hops of 210 to 280ms, each crossed edge lit in muted grey at 30% for 650ms, a few cells brightening as they are sensed. Nothing enters the copy column (the chips to the last hero line, padded 26px): agents, trails and pings all stay out of it.
- 1250: the sensing beat. Each agent stops once on a node for 120ms and pulses a small hex ring (0 to 13px, 35%).
- 1370 to 2760: 18 chosen agents (12), three (two) per path, go bright (#EEEBE4 at 100%) and travel along six paths, one through each neighbour cell: from five (four) hops out, to the neighbour's outer corner, along its edge to the core. Their trails are about five edges long. The other agents dim to 12% over 600ms and come to rest. Each neighbour strokes #55555B as its first agent reaches it; the paths land clockwise, 40ms apart, from 2340. The core outline charges with each arrival and a faint warm light starts under it.
- 2350: the hero button's revolving light starts (one lap, then it draws the full ring in on the second lap; done by 5950).
- 2600: ignition. The official mark lands (opacity over 280ms, scale 1, 1.08, 1 over 560ms), the warm light opens over 700ms (an ellipse with radii of 390 and 300px, peak 34%, under the honeycomb lines, so the field stays #1C1C21), and one ring wave runs out across the field (masked from the copy).
- 3900: everything is settled and the loop stops. The settled frame (field, warm light, the one lit cell) is identical to `?t=4800` and to the reduced-motion still.

## Placeholders, [DATA NEEDED] and [CONFIRM]

Visible as dashed mono chips:

- Whop plan IDs (checkout slot). `PLANS` in `page.js` holds `whopPlanId: null` for founding, standard and yearly; adding the IDs and the Elements mount in `mountCheckout()` is the only change needed.
- Next call day and time (inside the live call mock on desktop, and in the FAQ); guest traders; refund policy; launch date; when and where members get access; Terms, Privacy and Refund URLs and the legal entity.
- [CONFIRM] the AI tools do not place trades; [CONFIRM] which tools are live at launch; [CONFIRM] what happens to $49 if a founder cancels and rejoins.
- Mocks are illustrations, each labelled "Illustration · not live data": watch-list rows read Asset 01 to Asset 05 with short reasons in words (no tickers, prices or percentages) and one members-only note; scout states are SCANNING, ANALYZING and REPORTING only; watch-list chips WATCHING, NEW THIS WEEK and REMOVED; live-call rows Portfolio 01 to 04 with REVIEWED, LIVE, UP NEXT and IN QUEUE; trader-room names are roles ("Trader · 3 cycles", "Multi-cycle"), never invented names.
- The video is the founder card's poster and opens https://youtu.be/n15W6X84IGg in a new tab; production should use a youtube-nocookie click-to-load embed.

## Quotes on the page (all from FOUNDER-DOSSIER.md section 3 or Draft A)

- Hero card: Q09, 3:51 (?t=231).
- Why this cycle chips: Q04, 2:23 (?t=143), inside the why-now frame, with the source line right under it.
- Founder transcript: Draft A word for word, 2:33, 2:48 and 3:02, source line "Jesus Martinez, "Welcome To Swarm", JM Crypto on YouTube, October 16, 2026." Only "I stayed through the bear market when everyone else left." is set bright; "It wasn't luck" sits unemphasized inside its passage (C2).
- Who it's for: one transcript card stamped 3:39 holding both of his lines from that passage verbatim, now in quotation marks. Its footer says which part is verbatim: "Quoted lines verbatim from 3:39 · Headings from the video's on-screen text".
- Before you join: Q15, labeled "The Attention Cycle, Aug 7, 2026", linking to the X Article.
- FAQ: Q20 as the disclaimer line, introduced as "on @JesusMartinezTrades, my second YouTube channel" (it is that channel's About text).
- Nothing from section 10 is used.

## Copy I wrote around his lines (to check with Jesus)

"I'm Jesus Martinez of JM Crypto." at the start of the hero sub; the curve definitions; the why-now lede; the headlines "Only one knows when to get out." (the curve, from his right-curve line), "Two cycles behind me. / This one is my third.", "No more believing and hoping. / Here's what you get instead.", "Your first cycle or your second. / Either way, this is where you start.", "Not financial advice. Not a promise. / Here's exactly what you're joining." and "Be on the right side of this cycle. / I'll see you inside."; the three check lines under each benefit; the FAQ answers; the line "Education and research, not financial advice. You make your own decisions." (now under the hero CTA); the hero rail's short lines; the AI tools lines ("I'm still building them. Join early and you get each one as it's finished. Prices for new members go up as they're completed."); the pricing lines ("After that it's $99/month, and it rises as the tools are completed." and "The custom AI tools are still being built. Join now and you get each one as it's completed. Founding members keep $49/month forever; the price for everyone after goes up as the tools are completed."); the scout lines. Added in round 4, inside the mocks: the watch-list reasons ("Where attention is moving", "Real users, real revenue", "The crypto version of AI", "How the crowd is reacting", "The reason changed"), the live call's review chips (Allocation, Your reasons, Exit plan) and three trader-room messages: "Same pattern as last cycle. The attention moved first, then the money." (Trader · 3 cycles), "Know what you're buying, why you're buying it, and when to get out." (Jesus · Host, his right-curve line at 0:17 in the second person, not in quotation marks) and "Writing down my exit plan before I add anything new." (Multi-cycle). None of them claims a result.

## Known issues

- Headless Chrome here renders with software GL, so `rec.mjs` captures only a few distinct frames a second (the screencast also stops emitting once the page settles, so the hero videos end about 6s in). Timing is right because every piece runs on wall-clock time; the `*-frames.mp4` renders show the hero at a true 30fps. Not yet checked on an iPhone 12-class device.
- Full-page screenshots taller than about 8,192px wrap in this Chrome build. From round 4 the `d-NN` and `p-NN` tiles are cut from a viewport-stepped, stitched capture instead (`scratchpad/acg/restitch.sh` runs `tools/stitch.mjs` on `?t=6000` and re-cuts the tiles), so the last tiles end on the footer and the hero appears once.
- Page length: 10,458px on desktop (11.6 viewports at 1440x900; RESEARCH-NOTES aims for 6,300 to 9,000), 14,074px on phone.
- At 1366x768 the hero rail's bottom sits 29px under the fold (titles visible). 1280x800, 1440x900, 1536x864 and 1920x1080 end exactly on the rail.
- The why-now band labels games "2021 Games" (his first cycle); the video's games example starts in 2020.

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

### Round 3 reviews (October 17, 2026)

Review averages: reference 7.0, motion 6.6, buyer 7.4. The code audit raised 4 blocking items (the leftover Pause motion button, the crowd running about 15s, gold field outlines from the tint canvas, and an unsupported "access right after checkout" FAQ line).

What changed:

- **Hero intro, rebuilt as one beat.** The honeycomb and the unlit core outline are drawn at first paint, so the first frame is never an empty band. The swarm is calmer and smaller (72 agents, 36 on phones; muted grey trails at 30%, smaller nodes) and never enters the copy column, so no line crosses the headline or body copy and the frame no longer reads as a constellation. At 1.25s every agent stops and pulses a hex ring (sensing); then 18 chosen agents (12 on phones) go bright and come in along six paths, one through each neighbour cell, while the rest dim to 12% and rest. Neighbours light grey as their paths land, clockwise; the core charges, a faint warm light starts under it, and at 2.6s the mark ignites (scale 1, 1.08, 1) as the light opens over 0.7s. Settled by 3.9s. The receding-plane opening is gone (the field never moves), and the field, glow and mark no longer have any box edge, so the t3000 seams are gone (checked with brightness boosted 2.6x at 1440 and 390).
- **Gold stays on the core.** The warm-tint canvas is deleted. The core's light is one radial layer under the field (radii 390 by 300px on desktop, 190 by 165px on phone, peak 34%), so every outline stays #1C1C21 and reads against it; the hero is back to two canvases.
- **Fonts.** The three latin woff2 files are preloaded, Unbounded loads with `display=block`, a size-matched fallback face backs every Unbounded heading, and the hero headline is held until Unbounded is in (at most 2.5s). The swarm wakes 150ms after the fonts. Recorded frame 01 shows the field, the core outline and the headline in Unbounded on both desktop and phone.
- **The revolving light, crisp and bounded.** No blur, no halo: a continuous 1.5px gold track at 35%, 6px outside the button, and a comet (2.25px head, tail fading over about a third of the ring) that runs one lap, then draws the full ring in behind itself on the second lap and rests on a complete, even ring (3.6s, no loop). It replays when the button comes back into view, and on hover or keyboard focus. The hero's starts as the six paths land, so the settled frame (`?t=6000`) shows the full ring. Reduced motion shows the full ring, still. The hero button is 300px wide; the others 260px.
- **No Pause motion button.** The button, the motion toggle, the `swarm:motion` listeners and the `.motion-btn` CSS are gone. The crowd plays one pass (curve draws in 1.5s while LEFT drifts, one wave of MID steps out, RIGHT steps out together once) and settles by 4.5s; its agent counts are 254 at 1120px and 87 at phone width, inside the 260/90 budget. The why-now band ends by 4.6s, the final field by 4.5s, the tools 3D by 4.9s; the trader room's typing dots move only while its messages arrive. Every canvas piece now pauses offscreen and while the tab is hidden, and the mocks' running timers (spinners, audio bars) skip their ticks when offscreen or hidden.
- **Mocks in words.** The watch list's reason column reads in plain words (no skeleton bars except one members-only note); Asset 05's removal is a strikethrough instead of a 40% fade. The live call lists Portfolio 01 to 04 with REVIEWED, LIVE, UP NEXT and IN QUEUE, the live row opens on Allocation, Your reasons, Exit plan, and a Next call [Data needed] chip sits in the mock. The trader room shows three real messages with role names. The console log steps down in colour instead of opacity and shows whole rows above its footer (it used to push the footer out of the card).
- **Why this cycle.** One 1120px frame: the crowd starts packed in the 2021 games basin and streams along the honeycomb into the AI basin, which fills from the middle out; each crossing wears its edge in, so the still keeps the route as a worn path. His 2:23 chips sit inside the frame, the source line right under it, then Join Swarm and "Cancel anytime." before the founder.
- **Pacing.** The curve now flows straight into Why this cycle (its CTA moved after the why-now band, so a gold CTA lands before The founder). Section padding 68px; gaps from each "Cancel anytime." to the next eyebrow are 137px. FAQ now has 8 questions (launch and access merged). Desktop height 11,063 to 10,458px (605px shorter); the Members get section now starts at 3,996px.
- **Buyer.** The price promise is unambiguous: "After that it's $99/month, and it rises as the tools are completed." and "Founding members keep $49/month forever; the price for everyone after goes up as the tools are completed." The tools card and the FAQ say "Prices for new members go up". The hero definition sentence is in the main text colour. "Education and research, not financial advice. You make your own decisions." sits under the hero CTA (and left the members section, where it repeated). The curve headline is "Only one knows when to get out.", so "the expensive way" appears only in his 3:39 line.
- **Audit items.** FAQ: "access right after checkout" is gone ([Data needed: when and where members get access]); "Not all of them yet" is now "They're actively being built" with [Confirm: which tools are live at launch]; Q20 is introduced as his second channel. The tools resize path catches a failed import. Radii: `.ss-bar` and the audio bars square, the dev note and the call's shared screen and host tile at 28px. The `three/addons/` importmap entry is removed. Three.js now draws the tools card in three calls (plates and rims merged into one instanced mesh with a per-instance rim colour).
- **Type.** $49 is JetBrains Mono 500 at 84px with tabular figures (it was mono before; the -0.04em tracking made it read as proportional), /mo mono 20px muted. Hero and section body 18px at 1.6. The dev note is 480px wide like the switch and card. The Inside Swarm label sits on the item titles' baseline.
- **Phone.** Two chips (Pre-launch, $49/mo · 50 founding seats), the mark from 142 to 158px (R 21). The live-call rows fit at 390.
- **Captures.** Full pages are stitched from viewport screenshots (no wrap); the last tiles end on the footer, which has no martinezaccess.com link.

Calls where reviewers disagreed:

- The revolving light stays on every gold Join Swarm, as Jesus asked (the motion review wanted it on the hero and final CTAs only). The ref review's "continuous ring" is the static 35% track; the moving comet plays once per view, as the audit asked, and ends on the full ring the buyer asked for.
- Ignition: the mark lands in 280ms with the 1.08 pulse (motion), and the light ramps over 0.7s after a short pre-charge as the paths land (reference).
- Glow size: between the motion review's 240px and the director's "light from above": radii 390 by 300px with a steep falloff, under the field lines.
- Trails are grey, not "muted honey" (the kit keeps gold to the core).
- The nav keeps `swarm-wordmark-for-dark-bg.svg` (an SVG file, not typed text), per DIRECTIONS, so the hero's core stays the one lit cell; the compact lockup would add a second gold cell to every view.
- The curve and why-now stay two sections (two headlines), with no CTA between them.
- The Whop slot is 480px tall: DIRECTIONS says 420 for the placeholder, RESEARCH-NOTES 560 for the live embed.

Skipped, and why:

- The buyer's "No trade signals. No copy trading. No automated trading for you." line: none of it is confirmed (he says the tools "trade the markets"), and dossier section 9 lists those phrases as claims not to make. The hero now carries the confirmed "Education and research, not financial advice." line, and the FAQ keeps [Confirm: the tools do not place trades].
- Desktop height is still above RESEARCH-NOTES' 9,000px; going lower would cut content Jesus asked for.
- The phone live call hides its Next call chip (no room at 390); the FAQ carries it.

Checked with renders at 1440x900, 1280x800, 1366x768, 1536x864, 1920x1080, 820x1180, 390x844 and 360x640 (settled, t1500, t3000, t4800, reduced). A scan every 20px at 1440x900, 820x1180 and 390x844 finds at most one gold button, one gold number and one lit mark per view. No horizontal overflow, no console errors, no em or en dashes, hosts unchanged (Google Fonts, gstatic preloads, jsdelivr for three@0.160.0). Media re-recorded and the folds copied from the r4 capture.
