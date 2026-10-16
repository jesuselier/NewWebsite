# Direction B: Landing

**The idea.** The hero is a 3.9 second drone shot over the kit's honeycomb field: the camera skims low over a disc of thin hex outlines that fades to nothing at the edges, cranes up and lands exactly top-down on one cell while about 80 agents converge on it, and the official Hive Core lights there with a soft gold glow falling from above. The page below follows the joinasymmetric.xyz flow (fact chips, two-tone headlines, pill eyebrows, a gold "Join Swarm" with "Cancel anytime." after most sections, product-mock cards, one centered pricing card), told in Jesus's own words.

## Files

- `index.html`: the page (markup and CSS). Loads the kit tokens, Google Fonts and Three.js r160 through the import map.
- `page.js`: page script (hero lifecycle, curve lanes, why-now band trigger, mocks, plan switch, Whop stub, final field).
- `sim.js`: the shared agent simulation (timeline from RESEARCH-NOTES), the shared cell look, and the Canvas 2D renderer used for the fallback and the reduced-motion still.
- `hero3d.js`: the Three.js drone shot (3 draw calls: field outlines, agent ticks, agent heads). Loaded only after first paint.
- `band3d.js`, `hexgl.js`: the "Why this cycle" 3D band and the shared WebGL pieces (outline field and agents, both with the safe-rect mask).
- `img/jesus-interview-graded.jpg`: a regraded copy of `../assets/jesus-interview.jpg` (the original asset is untouched).
- `media/`: `fold-desktop.png`, `fold-phone.png`, `hero-desktop.mp4`, `hero-phone.mp4`, `scroll-desktop.mp4`.

Test switches: `?t=<ms>` freezes the hero at that time, `?reduce=1` forces the reduced-motion still, `?gl=0` forces the Canvas 2D fallback, and `?bandt=<ms>` freezes the why-now band. Take the last two out before production.

## How it keeps to the brief and the kit

- Field: unfilled 1px `#1C1C21` pointy-top outlines (no plate fills, extrusion or shading), radially masked to nothing by about 40% of the viewport width from the core on desktop (an ellipse on phone), so the x edges are bare ground. The six neighbours are 1.5px `#55555B` outlines at field scale. While the camera is low the outlines are lifted slightly (toward `#2C2C32`) so the tilted floor reads; from the landing on they are exactly the kit tone.
- The lit cell is the official `swarm-mark.svg`, registered at 7.5R on the field's core cell and shown through a hex window on its gold core, so the hero reads like the kit's X header (field-scale neighbours, thin outlines) rather than a large, heavy copy of the mark. The full mark appears as is in the nav wordmark, poster and footer lockups. Jesus should confirm he is happy with this use of the mark.
- The only glow is the core's: a gold radial at 10% opacity or less, about 480px radius (300px on phone), which gives the reference's light from above.
- Safe rect: the text column (chips, headline, body, CTA, watch link) is measured at load. Agents, pings and pulses fade to zero within 40px of it, in the shader and in the 2D renderer, so nothing ever crosses a glyph, in any frame or in the reduced still. About 110 agents on desktop (about 80 commit), 80 on tablet, 48 on phone (about 35 commit). They roam only the visible field above the text and outside the two hero cards.
- Gold per view: the core cell, one gold button and (in pricing) the $49. The nav button is an outline. Agents, pulses and mocks are never gold. Checked by pixel count on the full-page captures.
- Motion: camera lands at 3.9s, the mark fades in from 3.96s (by 4.4s at the latest), settled by about 4.6s. After that, scouts patrol outside the cluster at about 30fps with no pings. Visible "Pause motion" control; stops offscreen and when the tab is hidden. Reduced motion: no loop, the settled 2D still with the mark and glow on, curve and band drawn in their final state, mocks in their end states.
- Quotes: every quote and timestamp is word for word from `swarm-intro-transcript.md`: hero card 02:48, pull quote 0:34, band 2:15, founder transcript 02:33 / 02:48 / 03:02, who it's for 3:39. The final CTA headline is a shortened line, so it carries no timestamp.
- All words are DOM. No em or en dashes.

## Placeholders, [DATA NEEDED] and [CONFIRM]

Visible on the page as small mono chips:

- `[DATA NEEDED: Whop plan IDs]`. The `PLANS` map in `page.js` has `whopPlanId: null` for founding, standard and yearly, and `mountCheckout(planKey)` is the stub where Whop Elements mounts. Swapping in each plan ID is a one-line change.
- `[DATA NEEDED: day and time]` for the weekly live call (live call mock, its card checklist and the FAQ).
- `[DATA NEEDED: where Swarm lives]` (how joining works, step 3, and the FAQ).
- `[DATA NEEDED: refund policy]` and `[DATA NEEDED: launch date]` (FAQ).
- `[DATA NEEDED: Terms, Privacy and Refund policy links, legal entity name]` (footer).
- `[CONFIRM: the tools do not place trades]` (FAQ 1) and `[CONFIRM: what happens if a founder cancels and rejoins]` (FAQ 5).
- Unconfirmed footer lines from RESEARCH-NOTES ("not registered investment advisers", "Jesus may hold assets") stay out until Jesus confirms them.
- Mocks are illustrations, each labelled "Illustration · not live data". Watch list rows are "Project 01" to "Project 06" with reasons in the video's words (real revenue, real users, attention moving in, left curve bet). Trader posts are illustrative topics in the video's words, not results. Scout ids and trader tags are illustrative. The live call frame is a studio photo, not call footage.
- Video: the poster and quote card link out to https://youtu.be/n15W6X84IGg (timestamp links `?t=153`, `168`, `182`). No embed in previews.

## Known issues

- Every render and recording here used SwiftShader (software GL). Frame times still need checking on a real iPhone 12-class device, though the load is now much lighter (outline rings plus 48 to 110 agents).
- `scroll-desktop.mp4` runs about 49s instead of 26s: the recorder keeps real frame timings and software rendering slowed the scripted scroll. It is 4.8 MB. The hero videos run about 7s (software rendering gives roughly 10 to 25 fps).
- The hero sizes itself to the first viewport height and rebuilds only when the width changes. After a phone rotation it rebuilds straight into the settled state.
- The "Why this cycle" band plays once when 35% of it is visible, with no replay control.
- The two hero cards show only at 1100px and wider; below that they are hidden so the CTA stays in the first screen at 390x844 and 360x640.
- The page is about 11,600px tall on desktop, above the 7 to 10 viewport target, because the band and the video poster each add a section.
- Headlines use `text-wrap: balance`; older Safari ignores it (line breaks may differ, nothing clips).

## Review

Scores from the screenshot review: reference fit 6, agentic feel 6, premium 5, clarity and trust 6, kit compliance 5, phone 7.

Fixed:

- Hero field rebuilt to the kit: outlines only, radial fade to bare edges, no plates, bevels or shading (also in the why-now band and the final CTA field). The heavy 3D-looking cluster is gone: neighbours are 1.5px `#55555B` field-scale outlines and the gold comes from the official SVG's core. Stray lit outlines removed (no pings once the signal lands).
- Wider core glow (gold radial, 10% max, about 480px).
- Safe rect around the text column with a 40px feather; consensus capped at about 80 agents desktop and 35 phone. Re-shot t1500, t3000, t4800 and reduced at both sizes: no stroke touches a glyph.
- Two hero cards like the reference: left agent-status card (SCOUT 03 · FLAGGED FOR REVIEW, WATCH LIST UPDATE // MEMBERS, "Illustration · not live data"), right quote card with the 2:48 line. 28 radius, 1px `#232328`, no shadow, hidden below 1100px.
- Founder transcript set word for word with 02:33, 02:48, 03:02, the [CONFIRM] chip deleted. Band line replaced by the exact 2:15 quote. Pull quote now credits 0:34. Who-it's-for quotes now carry 3:39. The internal "SOURCE // PRE-LAUNCH CHECKOUT" line is gone from the price card.
- Members grid: no grey bars left. Watch list in words, trace output card in words, live call side panel in words (what you're buying, why, when you get out), trader posts as legible lines, three check lines under each card title. Idle scouts, IDLE labels and REMOVED chips are full `#8E8A80` (sampled exactly at 1x).
- Single lit cell: NOW · 3RD and both YOU stops are unfilled 2px `#EEEBE4` outline hexes, active state carried by the mono label.
- How joining works is one 28-radius panel with the hex number left of each title.
- Phone: static, complete chips on two rows (PRE-LAUNCH, 50 FOUNDING SEATS, CUSTOM AI TOOLS), "2 MO FREE" stacked under Yearly, footer links one per line under the logo.
- Founder portrait regraded: blue and violet background light desaturated and warmed, shirt and skin untouched. Behind the head, max blue minus red is 19 (target under 30).

Skipped or changed:

- The cluster is not drawn as a redrawn mark: the field draws the neighbour outlines (the kit's own pattern) and the gold core comes from the official SVG through a hex window, so the "never rebuild the mark" rule holds. This is a judgment call on the kit, flagged above for Jesus.
- The final CTA pill dropped its 03:51 timestamp instead of lengthening the headline, because the directions specify the shortened line and a timestamp would present it as a quote.
