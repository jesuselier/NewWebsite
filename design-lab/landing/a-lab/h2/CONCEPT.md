# h2: Signal Handoff

**The idea.** The swarm converges and the core lights exactly as before; then one bright #EEEBE4 pulse leaves the core along the honeycomb's own channels, routes around the headline (through Scout 03 on wide screens) and lands on the gold Join Swarm button, which ignites its revolving highlight at the exact point of contact. The swarm literally hands its signal to the call to action, and the scout card reports it on the way.

## What you see (1440x900, frame times from `window.__heroInfo()`)

- 0 to 2.78s: the current convergence, unchanged (boot wave, 196 agents scan, commit, route to the core, the mark lands at 2.78s). Scout 03 reads SCANNING, then ANALYZING; its Scan bar fills while the agents scan, the Analyze bar while they agree.
- 2.84 to 3.16s: the stage clears. The swarm's own lit edges and nodes fade out over 320ms as the mark lands, so nothing else moves when the signal leaves.
- 3.00s: the pulse leaves the core through the lower-right channel of the cluster (a 4.5px hexagonal node, a size up from the agents, lighting each edge it crosses in #EEEBE4 at 2.25px; each edge fades over 760ms behind it). It launches, cruises at about 2,000px/s and slows into the button.
- 3.00 to 3.54s: it runs right between the cluster and the fact chips, then down past the end of the headline. It never crosses a line of copy: routes are planned around the glyphs' own line boxes, and the pulse is held to 30% strength anywhere near text.
- 3.54 to 3.67s: it passes behind Scout 03. The card's border lifts to #55555B while the signal is inside, the card flips to REPORTING ("Reporting to the watch list") and its Report bar starts to fill.
- 3.67 to 3.90s: it comes out of the card's left edge and runs straight into the right side of the gold button. The Report bar completes as it lands.
- 3.90s: ignition. The ring's light starts at the contact point (the tail grows out of it, no tail appears where the light has not been), the track flares and settles to its normal 22%, and the first lap runs in 1.0s, decelerating smoothly into the normal 3.6s pace. Scout 03's spinner stops.
- 4.66s: the last lit edge is gone. 4.90s: the first lap is done and the CSS loop takes over in phase. The canvas has nothing left to draw and the loop stops at 4.94s, inside the 5s budget.

Phone (390x844): same timeline; the pulse runs right between the cluster and the chips, down the right gutter and into the top right of the full-width button (lands at 3.64s, first lap done 4.64s). Tablet (820x1180): around the end of the headline into the button's right side (lands 3.60s); Scout 03 sits under the CTA there, so it switches to REPORTING as the pulse leaves the core. Checked at 1280x800, 1366x768, 1440x900, 1440x1000, 1536x864, 1920x1080, 820x1180 and 390x844: the route is planned per layout and always stays off the copy.

The settled frame (`?t=6000`, live after 5s) is the base page plus the running ring; `?reduce=1` and `prefers-reduced-motion` show the settled still with the static ring, Scout 03 at REPORTING with all three bars full, and no pulse. No text is drawn on canvas, the pulse is never gold, and no new glow was added (the ring is the existing exception Jesus asked for).

## What changed

Only two files differ from `_base/`; `index.html`, `page.js`, `lattice.js`, `crowd.js` and `tools3d.js` are byte-identical.

**`hero.js`**
- `SIG` constants: departure delay 220ms after the mark lands, edge fade 760ms, 30% floor behind copy, travel 700 to 900ms, first lap 1000ms, normal lap 3600ms.
- `measure()`: also builds `prects` (the copy's text-node line boxes; the base mask uses `Range.getClientRects()`, which includes the full-width block spans of the h1), `blocks` (the quote card), `relay` (Scout 03 when it floats beside the copy) and `ringBox` (the ring's rounded rect, 4px outside the hero button, radius 22, perimeter).
- New: `pulseMaskAt()`, `inBox()`, `ringSD()` (rounded-rect distance), `ringPos()` (a point on the ring in the SVG rect's pathLength units, so the ring can start where the pulse lands), `planRoute()` (multi-source Dijkstra from the lattice edges that cut the ring's right half, outward to the core; cost 1 + 60q² per unit length near copy, the quote card blocked, the relay card free; then the speed profile and the relay entry and exit points), `sigS()` / `sigTau()` (distance at time, time at distance), `drawPulse()`, `ringLead()` / `ringAt()` (drives the hero ring's six dashed rects inline, frame-exact), `handRing()` (live hand-over to the CSS loop with a negative `animation-delay` so the phase matches), `repT()` / `outT()` (when Scout 03 reports).
- `setup()`: plans the route and marks the hero button `sig-drive` (its ring stays dark until the pulse lands).
- `step()`: at resolve schedules departure and arrival and extends `END` to cover the edge fade and the first lap.
- `renderAgents()`: the `calm` factor fades the swarm's edges and nodes over 320ms after resolve, then calls `drawPulse()`.
- `updatePhase()`: Scout 03's state follows the signal (SCANNING, ANALYZING, REPORTING when the pulse reaches the card); the three step bars fill as progress bars via `--p`; the card's border lifts while the signal passes through it; the spinner runs until the pulse lands.
- `render()`: stops redrawing the agent canvas once it is final, adds one near-invisible pixel to each agent frame (see Risks), and calls `ringAt()`.
- `finish()`: hands the ring to CSS in live mode. `window.__heroSeek(ms)` still works and now also drives the hero ring; new read-only `window.__heroInfo()` returns the timing, route length, contact point and planning time.

**`core-glow.css`** (one appended block, "lab h2, Signal Handoff"): `.btn-gold.sig-drive .ring rect { animation: none !important }`, and the step bars as fills (`::after` scaled by `--p`, #EEEBE4 while filling, #8E8A80 once full, full by default so no-JS and reduced motion show the finished card).

## Performance on a mid phone

- No new canvas, layer, image or network request. The pulse draws into the existing agent canvas.
- Route planning runs once per layout (load, fonts ready, width change): 2 to 5ms on this machine at phone size, about 10 to 12ms with 4x CPU throttling (a mid Android). Desktop 6 to 18ms, first run included.
- Handoff frames cost the same as base frames: about 1.3 to 1.7ms unthrottled, 6 to 9ms at 4x throttle, under the 16ms budget. Frames after the core lights are cheaper than base, because the swarm stops drawing about half a second sooner.
- During the 1s first lap, hero.js writes six inline dash styles per frame on the hero ring, which repaints that small SVG and its 5px blur halo. The base's CSS ring repaints the same way every frame, so the paint cost is unchanged.
- Total motion still settles before 5s (worst case: resolve at 2.78s, travel capped at 900ms, first lap done by 4.90s), then nothing runs but the existing CSS ring, paused offscreen by `page.js`.
- Not yet checked on a real iPhone 12-class device.

## Risks

- **Lattice alignment is layout-dependent.** The route is planned live from the copy's line boxes, so a copy or layout change can move it (for example to the far edge of the screen). If no clean route exists it degrades gracefully: no route means no pulse, and the ring runs as in base.
- **Phone legibility.** On phones the only way around the headline is the right gutter, 10 to 15px from the screen edge, partly at the 30% copy floor. It reads, but it is the weakest leg; the ignition carries the moment there.
- **The relay hides about 130ms of the pulse behind Scout 03.** At this speed it reads as the card catching and passing on the signal, but a reviewer could read it as the line breaking. If so, set `relay = null` in `measure()` and the planner routes around the card (longer, about 2,000px).
- **The ring is dark for the first 3.9s.** The gold button is visible from the first frame, but the revolving highlight Jesus asked for only appears when the pulse lands. That is the point of the concept; if he wants the ring from frame 0, keep the track on at 22% before ignition (one line in `ringAt()`).
- **Stale canvas buffer.** In this Chrome build, a canvas frame that only calls `clearRect` can present an older buffer (seen as a stale trail in sequential `__heroSeek` captures). h2 draws one near-invisible pixel per agent frame to avoid it. The base hero has the same latent issue in its last frames; worth porting.
- `rec.mjs` captures only about 3 frames a second here (software GL), so `media/moment.mp4` is choppy. Judge motion from `hero-desktop-frames.mp4` and `hero-phone-frames.mp4`.

## How to graft into the real page

1. Copy the `core-glow.css` block "lab h2, Signal Handoff" to the end of the page's stylesheet.
2. In the page's `hero.js`, port in order: the `SIG` constants and new state variables; the `measure()` additions (`prects`, `blocks`, `relay`, `ringBox`); the block of new functions from `pulseMaskAt()` to `sigTau()`; `drawPulse()`, `ringLead()`, `ringAt()`, `handRing()`, `repT()`, `outT()`; then the edits to `setup()`, `step()`, `renderAgents()` (`calm`), `updatePhase()`, `render()`, `finish()` and `__heroSeek`. A diff of `a-lab/_base/hero.js` against `a-lab/h2/hero.js` shows every hunk.
3. The hero's gold button is found as `.hero-copy .btn-gold`, so the HTML needs no change. Its ring markup must stay as it is (six rects with `pathLength="100"`, rx 22, 4px outside the button), because `ringPos()` and the dash math assume it.
4. Scout 03 must keep `id="scout-card"` and its `.sc-steps` list. It acts as the relay only while it is absolutely positioned beside the copy (1240px and up).
5. Check with `?t=3600`, `?t=3950`, `?t=6000` and `?reduce=1`, and render `frames.mjs` at desktop and phone.

## Captures

- Video: `media/hero-desktop-frames.mp4`, `media/hero-phone-frames.mp4` (frame-accurate 30fps), `media/moment.mp4` (live recording, `#top`).
- Stills: `media/fold-desktop.png`, `media/fold-phone.png` (settled), `media/handoff-desktop.png` (the landing at 3.96s).
- Review set (scratchpad `lab/h2/`): folds, t1500, t3000, t4800, reduced, tiles, `motion-*-NN.png`, and `moment-01.png` to `moment-06.png` (core lit 2.90s, pulse leaves 3.25s, around the headline 3.48s, through Scout 03 3.62s, lands and ignites 3.96s, settled).
