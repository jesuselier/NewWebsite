# Direction C: Three Cycles

## The idea

His story is the motion: three honeycomb planes labelled 2021, 2023 and NOW hang in depth across the band above the headline, agents scan each one and fall through toward NOW, then a dolly zoom with a crane to top-down collapses the parallax until the three lattices register into one field and the official Hive Core lands on the lit cell, centred above the headline like the reference's light from above. Three cycles become one view, which is the promise in the headline ("I want to get you there in one"), and the rest of the page is founder-led: the crowd under the curve with YOU parked on the right curve, a transcript card as the centerpiece, and product mocks that show what members get without inventing anything.

## Files

- `index.html`: the page (shared architecture from `DIRECTIONS.md`, flow, pacing and density modelled on joinasymmetric.xyz).
- `c.css`: all styles, kit tokens only.
- `hero.js`: the hero (ES module). One simulation and one camera drive two renderers that draw the same projection. The story plays on Canvas 2D from first paint; Three.js r160 (3 draw calls) loads after first paint and takes over once the story has settled, so its shader build never stalls the motion and the idle patrol runs on the GPU. No WebGL means the 2D renderer keeps going. `?t=<ms>` freezes a frame (rendered with Three.js when it loads), `?reduce=1` forces the reduced-motion still, `?gl=0` forces the 2D renderer.
- `page.js`: crowd under the curve and the YOU marker, agent swimlanes, watch list, live call level strip, plan switch, and the Whop stub (`PLANS` map with `whopPlanId: null` and `mountCheckout(planKey)`).
- `media/`: `fold-desktop.png`, `fold-phone.png`, `hero-desktop.mp4`, `hero-phone.mp4`, `scroll-desktop.mp4`.

## Placeholders and data needed

All open items now sit in one dashed "Preview notes for Jesus" panel at the bottom of the footer (remove it before launch), so the selling sections carry no bracketed tags:

- `[DATA NEEDED: Whop plan IDs]`. The checkout row under the pricing card is the mount point. Swapping in the IDs is one line per plan in `PLANS` in `page.js`, then replace the stub body of `mountCheckout`. No Whop script loads in the preview.
- `[DATA NEEDED: call day and time]` for the live call card and the FAQ. The page only says "weekly", which is confirmed.
- `[DATA NEEDED: guest names]` for the traders room. Trader messages show as locked panels ("Unlocks inside"), never fake names.
- `[DATA NEEDED: where Swarm lives]` (Discord or Whop). The "Where does Swarm happen?" FAQ is held back until this is known.
- `[CONFIRM: the tools do not place trades]`. FAQ 1 reads "Is this financial advice?" until this is confirmed; the "and will the AI trade for me?" half comes back with the answer.
- `[CONFIRM: what happens if a founder cancels and rejoins]` for the "$49 forever" answer.
- `[DATA NEEDED: refund policy]` for the payment FAQ.
- `[DATA NEEDED: Terms, Privacy and Refund policy links, legal entity name]` for the footer.
- `[CONFIRM: adviser status, and that Jesus may hold assets discussed in Swarm]`: two disclosure lines left out until confirmed.

Not marked as tags, but placeholders all the same:

- The watch list contents are a locked panel, because the list is members only and was not provided. The swimlane, watch list, live call and traders mocks each carry `ILLUSTRATION · NOT LIVE DATA`; the swimlane time axis is the visitor's own time on the page.
- The traders room shows two of Jesus's own lines from the intro video (1:08 and 2:15, verbatim, labelled "Intro video") as the founder's messages. They are quotes, not chat he wrote.
- The video is a composed poster panel that opens https://youtu.be/n15W6X84IGg in a new tab. Production should embed it with youtube-nocookie, click to load.
- Footer links use https://x.com/JesusMartinez and https://www.youtube.com/@jm_crypto, the handles already used in the site code.

Every quote with quotation marks or a timestamp is verbatim from `swarm-intro-transcript.md` with its real timestamp and links to that moment on YouTube. The only numbers are the brief's prices, 50 seats, 2 months free, 2021, 2023, 4:05, the video timestamps and publish date, and "2020" in the Why now paragraph, which now has a dated source line within 24px ("Source // Welcome to Swarm, JM Crypto, published Oct 16, 2026 · 0:40 to 2:15").

## Known issues

- All motion was measured in headless Chrome with software GL (SwiftShader), not on a phone. There the hero draws only a few frames a second, so the MP4s look steppy, and page load in this environment delays the start by about 1.5 seconds, so `hero-desktop.mp4` reaches the lit core in its last second. The simulation keeps real time by taking more steps per frame, so the story settles about 4.7 seconds after it starts. Check on an iPhone 12 class device before launch.
- The hero gives the Unbounded headline font up to 250 ms. If it lands later, the clear bands around the type and the core position follow it (masks are evaluated every frame), so nothing is ever drawn on the type, but the first frame can show the fallback face (visible in the first frame of `hero-desktop.mp4`).
- After the core lands, a few scouts keep patrolling at low opacity (about 30 fps). They stop offscreen, when the tab is hidden, and with the visible Pause motion control. The chips marquee, crowd, swimlanes, call level strip and typing dots follow the same pause control and also pause offscreen.
- The floating quote cards show at 1340px and wider; below that they are hidden so they never crowd the subcopy. Checked at 1024x768, 768x1024, 1280x720 and 360x640 (first gold CTA visible in each, no horizontal scroll).
- The desktop page is 11,637px tall (about 13 viewports), still above the 7 to 10 viewport target in `RESEARCH-NOTES.md`, mostly the founder centerpiece and the members grid. Asymmetric itself is about 14,600px.
- The live call photo (`jesus-studio-arms.jpg`) has a yellow JM Crypto sign in the background. It is part of the photo, not UI gold.
- Full-page review shots are stitched from viewport captures (`scratchpad/tools/stitch.mjs`), so the sticky nav appears only in the first chunk.
- Shared files, other directions' folders and the scratchpad tools shot.mjs, rec.mjs and tiles.py were not modified. No git commit was made.

## Review (October 16, 2026)

Scores from the screenshot review: reference fit 6, agentic feel 6, premium 5.5, clarity and trust 6, kit compliance 7.5, phone 7.

Fixed:

- Hero rebuilt in the reference's shape: fact chips, then the Hive Core (mark about 121px tall, R 22 desktop and 18 phone) above one compact two-line headline at 56px desktop and 31px phone with letter-spacing 0, then subcopy, gold CTA, "Cancel anytime." and "Watch the intro". At 1440x900 the headline starts at y 380 and "Watch the intro" ends at y 760; nothing sits between the two lines. The quote cards flank the subcopy and CTA under the headline.
- Motion never touches the type. Every hero text line, the CTA and the watch link own a clear band (box plus 24px, soft falloff beyond): cells, agents and pings are not drawn there, agents only pick targets outside the bands, and NOW agents stay above the headline. Measured with the text hidden at t 600, 1500, 2400, 3000, 3600, 4800 and 9000 on desktop and phone: no pixel inside any headline, subcopy, CTA or link box is brighter than channel 18 (ground is 11; the 18 is the core's own soft glow at rest).
- Agents are 3 to 3.4px square nodes with a 5 to 7px heading tick; the long streaks are gone. The 2021, 2023 and NOW planes are now wide trays spread across the band above the headline (2021 left, 2023 middle, NOW right), each with a solid DOM chip label above it that fades instead of jumping. The spindle line was removed. Labels are DOM, never canvas.
- Pings are never placed near the quote cards, chips or the readout, so no outline sits under a card edge at rest.
- "2020" now has a dated source line.
- Labelling headlines replaced: members is now "Believing and hoping isn't a plan. / This is what you get instead." (from his 2:15 line), FAQ is "Before you put in a dollar, / here are the straight answers.", steps is "Pick a plan and pay through Whop. / Cancel whenever you want."
- The 2021 / 2023 / Now icon timeline under the founder card is deleted (the transcript chips carry it). The founder headline no longer repeats the transcript's first sentence.
- What you get: the watch list and traders room show deliberately locked panels (solid ink, faint honeycomb, one "Unlocks inside" chip) instead of grey skeleton bars; the traders room carries Jesus's verbatim lines with timestamps and his avatar. No card has more than one placeholder panel. Every mock label is 12px desktop and 11px phone, card titles are 24px.
- Contrast: inactive curve columns use #8E8A80 text, not opacity. Every timestamp was pixel-sampled on desktop and phone: the brightest glyph pixel of 0:00, 0:09, 2:33, 2:48, 3:02, 3:39 and the room stamps is (142,138,128), the active ones (238,235,228). All mono labels are 12px desktop and 11px phone at #8E8A80 or brighter.
- Price early: "$49/mo founding" is the first chip, pinned outside the marquee, in text colour, also first in the reduced-motion row. Under the members headline: "The first 50 founding seats are $49 a month, locked for as long as you stay."
- Repetition and pacing: the 0:34 pull quote is deleted, the hero's "about attention" card is replaced, section gaps are 180px (90 + 90) desktop and 128px phone, and the readout no longer repeats "2021 · 2023 · Now" (it reads Scanning, Consensus, Signal). No body sentence appears twice (script check). The desktop full page went from 12,892px to 11,637px (1,255px shorter); phone from 14,779px to 14,377px.
- Pricing: the dashed 420px Whop box is now one solid 1px #232328 row, 88px tall, under the gold button: "CHECKOUT · FOUNDING MONTHLY / Opens here soon (Whop, card or ACH)". The whole pricing card is about 670px tall.
- Crypto curve: YOU travels once from left to right when the section comes into view, then parks on the right curve with the right column at full #EEEBE4; LEFT / MID / RIGHT labels sit on the baseline; "behavior" spelled the American way. Reduced motion shows it parked.

Skipped, and why:

- "Get four answers from Jesus and swap them in" (call day and time, guest names, where Swarm lives, whether the tools place trades). I cannot reach Jesus from this run, and the brief forbids inventing them. Instead the copy was rewritten so it asserts nothing unknown, and every open item moved into the footer's preview-notes panel, so no bracketed tag appears above the footer. The "Where does Swarm happen?" FAQ and the "will the AI trade for me?" half of FAQ 1 are held back until those answers exist.
- Swapping the hero's 0:40 card for the 2:48 line: 2:48 is already in the founder transcript card, so it would have repeated a sentence on the page. The hero cards now use 2:00 ("They're going to buy the crypto version of what they already believe in, and that's AI.") and 2:15 ("This might be the first cycle where most of the money is already mid-curve or right curve."), which appear nowhere else.
- The visible `[DATA NEEDED: Whop plan IDs]` chip that `DIRECTIONS.md` asked for in the checkout slot moved to the footer panel, per the review; the checkout row itself still says it is the mount point.

QA run after the changes: no em or en dashes in visible text, JS or CSS; the only external resource hosts are cdn.jsdelivr.net and Google Fonts (the rest are outbound links); shot.mjs reports no console or page errors and no horizontal overflow at 390px; the reduced-motion fold is complete; the first gold CTA sits at y 632 to 688 (1440x900) and y 609 to 661 (390x844); a DOM scan finds at most one gold button and one gold number in any viewport-tall window (plus the core and official logos).
