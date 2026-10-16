# Direction B: Landing

**The idea.** The hero is a 3.9 second drone shot. The camera skims low over a dark plain of extruded hex plates, flies toward a raised beacon cell, cranes up and lands exactly top-down on it. On the way, a few hundred independent agents scan, ping cells and then stream into that one cell, and the official Hive Core mark appears there. The page below follows the joinasymmetric.xyz flow (centered two-tone headlines, pill eyebrows, a gold "Join Swarm" with "Cancel anytime." after most sections, product-mock cards, one centered pricing card), told in Jesus's own words.

## Files

- `index.html`: the page (markup and CSS). Loads the kit tokens, Google Fonts and Three.js r160 through the import map.
- `page.js`: page script (hero lifecycle, curve lanes, why-now band trigger, mocks, plan switch, Whop stub, final field).
- `sim.js`: the shared agent simulation (timeline from RESEARCH-NOTES) and the Canvas 2D renderer used for the fallback and the reduced-motion still.
- `hero3d.js`: the Three.js drone shot (3 draw calls: plates with baked sides and rims, agent ticks, agent heads). Loaded only after first paint.
- `band3d.js`, `hexgl.js`: the "Why this cycle" 3D band and the shared WebGL pieces.
- `media/`: `fold-desktop.png`, `fold-phone.png`, `hero-desktop.mp4`, `hero-phone.mp4`, `scroll-desktop.mp4`.

Test switches: `?t=<ms>` freezes the hero at that time, `?reduce=1` forces the reduced-motion still, `?gl=0` forces the Canvas 2D fallback, and `?bandt=<ms>` freezes the why-now band.

## How it keeps to the brief

- Gold: in the hero, the core cell (the official `swarm-mark.svg`, registered on the field cell) and one gold button. In pricing, the $49 is the one gold number. The nav button is an outline. Agents, pings, pulses and mocks are never gold. Before the hand-off the 3D core shows only a thin gold rim, never a fill.
- The camera stops at 3.9s, and the mark fades in only after that (from 3.96s, by 4.4s at the latest). Everything settles by about 4.6s. After that, a few scouts patrol outside ring 2 at about 30fps. The motion has a visible "Pause motion" control, stops offscreen and when the tab is hidden, and the phone chip marquee pauses with it.
- Reduced motion: no animation loop. The page shows the settled 2D still with the mark at full opacity and no pings, the curve and band drawn in their final state, and the mocks in their end states.
- All words are DOM. Nothing is drawn as text in canvas or WebGL. The band labels are DOM placed by projection.
- Only allowed numbers appear: $49, $49.00, $99, $990, 50 seats, 2 months free, 2020, 2021, 2023, 4:05, video timestamps (00:40, 02:34, 02:50, 03:05, 03:51) and source dates. The 2020 games / since 2023 AI band carries a source line from the intro video.
- No em or en dashes in any copy.

## Placeholders, [DATA NEEDED] and [CONFIRM]

All of these are visible on the page as small mono chips:

- `[DATA NEEDED: Whop plan IDs]`. The `PLANS` map in `page.js` has `whopPlanId: null` for founding, standard and yearly, and `mountCheckout(planKey)` is the stub where Whop Elements mounts. Swapping in each plan ID is a one-line change.
- `[DATA NEEDED: day and time]` for the weekly live call (live call mock and FAQ).
- `[DATA NEEDED: where Swarm lives]` (how joining works, step 3, and FAQ).
- `[DATA NEEDED: refund policy]` and `[DATA NEEDED: launch date]` (FAQ).
- `[DATA NEEDED: Terms, Privacy and Refund policy links, legal entity name]` (footer).
- `[CONFIRM: the tools do not place trades]` (FAQ 1), `[CONFIRM: what happens if a founder cancels and rejoins]` (FAQ 5).
- `[CONFIRM: quotes against official captions]` on the transcript card. The quotes and timestamps come from the vidIQ watch-through, not from official captions.
- Unconfirmed footer lines from RESEARCH-NOTES ("not registered investment advisers", "Jesus may hold assets") are left out until Jesus confirms them.
- The mocks are illustrations, and each carries "Illustration · not live data". Asset names, trader names and messages are redaction bars. Scout ids and trader tags are illustrative. The live call frame uses the studio photo, not real call footage.
- Video: the poster links out to https://youtu.be/n15W6X84IGg in a new tab. There is no embed in previews.
- The transcript timestamps link to the matching second on YouTube (`?t=154`, `170`, `185`), and the hero quote card links to `?t=40`.

## Known issues

- Every render and recording here used SwiftShader (software GL). Frame times, the plate count (about 1,000 cells on desktop including off-screen rings) and 360 / 120 agents still need checking on a real iPhone 12-class device. The 2D fallback caches the calm plates after the reveal, but it still redraws about 40 cells per frame.
- `scroll-desktop.mp4` runs about 52s instead of 26s. The recorder keeps real frame timings, and software rendering slowed the scripted scroll steps. The hero videos run about 7s as asked.
- The hero sizes itself to the first viewport height and only rebuilds when the width changes, so phone URL-bar changes never restart the shot. If you rotate a phone, it rebuilds into the settled state without replaying the flight.
- The 3D band ("Why this cycle") plays once when 35% of it is visible and then stops. It has no replay control.
- The floating quote card only shows at 1100px and wider. Below that it is hidden, not stacked, to keep the hero CTA in the first screen.
- Unbounded headlines use `text-wrap: balance`, which older Safari ignores. Line breaks may differ there, but nothing clips.
