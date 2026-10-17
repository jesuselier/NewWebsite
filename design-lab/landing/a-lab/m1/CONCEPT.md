# m1: The Crowd

**The idea.** The crypto curve becomes a pinned, scroll-driven scene. The visitor's scroll is the clock: a YOU marker rides the bell curve from left to right through three crowds of hexagonal agent nodes. The left curve herds, the mid curve twitches and keeps stepping out to the sidelines, and the right curve holds in still ranks. YOU then steps off the curve into the one open slot in those ranks, the whole right group moves forward together in one step, and Jesus's 0:34 line lands: "Most people need three cycles and a lot of pain to get there. I want to get you there in one."

Open: `http://127.0.0.1:8820/a-lab/m1/index.html` and scroll past the hero. `?t=<ms>` and `?reduce=1` show the settled still without the pin. `?crowd=<0..1>` shows the still at any point in the scroll (for review). `window.__crowdSeek(ms)` steps the live scene on a virtual clock, for frame-accurate captures.

## How it plays (P = scroll progress through the pinned track)

The stage (pill, two-tone headline, canvas, zone tags and one text slot) pins under the nav for about 2.4 screen heights of scrolling (desktop 1,997px, phone 1,725px). Nothing moves unless the visitor scrolls. When scrolling stops, any node mid-hop finishes its hop onto a corner (snap over about 0.26s) and the loop stops. Scrolling back up plays everything in reverse, exactly.

| P | Canvas | DOM |
| --- | --- | --- |
| below 0 (stage scrolling up into place) | The 1px curve draws left to right, the honeycomb under it and the crowds appear behind the drawing front, all driven by scroll | Slot: Left curve |
| 0 to 0.30 | YOU rides the curve through the left zone. **Left herd:** surges of three hops along one shared heading, then three hops back, front first and followers a beat later. The heading drifts from surge to surge, and the herd rushes up against the curve. | Tag "Left curve" lit. Slot: "First cycle", his line at 0:00 |
| 0.30 to 0.56 | **Mid crowd:** nodes flinch a corner (mostly downward) and back at random moments. The low ones walk out below the baseline to the sidelines, wait, and climb back. | "Sidelines" label lit. Slot: "Second cycle", 0:09 |
| 0.56 to 0.72 | **Right ranks:** nodes on every other row of cells, perfectly aligned, never moving while the left and mid crowds keep churning (dimmed). YOU slows as it nears them. A grey hex outline marks one open slot in the ranks. | Slot: "Third cycle", 0:17 |
| 0.72 to 0.80 | YOU steps off the curve onto the lattice and hops down a short path into the open slot. Its drop line fades out. | |
| 0.83 to 0.93 | **The moment it matters:** all ranks, YOU included, hop six times in perfect unison (four on phone) and slide three cells forward. Every crossed channel lights at once. The left and mid crowds step back in brightness. | From 0.84 his 0:34 line replaces the definition (two-tone, Unbounded) |
| 0.93 to 1 | Settled final picture: left and mid at rest, a few mid nodes still out on the sidelines, the right ranks advanced with YOU in them | Then the stage unpins and the section's gold Join Swarm CTA scrolls in |

Agent language (as Jesus asked): small pointy-top hexagonal nodes on the honeycomb's corridor lattice, hopping corner to corner along its channels, with no tails. A channel lights only while a node crosses it, brightest mid-hop. The node rides a lit wire with light on both sides, and nothing trails behind it once it lands. At this density (about 360 nodes with 9.6px channels), the hero's 600ms after-glow made every landed node read as a pin with a tail, so I dropped it here. The right group's unison move and YOU's own path light in text color, other channels in hive grey or muted.

Words on the page, all DOM: zone tags (Left curve, Mid curve, Right curve), "Sidelines", "Illustration · one mark per person", the YOU chip, and four blockquotes in the slot. Each zone definition is verbatim from `swarm-intro-transcript.md` with its passage timestamp and a YouTube link:

- Left (0:00): "You buy because everyone else is buying and you have no idea when to sell."
- Mid (0:09): "You got burnt last time, so now you overthink everything. You sell too early and you watch the big moves from the sidelines."
- Right (0:17): "From the outside, it looks just like left curve because, you know, both people are buying. The difference is right curve knows what it's buying, why it's buying it, and when to get out."
- Landing (0:34, Q01): "Most people need three cycles and a lot of pain to get there. I want to get you there in one."

## What changed

Only the curve section. `hero.js`, `lattice.js`, `page.js`, `tools3d.js` and `NOTES.md` are byte-identical to `_base`, and every other section renders as before.

- **`index.html`**: the `#curve` section markup only. It is now `.crowd-track` > `.crowd-pin` > (sec-head, `figure#crowd` with `#crowd-stage` [canvas, YOU chip, `.c-side`, `.c-illu`], `.ztags`, `.zslot` with four `blockquote.zq`), followed by the unchanged CTA. The headline is unchanged. The "Pause motion" button is gone: the scene is driven by the visitor's scroll, so nothing plays on its own and no pause control is needed. Base's paraphrased definitions are replaced by his verbatim lines.
- **`core-glow.css`**: the "2. the curve" block and its phone overrides are replaced. It adds a `--navh` token (68px desktop, 60px phone). The default static layout is used with no JS, `?t` and reduced motion: three columns, then his line. `.curve.live` turns on the pinned layout: `position: sticky` stage at `100svh - nav` (100vh fallback), track 3.4 times the stage height (3.2 on phone), and a flexible stage height (170 to 400px). In live mode, inactive quotes are transparent but stay in the accessibility tree.
- **`crowd.js`**: rewritten (30 KB, 10.6 KB gzipped, Canvas 2D, one canvas plus one cached field canvas). It reuses `SwarmLattice.lattice`, `hexPath`, `rng`, `COL`, `clamp01` and `inOut`.
  - Timeline: `TL` (progress keys), `youU(p)` (YOU's path along the curve), `buildLut` / `lutAt`. The left and mid crowds step 2.5 times faster while YOU is in their zone.
  - Choreography, precomputed per layout as integer vertex states per beat, so any scroll position is a pure lookup: `scatter` (spaced placement), `buildHerd` (surge and return with a front-first ripple; nodes pressed against the curve wait and never pile up permanently; the herd rests back from the divider with a ragged edge), `buildMid` (BFS to the sideline row, trips with dwell, late "stayers", downward flinches, occupancy so nodes never overlap), `zigzag` plus the ranks and slot in `setup` (top corners of every other cell row, rows of three or more; the six-hop zigzag translates them rigidly), and YOU as a one-node zone (drop path by BFS, then the same six hops).
  - Drawing: `poseZone` (interpolates each node within its hop window and collects lit rails), `field` / `drawFieldTo` (honeycomb under the curve only, with the zone YOU is in one step brighter, cached), `strokeBuckets`, and `render(p, s)`, which also drives the YOU chip, drop line, tags, "Sidelines" and the slot (links in inactive quotes are taken out of the tab order).
  - Live loop: `readP` (track rect to P), `introAt` (scroll-driven curve draw-in), and `step`: P is smoothed with an 85ms time constant; the settle factor snaps to whole hops 140ms after scrolling stops; the loop stops once settled. `frame` and `kick` run only while the track is near the viewport (IntersectionObserver). `ResizeObserver`, resize and `fonts.ready` trigger a rebuild only if the stage size changed.
  - Static: `renderStatic()` draws P = 1 (or `?crowd=`), with no pin and no loop.

## Performance on a mid phone

Measured in this container by stepping the live scene over 601 scroll positions (`__crowdSeek`, JS plus Canvas 2D draw per frame, software canvas):

| | Desktop 1440x900 | Phone 390x844 at 3x |
| --- | --- | --- |
| Nodes (left / mid / right ranks) | 72 / 245 / 50, plus YOU | 45 / 150 / 27, plus YOU |
| Canvas | 1120x400 CSS px | 358x310 CSS px, DPR capped at 2 |
| Per frame, median / p95 | 0.9 / 2.0 ms | 0.5 / 1.2 ms |
| Frames when not scrolling | 0 (measured over 1s, settled) | 0 |
| Frames offscreen | 0 | 0 |

My estimate for an iPhone 12 or a mid Android is 1 to 3ms per scrolling frame: one canvas, a cached honeycomb blit, about 230 hex fills and a few dozen 1px strokes. It adds no WebGL, no new requests and no new libraries. The cost is page length: in live mode the curve section is about 2,000px taller on desktop and 1,700px taller on phone. I have not run it on a real phone; headless Chrome here renders slowly, so the live recording (`media/moment.mp4`) has few distinct frames. `media/moment-*-frames.mp4` are frame-accurate 30fps renders of the same scroll.

## Risks

- **Pinned scroll length.** 2.4 screens of pinned stage is a commitment. It is native `position: sticky`, not scroll-jacking (the visitor's own scroll speed, no snapping, no wheel capture), but a visitor in a hurry has to scroll through it. Easy lever: the track multiplier in CSS (3.4 to 2.8) shortens it, and the timeline keys in `TL` stay proportional.
- **Timestamps.** The three definitions carry their passage starts from the transcript (0:00, 0:09, 0:17), as the base page does for its 3:39 card. The lines themselves begin a few seconds later; check against the audio before launch. The mid quote skips the passage's first sentence because its opening word is unconfirmed (dossier section 10). "Burnt" is verbatim.
- **Lit edges.** Channels light only while crossed, with no after-glow (see above). This is a deliberate departure from the hero's 600ms fade, to keep the crowd from reading as tadpoles. Worth a yes from Jesus.
- **Repetition.** His 0:34 line echoes the hero headline. Here it is the full verbatim quote with its timestamp, as the payoff of the scene, and no number sits near it (the dossier's Q01 caution).
- **Meaning of the right move.** The ranks slide three cells forward (rightward). It reads as "moves together when it matters", but it does not literally show buying or getting out.
- **Mid density.** The bell puts about 65% of all nodes in the mid zone, so it is the busiest part of the canvas. That fits the story but is the first thing to thin if the scene feels noisy.
- **Embedding constraints.** Sticky breaks under any ancestor with `overflow: hidden/auto`. `--navh` must match the real nav height. `100svh` needs iOS 15.4 or later (falls back to `100vh`).
- **Accessibility.** In live mode all four quotes are in the DOM and the accessibility tree; only the active one is visible and focusable, and the canvas is `aria-hidden`. Reduced motion gets the static layout with everything visible.

## How to graft it into the real page

1. Copy `crowd.js` over the page's crowd script. It needs `window.SwarmLattice` with `lattice`, `hexPath`, `rng`, `COL`, `clamp01` and `inOut` (all in today's `lattice.js`). It does not read `page.js` or the `swarm:motion` event.
2. Replace the `#curve` section markup with this one (keep the IDs: `curve`, `crowd-track`, `crowd`, `crowd-stage`, `crowd-canvas`, `crowd-you`, `crowd-side`, and the `data-ztag` / `data-zq` attributes). Keep whichever headline Jesus approves; `a-core-glow` now uses "Only one knows when to get out."
3. Replace the curve block in the CSS with the m1 block (static rules, `.curve.live` rules and the phone overrides), and add `--navh`.
4. Remove the curve's "Pause motion" button. If no other section uses it, the motion-toggle code in `page.js` and the `.motion-btn` styles become dead code and can go.
5. Re-check the pin at 1280x800, 1366x768, 820x1180, 375x667 and 360x780 (all fit here: the slot ends 10px (375x667, 360x780) to 190px (820x1180) above the bottom of the screen), and re-render with `crowdframes.mjs`.
