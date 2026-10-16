// Swarm | Three Cycles: hero motion (ES module).
//
// Three pointy-top honeycomb planes hang in depth: 2021 nearest the eye, 2023 in the middle, NOW at the
// bottom. Agents wake on all three, scan cells (pings), and fall through the planes toward NOW. A dolly
// zoom (the camera pulls back while its focal length grows, so the NOW plane keeps 1 unit = 1 CSS px)
// plus a crane to top-down collapses the parallax. Each upper plane is pre-scaled by (D0 - z) / D0, so
// from the final eye the three lattices register exactly into one field. The core charges and the
// official Hive Core SVG lands on the lit cell. Every word is DOM; Three.js r160 draws lines and points
// only (3 draw calls). Reduced motion and no-WebGL get a Canvas 2D still of the settled frame.

const M = window.SwarmMotion || { reduce: false, paused: false, on() {}, set() {} };
const qs = new URLSearchParams(location.search);
const FIXED_T = qs.has('t') ? Math.max(0, parseFloat(qs.get('t')) || 0) : null;
const FORCE_2D = qs.get('gl') === '0';
const TUNE = qs.has('tune') ? qs.get('tune').split(',').map(Number) : null; // design-lab tuning only

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
  desktop: { tilt0: 60, tilt1: 54, az0: -5, az1: -16, d0: 0.62, d1: 0.68, center: 1 },
  phone: { tilt0: 42, tilt1: 37, az0: 214, az1: 204, d0: 0.62, d1: 0.68, center: 1 },
};
const C01 = (h) => [((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255];
const FAINT = C01(0x1c1c21), HIVE = C01(0x55555b), MUTED = C01(0x8e8a80), TEXT = C01(0xeeebe4), GOLD = C01(0xf5c542);

const hero = document.getElementById('top');
const stage = document.getElementById('stage');
const gapEl = document.getElementById('heroGap');
const markEl = document.getElementById('heroMark');
const warmEl = document.getElementById('coreWarmth');
const cv2d = document.getElementById('hero2d');
const labels = [...document.querySelectorAll('.plane-label')];

// ---------------------------------------------------------------- layout
function measure() {
  const sr = stage.getBoundingClientRect();
  const gr = gapEl.getBoundingClientRect();
  const W = Math.max(320, Math.round(sr.width)), H = Math.max(420, Math.round(sr.height));
  const phone = W <= 640;
  const R = phone ? 22 : 34, P = 1.95 * R, S = 7.5 * R;
  const core = { x: Math.round(W / 2), y: Math.round(gr.top + gr.height / 2 - sr.top) };
  const D0 = (H / 2) / Math.tan(15 * DEG); // FOV 30 at the final eye, 1 unit = 1 CSS px on NOW
  const zf = TUNE ? TUNE[3] : phone ? 0.2 : 0.3;
  const z = [2 * zf, zf, 0].map((f) => f * H);
  const s = z.map((zz) => (D0 - zz) / D0);
  const maxD = Math.hypot(Math.max(core.x, W - core.x), Math.max(core.y, H - core.y));
  return { W, H, phone, R, P, S, core, D0, z, s, patch: TUNE ? TUNE[4] : phone ? 2 : 3, maxD, dpr: Math.min(window.devicePixelRatio || 1, phone ? 1.5 : 2) };
}

function placeDom(L) {
  hero.style.setProperty('--core-y', L.core.y + 'px');
  Object.assign(markEl.style, { width: L.S + 'px', height: L.S + 'px', transform: `translate(${L.core.x - L.S / 2}px, ${L.core.y - L.S / 2}px)` });
  const g = L.R * 19;
  Object.assign(warmEl.style, { width: g + 'px', height: g + 'px', transform: `translate(${L.core.x - g / 2}px, ${L.core.y - g / 2}px)` });
}

// ---------------------------------------------------------------- world: cells + agents (screen-space sim, z for depth)
function makeWorld(L, seed = 7) {
  let sd = seed;
  const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  const { R, P, W, H, core } = L;
  const cells = [], map = new Map();
  const rq = Math.max(Math.ceil(L.maxD / P) + 2, L.patch + 1);
  for (let q = -rq; q <= rq; q++) for (let r = -rq; r <= rq; r++) {
    const x = core.x + P * (q + r / 2), y = core.y + P * (SQ3 / 2) * r;
    const ring = (Math.abs(q) + Math.abs(q + r) + Math.abs(r)) / 2;
    const inView = x > -P && x < W + P && y > -P && y < H + P;
    if (!inView && ring > L.patch) continue;
    const c = { q, r, x, y, ring, d: Math.hypot(x - core.x, y - core.y), inView, ping: [0, 0, 0], pingT: [-1, -1, -1] };
    cells.push(c); map.set(q + ',' + r, c);
  }
  const coreCell = map.get('0,0');
  const NEIGH = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]].map(([q, r]) => map.get(q + ',' + r));
  const st = { charge: 0, resolved: false, resolveT: 0, commitCount: 1 };
  const okCell = (c, lvl) => c.ring > 0 && c.x > R * 1.2 && c.x < W - R * 1.2 && c.y > R * 1.6 && c.y < H - R * 1.2 && (lvl === 2 || c.ring <= L.patch);
  const HN = 8;
  const N = L.phone ? 110 : 300;
  const agents = [];

  function pickTarget(a, t) {
    const bias = smooth(800, T.scanEnd, t);
    for (let tries = 0; tries < 24; tries++) {
      const c = cells[(rnd() * cells.length) | 0];
      if (!okCell(c, a.lvl)) continue;
      if (a.commit && rnd() < bias && c.ring > 3) continue;
      if (st.resolved && c.ring < 3) continue;
      a.target = c; return;
    }
    if (!a.target) a.target = map.get('3,0') || cells[1];
  }
  function startFall(a, t, to, dur) { a.fall = { t0: t, z0: a.z, z1: L.z[to], to, dur }; }

  for (let i = 0; i < N; i++) {
    const u = rnd(), lvl = u < 0.3 ? 0 : u < 0.6 ? 1 : 2;
    let c0 = null;
    for (let k = 0; k < 60 && !c0; k++) { const c = cells[(rnd() * cells.length) | 0]; if (okCell(c, lvl)) c0 = c; }
    c0 = c0 || map.get('3,0');
    const a = {
      x: c0.x + (rnd() - 0.5) * R, y: c0.y + (rnd() - 0.5) * R, vx: 0, vy: 0, mode: 'travel', target: null,
      dwell: 0, dwellMax: 260 + rnd() * 340, commit: rnd() < 0.72, delay: 200 + rnd() * 600, alive: true, lane: null,
      lvl, z: L.z[lvl], fall: null, scoutDrop: 2450 + rnd() * 1050, hist: new Float32Array(HN * 3), hi: 0, hc: 0,
    };
    pickTarget(a, 0);
    agents.push(a);
  }
  st.commitCount = Math.max(1, agents.filter((a) => a.commit).length);

  const grid = new Map();
  const pings = [];
  function ping(c, k, t) { c.pingT[k] = t; pings.push([c, k]); }

  function step(t, dt) {
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
        if (!a.fall && a.dwell > 120 && a.target.pingT[a.lvl] < 0 && activePings < pingCap && !(consensus > 0 && a.target.ring < 3)) { ping(a.target, a.lvl, t); activePings++; }
        if (a.dwell > a.dwellMax) {
          a.dwell = 0; a.dwellMax = 260 + rnd() * 340;
          if (t < T.scanEnd - 350 && a.lvl < 2 && !a.fall && rnd() < 0.3) startFall(a, t, a.lvl + 1, 520 + rnd() * 180);
          pickTarget(a, t);
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
  function runTo(target) { for (let t = 0; t <= target; t += STEP) step(t, STEP); }
  return { cells, map, agents, st, step, runTo, HN };
}

// ---------------------------------------------------------------- DOM state shared by both renderers
let lastPhase = '';
function setPhase(t, st) {
  const p = st.resolved ? 'one' : t >= T.scanEnd ? 'merge' : 'cycles';
  if (p !== lastPhase) { hero.dataset.phase = p; lastPhase = p; }
  const on = st.resolved;
  markEl.classList.toggle('on', on);
  warmEl.classList.toggle('on', on);
  hero.classList.toggle('cards-in', on);
}

// ---------------------------------------------------------------- Canvas 2D still (reduced motion, no WebGL)
function hexPath(g, x, y, r) {
  g.beginPath();
  for (let k = 0; k < 6; k++) { const a = (60 * k - 90) * DEG; const px = x + r * Math.cos(a), py = y + r * Math.sin(a); k ? g.lineTo(px, py) : g.moveTo(px, py); }
  g.closePath();
}
function drawStill(L, world) {
  cv2d.width = Math.round(L.W * L.dpr); cv2d.height = Math.round(L.H * L.dpr);
  const g = cv2d.getContext('2d');
  g.setTransform(L.dpr, 0, 0, L.dpr, 0, 0);
  g.fillStyle = '#0B0B0D'; g.fillRect(0, 0, L.W, L.H);
  g.lineWidth = 1; g.strokeStyle = '#1C1C21';
  for (const c of world.cells) {
    if (!c.inView || c.ring <= 1) continue; // the official SVG draws the 7-cell cluster
    g.globalAlpha = Math.max(0.12, 1 - smooth(0.25 * L.maxD, L.maxD, c.d));
    hexPath(g, c.x, c.y, L.R * 0.97); g.stroke();
  }
  for (const a of world.agents) {
    if (!a.alive || a.hc < 2) continue;
    const scout = a.mode === 'travel', o = (a.hi % a.hc) * 3;
    g.globalAlpha = scout ? 0.2 : 0.42; g.strokeStyle = '#8E8A80';
    g.beginPath(); g.moveTo(a.hist[o], a.hist[o + 1]); g.lineTo(a.x, a.y); g.stroke();
    g.globalAlpha = scout ? 0.5 : 1; g.fillStyle = scout ? '#8E8A80' : '#EEEBE4';
    g.fillRect(a.x - 1, a.y - 1, 2, 2);
  }
  g.globalAlpha = 1;
  for (const l of labels) l.style.opacity = '0';
  markEl.style.transition = 'none'; warmEl.style.transition = 'none';
  setPhase(T.still, world.st);
  document.body.dataset.ready = '1';
}

// ---------------------------------------------------------------- Three.js renderer
function buildGL(THREE, L, world) {
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

  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(30, L.W / L.H, 4, L.D0 * 4);
  cam.matrixAutoUpdate = true;

  // field (draw call 1): one triangle mesh, painted in order NOW, 2023, 2021. Upper planes are honeycomb
  // grates: each cell has a dark ground-coloured fill that hides what is below it, so the stack reads in
  // depth; the gaps between cells let the lower planes show through. Outlines are thin quads whose width
  // is s_k world units, i.e. exactly 1 CSS px once the planes register.
  const entries = [], pos = [], idx = [];
  const addPoly = (cx, cy, z, r) => {
    const v0 = pos.length / 3;
    pos.push(cx, cy, z);
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
  for (const k of [2, 1, 0]) {
    const s = L.s[k];
    for (const c of world.cells) {
      if (k === 2 ? !c.inView : c.ring > L.patch) continue;
      const fade = k === 2 ? Math.max(0.12, 1 - smooth(0.25 * L.maxD, L.maxD, c.d)) : 1; // upper planes: crisp grates
      const cx = (c.x - L.core.x) * s, cy = -(c.y - L.core.y) * s;
      const e = { k, c, r0: [0, 110, 230][k] + c.ring * 45, fade, f0: -1 }; // 2021 reveals first
      if (k < 2) e.f0 = addPoly(cx, cy, L.z[k] - 0.6, L.R * 0.97 * s);
      e.v0 = addRing(cx, cy, L.z[k], L.R * 0.97 * s, (c.ring === 0 ? 2.0 : k < 2 ? 1.25 : 1.0) * s);
      entries.push(e);
    }
  }
  const spV0 = pos.length / 3;
  pos.push(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
  idx.push(spV0, spV0 + 1, spV0 + 2, spV0 + 2, spV0 + 1, spV0 + 3);
  const goldEntry = { gold: true, f0: -1 };
  goldEntry.v0 = addRing(0, 0, 0, L.R * 0.825, 1.5);
  entries.push(goldEntry);
  const nV = pos.length / 3;
  const fGeo = new THREE.BufferGeometry();
  const fPos = new Float32Array(pos);
  const fPosAttr = new THREE.BufferAttribute(fPos, 3); fPosAttr.setUsage(THREE.DynamicDrawUsage);
  fGeo.setAttribute('position', fPosAttr);
  fGeo.setIndex(idx);
  const fCol = new Float32Array(nV * 4);
  const fColAttr = new THREE.BufferAttribute(fCol, 4); fColAttr.setUsage(THREE.DynamicDrawUsage);
  fGeo.setAttribute('color', fColAttr);
  // painter's order inside the mesh; depth is still written so the agents below an upper cell are hidden
  const lineMat = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthTest: true, depthFunc: THREE.AlwaysDepth, depthWrite: true, side: THREE.DoubleSide });
  const field = new THREE.Mesh(fGeo, lineMat); field.frustumCulled = false; field.renderOrder = 0;
  scene.add(field);

  // agents: trails (draw call 2) and heads (draw call 3)
  const N = world.agents.length;
  const tPos = new Float32Array(N * 6), tCol = new Float32Array(N * 8);
  const tGeo = new THREE.BufferGeometry();
  const tPosA = new THREE.BufferAttribute(tPos, 3).setUsage(THREE.DynamicDrawUsage);
  const tColA = new THREE.BufferAttribute(tCol, 4).setUsage(THREE.DynamicDrawUsage);
  tGeo.setAttribute('position', tPosA); tGeo.setAttribute('color', tColA);
  const trailMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, depthTest: true, depthWrite: false });
  const trails = new THREE.LineSegments(tGeo, trailMat);
  trails.frustumCulled = false; trails.renderOrder = 1; scene.add(trails);

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
  const heads = new THREE.Points(hGeo, headMat); heads.frustumCulled = false; heads.renderOrder = 2; scene.add(heads);

  const v3 = new THREE.Vector3(), fwd = new THREE.Vector3();
  const labelState = labels.map(() => ({ o: -1, x: 0, y: 0 }));

  function camAt(t) {
    const C = Object.assign({}, L.phone ? CAM.phone : CAM.desktop);
    if (TUNE) { const dt0 = C.tilt0 - C.tilt1, da = C.az0 - C.az1, dd = C.d1 - C.d0; C.tilt0 = TUNE[0]; C.tilt1 = TUNE[0] - dt0; C.az0 = TUNE[1]; C.az1 = TUNE[1] - da; C.d0 = TUNE[2]; C.d1 = TUNE[2] + dd; }
    const h = smooth(0, T.settle0, t);
    const e = easeInOut(clamp01((t - T.settle0) / (T.settle1 - T.settle0)));
    return {
      tilt: lerp(lerp(C.tilt0, C.tilt1, h), 0, e) * DEG,
      az: lerp(lerp(C.az0, C.az1, h), C.az1 - 6, e) * DEG,
      dist: L.D0 * lerp(lerp(C.d0, C.d1, h), 1, e),
      qz: L.z[1] * C.center * (1 - e), // look at the middle of the stack, then at the core
    };
  }
  const wx = (x, z) => (x - L.core.x) * ((L.D0 - z) / L.D0);
  const wy = (y, z) => -(y - L.core.y) * ((L.D0 - z) / L.D0);

  function render(t) {
    const st = world.st;
    const markOn = st.resolved ? smooth(st.resolveT, st.resolveT + T.fade, t) : 0;
    // camera with a lens shift so the core sits at its layout position; dolly zoom keeps f = distance
    const c = camAt(t);
    cam.position.set(c.dist * Math.sin(c.tilt) * Math.cos(c.az), c.dist * Math.sin(c.tilt) * Math.sin(c.az), c.qz + c.dist * Math.cos(c.tilt));
    cam.up.set(0, 1, 0); cam.lookAt(0, 0, c.qz); cam.updateMatrixWorld(true);
    const n = 4, k = n / c.dist;
    cam.projectionMatrix.makePerspective(-L.core.x * k, (L.W - L.core.x) * k, L.core.y * k, -(L.H - L.core.y) * k, n, c.dist * 4);
    cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert();
    cam.getWorldDirection(fwd);

    // field colours
    const sep = 1 - smooth(T.settle0 + 500, T.settle1, t);
    const pastA = 1 - smooth(T.settle1, T.settle1 + 380, t);
    const fillA = 0.9 * (1 - smooth(T.settle0 + 300, T.settle1 - 100, t));
    const nb = smooth(T.nb0, T.resolve, t);
    const mark = 1 - smooth(T.labelsOut0 + 300, T.settle1 - 150, t);
    const coreA = Math.max(st.charge, smooth(T.consensusEnd, T.resolve, t)) * (1 - markOn);
    for (const e of entries) {
      let r, g, b, a;
      if (e.gold) { [r, g, b] = GOLD; a = coreA; }
      else {
        const cc = e.c, kk = e.k;
        const reveal = smooth(e.r0, e.r0 + 300, t);
        const planeA = kk < 2 ? pastA : 1;
        a = reveal * e.fade * planeA;
        let mh = kk === 0 ? 0.85 * sep : kk === 1 ? 0.6 * sep : 0;
        let cm = 0;
        if (cc.ring === 0) { cm = mark * reveal; a = Math.max(a, cm * planeA); }
        const lit = cc.ping[kk];
        if (lit > 0) { mh = Math.max(mh, lit * 0.9); a = Math.max(a, lit * 0.85 * reveal * planeA); }
        if (kk === 2 && cc.ring <= 1) { mh = Math.max(mh, nb); a = Math.max(a, nb) * (1 - markOn); }
        r = lerp(FAINT[0], HIVE[0], mh); g = lerp(FAINT[1], HIVE[1], mh); b = lerp(FAINT[2], HIVE[2], mh);
        if (cm > 0) { r = lerp(r, MUTED[0], cm); g = lerp(g, MUTED[1], cm); b = lerp(b, MUTED[2], cm); }
      }
      let o = e.v0 * 4;
      for (let i = 0; i < 12; i++, o += 4) { fCol[o] = r; fCol[o + 1] = g; fCol[o + 2] = b; fCol[o + 3] = a; }
      if (e.f0 >= 0) {
        const fa = fillA * e.fade * smooth(e.r0, e.r0 + 300, t);
        o = e.f0 * 4;
        for (let i = 0; i < 7; i++, o += 4) { fCol[o] = 0.0431; fCol[o + 1] = 0.0431; fCol[o + 2] = 0.051; fCol[o + 3] = fa; }
      }
    }
    {
      const spA = 0.8 * smooth(T.labelsIn, T.labelsIn + 500, t) * (1 - smooth(T.labelsOut0, T.settle1 - 300, t));
      const px = -Math.sin(c.az) * 0.6, py = Math.cos(c.az) * 0.6, zt = L.z[0];
      fPos.set([px, py, 0, -px, -py, 0, px, py, zt, -px, -py, zt], spV0 * 3);
      fPosAttr.needsUpdate = true;
      for (let i = 0; i < 4; i++) { const o = (spV0 + i) * 4; fCol[o] = MUTED[0]; fCol[o + 1] = MUTED[1]; fCol[o + 2] = MUTED[2]; fCol[o + 3] = spA * (i < 2 ? 0.55 : 1); }
    }
    fColAttr.needsUpdate = true;
    // agents are hidden under upper cells while the planes hang apart, then everyone is on one field
    const occl = t < T.settle0 + 650;
    trailMat.depthTest = occl; headMat.depthTest = occl;

    // agents
    const dim = st.resolved ? lerp(1, 0.55, smooth(st.resolveT, st.resolveT + 900, t)) : 1;
    const ag = world.agents;
    for (let i = 0; i < N; i++) {
      const a = ag[i];
      const on = a.alive && t >= a.delay && a.hc >= 2;
      if (!on) { tCol[i * 8 + 3] = 0; tCol[i * 8 + 7] = 0; hCol[i * 4 + 3] = 0; continue; }
      const wake = smooth(a.delay, a.delay + 300, t), scout = a.mode === 'travel';
      const col = scout ? MUTED : TEXT;
      const hx = wx(a.x, a.z), hy = wy(a.y, a.z), hz = a.z;
      const o = (a.hi % a.hc) * 3, ox = a.hist[o], oy = a.hist[o + 1], oz = a.hist[o + 2];
      tPos[i * 6] = wx(ox, oz); tPos[i * 6 + 1] = wy(oy, oz); tPos[i * 6 + 2] = oz;
      tPos[i * 6 + 3] = hx; tPos[i * 6 + 4] = hy; tPos[i * 6 + 5] = hz;
      tCol[i * 8] = col[0]; tCol[i * 8 + 1] = col[1]; tCol[i * 8 + 2] = col[2]; tCol[i * 8 + 3] = 0;
      tCol[i * 8 + 4] = col[0]; tCol[i * 8 + 5] = col[1]; tCol[i * 8 + 6] = col[2]; tCol[i * 8 + 7] = (scout ? 0.34 : 0.55) * wake * (scout ? dim : 1);
      hPos[i * 3] = hx; hPos[i * 3 + 1] = hy; hPos[i * 3 + 2] = hz;
      hCol[i * 4] = col[0]; hCol[i * 4 + 1] = col[1]; hCol[i * 4 + 2] = col[2]; hCol[i * 4 + 3] = (scout ? 0.82 * dim : 1) * wake;
      v3.set(hx - cam.position.x, hy - cam.position.y, hz - cam.position.z);
      const depth = Math.max(1, v3.dot(fwd));
      hSize[i] = 2 * Math.min(2.2, Math.max(0.85, c.dist / depth));
    }
    tPosA.needsUpdate = tColA.needsUpdate = hPosA.needsUpdate = hColA.needsUpdate = hSizeA.needsUpdate = true;

    renderer.render(scene, cam);

    // cycle labels ride the centre cell of their plane and fade as the planes lock
    for (let kk = 0; kk < 3; kk++) {
      const el = labels[kk], ls = labelState[kk];
      const op = smooth(T.labelsIn + 150 * kk, T.labelsIn + 150 * kk + 420, t) * (1 - smooth(T.labelsOut0, T.labelsOut1, t));
      if (op <= 0.001) { if (ls.o !== 0) { el.style.opacity = '0'; ls.o = 0; } continue; }
      v3.set(0, 0, L.z[kk]).project(cam);
      const sx = (v3.x + 1) * 0.5 * L.W, sy = (1 - v3.y) * 0.5 * L.H;
      v3.set(L.P * L.s[kk], 0, L.z[kk]).project(cam);
      const pp = Math.hypot((v3.x + 1) * 0.5 * L.W - sx, (1 - v3.y) * 0.5 * L.H - sy);
      el.style.opacity = op.toFixed(3);
      if (L.phone) el.style.transform = `translate(${sx.toFixed(1)}px, ${(sy + pp * 0.62).toFixed(1)}px) translate(-50%, 0)`;
      else el.style.transform = `translate(${(sx + pp * 0.62).toFixed(1)}px, ${(sy - 6).toFixed(1)}px)`;
      ls.o = op;
    }
    setPhase(t, st);
  }

  function dispose() {
    fGeo.dispose(); tGeo.dispose(); hGeo.dispose(); lineMat.dispose(); headMat.dispose(); trailMat.dispose();
    renderer.dispose(); el.remove();
  }
  return { render, dispose, renderer };
}

// ---------------------------------------------------------------- main
async function main() {
  await Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), sleep(1600)]);
  await nextFrame();
  let L = measure();
  placeDom(L);
  let world = makeWorld(L);

  if (M.reduce) { world.runTo(T.still); drawStill(L, world); return; }

  // first paint is done: now load the 3D
  let THREE = null;
  if (!FORCE_2D) {
    try { THREE = await Promise.race([import('three'), sleep(7000).then(() => null)]); } catch (e) { THREE = null; }
  }
  let gl = THREE ? buildGL(THREE, L, world) : null;
  if (!gl) { world.runTo(T.still); drawStill(L, world); return; }

  if (FIXED_T !== null) {
    world.runTo(FIXED_T);
    gl.render(FIXED_T);
    markEl.style.transition = 'none';
    document.body.dataset.ready = '1';
    return;
  }

  let clock = 0, tSim = 0, last = null, raf = 0, running = false, lastDraw = 0;
  let visible = true;
  const frame = (now) => {
    raf = 0;
    if (!running) return;
    const dt = last === null ? STEP : Math.min(120, now - last);
    last = now;
    clock += dt;
    let n = 0;
    while (tSim + STEP <= clock && n < 30) { world.step(tSim, STEP); tSim += STEP; n++; }
    if (n === 30) clock = tSim; // fell behind: slow the clock rather than skip the story
    const settled = tSim > T.still + 400;
    if (!settled || now - lastDraw > 32) { gl.render(tSim); lastDraw = now; }
    raf = requestAnimationFrame(frame);
  };
  const update = () => {
    const should = visible && !document.hidden && !M.paused;
    if (should && !running) { running = true; last = null; if (!raf) raf = requestAnimationFrame(frame); }
    else if (!should && running) { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }
  };
  gl.render(0);
  document.body.dataset.ready = '1';
  new IntersectionObserver((es) => { visible = es[0].isIntersecting; update(); }, { threshold: 0 }).observe(hero);
  document.addEventListener('visibilitychange', update);
  M.on(update);
  update();

  // resize: rebuild and land on the settled frame (no replay)
  let rt = 0, lastW = L.W, lastH = L.H;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      const r = stage.getBoundingClientRect();
      if (Math.abs(r.width - lastW) < 2 && Math.abs(r.height - lastH) < 90) return;
      lastW = r.width; lastH = r.height;
      gl.dispose();
      L = measure(); placeDom(L); world = makeWorld(L); world.runTo(T.still);
      clock = tSim = T.still;
      gl = buildGL(THREE, L, world);
      if (!gl) { drawStill(L, world); running = false; return; }
      gl.render(tSim);
    }, 220);
  });
}

main().catch((e) => { console.error(e); document.body.dataset.ready = '1'; });
