# Graft plan: Core Glow creative bake-off (October 17, 2026)

Creative director's decisions on the six lab builds (`a-lab/h1` to `h4`, `m1`, `m2`), with the panel scores, the reasons, and the exact steps to graft the winners into `design-lab/landing/a-core-glow/`.

## 0. Read this first: the live page has moved on

The lab builds and the "control" the judges saw are all based on `a-lab/_base/`. That is a copy of `a-core-glow/` from October 16 at 23:22, at the end of Jesus's round 3 notes. Since then `a-core-glow/` has been through the round 3 review fixes, Jesus's round 5 notes and the round 4 review fix (NOTES.md, "Round 6" tasks, finished at about 04:45 UTC on October 17). Every lab file except `tools3d.js` now differs from the live page:

- **Hero.** `hero.js` was rebuilt: it is time-pure (positions are a function of time). The honeycomb and the unlit core are there at first paint. About 65 agents (20 on phones) use the page's one glyph, a hex outline with a head node. They sense, decide and commit as trains along twelve routes. Ignition is at 2.4s and everything is still by 3.2s. At rest the routes stay as quiet traces and 10 agents stay parked near the core.
- **Ring.** The gold-button ring now plays once and rests on a full ring (3.6s, no loop). Its static 35% track is visible from first paint.
- **Crowd.** `crowd.js` was redrawn twice, to Jesus's round 5 spec: hexagonal nodes on a lattice, groups moving as rigid blocks, YOU walking the curve, settled by 4.8s.
- **Pricing.** It has no dev box. The Whop row is inside the card, How joining works sits under the card, and the policy copy is in place.

**Rule for the graft:** port ideas and specific functions INTO the live files. Never copy a lab file over a live one, and never undo Jesus's notes. Where this plan and his notes or the brief disagree, the notes and the brief win; record the call in `a-core-glow/NOTES.md`.

I judged from the panel reports, the builders' reports and my own look at the captures (section 3). I also took fresh frames of the live hero from `a-core-glow/media/hero-*-frames.mp4`, and probed the live hero layout at six viewports.

## 1. Decisions

| Piece | Decision |
| --- | --- |
| **Hero** | **Combination: the live round-6 hero, plus h2 Signal Handoff's closing beat, plus Scout 03 progress bars (from h2, which h4 also built).** After ignition, one bright agent leaves the core along the honeycomb. On desktop it passes through Scout 03 (the card flips to REPORTING) and lands on the hero's Join Swarm button. The button's light starts from that contact point, draws one lap and rests on the full ring. The pulse's path stays as a quiet trace at rest. Phones and any layout without a clean route get no pulse; the ring starts just after ignition from the point nearest the core. |
| h1 Rising Routes | Not adopted. No code or geometry from it. |
| h3 Push-in | Not adopted. No code from it. |
| h4 Scroll Convergence | Not adopted (scroll hold rejected). Only its idea of bars that fill with each phase comes along, through h2's implementation. |
| **m1 The Crowd** | **Not adopted.** The live crowd stays as it is. Two ideas go to Jesus as follow-ups (section 7). |
| **m2 Lock In Your Seat** | **Adopted with changes.** The pricing card gets the open "seat" with the section's one lit cell. Agents route into it and the founding $49 lights gold as the mark lands. The honest price ladder sits under the card. The LOCKING and LOCKED badge, its six dots and m2's copy edits are dropped. |

## 2. Panel scores (de-anonymized)

### Hero panel

Letters as each judge saw them. Wow: A control, B h1, C h2, D h3, E h4. Sell: A h1, B h2, C h3, D h4, E control. Craft: A h2, B h3, C h4, D control, E h1. "Control" is the lab's `_base` hero, not today's live hero.

| Hero | Wow | Sell | Craft | Mean | Ranks (wow / sell / craft) | Rank sum |
| --- | --- | --- | --- | --- | --- | --- |
| **h2 Signal Handoff** | 6.5 | **8.0** | 7.5 | **7.33** | 3 / 1 / 2 | **6** |
| h3 Push-in | **8.5** | 5.5 | 6.2 | 6.73 | 1 / 4 / 4 | 9 |
| h4 Scroll Convergence | 4.5 | 7.5 | **8.0** | 6.67 | 5 / 2 / 1 | 8 |
| control (`_base` hero) | 5.5 | 6.5 | 6.8 | 6.27 | 4 / 3 / 3 | 10 |
| h1 Rising Routes | 8.0 | 4.5 | 4.5 | 5.67 | 2 / 5 / 5 | 12 |

h2 has the best mean and the best rank sum, and it is the only concept no judge ranked below third.

### Signature moments (one judge each, 0 to 10)

| | Impact | Clarity | Honesty | Kit fidelity | Phone | Avg |
| --- | --- | --- | --- | --- | --- | --- |
| m1 The Crowd | 7.5 | 8 | 8.5 | 8 | 8 | 8.0 |
| crowd control (`_base`) | 4 | 7 | 9 | 4.5 | 6 | 6.1 |
| m2 Lock In Your Seat | 7.5 | 8 | 9 | 8.5 | 8 | 8.2 |
| pricing control (`_base`) | 5.5 | 7 | 7.5 | 8.5 | 7 | 7.1 |

Both moment judges said "adopt with changes", but both judged against the stale `_base` sections. The crowd control's main faults (a Pause motion button, a 15s loop, round dots, no honeycomb) are all fixed on the live page. The pricing control's dev box and source line are gone too. My decisions weigh the moments against the live page.

## 3. What I saw in the captures

- **Live hero (round 6, fresh frames).** The honeycomb and the unlit core are there in frame 1, so there is no empty band. At 0.8 to 1.6s the agent glyphs spread over the top band and the outer columns, with sense rings and no line on the copy. Trains run into the six neighbours and the mark ignites big at 2.4s. The rest frame keeps the traces and the parked agents. This already answers several panel risks raised against the `_base` control: the empty first paint, the stray path after the glow, the box edge on the glow layer and the swarm vanishing at rest. What it still lacks is any link between the swarm and the offer: the motion ends at the top of the screen.
- **h2** (`lab/h2/moment-01` to `06`, motion frames). At 1440 the handoff is legible: a thin path from the core runs right above the chips, down the empty right column, behind Scout 03 (which flips to REPORTING) and into the side of the button. It never crosses copy. It is the only concept whose motion points at the CTA. On phones (`motion-phone-07` to `12`) the path hugs the right edge and almost disappears; only the button lighting reads. So phones get the no-pulse fallback.
- **h1** (motion frames 05 to 07). The gold column with gold side faces reads as an extruded copy of the core cell, which the kit forbids ("never builds a 3D or redrawn copy of the mark"). The skyline is squeezed behind the chips, the pillar rises into the nav on phones, and the change from 3D to flat at about 3.0 to 3.5s looks like a jump cut.
- **h3** (motion frames 01 to 06). At 0.5 to 1.0s, thousands of white specks over the top half read as the neutral "particle network" on ANTI-SLOP. At 2.0 to 2.5s, white spoke chains run full width at chip level and close to the headline. It also costs a 167KB Three.js load, shows a dark field until setup (400 to 600ms of main-thread work estimated on a mid phone) and does not detect broken low-precision GPUs. Its one good lesson, trunks that read from anywhere on screen, is already met by the live hero's twelve routes.
- **h4** (motion frames). The first 2s are a faint grey constellation, and convergence comes late. The concept is a 120vh sticky hold on the very first scroll of a launch page. First-time visitors can read that as the page being stuck. It risks iOS toolbar glitches and leaves a frozen hold if the script fails.
- **m1** (`lab/m1/moment-01` to `06`). At 1440 about 370 small nodes read as dots, and the mid curve reads as static. The pin adds 2,000px to a page that is already 10,544px (the target is 9,000). Its timestamps are passage starts, not line starts, which blocks it on honesty. Its payoff line repeats the hero headline, which is now that same 0:34 sentence. The live crowd (`polish/a-core-glow/r5/d-01.png`) is cleaner: a mirror-symmetric lattice of glyphs, three definition columns and YOU on the right slope, in one screen.
- **m2** (`lab/m2/moment-01` to `06`, `sheet-1440x900.png`). The idea lands: the swarm docks into your seat and the price lights. Two flaws show. In moment-03 the routes spread about 950px wide, which looks like a replay of the hero. In moment-06 the lit cluster is small inside a large empty panel. The ladder ("How the price moves": $49 now, $99 standard, then "Rises") is the clearest statement on the page of Jesus's new fact that prices rise as the tools are completed.

## 4. Why

**Hero: the live hero plus h2's handoff.** The page must make a first-time crypto investor understand and act, and h2 is the only concept that turns the swarm into a story ending on the CTA. The agents scan, the scout reports, and the signal is handed to Join Swarm. Sell and craft ranked it first and second. Its two real faults are both fixable.

- **Bare button for about 4s.** The live ring already shows its static 35% track from first paint, so only the moving light waits for the handoff. Jesus's "revolving highlight on every gold Join Swarm button" holds throughout.
- **Weak on phones.** Phones get a clean fallback with no pulse.

h2 is also the cheapest graft: no new canvas, request or library, and no change to page length.

The wow lens favoured h3 and h1, but both fail the kit or the anti-slop list, and both cost the most on a mid phone. "Outstanding" cannot come at the price of a kit violation on Jesus's most important launch.

**m1: not adopted.** Compared with the live crowd, what m1 adds (scroll-driven beats and quoted definitions) is outweighed by:

- 2,000px of pin on an already long page, with a scroll-jacking feel on phones;
- the wrong timestamps (blocking);
- a noisy mid curve and dot-like nodes at desktop;
- a guaranteed repeat of the hero line.

The live crowd already follows Jesus's own round 5 spec and settles in 4.8s.

**m2: adopted with changes.** The ladder answers "why now?" honestly, using only allowed numbers ($49, $99, 50). The card's lock moment ties the page's motif to the decision point, and the moment stays honest once the "LOCKED" badge, which could read as a reserved seat, is removed. The lit cell moves from the art band into the card, so the section still has one lit cell, and the page grows only by about 200px.

## 5. Implementation plan

Work only in `a-core-glow/`, after the round 6 polish run has finished (it has). Do not touch `terms.html`, `privacy.html`, `refunds.html`, `legal.css`, `a-lab/`, `_base/` or shared files. Keep the contract: the CSP meta, `.swarm` on body, the kit tokens, `?t=<ms>` freeze, `?reduce=1` still, `window.__heroSeek(ms)`, plays once and settles within 5s, pauses offscreen and while the tab is hidden, all words in the DOM, no em or en dashes, no new hosts.

### 5A. Hero: Signal Handoff on the live hero

Target timeline at 1440x900 (phones run 8% faster, as today):

- **0 to 2.4s:** the live hero, unchanged. Scout 03's Scan bar fills over 0 to 0.9s, then Analyze.
- **2.40s:** ignition, as today.
- **2.60s:** the pulse departs (ignite + 200ms). It is one agent glyph at full `#EEEBE4`, lighting each edge it crosses at 2.25px.
- **About 3.0 to 3.1s:** it passes behind Scout 03. The card flips to REPORTING (its existing `.cst` chip border lift is the only card change) and the Report bar fills.
- **3.35 to 3.45s:** it lands on the right side of the hero button's ring. The ring's head starts at the contact point and draws the full ring behind it in one 1.4s lap.
- **By about 3.9s:** the pulse's lit edges have faded to a quiet trace, and the hero.js loop stops.
- **By 4.85s:** the ring rests full. The whole hero view is still before 5s, the ring included.

The live probe confirms a route exists (`?t=6000`, 1440x900). The core is at (720,180) with R 40. The h1 lines end at x 1322, Scout 03 sits at 1101 to 1363 by 563 to 743 (absolute), and the button at 570 to 870 by 577 to 633. That leaves a clear column right of the headline, and a clear row at y 590 to 620 between the card and the button. 1280x800, 1366x768 and 1920x1080 have the same shape. At 820x1180 the gap right of the headline is about 36px after padding, so a route is possible but not certain. At 390x844 the copy column fills the width, so phones fall back.

**`a-core-glow/hero.js`:**

1. **Constants and state.** Add `const SIG = { delay: 200, fade: 450, Dmin: 650, Dmax: 850, gap: 16, lap: 1400 }` and `let ringBox, relay, sroute = null, sigT0 = Infinity, sigArr = Infinity, sigEdges = [];`.
2. **`measure()`.** Keep everything that is there. Also record:
   - `ringBox`: the `.btn-hero` rect grown by 6px on every side, matching `.ring { left: -6px; top: -6px; ... }`. Use `rx: 24` (the live SVG rects use `rx="24"`) and compute `per`.
   - `relay`: the `#scout-card` box inset by 3px, only when `getComputedStyle(card).position === 'absolute'` (1240px and up).
   - The indices in `rects` of the scout card box and the hero button box, so the planner can exempt them.
3. **Ring geometry.** Port `ringSD()` and `ringPos()` from `a-lab/h2/hero.js` lines 114 to 145, unchanged except for the field names of `ringBox`.
4. **`planSignal()`.** Adapt it from h2's `planRoute()` (h2 lines 147 to 221) with these changes:
   - **Walkable corners (`ok[i]`):** inside the hero (x 3 to W-3, y 4 to min(Hc-10, floorY-10)), and outside every live `rects` box grown by `SIG.gap`. The exceptions are the relay box, which is free, and the hero button box (the last leg reaches the ring through contact edges, as in h2). The core vertex is allowed.
   - **Edges:** an edge is allowed only if its 0.25, 0.5 and 0.75 points pass the same test, like the live `edgeOK()`.
   - **Reading mask:** this is a hard exclusion, so delete h2's `prects`, `pulseMaskAt()` and the 30% floor. The pulse never shows behind copy.
   - **Costs:** cost = edge length, keeping h2's x40 cost on the core cell's own edges so the pulse leaves the cluster cleanly.
   - **Contacts:** keep h2's rule: lattice edges that cut the ring on its right half, above `cy + 0.3 * h / 2`, so the pulse never passes under "Cancel anytime."
   - **Speed profile:** replace h2's `sigS()`, `sigTau()` and ring launch-speed matching with the live `prof()` and `profInv()`. Position at tau is `len * prof(tau / D)`, with D = clamp(len / 1.8, Dmin, Dmax), which keeps the trains' motion language.
   - **Result:** keep h2's relay entry and exit search (`inS`, `outS`). Store `sroute = { pts, cum, len, D, pos: ringPos(contact), inS, outS }`. Return null when no path exists.
5. **`setup()` (full plan only, not `fieldOnly`).** After the edges are built:
   - Call `planSignal()`.
   - If there is a route: set `sigT0 = T.ignite + SIG.delay * k` and `sigArr = sigT0 + sroute.D`, then `T.end = Math.max(T.end, sigArr + SIG.fade)`. Build `sigEdges` with each edge's on-time (when the head reaches it).
   - Publish `window.SWARM.heroSignal = { depart: sigT0, land: sigArr, pos: sroute.pos, relayIn, relayOut }`.
   - If there is no route: publish `{ land: T.ignite + 150 * k, pos: ringPos(ringBox.cx, ringBox.y0), fallback: true }`.
   - Either way, dispatch `document.dispatchEvent(new CustomEvent('swarm:hero-signal'))`. `rebuild()` after fonts re-runs `setup()`, so it republishes.
6. **`drawPulse(g, t)`.** Adapt it from h2 lines 515 to 550:
   - Lit edges in `COL.text` at 2.25px fade over `SIG.fade` after the head leaves each edge.
   - The head is drawn with the live `drawGlyphs(g, [{ x, y, a: 1, k: 1 }], same options as the agents)`, so it is the page's one agent glyph, not h2's filled hex.
   - No mask is needed, because the route never comes near copy, and the cards sit above the canvas, so the pulse disappears behind Scout 03 by itself.
   - Call it in `renderAgents()` after the routes and before `drawGlyphs` for the agents.
7. **Rest-frame trace.** In `renderAgents()`, add each `sigEdges` edge to the existing `traces` list (the `#55555B` lines at 42%, 1.25px) once the head has passed it. The settled frame, `?t=6000` and the reduced still then show the route from the core to the button. This answers the wow judge's risk that every hero settles on the same calm frame with no trace of the story.
8. **`updatePhase(t)`.** Replace the state rule and add the bars, porting h2 lines 587 to 632 in spirit:
   - `repT` = the relay entry time if relaying, otherwise `sigT0`, otherwise (fallback) `T.ignite`. The state is SCANNING before `900 * k`, ANALYZING until `repT`, then REPORTING.
   - Bars use `--p` on each `.sc-steps li`:
     - Scan = clamp01(t / (900k));
     - Analyze = clamp01((t - 900k) / (repT - 900k));
     - Report = clamp01((t - repT) / (land - repT)), or (t - T.ignite) / 400 in the fallback.
   - Toggle `li.on` and `li.full`. The spinner runs until `land`.
   - Do NOT port h2's card border lift (`#55555B` card borders are outside the kit), or its `calm` fade.
9. **Test hook.** Add `window.__heroInfo = () => ({ depart: sigT0, land: sigArr, end: T.end, fallback, len, relayIn, relayOut, planMs })`.
10. **Do NOT port** any of the following:
    - h2's `ringLead()`, `ringAt()` and `handRing()`, the `sig-drive` class, or the dark ring before landing. The live ring is play-once, with its track visible from first paint.
    - h2's engine (`policy`, `step`, `simulateTo`, `projAt`, `tiltCSS`, `maskAt`), which belongs to the old `_base` hero.
    - h2's near-invisible pixel per frame. Port it only if the frame renders show a stale trail.

**`a-core-glow/page.js`, the ring block (lines 30 to 74):**

1. **Hero ring timing.** Replace `HERO_RING_AT = 2250` with the value from `window.SWARM.heroSignal`. Read it on `swarm:hero-start`, and again on `swarm:hero-signal` if the ring has not played yet. If the object is missing (hero.js failed), keep 2250 and the normal ring.
2. **`playSig(btn, pos)`.** Use the Web Animations API, which is robust in WebKit and seekable for `?t`. Animate only `.r-head` and `.r-fill`; the tails stay hidden, because the fill is the trail:
   - head: `strokeDashoffset` from `4 - pos` to `4 - pos - 100`, with opacity 1 until 93% and then 0;
   - fill: `strokeDasharray` from `0 100` to `100 0` at a fixed `strokeDashoffset: -pos`;
   - both over `SIG.lap` = 1400ms, easing `cubic-bezier(.33,.7,.3,1)`, `fill: 'forwards'`.
   - On finish, add `ring-done`, set `dataset.ring = 'done'` and cancel the animations; the CSS keeps the full ring.
3. **Live mode.** Schedule it with `later(t0 + land - now)`, gated as today by `fullyIn(heroBtn)` and `!heroBtn.dataset.ring`. If the button is not fully in view at land, the existing IntersectionObserver path plays the normal 3.6s ring when it comes into view. Hover, focus and re-entry replays stay the normal `ring-run`.
4. **Freeze mode.** In `seekRing(t)`: before `land`, show the track only. From `land`, create the sig animations once, paused, with `currentTime = min(1400, t - land)`. The `__heroSeek` wrapper stays.
5. **Reduced motion.** Unchanged: the full ring, still.

**`a-core-glow/core-glow.css`:** append a block, "graft: hero signal handoff", ported from `a-lab/h2/core-glow.css` lines 763 to 771, with two changes:

1. Drop `.btn-gold.sig-drive .ring rect { animation: none !important; }`.
2. Drop the `.full` muted colour. Completed bars stay at full strength (`#EEEBE4`), which was a live round 3 fix.

The remaining rules: `.sc-steps li { --p: 1; }`, `html .scard[data-state] .sc-steps li .ss-bar { position: relative; overflow: hidden; background: var(--swarm-line); }`, and `.scard .sc-steps li .ss-bar::after { content: ""; position: absolute; inset: 0; background: var(--swarm-text); transform-origin: 0 50%; transform: scaleX(var(--p)); }`.

Make the no-JS card coherent: either give the HTML default `data-state="REPORTING"` with its text, or scope `--p: 1` to `html:not(.js)` and the reduced still. Pick whichever shows no flash at first paint, and check with JS disabled.

**`a-core-glow/index.html`:** no change for the hero.

### 5B. Pricing: Lock In Your Seat, stripped down

**`a-core-glow/index.html`, section 8 (`#join`):**

1. Remove the `.join-art` block (`#join-field`, `#join-mark` above the pill).
2. Keep the live sec-head exactly as it is: pill, "Early on purpose.", and the live lede (it already carries the founding policy and "goes up as the tools are completed").
3. Wrap the plan area in m2's `.lock-stage` (from `a-lab/m2/index.html` lines 451 to 488). It holds `#join-field` and `#join-agents` canvases, a `.lock-band` spacer, and `#pcard` with an open `.pc-seat` (holding `#join-mark`, src `../brand/swarm/logo/swarm-mark.svg`, not m2's `../../` path) and a `.pc-body`.
4. Inside `.pc-body`, keep the live card content and copy (`#pc-name`, `#pc-chip`, `#pc-amt`, `#pc-unit`, `#pc-note`, `#pc-sub`, the checklist, `#join-btn` with its ring, "Card or ACH through Whop. Cancel anytime.", and the live compact `#whop-checkout` row). Follow m2's order: name and chip, `.price-row`, notes, the plan switch (moved into the card under the price, as m2 tested for the `#join` jump), the rule, the checklist, Join, the Whop row.
5. Do NOT port:
   - `#pc-lock` (the LOCKING and LOCKED badge and its six dots: the dots could read as seats filling, and LOCKED as a held seat);
   - m2's `.src` source line (removed live in round 4);
   - m2's lede and founding note wording;
   - m2's FAQ edit (the live FAQ already follows the October 17 policy and has six questions);
   - m2's `.join-after` Whop block.
6. After the live `.risk` line, add m2's ladder (`.ladder-wrap > h3.pill.ladder-h + ol.ladder`, m2 lines 492 to 515), then keep the live `.how` strip. The ladder copy is mine; check it with Jesus:
   - 01 Founding, chip "Now", $49/mo, "The first 50 seats."
   - 02 Standard, $99/mo, "Once the 50 founding seats are gone."
   - 03 Then, "Rises", "For new members, as the custom AI tools are completed." The tools line reads Custom AI tools, In development.

   This keeps "for as long as you stay subscribed" to two mentions (the lede and the card note), as the m2 judge asked. It uses no dates, tool names, counts or price for step 03.

**`a-core-glow/core-glow.css`:**

1. Port m2's section 8 rules (`a-lab/m2/core-glow.css` lines 555 to 582 and 601 to 627): `.lock-stage`, `.lock-band`, `.pcard`, `.pc-seat`, `.seat-drawn`, `#join-mark`, `.pc-body`, `.pc-body .seg-switch`, `.price-row`, `.pcard.lock-pending.is-gold .amt`, the `:not(.lock-pending)` transition, and the ladder rules. Also port the phone overrides (lines 797 to 800) and the `@media (max-width: 760px)` ladder block (lines 815 to 827).
2. Skip `.pc-lock`, `.lk-*` and `.is-locked` (lines 583 to 600), `.join-after`, and m2's `.whop` sizes. Keep the live `.whop` row and `.how`.
3. Make the payoff bigger, as the m2 judge asked. Set `--lockR: 20px` on desktop and `16px` on phones. Use a seat of three lattice rows above and below the core: `--seat: calc(var(--lockR) * 10.13 - 2px)`, about 200px on desktop and 160px on phones. The card's top edge still crosses the honeycomb halfway along a vertical edge, and the cluster-to-panel ratio grows by about 1.33 times.
4. Give the ladder's "Now" chip a 10px radius. Remove the live `.join-art` and `#join-mark` rules.

**`a-core-glow/page.js`:**

1. Delete `joinField()` (live lines 572 to 579). Keep `converge()` for the final CTA.
2. Port m2's `lockMoment()` IIFE (`a-lab/m2/page.js` lines 419 to 789). It is self-contained on `SwarmLattice`, and handles the seat geometry, the ports, the settled DOM, the no-canvas fallback, the offscreen pause, resize and `?lock`. Adapt it as follows:
   - **Agent glyph.** Draw agents with the page's one glyph: `drawAgents(g, Sx, t, { glyph: true, r: phone ? 3.6 : 4.4, lw: 1.1, ... })`, as `converge()` does. Check that the live `lattice.js` `sim`, `drawAgents`, `drawEdges` and `drawField` signatures match its calls.
   - **Calmer field.** Use 40 agents on desktop and 20 on phones (m2 used 80 and 30). Shrink `Dm` to the card's half width plus two pitches (about 300px on desktop, 200px on phones), so the field stays within the card's width plus a cell or two each side. Dim the scouts.
   - **Remove** every badge reference (`badge`, `dots`, `is-locked`, `has-lock`) and `motionOff`, which no longer exists live. `STILL` becomes `!FROZEN && (STATIC || !('IntersectionObserver' in window))`.
   - **Lock moment.** Keep `lock-pending` on `#pcard` until the lock, then remove it so $49 turns gold over 360ms. STATIC, no JS and no canvas show the gold $49 at once (the HTML has no `lock-pending`; JS adds it only in live mode).
   - **Timing.** Keep the trigger (75% of `.price-row` in view), the one-play rule, `window.__lockSeek` and `window.__lockDebug`. Keep the lock by 2.6s at the latest and the settle by about 4s.
3. In `PLANS` and `showPlan()`, keep the live code. Do not add `lock` or `has-lock`: `is-gold` already keeps $99 and $990 white.

### 5C. Crowd

No change to `crowd.js`, the crowd markup or its CSS.

## 6. How to verify

1. **Serve.** `cd /home/user/NewWebsite/design-lab/landing && (npx --yes http-server -p 8820 -c-1 -s . > /dev/null 2>&1 &)`
2. **Hero timing.** At 1440x900, 1280x800, 1366x768, 1920x1080, 820x1180, 390x844 and 360x640, call `window.__heroInfo()` with `?t=0`. Expect:
   - a route at all widths of 1240 and up;
   - land at or before 3.5s and end at or before 4.0s on desktop;
   - `fallback: true` on phones;
   - tablet either way, but never a route closer than 16px to a glyph.
3. **Route clearance.** For each width, add a script that measures the minimum distance from the pulse polyline (`__heroInfo` can expose `pts`) to every text-node line box in `.hero-copy`, the chips and `.q1`. It must be at least 16px.
4. **Frames.** Seek with `?t=` plus `window.__heroSeek` at 0, 1500, 2400, 2800, 3000, 3100, 3400, 3600, 4000, 4800 and 6000, then look at them. Check that the pulse reads clearly through the ignition ring wave at 2.6 to 3.0s. If it does not, halve the wave's alpha within 3 cells of the route. At about 3.4s the ring's head must start at the contact point. `?t=6000` shows the full ring, the faint core-to-button trace, Scout 03 at REPORTING with three full bars, and identical art with `?reduce=1`.
5. **Renders and media.** Regenerate `media/hero-desktop-frames.mp4` and `hero-phone-frames.mp4` with `node /home/user/NewWebsite/design-lab/landing/tools/frames.mjs` (see its header), plus the `rec.mjs` videos. Watch them before signing off. The judges only saw 0.5s stills.
6. **Settle and rAF.** Zero rAF calls over 2s after 5.1s at rest, in the hero and at the bottom after a full scroll. The hero ring finishes by 5.0s in live mode.
7. **Pricing jump.** Use the `#join` jump at 1440x900, 1366x768, 1280x800 and 390x844. The seat and price row must be in view, and the moment must start, lock by 2.6s and settle by about 4s. Check the `?lock=` frames, `?reduce=1`, no-JS and no-canvas.
8. **Pricing behaviour.**
   - **Plan switch:** switching to Standard before and after the lock leaves $99 white; switching back to Founding shows gold only after the lock.
   - **Play once:** scroll away and back, and the moment does not replay.
   - **Rotation:** rotating mid-play jumps to the settled card.
9. **Gold scan.** Run `/tmp/claude-0/-home-user/fdc58892-55e5-54b6-a74d-8da9a91cd372/scratchpad/tools/goldscan.mjs` every 20px at 1440x900, 390x844 and 820x1180, settled and reduced. Expect at most one gold button, one gold number and one lit cell per view. The ladder's $49 is never gold, and the hero and pricing marks are never in one view.
10. **Hygiene.** No console errors or warnings, no horizontal overflow, no em or en dashes, no non-ASCII except the middle dot, and hosts unchanged.
11. **Nav.** Check the m1 judge's side note on the live page. Scroll so the members rail passes under the nav: the nav must be solid (`.nav.scrolled`) and the rail text must not collide with its Join Swarm.
12. **Performance.**
    - `__heroBench(20)` must not grow by more than about 15ms per plan on desktop, and the hero's per-frame JS by no more than 0.5ms.
    - For the pricing moment, aim for a mean under 1ms and a p95 under 3ms per frame (m2's own measurements).
13. **Capture and record.** Final capture with `shootall.sh`, a "Graft" entry in `NOTES.md` (what came from where, what was dropped and why), then `node scripts/build-swarm-site.mjs`, the build and the Host-header checks from OVERNIGHT step 5.

## 7. For Jesus to confirm

1. The hero button's moving light now starts when the swarm's signal reaches it, at about 3.4s on desktop and 2.4s on phones. The thin gold track is on the button from the first frame. If he wants the moving light from frame one, it is a one-line change, at the cost of the handoff.
2. The faint trace from the core to the button stays on the settled hero.
3. The pricing card: the founding $49 lights gold as the swarm docks into the card. The ladder copy is in 5B.
4. m1 follow-ups, not built:
   - **Open seat for YOU.** YOU takes a marked open seat in the right-curve group, then moves with it. This is a small change to the live crowd, within his round 5 spec.
   - **Quoted definitions.** Show his own three definitions as quotes, but only after the line-level timestamps (about 0:05, 0:11 and 0:22) are checked against the caption segments. The 0:09 passage's first word is still unconfirmed (dossier section 10).
