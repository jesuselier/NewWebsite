# h3: Push-in

**The idea.** The page opens high above a vast honeycomb at night: tens of thousands of cells and thousands of hexagonal agents scanning like city lights, with one small gold cell at the focal point. As the agents agree, their routes merge into six trunks that all run to that cell. The camera pushes in and down along those trunks and lands exactly top-down on the hero composition, and at that moment the core lights and the official mark lands. The swarm is huge, and it agrees on one signal.

Everything else on the page is the base, unchanged: copy, layout, cards, rail, rings, sections, the settled frame and the reduced-motion still.

## What you see (1440x900; frame times from `?t=` and `window.__heroSeek`)

- **0 to 0.9s, the wide shot.** The camera hangs at 6.6 times the final distance, pitched 50 degrees and yawed -16 degrees. The honeycomb recedes toward the top of the screen. Its lines thin out where cells get small, so the far field fades into haze instead of shimmering. Agents wake from the centre outwards over 0.5s: 2,600 of them, 70% spread evenly over the ground (so they thicken with perspective toward the horizon, like city lights) and 30% log-distributed around the core (the dense "downtown" the camera dives into). Each hop lights its edge, and sensed cells flash. The core is a 4px gold cell with a heavier outline and a small warm point of light, so the target reads from the first second.
- **Readable from the first frame.** The copy sits in the near foreground, below the core, and that is where the scene is darkest. An atmosphere term dims everything nearer to the camera than the core (down to 22%) and hazes the far field, and the base's reading mask keeps agents, edges and pings at 13% behind every line of copy. Top-down, every point is at the core's depth, so the atmosphere disappears as the camera lands and the end frame is the base frame exactly.
- **0.8 to 1.4s, consensus.** 66% of agents commit and route in. Routes are planned twice. The first pass traces the geodesic in from the far end of each of the six arteries leaving the cluster. The second pass makes those six corridors cheap, so routes leave their neighbourhood early to join a trunk, like a river network running backwards. Lit edges stay on for about 2.6 hops (170 to 600ms) whatever the speed, so a fast agent never trails a tail.
- **1.0 to 2.4s, the dive.** The distance eases in log space, so the zoom feels constant, with a sine in-out: hold, dive, then a long soft landing. The pitch unwinds 220ms behind the distance and the yaw unwinds with it. The scanning web resolves into trunks: zigzag streams of hexagonal nodes on the honeycomb's own corridors, converging on the gold cell. Routes keep clear of the copy as it sits in the final composition: cost 3 inside a line box and 2 within 26px. So the two lower trunks run level between the cluster and the chips, and nothing cuts through the headline.
- **2.3 to 2.95s, arrival.** The nearest agents reach the cluster. Each neighbour lights (#55555B) as agents reach its corner, and the core charges and flashes on each arrival.
- **2.95s, landing.** The camera lands exactly top-down at 1:1, registered to the 2D field. In the same frame the mark lands (380ms, 0.93 to 1 scale), the warm light opens (1s), one ring wave runs out across the field, Scout 03 switches to REPORTING, scouts fade where they stand and trunk agents fade 380 to 620ms later. Fading agents stop hopping.
- **4.28 to 4.45s, hand-off.** The GL canvas cross-fades (170ms) into the base's 2D field, drawn underneath at the same registration. Measured difference before and after the fade: mean 0.25 grey levels at 1440x900 and 0.75 on a phone. At 4.45s the loop stops. Live, the WebGL renderer is disposed and its context released. The settled frame is pixel-identical to `?t=6000` and to `?reduce=1` in the hero art; only the button ring differs, which is static under reduced motion.

Phone (390x844) runs the same timeline with 1,000 agents, a 5.4x pull-back, 46 degrees of pitch and -13 degrees of yaw. Tablet (820x1180) uses 1,700 agents and 6x. No horizontal overflow, no console errors and no em or en dashes at 1440x900 or 390x844, and the tablet was checked by render. Gold appears only on the core cell, its light and the existing button rings. No text is drawn in WebGL.

## What changed

- `hero3d.js` (new, ES module, about 13KB gzipped): `createPushIn(options)` builds the scene and returns `{ canvas, render(t), setMask(), info(), dispose() }`.
  - Camera: `pose(t)` gives distance, pitch, yaw and progress. `rig()` builds an orbit about the core, and an off-centre frustum puts the principal point on the core's screen position, so the target never moves while the camera flies. `toPlane()` and `toScreen()` work out the ground the opening shot sees.
  - Lattice: typed arrays over the opening shot's footprint. Vertex `2c` is the top corner of cell `c` and `2c+1` is its bottom corner, with neighbours by formula. Desktop has 40,812 cells and 81,624 corners; phone has 12,555 and 25,110.
  - Routing: `dijkstra()`, `parents()` (artery tie-break), the trunk trace and replan, hop counts and the cluster's inner routes.
  - Swarm: `reset()` spawns agents (deterministic seed). `policy()` and `step()` are the base engine's behaviour (scan, sense, commit, route, enter the core) with the new timings, on fixed 60Hz steps, so `?t` and live runs match frame for frame.
  - GL, five draw calls with no lights and no post-processing: the procedural honeycomb plane (also draws the six neighbours and core before the mark, the boot wave and the ring wave), instanced pings, a ring buffer of lit edges (partial uploads with `addUpdateRange`), the edge each agent is crossing, and instanced hexagonal agents that turn and tilt with the grid and never get smaller than 1.5 to 1.75px. Colours are sRGB with premultiplied Canvas-2D blending and colour management off. Shaders compute anti-aliasing themselves (no MSAA). All materials are double-sided because the hero's y-down coordinates flip the winding.
- `hero.js` (the base file plus a controller; the 2D hero is untouched):
  - WebGL probe and `mode` (`wait`, `3d`, `2d`, `done`), plus the `T3` timeline.
  - `copyDist()`, which feeds the route costs.
  - `boot3d()`, which imports the module after fonts are ready (1.5s cap), measures and builds. It falls back to 2D after 3.2s, or on an import error or a lost context.
  - `render3()`: the core's light, which is small while it charges and opens on landing (the tint stays hidden until the camera is top-down), the mark, Scout 03 phases and the cross-fade.
  - `finish3()` and `seek3()`. `renderField()` is split into light plus `drawFieldCanvas()`, and `updatePhase(t, idx)` takes the phase from the caller.
  - The frame loop runs on wall-clock time in 3D mode. Resize (new width), the motion event and fonts.ready are handled per mode.
  - `window.__heroSeek` returns a promise while the module loads, which Playwright awaits. `window.__h3()` reports mode, setup timings and sizes.
  - `?flat=1` forces the 2D hero for side-by-side comparison.
- `index.html`: two `modulepreload` links (Three.js r160 from the import map's jsdelivr URL, and `hero3d.js`). Nothing else.
- `media/`: `hero-desktop-frames.mp4` and `hero-phone-frames.mp4` (frames.mjs, 30fps, `?t=0` stepped with `__heroSeek`), and `moment.mp4` (rec.mjs, live, `#top`, 10s; software GL here, so few distinct frames, but wall-clock timing is right). `fold-*.png` are still the base folds, and they match h3's settled frame.

## Performance (measured here in headless Chrome with SwiftShader, then estimated for a mid phone)

| | Desktop 1440x900 | Phone 390x844 |
| --- | --- | --- |
| Agents / lattice corners / edge ring | 2,600 / 81,624 / 16,384 | 1,000 / 25,110 / 6,144 |
| One-time setup (lattice, two route plans, mask, spawn), JS | about 220ms | about 125ms here (lattice 28, routes 67, spawn 18, mask 7), so roughly 400 to 600ms on a mid phone |
| WebGL context and renderer | 65 to 350ms (software GL) | about 200ms here (software GL); usually 30 to 80ms on device |
| Per frame, simulation plus attribute uploads | 0.67ms average, 22ms worst (one frame) | 0.3ms average, 6ms worst, so roughly 1 to 2ms average on a mid phone |
| Per frame, GPU | 5 draw calls, about 54k triangles submitted (expired instances collapse in the vertex shader, so few are rasterised), a full-screen procedural shader at DPR 1 (DPR 2 cap) | 5 draw calls, about 21k triangles submitted, full-screen shader at DPR 1.5 cap (585x1446, 0.85M fragments), comfortably inside a mid-range GPU at 60fps |
| Upload per frame | about 104KB agents plus a few KB of edges | about 40KB plus a few KB |
| Memory | GL canvas plus buffers about 6MB | about 4MB, released at 4.45s |
| Download | Three.js r160 166KB gzipped (the page already uses it for the tools card, so it is now shared and preloaded) plus 13KB | same |

The animation runs only while the hero is on screen and the tab is visible. It stops for good at 4.45s, and then the 3D layer is gone. Not yet checked on a real iPhone 12-class or mid Android device.

## Risks

- **A black hero art before the scene arrives.** The copy is readable at once, but the field appears only when Three.js, the module and setup are ready: about 2s in this sandbox through its proxy, typically 0.3 to 1s in production. On a slow connection the 2D hero takes over at 3.2s. Fix for production: bundle the few Three classes used (tree-shaken, about 120KB raw) with the hero, or draw a static first frame while it loads.
- **Main-thread setup of 400 to 600ms on a mid phone** before the first frame. It could be moved into a worker (all typed arrays, no DOM) or cut by planning routes over a smaller disc on phones.
- **Busy middle.** Between 1.0 and 1.6s the scanning web is dense before it resolves into trunks. That is the intended "network being worked" beat, but a reviewer may want fewer scouts (34% now) or a shorter scan.
- **Lower trunks run level just above the chips.** The cluster sits about 22px above the chip row, so any trunk heading down has to turn there. It reads as a horizon through the core, but it is a strong horizontal line.
- **Phone end frame is slightly softer during the 170ms cross-fade.** The GL canvas uses DPR 1.5 against the 2D canvas at 2. It is invisible in motion; raise the GL cap to 2 if a reviewer catches it.
- **WebGL1-only or low-precision GPUs.** The field shader needs highp floats for world coordinates up to about 9,000px; mediump devices would show broken cells. This is detected only as a visual fault. A guard could check `getShaderPrecisionFormat` and use the 2D hero.
- The camera's yaw, and the hand-off at 1:1, assume the hero's width does not change mid-sequence. A width change lands straight on the settled still.

## How to graft it into the real page

1. Add `hero3d.js` next to `hero.js` and add the two `modulepreload` links after the import map (the CSP already allows cdn.jsdelivr.net for scripts).
2. Replace `hero.js` with this version. The 2D code is byte-for-byte the base apart from the `renderField` / `drawFieldCanvas` split and `updatePhase(t, idx)`. If the production `hero.js` has moved on (round 4 or later), port the blocks marked "the push-in" (probe and `mode`, `T3`, `copyDist`, `render3`, `finish3`, `seek3`, `fallback`, `boot3d`, the 3D branch in `frame()`, the `start()` / `start2d()` split, the 3D cases in `rebuild`, fonts.ready and `swarm:motion`, and `__heroSeek` / `__h3`).
3. The module needs only what the base hero already exposes: `glowEl` (it inserts its canvas before it), `W`, `Hc`, `DPR`, `phone`, `tablet`, `R` (from `--R`), `core`, `maskAt`, and `copyDist`. If the production field moves the glow under the lines or changes the field's alpha, mirror that in `FIELD_FS` (the `ring > 1.5` branch) so the hand-off stays seamless. Check this with the 4270 vs 4800 frame diff.
4. Keep `?flat=1` while reviewing; remove `window.__h3` before launch if wanted.
