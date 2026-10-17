// Swarm | Three Cycles: hero motion (ES module).
//
// Three pointy-top honeycomb planes hang in depth: 2021 nearest the eye, 2023 in the middle, NOW at the
// bottom. Seen from the side, the stack spreads across the band above the headline: 2021 on the left, 2023 in
// the middle, NOW on the right. Agents wake on all three planes, scan cells (pings) and fall through toward
// NOW. A dolly zoom (the camera pulls back while its focal length grows, so the NOW plane keeps 1 unit = 1 CSS
// px) plus a crane to top-down collapses the parallax: each upper plane is pre-scaled by (D0 - z) / D0, so
// from the final eye the three lattices register into one field, and the official Hive Core SVG lands on the
// lit cell, centred above the headline (the "light from above" of the layout).
//
// Nothing is ever drawn over the type. Every line of hero text (and the CTA) owns a clear band: its box plus
// 24 px, with a soft falloff beyond. Cells, agents and pings inside a band are not drawn, agents only pick
// targets outside the bands, and NOW-plane agents stay above the headline. Every word is DOM.
//
// Rendering: one simulation and one camera, two renderers. A Canvas 2D renderer projects the scene with the
// same camera maths from first paint, so the story never waits on the CDN. Three.js r160 (3 draw calls: a
// triangle mesh for the field, line segments for the agents' heading ticks, points for their heads) loads
// after first paint, fades in over the 2D canvas and takes over. No WebGL means the 2D renderer keeps going.
// Reduced motion gets one Canvas 2D still of the settled frame and no loop at all.

const M = window.SwarmMotion || { reduce: false, paused: false, on() {}, set() {} };
const qs = new URLSearchParams(location.search);
const FIXED_T = qs.has('t') ? Math.max(0, parseFloat(qs.get('t')) || 0) : null;
const FORCE_2D = qs.get('gl') === '0';

const SQ3 = Math.sqrt(3), DEG = Math.PI / 180, STEP = 1000 / 60;
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const lerp = (a, b, t) => a + (b - a) * t;
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));

// timeline (ms), shared with the research notes: settled by 4.64 s
const T = {
  scanEnd: 2400, consensusEnd: 3600, settle0: 2300, settle1: 3900, nb0: 2800,
  resolve: 4400, fade: 240, still: 4700, labelsIn: 380, labelsOut0: 2350, labelsOut1: 2950,
};
// camera: tilt from straight down, azimuth of the camera foot around the core, distance as a share of D0
const CAM = {
  desktop: { tilt0: 46, tilt1: 42, az0: -2, az1: -6, d0: 0.56, d1: 0.6, zf: 0.4, sx: 70 },
  phone: { tilt0: 44, tilt1: 40, az0: -2, az1: -5, d0: 0.56, d1: 0.6, zf: 0.22, sx: 20 },
};
const C01 = (h) => [((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255];
const FAINT = C01(0x1c1c21), HIVE = C01(0x55555b), MUTED = C01(0x8e8a80), TEXT = C01(0xeeebe4), GOLD = C01(0xf5c542);

const hero = document.getElementById('top');
const stage = document.getElementById('stage');
const slotEl = document.getElementById('coreSlot');
const markEl = document.getElementById('heroMark');
const warmEl = document.getElementById('coreWarmth');
const cv2d = document.getElementById('hero2d');
const labels = [...document.querySelectorAll('.plane-label')];
const navEl = document.getElementById('nav');
const textEls = () => [hero.querySelector('.hero-h .l1'), hero.querySelector('.hero-h .l2'), hero.querySelector('.hero-sub'), hero.querySelector('.hero .cancel')];
const boxEls = () => [hero.querySelector('.hero .btn-gold'), hero.querySelector('.watch-link')];
const solidEls = () => [hero.querySelector('.chips'), ...hero.querySelectorAll('.qcard'), hero.querySelector('.cyc-status'), hero.querySelector('.hero-foot .motion-btn')];

// ---------------------------------------------------------------- layout and the clear bands around the type
function rel(r, sr) { return { l: r.left - sr.left, t: r.top - sr.top, r: r.right - sr.left, b: r.bottom - sr.top }; }
function boxOf(el, sr) {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width < 1 || r.height < 1) return null;
  return rel(r, sr);
}
// tight union of the glyph line boxes of an element's text
function glyphsOf(el, sr) {
  if (!el) return null;
  const rg = document.createRange(); rg.selectNodeContents(el);
  let u = null;
  for (const r of rg.getClientRects()) {
    if (r.width < 0.5 || r.height < 0.5) continue;
    const q = rel(r, sr);
    u = u ? { l: Math.min(u.l, q.l), t: Math.min(u.t, q.t), r: Math.max(u.r, q.r), b: Math.max(u.b, q.b) } : q;
  }
  return u;
}
function bandsOf(L) {
  const sr = stage.getBoundingClientRect();
  L.text = [...textEls().map((e) => glyphsOf(e, sr)), ...boxEls().map((e) => boxOf(e, sr))].filter(Boolean);
  L.solid = solidEls().map((e) => boxOf(e, sr)).filter(Boolean);
  const nb = navEl ? navEl.getBoundingClientRect().height : 64;
  L.solid.push({ l: -1e5, t: -1e5, r: 1e5, b: nb });
  L.pad = L.phone ? 14 : 24;
  L.fade = L.phone ? 22 : 36;
  const h1 = L.text[0];
  L.textTop = h1 ? h1.t : L.core.y + 4 * L.R;
  // NOW-plane agents (and so their pings) live above the headline, around the core
  L.agentMaxY = L.textTop - L.pad - L.R * 0.6;
}
function rectDist(x, y, q) {
  const dx = Math.max(q.l - x, 0, x - q.r), dy = Math.max(q.t - y, 0, y - q.b);
  return Math.hypot(dx, dy);
}
// 1 = draw fully, 0 = inside a clear band. ext is the mark's own radius around (x, y).
function textVis(L, x, y, ext) {
  let v = 1;
  const lim = L.pad + L.fade;
  for (let i = 0; i < L.text.length; i++) {
    const d = rectDist(x, y, L.text[i]) - ext;
    if (d < lim) { v = Math.min(v, smooth(L.pad, lim, d)); if (v <= 0) return 0; }
  }
  return v;
}
function solidVis(L, x, y, pad) {
  let v = 1;
  for (let i = 0; i < L.solid.length; i++) {
    const d = rectDist(x, y, L.solid[i]);
    if (d < pad + 10) { v = Math.min(v, smooth(pad, pad + 10, d)); if (v <= 0) return 0; }
  }
  return v;
}

function readR() {
  const v = parseFloat(getComputedStyle(hero).getPropertyValue('--R'));
  return v > 0 ? v : (window.innerWidth <= 640 ? 18 : 22);
}
function measure() {
  const h1 = hero.querySelector('.hero-h');
  if (h1) hero.style.setProperty('--h1-h', Math.round(h1.getBoundingClientRect().height) + 'px');
  const sr = stage.getBoundingClientRect();
  const cr = slotEl.getBoundingClientRect();
  const W = Math.max(320, Math.round(sr.width)), H = Math.max(420, Math.round(sr.height));
  const phone = W <= 640;
  const R = readR(), P = 1.95 * R, S = 7.5 * R;
  const core = { x: Math.round(cr.left + cr.width / 2 - sr.left), y: Math.round(cr.top + cr.height / 2 - sr.top) };
  const D0 = (H / 2) / Math.tan(15 * DEG); // FOV 30 at the final eye, 1 unit = 1 CSS px on NOW
  const zf = (phone ? CAM.phone : CAM.desktop).zf; // plane spacing as a share of the hero height
  const z = [2 * zf, zf, 0].map((f) => f * H);
  const s = z.map((zz) => (D0 - zz) / D0);
  const maxD = Math.hypot(Math.max(core.x, W - core.x), Math.max(core.y, H - core.y));
  // the 2021 and 2023 planes show a tray of cells: three rows, patchW pitches either side of the axis
  const L = { W, H, phone, R, P, S, core, D0, z, s, patchW: phone ? 2.1 : 3.4, maxD, dpr: Math.min(window.devicePixelRatio || 1, phone ? 1.5 : 2) };
  bandsOf(L);
  return L;
}

const inPatch = (L, c) => Math.abs(c.r) <= 1 && Math.abs(c.x - L.core.x) <= L.patchW * L.P + 0.5;
function placeDom(L) {
  Object.assign(markEl.style, { width: L.S + 'px', height: L.S + 'px', transform: `translate(${L.core.x - L.S / 2}px, ${L.core.y - L.S / 2}px)` });
  const g = L.R * 15;
  Object.assign(warmEl.style, { width: g + 'px', height: g + 'px', transform: `translate(${L.core.x - g / 2}px, ${L.core.y - g / 2}px)` });
}

// ---------------------------------------------------------------- camera (shared by both renderers)
function camAt(L, t) {
  const C = L.phone ? CAM.phone : CAM.desktop;
  const h = smooth(0, T.settle0, t);
  const e = easeInOut(clamp01((t - T.settle0) / (T.settle1 - T.settle0)));
  return {
    tilt: lerp(lerp(C.tilt0, C.tilt1, h), 0, e) * DEG,
    az: lerp(lerp(C.az0, C.az1, h), C.az1 - 4, e) * DEG,
    dist: L.D0 * lerp(lerp(C.d0, C.d1, h), 1, e),
    qz: L.z[1] * (1 - e), // look at the middle of the stack, then at the core
    sx: (L.phone ? CAM.phone : CAM.desktop).sx * (1 - e), // lens shift that centres the stack in the band
  };
}
// camera basis exactly as THREE.Object3D.lookAt builds it for a camera (up = +y)
function viewOf(c) {
  const st = Math.sin(c.tilt), ct = Math.cos(c.tilt);
  const px = c.dist * st * Math.cos(c.az), py = c.dist * st * Math.sin(c.az), pz = c.qz + c.dist * ct;
  let zx = px, zy = py, zz = pz - c.qz; const zl = Math.hypot(zx, zy, zz) || 1; zx /= zl; zy /= zl; zz /= zl;
  let xx = zz, xz = -zx; const xl = Math.hypot(xx, xz) || 1; xx /= xl; xz /= xl;
  const yx = zy * xz, yy = zz * xx - zx * xz, yz = -zy * xx;
  return { px, py, pz, xx, xz, yx, yy, yz, zx, zy, zz, f: c.dist, c, sx: c.sx || 0 };
}
// world -> CSS px (lens shift puts the look target on the core's layout position; f = distance: dolly zoom)
function proj(V, L, x, y, z, o) {
  const dx = x - V.px, dy = y - V.py, dz = z - V.pz;
  const cx = dx * V.xx + dz * V.xz;
  const cy = dx * V.yx + dy * V.yy + dz * V.yz;
  const cz = -(dx * V.zx + dy * V.zy + dz * V.zz);
  const k = V.f / Math.max(1, cz);
  o[0] = L.core.x + V.sx + cx * k; o[1] = L.core.y - cy * k; o[2] = cz;
  return o;
}
const wxOf = (L, x, z) => (x - L.core.x) * ((L.D0 - z) / L.D0);
const wyOf = (L, y, z) => -(y - L.core.y) * ((L.D0 - z) / L.D0);

// ---------------------------------------------------------------- world: cells + agents (screen-space sim, z for depth)
function makeWorld(L, seed = 7) {
  let sd = seed;
  const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  const { R, P, W, H, core } = L;
  const cells = [], map = new Map(), patchCells = [], nowCand = [];
  // NOW also extends past the far (left) edge and above the top: those cells only show while the camera is tilted
  const rq = Math.ceil(Math.hypot(W * 1.6, H * 1.6) / P) + 2;
  for (let q = -rq; q <= rq; q++) for (let r = -rq; r <= rq; r++) {
    const x = core.x + P * (q + r / 2), y = core.y + P * (SQ3 / 2) * r;
    const ring = (Math.abs(q) + Math.abs(q + r) + Math.abs(r)) / 2;
    const inView = x > -P && x < W + P && y > -P && y < H + P;
    const inTilt = x > -W * 0.95 && x < W + P * 2 && y > -H * 0.6 && y < H * 1.3;
    const c = { q, r, x, y, ring, d: Math.hypot(x - core.x, y - core.y), inView, inTilt, ping: [0, 0, 0], pingT: [-1, -1, -1] };
    c.patch = inPatch(L, c);
    if (!inTilt && !c.patch) continue;
    cells.push(c); map.set(q + ',' + r, c);
    if (ring >= 1 && c.patch) patchCells.push(c);
    // NOW-plane agents work near the core, so every committed agent can land before the 4.4 s resolve
    if (inTilt && ring >= 1 && c.d <= P * (L.phone ? 6.5 : 9.5)) nowCand.push(c);
  }
  const coreCell = map.get('0,0');
  const NEIGH = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]].map(([q, r]) => map.get(q + ',' + r));
  const st = { charge: 0, resolved: false, resolveT: 0, commitCount: 1 };
  const PA = [0, 0, 0];
  // a cell an agent may stand on (and ping) under the current camera: on screen, clear of the type and the chips
  function allowed(c, k, V) {
    proj(V, L, (c.x - core.x) * L.s[k], -(c.y - core.y) * L.s[k], L.z[k], PA);
    const x = PA[0], y = PA[1];
    if (PA[2] < 1) return false;
    if (x < P * 0.8 || x > W - P * 0.8 || y < P * 0.6 || y > H - P) return false;
    if (y > L.agentMaxY) return false;
    if (textVis(L, x, y, R * 1.3) < 1) return false;
    if (solidVis(L, x, y, R + 4) < 1) return false;
    return true;
  }
  const HN = 8;
  const N = L.phone ? 96 : 230;
  const agents = [];
  const V0 = viewOf(camAt(L, 0));

  function pickTarget(a, t, V) {
    const bias = smooth(800, T.scanEnd, t);
    const list = a.lvl < 2 ? patchCells : nowCand;
    for (let tries = 0; tries < 48; tries++) {
      const c = list[(rnd() * list.length) | 0];
      if (a.commit && rnd() < bias && c.ring > 6) continue;
      if (st.resolved && c.ring < 3) continue;
      if (!allowed(c, a.lvl, V)) continue;
      a.target = c; return;
    }
    if (!a.target) a.target = NEIGH[(rnd() * 6) | 0];
  }
  function startFall(a, t, to, dur) { a.fall = { t0: t, z0: a.z, z1: L.z[to], to, dur }; }

  for (let i = 0; i < N; i++) {
    const u = rnd(), lvl = u < 0.28 ? 0 : u < 0.56 ? 1 : 2;
    const list = lvl < 2 ? patchCells : nowCand;
    let c0 = null;
    for (let k = 0; k < 120 && !c0; k++) { const c = list[(rnd() * list.length) | 0]; if (allowed(c, lvl, V0)) c0 = c; }
    c0 = c0 || NEIGH[(rnd() * 6) | 0];
    const a = {
      x: c0.x + (rnd() - 0.5) * R, y: c0.y + (rnd() - 0.5) * R, vx: 0, vy: 0, mode: 'travel', target: null,
      dwell: 0, dwellMax: 260 + rnd() * 340, commit: rnd() < 0.72, delay: 200 + rnd() * 600, alive: true, lane: null,
      lvl, z: L.z[lvl], fall: null, scoutDrop: 2450 + rnd() * 1050, hist: new Float32Array(HN * 3), hi: 0, hc: 0,
      dw: [rnd() - 0.5, -1, 0],
    };
    const dl = Math.hypot(a.dw[0], a.dw[1]); a.dw[0] /= dl; a.dw[1] /= dl;
    pickTarget(a, 0, V0);
    agents.push(a);
  }
  st.commitCount = Math.max(1, agents.filter((a) => a.commit).length);

  const grid = new Map();
  const pings = [];
  function ping(c, k, t) { c.pingT[k] = t; pings.push([c, k]); }

  function step(t, dt, V) {
    const s = dt / 1000;
    const consensus = smooth(T.scanEnd, T.consensusEnd, t);
    const vmaxBase = P * (L.phone ? 2.0 : 2.2);
    const scoutSlow = st.resolved ? 0.6 : 1;
    grid.clear();
    for (const a of agents) {
      if (!a.alive || t < a.delay) continue;
      const k = (((a.x / P) | 0) + 64) * 4096 + (((a.y / P) | 0) + 64);
      let b = grid.get(k); if (!b) grid.set(k, (b = [])); b.push(a);
    }
    let activePings = pings.length;
    const pingCap = st.resolved ? 3 : L.phone ? 4 : 8;

    for (const a of agents) {
      if (!a.alive || t < a.delay) continue;
      if (a.fall) {
        const u = clamp01((t - a.fall.t0) / a.fall.dur);
        a.z = lerp(a.fall.z0, a.fall.z1, u * u); // gravity: ease-in
        if (u >= 1) { a.lvl = a.fall.to; a.z = a.fall.z1; a.fall = null; }
      }
      if (a.commit && t > T.scanEnd && a.mode !== 'final') {
        if (!a.lane) {
          let best = NEIGH[0], bd = 1e9;
          for (const c of NEIGH) { const d = Math.hypot(c.x - a.x, c.y - a.y); if (d < bd) { bd = d; best = c; } }
          a.lane = best; a.target = best; a.mode = 'commit';
          if (a.lvl < 2 && !a.fall) startFall(a, t, 2, 620 + rnd() * 280);
        }
        if (t > T.consensusEnd - 200 && Math.hypot(a.lane.x - a.x, a.lane.y - a.y) < R * 1.2) { a.mode = 'final'; a.target = coreCell; }
      }
      if (!a.commit && a.lvl < 2 && !a.fall && t > a.scoutDrop) startFall(a, t, 2, 600);

      const ox = a.target.x - a.x, oy = a.target.y - a.y, dist = Math.hypot(ox, oy) || 1e-6;
      const vmax = a.mode === 'travel' ? vmaxBase * scoutSlow : vmaxBase * (1 + 1.2 * consensus);
      const sp = Math.min(vmax, (vmax * dist) / (P * 0.9));
      const dvx = (ox / dist) * sp - a.vx, dvy = (oy / dist) * sp - a.vy;
      let sx = 0, sy = 0, ax = 0, ay = 0, cx = 0, cy = 0, n = 0;
      const gx = ((a.x / P) | 0) + 64, gy = ((a.y / P) | 0) + 64;
      for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
        const b = grid.get((gx + i) * 4096 + (gy + j)); if (!b) continue;
        for (const o of b) {
          if (o === a) continue;
          const dx = a.x - o.x, dy = a.y - o.y, d2 = dx * dx + dy * dy;
          if (d2 < (0.42 * P) ** 2 && d2 > 0) { const d = Math.sqrt(d2); sx += dx / d / d; sy += dy / d / d; }
          if (d2 < (1.1 * P) ** 2) { ax += o.vx; ay += o.vy; cx += o.x; cy += o.y; n++; }
        }
      }
      let fx = dvx * 3.2 + sx * vmax * 9, fy = dvy * 3.2 + sy * vmax * 9;
      if (n && a.mode !== 'travel') {
        fx += (ax / n - a.vx) * 1.4 * consensus; fy += (ay / n - a.vy) * 1.4 * consensus;
        fx += (cx / n - a.x) * 0.6 * consensus; fy += (cy / n - a.y) * 0.6 * consensus;
      }
      const w = (1 - consensus) * vmax * 1.2;
      fx += (rnd() - 0.5) * w; fy += (rnd() - 0.5) * w;
      a.vx += fx * s; a.vy += fy * s;
      const v = Math.hypot(a.vx, a.vy), lim = vmax * 1.15;
      if (v > lim) { a.vx *= lim / v; a.vy *= lim / v; }
      a.x += a.vx * s; a.y += a.vy * s;
      const h = a.hi * 3; a.hist[h] = a.x; a.hist[h + 1] = a.y; a.hist[h + 2] = a.z;
      a.hi = (a.hi + 1) % HN; a.hc = Math.min(HN, a.hc + 1);

      if (a.mode === 'travel' && dist < R * 0.35) {
        a.dwell += dt;
        if (!a.fall && a.dwell > 120 && a.target.pingT[a.lvl] < 0 && activePings < pingCap && !(consensus > 0 && a.target.ring < 3) && allowed(a.target, a.lvl, V)) { ping(a.target, a.lvl, t); activePings++; }
        if (a.dwell > a.dwellMax) {
          a.dwell = 0; a.dwellMax = 260 + rnd() * 340;
          if (t < T.scanEnd - 350 && a.lvl < 2 && !a.fall && rnd() < 0.3) startFall(a, t, a.lvl + 1, 520 + rnd() * 180);
          pickTarget(a, t, V);
        }
      }
      if (a.mode === 'final' && dist < R * 0.45) { a.alive = false; st.charge = Math.min(1, st.charge + 1 / st.commitCount); }
      if (st.resolved && a.mode !== 'travel' && t > st.resolveT + 260 && Math.hypot(a.x - core.x, a.y - core.y) < P * 1.5) a.alive = false;
    }
    // pings: 120 ms rise, 160 ms hold, 520 ms fade
    for (let i = pings.length - 1; i >= 0; i--) {
      const [c, k] = pings[i], e = t - c.pingT[k];
      c.ping[k] = e < 120 ? e / 120 : e < 280 ? 1 : Math.max(0, 1 - (e - 280) / 520);
      if (e > 800) { c.ping[k] = 0; c.pingT[k] = -1; pings.splice(i, 1); }
    }
    if (!st.resolved && (st.charge >= 0.9 || t >= T.resolve)) { st.resolved = true; st.resolveT = t; }
  }
  function stepAt(t, dt) { step(t, dt, viewOf(camAt(L, t))); }
  function runTo(target) { for (let t = 0; t <= target; t += STEP) stepAt(t, STEP); }
  // the layout moved (a late font): translate the screen-space state with it
  function shift(dx, dy) {
    for (const c of cells) { c.x += dx; c.y += dy; }
    for (const a of agents) { a.x += dx; a.y += dy; for (let i = 0; i < HN; i++) { a.hist[i * 3] += dx; a.hist[i * 3 + 1] += dy; } }
  }
  return { cells, map, agents, st, stepAt, runTo, shift, HN };
}

// ---------------------------------------------------------------- scene: every cell of every plane, drawn in painter's order
function sceneOf(L, world) {
  const byPlane = [[], [], []];
  for (const k of [2, 1, 0]) {
    const s = L.s[k];
    for (const c of world.cells) {
      if (k === 2 ? !c.inTilt : !c.patch) continue;
      byPlane[k].push({
        k, c, r0: [0, 110, 230][k] + (k < 2 ? Math.abs(c.q + c.r / 2) * 55 : c.ring * 40), // 2021 reveals first
        fade: k === 2 ? Math.max(0.12, 1 - smooth(0.22 * L.maxD, L.maxD, c.d)) : 1, // upper planes: crisp grates
        wx: (c.x - L.core.x) * s, wy: -(c.y - L.core.y) * s, z: L.z[k],
        rr: L.R * 0.97 * s, w: (c.ring === 0 ? 2.0 : k < 2 ? 1.25 : 1.0) * s, fill: k < 2,
        ext: L.R * (k < 2 ? 1.3 : 1.0),
      });
    }
  }
  return { byPlane, nowInView: byPlane[2].filter((e) => e.c.inView) };
}

// per-frame constants, then per-cell style (shared so both renderers paint the same thing)
function frameOf(t, st) {
  const markOn = st.resolved ? smooth(st.resolveT, st.resolveT + T.fade, t) : 0;
  return {
    t, markOn,
    sep: 1 - smooth(T.settle0 + 500, T.settle1, t),
    pastA: 1 - smooth(T.settle1, T.settle1 + 380, t),
    fillA: 0.9 * (1 - smooth(T.settle0 + 300, T.settle1 - 100, t)),
    nb: smooth(T.nb0, T.resolve, t),
    mark: 1 - smooth(T.labelsOut0 + 300, T.settle1 - 150, t),
    coreA: Math.max(st.charge, smooth(T.consensusEnd, T.resolve, t)) * (1 - markOn),
    occl: t < T.settle0 + 650,
    upper: t <= T.settle1 + 420,
    dim: st.resolved ? lerp(1, 0.55, smooth(st.resolveT, st.resolveT + 900, t)) : 1,
  };
}
const CS = { r: 0, g: 0, b: 0, a: 0, fa: 0, plain: true };
function cellStyle(L, e, F, sx, sy) {
  const cc = e.c, kk = e.k;
  const vis = textVis(L, sx, sy, e.ext);
  const reveal = smooth(e.r0, e.r0 + 300, F.t);
  const planeA = kk < 2 ? F.pastA : 1;
  let a = reveal * e.fade * planeA;
  // while the planes hang apart, each tray (NOW's too) is outlined a step brighter than the field
  let mh = kk === 0 ? 0.85 * F.sep : kk === 1 ? 0.6 * F.sep : cc.patch ? 0.42 * F.sep : 0, cm = 0;
  if (kk === 2 && cc.patch) a = Math.max(a, reveal * F.sep);
  if (cc.ring === 0) { cm = F.mark * reveal; a = Math.max(a, cm * planeA); }
  const lit = cc.ping[kk];
  if (lit > 0) { mh = Math.max(mh, lit * 0.9); a = Math.max(a, lit * 0.85 * reveal * planeA); }
  if (kk === 2 && cc.ring <= 1) { mh = Math.max(mh, F.nb); a = Math.max(a, F.nb) * (1 - F.markOn); }
  let r = lerp(FAINT[0], HIVE[0], mh), g = lerp(FAINT[1], HIVE[1], mh), b = lerp(FAINT[2], HIVE[2], mh);
  if (cm > 0) { r = lerp(r, MUTED[0], cm); g = lerp(g, MUTED[1], cm); b = lerp(b, MUTED[2], cm); }
  CS.r = r; CS.g = g; CS.b = b; CS.a = a * vis; CS.plain = mh === 0 && cm === 0;
  CS.fa = e.fill ? F.fillA * e.fade * reveal * vis : 0;
  return CS;
}

// agents: a 3 to 4 px head plus a short heading tick, computed once per frame for both renderers
function agentBuffers(N) {
  return {
    on: new Uint8Array(N), scout: new Uint8Array(N), bucket: new Uint8Array(N),
    hw: new Float32Array(N * 3), tw: new Float32Array(N * 3), hs: new Float32Array(N * 2), ts: new Float32Array(N * 2),
    size: new Float32Array(N), aHead: new Float32Array(N), aTick: new Float32Array(N),
  };
}
const AO = [0, 0, 0], AO2 = [0, 0, 0];
function agentsFrame(L, world, V, F, B) {
  const ag = world.agents, HN = world.HN, zMid = L.z[1] + 0.5;
  for (let i = 0; i < ag.length; i++) {
    const a = ag[i];
    if (!a.alive || F.t < a.delay || a.hc < 2) { B.on[i] = 0; continue; }
    const wake = smooth(a.delay, a.delay + 300, F.t), scout = a.mode === 'travel';
    const hx = wxOf(L, a.x, a.z), hy = wyOf(L, a.y, a.z), hz = a.z;
    // heading from the sample three steps back (world space); keep the last one while an agent dwells
    const back = Math.min(3, a.hc - 1), h = ((a.hi - 1 - back + HN * 2) % HN) * 3;
    const oz = a.hist[h + 2];
    const dx = hx - wxOf(L, a.hist[h], oz), dy = hy - wyOf(L, a.hist[h + 1], oz), dz = hz - oz;
    const dl = Math.hypot(dx, dy, dz);
    if (dl > 0.35) { a.dw[0] = dx / dl; a.dw[1] = dy / dl; a.dw[2] = dz / dl; }
    proj(V, L, hx, hy, hz, AO);
    const k = V.f / Math.max(1, AO[2]);
    const tl = (scout ? 5 : 7) / Math.max(0.3, k);
    const tx = hx - a.dw[0] * tl, ty = hy - a.dw[1] * tl, tz = hz - (a.dw[2] || 0) * tl;
    proj(V, L, tx, ty, tz, AO2);
    let vis = Math.min(textVis(L, AO[0], AO[1], 3), textVis(L, AO2[0], AO2[1], 1)) * solidVis(L, AO[0], AO[1], 3);
    // nothing crawls over the official mark once it is on
    if (F.markOn > 0) vis *= 1 - F.markOn * (1 - smooth(L.P * 1.6, L.P * 2.1, Math.hypot(AO[0] - L.core.x, AO[1] - L.core.y)));
    if (vis <= 0.003) { B.on[i] = 0; continue; }
    B.on[i] = 1; B.scout[i] = scout ? 1 : 0; B.bucket[i] = a.z <= 0.5 ? 2 : a.z <= zMid ? 1 : 0;
    B.hw[i * 3] = hx; B.hw[i * 3 + 1] = hy; B.hw[i * 3 + 2] = hz;
    B.tw[i * 3] = tx; B.tw[i * 3 + 1] = ty; B.tw[i * 3 + 2] = tz;
    B.hs[i * 2] = AO[0]; B.hs[i * 2 + 1] = AO[1]; B.ts[i * 2] = AO2[0]; B.ts[i * 2 + 1] = AO2[1];
    B.size[i] = (scout ? 3 : 3.4) * Math.min(1.3, Math.max(0.85, k));
    B.aHead[i] = (scout ? 0.8 * F.dim : 1) * wake * vis;
    B.aTick[i] = (scout ? 0.42 * F.dim : 0.62) * wake * vis;
  }
}

// ---------------------------------------------------------------- DOM: cycle labels, phase readout, mark
let lastPhase = '';
function setPhase(t, st) {
  const p = st.resolved ? 'signal' : t >= T.scanEnd ? 'consensus' : 'scanning';
  if (p !== lastPhase) { hero.dataset.phase = p; lastPhase = p; }
  const on = st.resolved;
  markEl.classList.toggle('on', on);
  warmEl.classList.toggle('on', on);
  hero.classList.toggle('cards-in', on);
}
const labelO = [-1, -1, -1], PJ = [0, 0, 0];
const labelW = [0, 0, 0], labelH = [0, 0, 0];
function updateDom(L, t, st, V) {
  // each label sits on its plane's patch (just above it), fades in with the planes and out before they lock
  const chips = L.solid[0];
  for (let k = 0; k < 3; k++) {
    const el = labels[k];
    let op = smooth(T.labelsIn + 150 * k, T.labelsIn + 150 * k + 420, t) * (1 - smooth(T.labelsOut0, T.labelsOut1, t));
    if (op <= 0.001) { if (labelO[k] !== 0) { el.style.opacity = '0'; labelO[k] = 0; } continue; }
    if (!labelW[k]) { labelW[k] = el.offsetWidth; labelH[k] = el.offsetHeight; }
    const s = L.s[k], ey = (L.P * SQ3 / 2 + L.R) * s, ex = (L.patchW * L.P + L.R * 0.87) * s;
    let top = 1e9, bot = -1e9, cxs = 0;
    for (const [wx, wy] of [[0, ey], [0, -ey], [ex, 0], [-ex, 0]]) {
      proj(V, L, wx, wy, L.z[k], PJ); top = Math.min(top, PJ[1]); bot = Math.max(bot, PJ[1]);
    }
    proj(V, L, 0, 0, L.z[k], PJ); cxs = PJ[0];
    // always above its tray; if the tray rises toward the chips, the label stays put and fades instead of jumping
    let y = top - 10 - labelH[k];
    if (chips && y < chips.b + 6) { y = chips.b + 6; op *= clamp01(1 - (y + labelH[k] - (top - 4)) / 10); }
    const x = cxs - labelW[k] / 2;
    // never on the type
    const q = { l: x, t: y, r: x + labelW[k], b: y + labelH[k] };
    for (const b of L.text) if (q.l < b.r + L.pad && q.r > b.l - L.pad && q.t < b.b + L.pad && q.b > b.t - L.pad) { op = 0; break; }
    el.style.opacity = op.toFixed(3); labelO[k] = op;
    el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
  }
  setPhase(t, st);
}

// ---------------------------------------------------------------- Canvas 2D renderer (first paint, and the no-WebGL path)
function hexPath(g, x, y, r) {
  g.beginPath();
  for (let k = 0; k < 6; k++) { const a = (60 * k - 90) * DEG; const px = x + r * Math.cos(a), py = y + r * Math.sin(a); k ? g.lineTo(px, py) : g.moveTo(px, py); }
  g.closePath();
}
const css = (r, g, b) => `rgb(${(r * 255) | 0},${(g * 255) | 0},${(b * 255) | 0})`;
const FAINT_CSS = css(...FAINT), MUTED_CSS = '#8E8A80', TEXT_CSS = '#EEEBE4';
function drawAgents2D(g, B, N, bucket) {
  for (let i = 0; i < N; i++) {
    if (!B.on[i] || (bucket >= 0 && B.bucket[i] !== bucket)) continue;
    const col = B.scout[i] ? MUTED_CSS : TEXT_CSS, x = B.hs[i * 2], y = B.hs[i * 2 + 1], sz = B.size[i];
    g.globalAlpha = B.aTick[i]; g.strokeStyle = col; g.lineWidth = 1;
    g.beginPath(); g.moveTo(B.ts[i * 2], B.ts[i * 2 + 1]); g.lineTo(x, y); g.stroke();
    g.globalAlpha = B.aHead[i]; g.fillStyle = col;
    g.fillRect(x - sz / 2, y - sz / 2, sz, sz);
  }
}
function make2D(L, world, scene) {
  cv2d.width = Math.round(L.W * L.dpr); cv2d.height = Math.round(L.H * L.dpr);
  const g = cv2d.getContext('2d');
  const o = [0, 0, 0], ang = [];
  for (let i = 0; i < 6; i++) ang.push([Math.cos((60 * i + 90) * DEG), Math.sin((60 * i + 90) * DEG)]);
  const N = world.agents.length, B = agentBuffers(N);
  function cellPath(V, e, r) {
    g.beginPath();
    for (let i = 0; i < 6; i++) { proj(V, L, e.wx + r * ang[i][0], e.wy + r * ang[i][1], e.z, o); i ? g.lineTo(o[0], o[1]) : g.moveTo(o[0], o[1]); }
    g.closePath();
  }
  function render(F, V) {
    agentsFrame(L, world, V, F, B);
    g.setTransform(L.dpr, 0, 0, L.dpr, 0, 0);
    g.globalAlpha = 1; g.fillStyle = '#0B0B0D'; g.fillRect(0, 0, L.W, L.H);
    for (const k of [2, 1, 0]) {
      if (k < 2 && !F.upper) break;
      const list = k === 2 && !F.upper ? scene.nowInView : scene.byPlane[k];
      for (const e of list) {
        if (F.t < e.r0) continue;
        proj(V, L, e.wx, e.wy, e.z, o);
        if (o[0] < -80 || o[0] > L.W + 80 || o[1] < -80 || o[1] > L.H + 80) continue;
        const s = cellStyle(L, e, F, o[0], o[1]);
        if (s.a <= 0.004 && s.fa <= 0.004) continue;
        cellPath(V, e, e.rr);
        if (s.fa > 0.004) { g.globalAlpha = s.fa; g.fillStyle = '#0B0B0D'; g.fill(); }
        if (s.a > 0.004) { g.globalAlpha = s.a; g.strokeStyle = s.plain ? FAINT_CSS : css(s.r, s.g, s.b); g.lineWidth = Math.max(1, e.w / L.s[k]); g.stroke(); }
      }
      if (F.occl) drawAgents2D(g, B, N, k);
    }
    if (F.coreA > 0.004) {
      g.globalAlpha = F.coreA; g.strokeStyle = '#F5C542'; g.lineWidth = 1.5;
      cellPath(V, { wx: 0, wy: 0, z: 0 }, L.R * 0.825); g.stroke();
    }
    if (!F.occl) drawAgents2D(g, B, N, -1);
    g.globalAlpha = 1;
  }
  return { render };
}

// a settled still (reduced motion): top-down, the official SVG draws the 7-cell cluster
function drawStill(L, world) {
  cv2d.width = Math.round(L.W * L.dpr); cv2d.height = Math.round(L.H * L.dpr);
  const g = cv2d.getContext('2d');
  g.setTransform(L.dpr, 0, 0, L.dpr, 0, 0);
  g.fillStyle = '#0B0B0D'; g.fillRect(0, 0, L.W, L.H);
  g.lineWidth = 1; g.strokeStyle = '#1C1C21';
  for (const c of world.cells) {
    if (!c.inView || c.ring <= 1) continue;
    const a = Math.max(0.12, 1 - smooth(0.22 * L.maxD, L.maxD, c.d)) * textVis(L, c.x, c.y, L.R);
    if (a <= 0.004) continue;
    g.globalAlpha = a;
    hexPath(g, c.x, c.y, L.R * 0.97); g.stroke();
  }
  const V = viewOf(camAt(L, T.still)), B = agentBuffers(world.agents.length);
  agentsFrame(L, world, V, frameOf(T.still, world.st), B);
  drawAgents2D(g, B, world.agents.length, -1);
  g.globalAlpha = 1;
  for (const l of labels) l.style.opacity = '0';
  markEl.style.transition = 'none'; warmEl.style.transition = 'none';
  setPhase(T.still, world.st);
  document.body.dataset.ready = '1';
}

// ---------------------------------------------------------------- Three.js renderer
function buildGL(THREE, L, world, scene) {
  THREE.ColorManagement.enabled = false; // write kit hex values straight through
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' }); }
  catch (e) { return null; }
  if (!renderer.getContext()) return null;
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.setPixelRatio(L.dpr);
  renderer.setSize(L.W, L.H, false);
  renderer.setClearColor(0x0b0b0d, 1);
  const el = renderer.domElement; el.className = 'hero-gl';
  cv2d.after(el);
  const scene3 = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(30, L.W / L.H, 4, L.D0 * 4);

  // field (draw call 1): NOW outlines, the gold core outline, then the upper planes as honeycomb grates
  // (a ground-coloured fill per cell hides what is below; the gaps let the lower planes through), then the
  // spindle. Painter's order inside the mesh; depth is still written so agents under an upper cell hide.
  const pos = [], idx = [], ent = [];
  const addPoly = (cx, cy, z, r) => {
    const v0 = pos.length / 3; pos.push(cx, cy, z);
    for (let i = 0; i < 6; i++) { const a = (60 * i + 90) * DEG; pos.push(cx + r * Math.cos(a), cy + r * Math.sin(a), z); }
    for (let i = 0; i < 6; i++) idx.push(v0, v0 + 1 + i, v0 + 1 + ((i + 1) % 6));
    return v0;
  };
  const addRing = (cx, cy, z, r, w) => {
    const v0 = pos.length / 3, h = w / 2 / Math.cos(30 * DEG);
    for (let i = 0; i < 6; i++) { const a = (60 * i + 90) * DEG; pos.push(cx + (r + h) * Math.cos(a), cy + (r + h) * Math.sin(a), z); }
    for (let i = 0; i < 6; i++) { const a = (60 * i + 90) * DEG; pos.push(cx + (r - h) * Math.cos(a), cy + (r - h) * Math.sin(a), z); }
    for (let i = 0; i < 6; i++) { const j = (i + 1) % 6; idx.push(v0 + i, v0 + j, v0 + 6 + i, v0 + 6 + i, v0 + j, v0 + 6 + j); }
    return v0;
  };
  let nowIdx = 0, goldV0 = 0;
  for (const k of [2, 1, 0]) {
    if (k === 1) { goldV0 = addRing(0, 0, 0, L.R * 0.825, 1.5); nowIdx = idx.length; }
    for (const e of scene.byPlane[k]) {
      const f0 = e.fill ? addPoly(e.wx, e.wy, e.z - 0.6, e.rr) : -1;
      ent.push({ e, f0, v0: addRing(e.wx, e.wy, e.z, e.rr, e.w) });
    }
  }
  const allIdx = idx.length;
  const fGeo = new THREE.BufferGeometry();
  const fPos = new Float32Array(pos);
  const fPosA = new THREE.BufferAttribute(fPos, 3);
  fGeo.setAttribute('position', fPosA);
  fGeo.setIndex(idx);
  const fCol = new Float32Array((pos.length / 3) * 4);
  const fColA = new THREE.BufferAttribute(fCol, 4).setUsage(THREE.DynamicDrawUsage);
  fGeo.setAttribute('color', fColA);
  const fieldMat = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthTest: true, depthFunc: THREE.AlwaysDepth, depthWrite: true, side: THREE.DoubleSide });
  const field = new THREE.Mesh(fGeo, fieldMat); field.frustumCulled = false; field.renderOrder = 0;
  scene3.add(field);

  // agents: heading ticks (draw call 2) and heads (draw call 3)
  const N = world.agents.length, B = agentBuffers(N);
  const tPos = new Float32Array(N * 6), tCol = new Float32Array(N * 8);
  const tGeo = new THREE.BufferGeometry();
  const tPosA = new THREE.BufferAttribute(tPos, 3).setUsage(THREE.DynamicDrawUsage);
  const tColA = new THREE.BufferAttribute(tCol, 4).setUsage(THREE.DynamicDrawUsage);
  tGeo.setAttribute('position', tPosA); tGeo.setAttribute('color', tColA);
  const trailMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, depthTest: true, depthWrite: false });
  const ticks = new THREE.LineSegments(tGeo, trailMat); ticks.frustumCulled = false; ticks.renderOrder = 1; scene3.add(ticks);
  const hPos = new Float32Array(N * 3), hCol = new Float32Array(N * 4), hSize = new Float32Array(N);
  const hGeo = new THREE.BufferGeometry();
  const hPosA = new THREE.BufferAttribute(hPos, 3).setUsage(THREE.DynamicDrawUsage);
  const hColA = new THREE.BufferAttribute(hCol, 4).setUsage(THREE.DynamicDrawUsage);
  const hSizeA = new THREE.BufferAttribute(hSize, 1).setUsage(THREE.DynamicDrawUsage);
  hGeo.setAttribute('position', hPosA); hGeo.setAttribute('acol', hColA); hGeo.setAttribute('asize', hSizeA);
  const headMat = new THREE.ShaderMaterial({
    uniforms: { uDpr: { value: L.dpr } },
    vertexShader: 'attribute vec4 acol; attribute float asize; uniform float uDpr; varying vec4 vC;\n' +
      'void main(){ vC = acol; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_PointSize = asize * uDpr; }',
    fragmentShader: 'varying vec4 vC; void main(){ if (vC.a <= 0.0) discard; gl_FragColor = vC; }',
    transparent: true, depthTest: true, depthWrite: false,
  });
  const heads = new THREE.Points(hGeo, headMat); heads.frustumCulled = false; heads.renderOrder = 2; scene3.add(heads);

  const PO = [0, 0, 0];
  const put = (v0, n, r, g, b, a) => { let o = v0 * 4; for (let i = 0; i < n; i++, o += 4) { fCol[o] = r; fCol[o + 1] = g; fCol[o + 2] = b; fCol[o + 3] = a; } };

  function render(F, V) {
    cam.position.set(V.px, V.py, V.pz); cam.up.set(0, 1, 0); cam.lookAt(0, 0, V.c.qz); cam.updateMatrixWorld(true);
    const n = 4, k = n / V.f;
    const ox = L.core.x + V.sx;
    cam.projectionMatrix.makePerspective(-ox * k, (L.W - ox) * k, L.core.y * k, -(L.H - L.core.y) * k, n, V.f * 4);
    cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert();

    for (const x of ent) {
      if (!F.upper && x.e.k < 2) break;
      const e = x.e;
      let s = null;
      if (F.t >= e.r0) {
        proj(V, L, e.wx, e.wy, e.z, PO);
        if (PO[0] > -80 && PO[0] < L.W + 80 && PO[1] > -80 && PO[1] < L.H + 80) s = cellStyle(L, e, F, PO[0], PO[1]);
      }
      if (!s) { put(x.v0, 12, 0, 0, 0, 0); if (x.f0 >= 0) put(x.f0, 7, 0, 0, 0, 0); continue; }
      put(x.v0, 12, s.r, s.g, s.b, s.a);
      if (x.f0 >= 0) put(x.f0, 7, 0.0431, 0.0431, 0.051, s.fa);
    }
    put(goldV0, 12, GOLD[0], GOLD[1], GOLD[2], F.coreA);
    fColA.needsUpdate = true;
    fGeo.setDrawRange(0, F.upper ? allIdx : nowIdx);
    trailMat.depthTest = F.occl; headMat.depthTest = F.occl;

    agentsFrame(L, world, V, F, B);
    for (let i = 0; i < N; i++) {
      if (!B.on[i]) { tCol[i * 8 + 3] = 0; tCol[i * 8 + 7] = 0; hCol[i * 4 + 3] = 0; continue; }
      const col = B.scout[i] ? MUTED : TEXT;
      tPos[i * 6] = B.tw[i * 3]; tPos[i * 6 + 1] = B.tw[i * 3 + 1]; tPos[i * 6 + 2] = B.tw[i * 3 + 2];
      tPos[i * 6 + 3] = B.hw[i * 3]; tPos[i * 6 + 4] = B.hw[i * 3 + 1]; tPos[i * 6 + 5] = B.hw[i * 3 + 2];
      tCol[i * 8] = col[0]; tCol[i * 8 + 1] = col[1]; tCol[i * 8 + 2] = col[2]; tCol[i * 8 + 3] = B.aTick[i] * 0.35;
      tCol[i * 8 + 4] = col[0]; tCol[i * 8 + 5] = col[1]; tCol[i * 8 + 6] = col[2]; tCol[i * 8 + 7] = B.aTick[i];
      hPos[i * 3] = B.hw[i * 3]; hPos[i * 3 + 1] = B.hw[i * 3 + 1]; hPos[i * 3 + 2] = B.hw[i * 3 + 2];
      hCol[i * 4] = col[0]; hCol[i * 4 + 1] = col[1]; hCol[i * 4 + 2] = col[2]; hCol[i * 4 + 3] = B.aHead[i];
      hSize[i] = B.size[i];
    }
    tPosA.needsUpdate = tColA.needsUpdate = hPosA.needsUpdate = hColA.needsUpdate = hSizeA.needsUpdate = true;
    renderer.render(scene3, cam);
  }
  function dispose() {
    fGeo.dispose(); tGeo.dispose(); hGeo.dispose(); fieldMat.dispose(); trailMat.dispose(); headMat.dispose();
    renderer.dispose(); el.remove();
  }
  return { render, dispose, el };
}

// ---------------------------------------------------------------- main
async function main() {
  // a module script runs after first paint; the 3D bytes were preloaded and are evaluated after the first frame
  await nextFrame();
  // the clear bands follow the real headline glyphs: give Unbounded a moment (never more than 250 ms); if it
  // lands later, the bands and the core follow it (fonts.ready below) and the masks are evaluated every frame
  const headFont = document.fonts && document.fonts.load ? document.fonts.load('600 56px "Unbounded"').catch(() => null) : Promise.resolve();
  await Promise.race([headFont, sleep(250)]);
  await nextFrame();
  let L = measure();
  placeDom(L);
  let world = makeWorld(L), scene = sceneOf(L, world);

  if (M.reduce) { world.runTo(T.still); drawStill(L, world); return; }

  let r2d = make2D(L, world, scene);
  r2d.render(frameOf(0, world.st), viewOf(camAt(L, 0)));
  await nextFrame();
  const threeP = FORCE_2D ? Promise.resolve(null)
    : Promise.race([import('three').catch(() => null), sleep(9000).then(() => null)]);
  let gl = null, glAt = 0, THREE = null;
  const frameAt = (t) => { const V = viewOf(camAt(L, t)); return [frameOf(t, world.st), V]; };

  if (FIXED_T !== null) {
    // deterministic frame for screenshots: wait for the 3D, fall back to 2D if it never comes
    THREE = await threeP;
    world.runTo(FIXED_T);
    const [F, V] = frameAt(FIXED_T);
    gl = THREE ? buildGL(THREE, L, world, scene) : null;
    if (gl) { gl.el.style.transition = 'none'; gl.el.classList.add('on'); gl.render(F, V); }
    else r2d.render(F, V);
    markEl.style.transition = 'none';
    for (const q of hero.querySelectorAll('.qcard')) q.style.transition = 'none';
    updateDom(L, FIXED_T, world.st, V);
    document.body.dataset.ready = '1';
    return;
  }

  let clock = 0, tSim = 0, last = null, raf = 0, running = false, lastDraw = 0, visible = true, glTried = false;
  // Both renderers draw the same projection. The story plays on the 2D canvas from first paint; Three.js takes
  // over once the story has settled, so building its buffers and shaders (slow under software GL) never stalls
  // the motion, and the idle patrol afterwards runs on the GPU.
  threeP.then((T3) => { if (T3) THREE = T3; });
  const handOver = () => {
    glTried = true;
    gl = buildGL(THREE, L, world, scene);
    if (!gl) return;
    glAt = performance.now();
    const [F, V] = frameAt(tSim); gl.render(F, V);
    requestAnimationFrame(() => gl && gl.el.classList.add('on'));
    document.body.dataset.heroGl = String(Math.round(glAt));
  };

  const frame = (now) => {
    raf = 0;
    if (!running) return;
    const dt = last === null ? STEP : Math.min(1000, now - last); // keep real time on slow devices
    last = now; clock += dt;
    let n = 0;
    while (tSim + STEP <= clock && n < 64) { world.stepAt(tSim, STEP); tSim += STEP; n++; }
    if (n === 64) clock = tSim;
    const settled = tSim > T.still + 400;
    if (settled && THREE && !gl && !glTried) { handOver(); last = performance.now(); }
    if (!settled || now - lastDraw > 32) {
      const [F, V] = frameAt(tSim);
      if (gl) { gl.render(F, V); if (now - glAt < 700) r2d.render(F, V); }
      else r2d.render(F, V);
      updateDom(L, tSim, world.st, V);
      lastDraw = now;
    }
    raf = requestAnimationFrame(frame);
  };
  const update = () => {
    const should = visible && !document.hidden && !M.paused;
    if (should && !running) { running = true; last = null; if (!raf) raf = requestAnimationFrame(frame); }
    else if (!should && running) { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }
  };
  { const [F, V] = frameAt(0); r2d.render(F, V); }
  document.body.dataset.ready = '1';
  new IntersectionObserver((es) => { visible = es[0].isIntersecting; update(); }, { threshold: 0 }).observe(hero);
  document.addEventListener('visibilitychange', update);
  M.on(update);
  update();

  // a late font can move the type (and so the bands) or the core: follow it without a rebuild
  if (document.fonts) document.fonts.ready.then(() => {
    const L2 = measure();
    const dx = L2.core.x - L.core.x, dy = L2.core.y - L.core.y;
    L.text = L2.text; L.solid = L2.solid; L.textTop = L2.textTop; L.agentMaxY = L2.agentMaxY;
    labelW.fill(0);
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
    world.shift(dx, dy);
    L.core = L2.core; placeDom(L);
  });

  // resize: rebuild and land on the settled frame (no replay)
  let rt = 0, lastW = L.W, lastH = L.H;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      const r = stage.getBoundingClientRect();
      if (Math.abs(r.width - lastW) < 2 && Math.abs(r.height - lastH) < 90) return;
      lastW = r.width; lastH = r.height;
      if (gl) gl.dispose();
      gl = null; labelW.fill(0);
      L = measure(); placeDom(L); world = makeWorld(L); scene = sceneOf(L, world); world.runTo(T.still);
      clock = tSim = T.still;
      r2d = make2D(L, world, scene);
      if (THREE) { gl = buildGL(THREE, L, world, scene); if (gl) { gl.el.style.transition = 'none'; gl.el.classList.add('on'); glAt = 0; } }
      const [F, V] = frameAt(tSim);
      if (gl) gl.render(F, V); else r2d.render(F, V);
      updateDom(L, tSim, world.st, V);
    }, 220);
  });
}

main().catch((e) => { console.error(e); document.body.dataset.ready = '1'; });
