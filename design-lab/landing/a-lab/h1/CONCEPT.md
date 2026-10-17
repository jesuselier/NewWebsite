# h1: Rising Routes

**The idea.** The same honeycomb, hexagonal agent nodes and lit edges as Core Glow, seen in true 3D from a low camera: every edge a committed agent crosses raises the two cells beside it, so the routes become a skyline of thin hex columns, drawn as kit-grey outlines, whose ridges converge on one tall column at the core. When consensus forms the core column lights gold, the camera cranes to exactly top-down, the skyline sinks flat, and the official `swarm-mark.svg` lands on the core with its warm light, ending on the base hero's settled frame pixel for pixel.

Open: `http://127.0.0.1:8820/a-lab/h1/index.html` (`?t=<ms>` freezes a frame, `?reduce=1` gives the still, `?flat=1` forces the 2D fallback, `?debug=1` exposes `window.__h1()` for inspection).

## Timeline (desktop and phone)

| Time | What you see |
| --- | --- |
| 0 to 0.5s | Ink, then the field boots ring by ring from the core, already a receding plane seen from 19 degrees. |
| 0.3 to 1.4s | Scouts wake as small hex prisms, hop along the honeycomb's edges and light each edge (scouts `#8E8A80`, committed `#EEEBE4`). The camera orbits slowly (yaw -20 to -8 degrees) so columns show parallax. The core is a short column outlined in dim gold. Scout card: Scanning. |
| 1.0 to 2.45s | 70% commit and route to the core. Cells beside the trunks rise (only cells crossed four or more times; full height at 22 crossings), taller toward the core. Agents ride the roofs and climb at each corner. The core column always stands 1.45 times above the tallest column. Scout card: Analyzing. |
| 2.45s | Consensus (forced by 2.45s at the latest). The core column lights gold: kit core gradient on its roof, gold edges. Scout card: Reporting. |
| 2.5 to 3.6s | The camera cranes to top-down; column outlines return to field grey, the skyline sinks, the core sinks last, a ring wave runs across the field. |
| 3.41s | The official mark lands (opacity and 0.93 to 1 scale over 380ms), its warm light opens over 1s. |
| 3.9s | Hand-off: the 2D field canvas takes over (identical frame), the WebGL canvas fades out over 240ms and is released. |
| 4.51s | Settled, the loop stops. Identical to `?t=4800`, `?t=6000`, `?reduce=1` and the base hero's settled frame (checked by pixel diff at 1440x900 and 390x844: zero differing pixels). |

## What changed

Everything outside the hero is untouched: `core-glow.css`, `lattice.js`, `crowd.js`, `page.js`, `tools3d.js` and `NOTES.md` are byte-identical to `_base`, and every page tile below the hero matches the control capture.

- **`hero3d.js` (new, ES module, 14 KB, 5 KB gzipped).** `createRising(host, before, opts)` returns `{ canvas, build, setMask, draw, setDpr, dispose }`. Four instanced draw calls: column bodies (ink sides and roofs, the core roof in the mark's own radial gradient, drawn first with a polygon offset so they hide what is behind them), column outlines (one instance per cell, 18 screen-space anti-aliased line quads: top ring, six verticals, base ring), lit edges (one instance per segment) and agents (small hex prisms). Colours are written and blended in sRGB like Canvas 2D (`ColorManagement` off, linear output), so the top-down end frame matches the 2D field. A small mask texture keeps everything at 13% behind the copy, as in the 2D hero. No lights, shadows, post-processing or text.
- **`hero.js` (the base 2D hero kept intact as the fallback, with the 3D path added).**
  - Camera: `camAt(t)`, `viewOf()`, `projOf()`, `projector(t)`, `groundAt()`. World units are settled-layout CSS px with the core at the origin; the projection is off-axis with its centre on the core, so the core never moves sideways and the top-down view maps the field 1:1 onto the 2D layout. During the low phase the core sits 7% of the screen lower (2.5% on phones) so the spire clears the top edge.
  - `setup()`: in 3D the lattice also covers the low camera's footprint (2,781 cells on desktop, 1,275 on phone); routing costs, the walkable area and the spawn pool use what the low camera shows, so routes still go around the copy as it is seen; spawn weights are scaled by on-screen area so the far field does not hog the swarm.
  - Skyline: `setup3()`, `cellsOf()`, `addTraffic()`, `edgeH()`, `stepHeights()`; `policy()` adds traffic on every edge a routing agent crosses. Heights integrate on the fixed 60Hz step, so `?t` and `__heroSeek` stay deterministic.
  - Timeline hooks: `markDelay()` (960ms in 3D, 0 in 2D) feeds `handAt()`, `glowAt()` and `END`; `coreAt()` lights the core fully at consensus in 3D; `render3()` fills the buffers; `render()` runs 3D until the hand-off, then the base `renderField()` / `renderAgents()`.
  - Lifecycle: `start()` / `wants3D()` / `begin()` wait for the module and the fonts (at most 1.8s and 0.9s in live mode) before the first frame, so the copy's mask is measured once with real type; `finish()` / `release3()` dispose WebGL when the sequence ends; `frame()` drops to 1x pixels once if the first 18 frames average over 40ms; `webglcontextlost` jumps to the settled frame; `window.__heroSeek` is defined synchronously (so `page.js` still wraps it for the button rings) and queues a seek until the hero has begun.
- **`index.html`**: two `<link rel="modulepreload">` lines (Three.js r160 from cdn.jsdelivr.net, already allowed by the CSP and the existing import map, and `hero3d.js`). Nothing else.

## Fallbacks (all verified)

- `?reduce=1` / `prefers-reduced-motion`: the settled still; Three.js is never loaded.
- CDN blocked (tested by aborting cdn.jsdelivr.net), WebGL disabled (tested with `--disable-webgl`), `deviceMemory < 4`, `hardwareConcurrency < 4`, Save-Data, `?flat=1`: the base 2D hero runs unchanged (`?flat=1` frames match `_base` at t2600 exactly).
- No page errors in any capture, live run, resize or scroll test; no horizontal overflow; no em or en dashes.

## Performance on a mid phone

Measured in this container by stepping the frozen hero frame by frame (390x844 at 2x, then 1440x900):

| | Phone | Desktop |
| --- | --- | --- |
| Cells (column instances) | 1,275 | 2,781 |
| Peak column bodies / lit segments / agents | 112 / 357 / 86 | 325 / 957 / 196 |
| Vertices per frame (outlines) | about 92k | about 200k |
| Draw calls | 4 | 4 |
| JS per frame (simulation, buffer fill, upload), two runs | 1.4 to 2.2 ms | 3.1 to 5.3 ms |
| Canvas | 780x1928, no MSAA (lines carry their own AA) | 1440x900, 4x MSAA |

Estimate for an iPhone 12 or mid Android: JS 3 to 6 ms per frame, GPU light (thin lines, one opaque pass, no textures beyond a 98x241 mask), so 60fps is a realistic target; the 1x-pixel guard covers weaker GPUs. The motion runs for 4.5s, then WebGL is released and the page costs what the base page costs. Extra download: Three.js now loads at first paint (167 KB gzipped) instead of only when the tools card nears the viewport; the tools card then reuses the cached module. **Not yet run on a real phone**: headless Chrome here renders with SwiftShader, so the live recording (`media/moment.mp4`) shows few distinct frames; `media/hero-*-frames.mp4` are frame-accurate 30fps renders of the same sequence.

## Risks

- **"A 3D copy of the mark."** The kit forbids a 3D or redrawn Hive Core. Here the gold column and its six lit neighbours are the field pattern the kit allows (one gold cell, six `#55555B` neighbours) raised as part of the skyline, the neighbours are ordinary grey columns among others, and the official SVG only lands once everything is flat and top-down. Still worth an explicit yes from Jesus.
- **First motion starts later.** The hero waits for Three.js and the fonts (typically 0.3 to 0.6s on a fast connection, capped at 1.8s, then the 2D hero). The copy is there from first paint; the canvas is ink until the field boots.
- **Timing is tight to the 5s rule.** Settled at 4.51s because consensus is forced at 2.45s; any later landing would need a shorter glow or crane.
- **Density.** Desktop runs 196 agents and up to 325 columns; the far field reads busy near the nav for about a second. The phone is calmer (86 agents).
- **Perspective magnifies the near field** behind the copy; it stays at the faint field grey, but a reviewer may want the low phase to start a few degrees higher (`C3.phi0`).
- **Seeking backwards** rebuilds the buffers (capture tooling only), and a frozen `?t` page keeps one WebGL context alive.

## How to graft it into the real page

1. Copy `hero3d.js` next to the real `hero.js`.
2. If the real `hero.js` is still the `_base` version, replace it with this one: the 2D path is the base code with only the hooks listed above. If it has moved on (later rounds), port these blocks: the `C3` constants, the camera functions, `setup3()` and the skyline functions, the `mode3` branches in `setup()` (lattice footprint, projected routing, spawn weights), `markDelay()` in `handAt()` / `glowAt()` / `END`, `coreAt()`, `render3()`, the hand-off in `render()`, and `start()` / `wants3D()` / `begin()` / `release3()`.
3. Add the two `modulepreload` lines after the import map. No CSS or CSP change is needed (`.hero-art canvas` already positions the WebGL canvas).
4. Re-run the parity check: `?t=6000` and `?reduce=1` must stay pixel-identical to the 2D hero, and `?flat=1` must equal it at any `?t`.
5. Test on an iPhone 12-class device and a mid Android before shipping; if either drops below about 45fps, lower the desktop/phone agent counts or raise `C3.t0` (fewer columns).

## Captures

- Frame-accurate motion: `media/hero-desktop-frames.mp4`, `media/hero-phone-frames.mp4` (`?t=0` stepped with `window.__heroSeek` at 30fps, 5.2s plus a 1.5s hold).
- Live recording of the hero moment: `media/moment.mp4` (rec.mjs, `#top`, 10s, desktop).
- Review stills (scratchpad `lab/h1/`): folds, t1500/t3000/t4800, reduced, tiles, `motion-desktop-NN.png`, `motion-phone-NN.png`, and `moment-01.png` to `moment-06.png` (scan 1.2s, skyline 2.13s, gold column 2.73s, crane 3.07s, mark landing 3.43s, settled 4.6s).
