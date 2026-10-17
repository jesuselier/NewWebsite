# h4: Scroll Convergence

**The idea.** The swarm scans the honeycomb on its own for about two seconds, then the hero holds still for about 120vh of scroll and the visitor's own scroll becomes the consensus: every bit of scroll turns more grey scouts bright, routes them along the shared paths to the core, lights the six neighbours, and at the end of the hold the official mark lands with its warm light and the page lets go. If nobody scrolls, the rest plays on its own and the first screen is complete at rest by about 4.2s (settled 4.85s), exactly the base hero's settled frame.

Open: `http://127.0.0.1:8820/a-lab/h4/index.html`. `?t=<ms>` freezes a frame (autoplay timeline, no hold) and `window.__heroSeek(ms)` steps it; `?reduce=1` gives the settled still with no hold; `?t=0&pin=1` keeps the hold in the frozen page, so a capture script can scroll the real page and seek (the scroll position is read at each seek). `window.__heroInfo()` returns `{ t, P, complete, auto, routing, absorbed, roomPx, pinTop }`.

## What the visitor sees (1440x900; phone is the same with 86 agents)

| Scroll / time | What happens |
| --- | --- |
| 0 to 1.2s | The base opening: the field boots ring by ring from the core on a receding plane, the core cell is a dim gold outline. |
| 0.2 to 2.4s | 196 agents wake and scan as grey `#8E8A80` scouts (one colour, so "bright" can mean "agreed"): eased 175 to 260ms hops, every crossed edge lit for 600ms, sensed cells brighten. The plane straightens to a 12 degree recline and waits there. Scout 03 reads SCANNING; its Scan bar fills over 2s. |
| First scroll | The hero is held (CSS `position: sticky`); copy, chips, cards, Join Swarm and the members rail do not move. Scouts commit as the visitor's progress passes each one's threshold (spread over the first 30% of the hold, nearer ones a little earlier): the node turns `#EEEBE4` and starts down the shared tree. Scout 03 flips to ANALYZING and its Analyze bar fills with the scroll. |
| 0 to 84% of progress | Committed agents travel at about one edge per 30px of scroll, so they move with the finger. Each lit edge fades by time (600ms) and by distance (at most about five edges behind the agent), so a fast scroll draws short bright runs, never whole routes. The six neighbours light in `#55555B` as agents reach their corners, the core outline charges, the recline flattens. Scrolling back plays all of it back: agents back out along their routes, turn grey again below their decision point and resume scanning, neighbours dim. |
| 85 to 100% | Scouts fade, the official `swarm-mark.svg` lands (opacity and 0.93 to 1 scale), the warm light opens, one ring wave runs out across the field, Scout 03 reads REPORTING and its Report bar fills. Progress reaches 1 at 92% of the hold, so there is a short still beat with the core lit before the release. |
| Release | The hold ends and the hero scrolls away normally; the nav turns solid only now (it stays transparent while the hero is held). The rest of the page is the base page, pixel for pixel. |

Idle rules (also what `?t` renders): if there is no scroll by 2.4s, or the visitor stops scrolling for 1s before the end, the remaining progress plays on its own with a smoothstep ease (1.8s for a full run, shorter for the remainder). Once the core has lit, the sequence is locked (scrolling back never un-lights it), the hold is shortened to wherever the visitor is (nothing on screen moves), and once the hold is fully above the screen and the visitor is idle, the remaining room collapses with the scroll position compensated in the same frame, so scrolling back up never passes through a dead hold. A visitor who waits at the top therefore never meets a hold at all.

Guards: progress follows the scroll with a 70ms ease and at most a full run per 0.7s (a flick still shows a convergence), and the core cannot light before 2.0s (the swarm always scans first). A hero that leaves the screen unfinished is finished at once, so it is never found frozen halfway. Loading mid-page or on a `#hash` finishes it immediately.

## What changed

Only three files differ from `_base/`; `page.js`, `lattice.js`, `crowd.js`, `tools3d.js` and `NOTES.md` are byte-identical.

**`index.html`**: the hero section is wrapped in `<div class="hero-pin" id="hero-pin">` with an empty `<div class="pin-room" id="pin-room" aria-hidden="true">` after it. Nothing else (CSP, import map, fonts, kit tokens and `class="swarm"` untouched).

**`core-glow.css`** (one appended block, "lab h4, Scroll Convergence"): `.pin-room` hidden by default; `html.h4-pin .hero { position: sticky; top: 0 }` and `html.h4-pin .pin-room { height: 120vh }`; `html.h4-pinned .nav.scrolled` stays transparent while the hero is held; Scout 03's three step bars become fills (`::after` scaled by `--p`, `#EEEBE4` while filling, `#8E8A80` when full, full by default). `.h4-pin` is added by `hero.js` only when the hero runs live, so no JS, reduced motion and `?t` all get the base layout with no hold.

**`hero.js`** (the base hero kept, with a progress controller between the wall clock and the convergence):
- Constants: `T` (wall clock: boot, tilt, 2s scan, autoplay at 2.4s for 1.8s, 1s idle, 650ms settle), `PZ` (progress thresholds for commit, arrival, consensus, mark, fades, ring wave, and `hold: 0.92`), `V0` route speed, `TRAIL`, `TAU`/`VMAX` scroll follow, `THR` recline.
- `control(t, sp)`: eased, rate-limited follow of the scroll progress, the 2s earliest cap, idle and no-scroll autoplay, completion lock.
- `routeFrom()`, `commit()`, `uncommit()`: a committed agent's path (shared tree to the cluster, then the core's corners) and the hand-over between the engine's wall-clock hops and progress-driven placement; `policy()` keeps the base scan and commits by threshold.
- `step()`: places committed agents on their paths as a function of P (eased per edge, so they still hop corner to corner), lights crossed edges with their owner and index, counts absorptions, sets the neighbours' targets; `advanceTo(target, sp)` runs the fixed 60Hz step with the scroll input interpolated, so `?t`, `__heroSeek` and rebuilds are deterministic (`rebuild()` replays the logged inputs).
- Drawing: `drawEdgesP()` / `drawAgentsP()` (the engine's drawing plus per-agent visibility and the distance-limited trail), `handAt()`, `glowAt()`, `scoutVis()` and the ring wave all read P; `tiltK()` / `projAt()` / `tiltCSS()` add the recline that the scroll flattens (the tint canvas now tilts with the field); `updatePhase()` drives Scout 03's state and bar fills.
- The hold: `measurePin()`, `readSP()`, `updatePinned()`, `release()` (shortens the room to the visitor's position once the core is lit), `collapse()` (removes the remaining room when it is fully above the screen and the visitor is idle, with `scroll-behavior` and `overflow-anchor` switched off for that one frame); passive scroll and touch listeners.
- Lifecycle as in the base (rAF only while running, IntersectionObserver pause, `visibilitychange`, `swarm:motion`, width-change rebuild, `fonts.ready` rebuild), plus `window.__heroInfo()`.

## Performance on a mid phone

- No new canvas, image, layer or request. The hold is `position: sticky`, which the compositor scrolls, so touch scrolling stays native (no scroll listeners that block, no transforms on scroll, no `preventDefault`); the scroll position is read once per animation frame.
- Per-frame JS (sim plus draw), 390x844 at DPR 2 with 4x CPU throttling: scan median 9.3ms (p95 16.9), convergence 7.3ms (p95 12.4), versus 9.1 / 6.0ms for the base hero. Desktop 1440x900 unthrottled: 3.1ms / 2.0ms. The extra cost is the per-agent path placement and the trail check.
- The loop runs longer than the base when the visitor scrolls slowly (it runs for as long as they drive it), and the scan lasts 2.4s instead of about 1s. It still stops completely once the core has lit (worst case without input: 4.85s), and it stops at once if the hero leaves the screen.
- `hero.js` grows from 22 KB to 33 KB (8.0 to 11.4 KB gzipped).
- Not yet checked on a real iPhone 12-class device; headless Chrome here composites in software, so the live recording (`scroll-live-desktop.mp4`) shows few distinct frames. The frame-accurate renders show the real motion.

## Risks

- **Scroll-jacking perception.** For 120vh the page does not move under the finger. The visible response is immediate (agents turn bright within the first few percent and move about 1px per px of scroll), but some visitors will read any hold as friction. Mitigations in place: the hold vanishes for anyone who waits 2.4s, it shortens to the visitor's position as soon as the core lights, and it never comes back on the way up. A shorter hold (90 to 100vh) is a one-value change in the CSS.
- **iOS toolbar.** The hero's min-height is `100svh`; when Safari's toolbar collapses the visible viewport is taller than the held hero, so the top of the next section can show in the bottom band near the end of the hold. Cosmetic; check on a device.
- **Programmatic scroll compensation** in `collapse()` only runs when idle and not touching, but any `scrollTo` during an unforeseen momentum state could cause a small jump. It can be removed (leaving a still hold on the way back up) without touching anything else.
- **A failure after `.h4-pin` is set** (an exception in the hero) would leave a held, frozen hero. The class is added after the canvas checks; a production graft should add it only after the first successful frame.
- **Reading time.** A visitor who scrolls slowly keeps the swarm moving for longer than 5s. That motion is driven by their input, which WCAG 2.2.2 does not count as auto-playing; any pause of 1s ends it within 1.8s.
- **The scan is calmer than the base.** All agents start grey, so the first 2.4s at rest carry less contrast than the base's white majority (scouts were brightened to compensate: edges 0.56, nodes 1.0). On phones the visible scan above the copy is sparse.
- **Uniform phone layout.** On phones the hero is taller than the screen; sticky with `top: 0` holds its first screen (copy, CTA and the top of the quote card, exactly the at-rest first screen) and the stacked cards follow after the release. Checked at 1280x800, 1366x768, 1440x900, 1920x1080, 820x1180, 390x844 and 375x667: the next section is always below the fold during the hold and sits at the fold at its end.

## How to graft it into the real page

1. Wrap the hero section in `<div class="hero-pin" id="hero-pin">` and add `<div class="pin-room" id="pin-room" aria-hidden="true"></div>` right after the section, inside the wrapper.
2. Append the "lab h4, Scroll Convergence" CSS block. If the real page already styles Scout 03's bars as fills (h2 Signal Handoff does), keep one of the two bar treatments.
3. Port `hero.js`'s controller into the real hero: `T`/`PZ` timing, `control()`, `routeFrom()` / `commit()` / `uncommit()`, the progress placement in `step()`, `advanceTo()` with the input log, the P-driven `handAt()` / `glowAt()` / `scoutVis()` / ring wave, `drawEdgesP()` / `drawAgentsP()`, and the hold functions (`measurePin`, `readSP`, `updatePinned`, `release`, `collapse`) with their listeners. The routing tree, mask and lattice setup are unchanged from the base, so a real hero that kept those can take the controller as a layer on top. If the real hero has moved on (round 4 six-spoke convergence, font gate), keep its routes and replace only its time-based commit and arrival with the progress-based ones.
4. Add `.h4-pin` (rename it) only after the hero's first frame has rendered, and never under reduced motion or `?t`.
5. Re-check `?t`, `?reduce=1`, `window.__heroSeek` (page.js still wraps it for the ring lights), and the ring and gold-per-view scan; the settled frame here is identical to the base's.

## Captures

- Standard capture (`shootall.sh`): `scratchpad/lab/h4/` (settled, t1500, t3000, t4800 and reduced folds, d-00 to d-12 and p-00 to p-08 tiles). Settled and reduced folds and every tile below the hero match the control capture (no pixel off by more than 24 levels; the page height at rest is the base's 11,063px desktop and 14,340px phone).
- Frame-accurate autoplay (no scroll) renders: `media/hero-desktop-frames.mp4`, `media/hero-phone-frames.mp4` (`frames.mjs`, `?t=0` stepped with `__heroSeek` at 30fps); review frames `scratchpad/lab/h4/motion-desktop-01..13.png`, `motion-phone-01..13.png`.
- The moment (the hold, rendered frame-accurately from the real pinned page, `?t=0&pin=1`, scroll then seek per frame): `media/moment.mp4` (desktop, steady pass through the hold and on into the page), `media/moment-scrub.mp4` (forward to 60%, back to 30%, then through), `media/moment-phone.mp4`. Stills `scratchpad/lab/h4/moment-01..06.png`: scanning, first commits, streaming, neighbours lighting, the mark landing, the release.
- Live recording of the real page with a scripted scroll through the hold: `media/scroll-live-desktop.mp4` (software compositing, low frame count).
- The jump links (`#curve`, `#join`, the rail's `#m-*`) skip the hold by design, so the section moment is the hold itself rather than a `rec.mjs` jump.
