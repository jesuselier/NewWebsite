# m2: Lock in your seat

**The idea.** The pricing card sits on the honeycomb. Its top is open, so the field runs on into it. When the price row comes into view, the swarm wakes around the card, commits, and routes along the honeycomb's edges through three ports in the card's outline to the card's own core cell. As the agents dock, the six neighbours light (the badge's six dots follow them), the official mark lands on the core, the founding $49 turns gold and a mono badge reads LOCKED. Under the card, an honest price ladder shows where the price goes from here: Founding $49, then Standard $99, then a rise as the custom AI tools are completed.

Open: `http://127.0.0.1:8820/a-lab/m2/index.html#join`. Switches: `?t=<ms>` and `?reduce=1` show the settled card, as before. `?lock=<ms>` freezes the moment at that time. `window.__lockSeek(ms)` steps it frame by frame (it also moves the Join Swarm ring). `window.__lockDebug()` reports its state. The hero and every other section are unchanged.

## Timeline (from the moment the price row is 75% in view)

| Time | What you see |
| --- | --- |
| Before | The field around the card's top and inside the open seat; the core cell is a dim 1.5px gold outline; $49 is plain text; the badge reads LOCKING with six empty dots. |
| 0 to 0.4s | Agents appear on the field around the card (80 on desktop, 30 on phone), all muted grey, scanning: 175 to 260ms hops along the honeycomb's edges, faint lit edges, sensed cells brighten. |
| 0.4 to 1.0s | The decision: 76% of the scouts commit. A committed agent turns bright (#EEEBE4) and sets off. |
| 1.0 to 2.1s | Routes merge into trunks heading for the ports: left and right edges of the seat and the top centre on desktop and tablet, three points along the top on phones. They cross the card's border and run to the core. The whole edge an agent is crossing lights as it sets off, so a moving node sits on a lit edge and never trails a line. |
| about 2.0 to 2.4s | Arrivals at the cluster light the six neighbours in #55555B, one per corner reached. Each neighbour fills one dot of the badge. The core outline charges as agents dock. |
| about 2.4s | The lock, once 62% of the committed agents have docked (2.6s at the latest): the official `swarm-mark.svg` lands on the core (opacity and a 0.93 to 1 scale over 380ms), the $49 turns gold over 360ms, the badge flips to a solid hex and LOCKED, scouts fade, and one ring wave runs out across the seat and the field. |
| about 3.9s | Settled. The loop stops and the agent canvas is cleared. The settled card matches `?t=6000`, `?reduce=1` and the no-JS page. |

Measured live in headless Chrome: the moment starts about 70ms after the trigger, locks at about 2.5s and stops at about 4.0s (desktop and phone). It pauses while the stage is offscreen and resumes where it left off. It runs on wall-clock time, so a slow phone still settles on schedule.

## What changed

Only the pricing section, plus one FAQ answer. `hero.js`, `lattice.js`, `crowd.js`, `tools3d.js` and `NOTES.md` are byte-identical to `_base`. The folds, the t1500/t3000/t4800 frames, the reduced still and every desktop and phone tile above the pricing section are pixel-identical to the control capture.

**`index.html`, section 8 (pricing):**
- The art band above the headline (`.join-art` with the mark) is gone. The lit cell now lives in the card.
- New `.lock-stage`, a full-bleed wrapper holding two canvases (`#join-field`, `#join-agents`) and a `.lock-band` spacer above the card.
- The card is now `.pcard.has-lock`. It has an open `.pc-seat` (holding `#join-mark`) and a `.pc-body`.
- The body order is: plan name, price row, note, source line, plan switch, checklist, gold Join Swarm button (the ring is unchanged). The plan switch moved into the card under the price, so agents can enter from above on phones and so the price row is in view right after the nav's `#join` jump.
- The price row carries the badge `#pc-lock` (`aria-hidden`: six dots, LOCKING, LOCKED). In the HTML it is already locked and the six dots are lit, so the page without JS shows the settled state.
- New ladder `.ladder-wrap > ol.ladder` (three `.rung`s) between the card and the Whop slot.
- The Whop slot and the risk line are unchanged, now in `.join.join-after`.
- The "In active development" note box above the card is removed; its content is now ladder step 03.

**Copy (mine, to check with Jesus):**
- Lede: "The first 50 founding seats lock in $49/month for as long as you stay. After that it goes to $99/month. Cancel anytime."
- Founding note: "Yours for as long as you stay subscribed. Cancel whenever. 50 seats only."
- Ladder:
  - 01 Founding, Now, $49/mo, "Locked in for as long as you stay subscribed."
  - 02 Standard, $99/mo, "Once the 50 founding seats are gone."
  - 03 Then, Rises, "The custom AI tools are still being built, and the price for new members goes up as they're completed. A founding seat stays at $49." The status line reads Custom AI tools, In development. No dates, no tool names, no counts, and no price for step 03.
- FAQ "What does "$49 forever" mean?": the answer now follows the October 17 founding-price policy, so it no longer contradicts the ladder. The answer is "A founding seat keeps $49 a month for as long as you stay subscribed, even as the price for new members goes up. Once those 50 seats are taken, new members pay $99 a month. If you cancel and rejoin after prices have gone up, you pay the price at that time."
- No other copy changed.

**`core-glow.css`, section 8:**
- `.lock-stage` holds the tokens `--lockR` (16px desktop, 13px phone), `--band` and `--seat`.
- `--seat: calc(var(--lockR) * 13.51 - 2px)` makes the seat exactly four lattice rows above and below the core. The card's top edge then crosses the honeycomb halfway along a vertical edge. Without that, a corner row sits exactly on the border and no edge can cross it.
- Other rules: `.pc-seat` and `.seat-drawn`, `.pc-body`, `.price-row`, the badge (`.pc-lock`, `.lk-dots`, `.is-locked`), `.pcard.lock-pending.is-gold .amt` (plain text until the lock), and the ladder (`.ladder`, `.rung`, whose treads step up 22px per rung, `.rg-*`). Below 760px the ladder becomes a vertical rail.
- `.dev-note` and `.join-art` rules are removed.

**`page.js`:**
- `joinField()` is replaced by `lockMoment()`, about 330 lines, self-contained, built on `SwarmLattice`:
  - `geometry()` and `inCard()`: the card, seat and core in stage pixels.
  - `setup()`: the lattice, walkable corners, ports, a breadth-first search where crossing the card's outline is allowed only at a port, and parents that head for the port outside the card and follow the six arteries inside.
  - `spawn()`, `policy()` and `step()`: scan, commit, route, dock, lock.
  - `drawStatic()`: the field and the seat's surface, drawn once.
  - `drawRoutes()`: full lit edges.
  - `draw()`: wave, sensing, routes, cluster, agents, plus the DOM sync for the mark, the badge dots, `lock-pending` and `is-locked`.
  - `render()`, `seek()`, `loop()` and `start()`: the timing.
  - IntersectionObservers trigger the moment and pause it offscreen, `visibilitychange` resets the clock, and a ResizeObserver rebuilds on a width change and shows the settled card.
- `PLANS.founding` gets `lock: true` and the new note. `showPlan()` toggles `has-lock`, so the badge shows only on the Founding plan, and the $99 and $990 are never gold.

## Kit and honesty checks

- I scanned every 120px through the section at 1440x900, 390x844, 820x1180 and 1280x800 (settled and `?reduce=1`). No view has more than one gold button, one gold number or one lit cell. Before the lock, the only gold is the core cell's own outline.
- Gold is used only for the core cell, the $49 and the existing Join Swarm button with its ring.
- Grey #55555B appears only on hex outlines and on the two chip borders (the base page already uses it for chip borders).
- The kit radii are kept: 28px card, 18px switch, 10px chips. There are no new glows, gradients or shadows, and no text on canvas. All words are in the DOM.
- There are no em or en dashes, and the CSP, import map and fonts are unchanged.
- The only numbers are $49, $99, 50 and the existing source date. There are no seat counts, dates, tool names or tool counts.
- "LOCKED" describes the founding price policy, not a reservation, and the note under it says so in words.

## Fallbacks

- `?reduce=1` / `prefers-reduced-motion`, `?t=`, and no IntersectionObserver show the settled card at once: field, mark, gold $49, LOCKED.
- No JS: the seat shows with a plain surface and the mark (the CSS default), with a gold $49 and LOCKED.
- No canvas: `settleDom()`.
- Rotating or resizing mid-play jumps to the settled state.
- No page errors in any capture or live run, and no horizontal overflow at any size tested.

## Performance on a mid phone

Measured by stepping the moment frame by frame (simulation, drawing and DOM sync):

| | Phone 390x844 @2x | Desktop 1440x900 @1x | Desktop @2x |
| --- | --- | --- | --- |
| Agents | 30 | 80 | 80 |
| JS per frame, mean / p95 / max | 0.44 / 1.0 / 2.3 ms | 0.84 / 2.6 / 8.3 ms | 0.70 / 1.4 / 3.9 ms |
| Agent canvas (cleared and redrawn each frame) | 780x562 | 1440x346 | 2880x692 |
| Field canvas (drawn once) | 780x1038 | 1440x787 | 2880x1574 |

- On an iPhone 12-class phone, expect well under 4ms of JS per frame plus a small 2D raster: thin lines and 30 tiny hexagons on a 0.44MP canvas. That leaves comfortable 60fps headroom.
- The moment runs for about 4s, once, then costs nothing. Building the lattice and drawing the static field takes a few ms, once per width.
- Nothing new downloads: no images and no libraries.
- Not yet run on a real phone. Headless Chrome here renders in software, so the live recording `media/moment.mp4` shows few distinct frames; `media/moment-*-frames.mp4` are frame-accurate 30fps renders.

## Risks

- **Two marks on the page.** Like the base, the hero and the pricing card each show the official mark. They are never in the same view (scanned), but the seat brings it closer to the card's content than before.
- **The card is taller,** by the 214px seat (174px on phones): the page grows 364px on desktop and 461px on phones. The switch now sits under the price instead of above the card, which departs from the reference's order.
- **"LOCKED" could be read as a reserved seat.** I kept it next to "Yours for as long as you stay subscribed" and on the Founding plan only. If Jesus prefers, it can read "PRICE LOCKED" without layout changes (the badge has room on phones).
- **Trigger timing.** The moment starts when 75% of the price row is visible. A visitor who scrolls fast past it still gets the lock (the stage pauses offscreen and resumes when seen), but may see it finish rather than start.
- **Ladder step 03 has no price,** by design. A reviewer may want a number there; none exists, so it stays "Rises".
- **The desktop field canvas at 2x is 4.5MP** (static). If memory matters on high-DPI laptops, cap its DPR at 1.5; the lines are 1px and faint.
- The FAQ answer edit aligns with the binding policy but goes beyond the pricing card. Drop it if the comparison must keep the FAQ byte-identical.

## How to graft it into the real page (`a-core-glow/`)

1. **HTML:** replace section 8 with this one, keeping the real page's own copy where it has moved on (its lede already states the policy) and its `../brand/` paths. Keep the `h2-one` class it uses. The real page has no dev-note box, so ladder step 03 is the only place that repeats the tools line besides the lede and the FAQ.
2. **CSS:** copy the `/* 8. pricing: "Lock in your seat" */` block, the badge and ladder rules, the phone overrides (`.lock-stage` tokens, `.pc-body`, `.join-after`) and the `@media (max-width: 760px)` ladder block. Remove the real page's `.join-art` and `#join-mark` rules.
3. **JS:** replace the real `joinField()` IIFE with `lockMoment()` from this `page.js`. Add `lock: true` to `PLANS.founding` and the `has-lock` toggle in `showPlan()`. `lockMoment()` needs only `SwarmLattice`, `STATIC`, `DPR()`, `$`, `$$` and `motionOff`, all already in the real `page.js`.
4. **Check:** `#join` jump at 1440x900, 1366x768, 1280x800 and 390x844 (the price row must be in view and the moment must start); the gold scan; `?reduce=1`; no-JS; rotation mid-play.
5. Test on an iPhone 12-class phone and a mid Android. If needed, lower the agent counts (`N`) or skip the wave on phones.

## Captures

- Media in `media/`:
  - `moment-desktop-frames.mp4` and `moment-phone-frames.mp4`: frame-accurate, `?lock` stepped with `__lockSeek` at 30fps, 4.4s plus a 1.5s hold.
  - `moment.mp4`: live recording with rec.mjs, `#join`, desktop. The jump smooth-scrolls past the hero first, so the moment starts about 6s in; I recorded 14s so the clip includes the settle (it ends at 9s, when the page stops changing).
  - `hero-desktop-frames.mp4` and `hero-phone-frames.mp4`: the unchanged hero, via frames.mjs.
- Review stills in the scratchpad's `lab/m2/`:
  - `moment-01.png` to `moment-06.png` (desktop) and `moment-phone-01.png` to `-06.png`: open seat 0s, scanning 0.5s, routing 1.3s, docking 2.1s, lock 2.48s, settled 4.4s.
  - `lock-desktop-NN.png` and `lock-phone-NN.png` (4fps from the frame renders), `motion-desktop-NN.png` and `motion-phone-NN.png` (hero).
  - Folds, t-frames, reduced stills and tiles.
  - `vp-*` viewport walks through the section (and `vpr-*` for reduced), `reduced-join-*.png` and `nojs-join-*.png`.
