/* Swarm A, Core Glow, hero concept h1 "Rising Routes".
   The same honeycomb, hexagonal agent nodes and lit edges as the base hero, seen in true 3D from a low camera angle
   (Three.js r160, hero3d.js). Agents scan, commit and route to the core; every edge a committed agent crosses raises
   the two cells beside it, so the cells along the routes rise as thin hex columns drawn as outlines in kit greys and
   the swarm's attention becomes a skyline whose ridges converge on one tall column at the core. When consensus forms
   the core column lights gold, the camera cranes to exactly top-down, the columns sink back flat, and the official
   swarm-mark.svg lands on the core with its warm light: the same settled frame as the base hero, which this file then
   hands back to the 2D field canvas (so the settled frame and the reduced-motion still stay pixel-identical to base).
   Everything settles by about 4.4s and the loop stops.

   Fallback: without WebGL, without the Three.js module (blocked CDN, 1.8s timeout), on low-memory or low-core devices,
   with Save-Data, or with ?flat=1, the base 2D hero runs unchanged. ?reduce=1 shows the settled still and never loads
   Three.js. ?t=<ms> freezes a frame and window.__heroSeek(ms) steps it for frame-accurate captures.
   No text is drawn on canvas. */
(() => {
  'use strict';
  const SL = window.SwarmLattice;
  const S = window.SWARM || { reduce: false, freeze: null };
  const hero = document.getElementById('top');
  const fc = document.getElementById('hero-field');
  const ac = document.getElementById('hero-agents');
  const mark = document.getElementById('hero-mark');
  const anchor = document.getElementById('core-anchor');
  const card = document.getElementById('scout-card');
  if (!SL || !hero || !fc || !ac || !fc.getContext) return;
  const fx = fc.getContext('2d'), ax = ac.getContext('2d');
  if (!fx || !ax) return;
  const art = fc.parentNode;
  const Q = new URLSearchParams(location.search);
  const { COL, clamp01, sm, inOut, outCubic, rng, hexPath, lattice, sim, ekey, drawEdges, drawAgents, drawField } = SL;

  const T = { ringMs: 20, wake: 120, commit0: 980, commit1: 1400, arrive: 2320, resolveMin: 2200, resolveMax: 2780, markIn: 380, glowIn: 1000, tilt: 2350 };
  /* Rising Routes timing (ms after consensus resolves) and shape. Heights are in cell radii R, distances in pitches. */
  const C3 = {
    crane0: 60, crane: 1100,          // the crane to top-down
    sink0: 300, sink1: 1050,          // the skyline sinks flat
    core0: 420, core1: 1150,          // the core column sinks last
    mark: 960,                        // the official mark lands (the 2D hero lands it at 0)
    hand: 1450, fadeGL: 240,          // hand back to the 2D field, then the WebGL canvas fades and is released
    resolveMax: 2450, lift: 0.07,     // lift: the core sits this much of the screen lower until the crane
    fov: 34, phi0: 19, phi1: 25, yaw0: -20, yaw1: -8, dk0: 0.88, dk1: 0.94, drift: 2500,  // the low camera, drifting
    hMax: 3.0, hCore: 6.0, lam: 6.5, t0: 4, t1: 22, rise: 150
  };
  const DT = 1000 / 60;
  const MASK = 0.13;
  const D2R = Math.PI / 180;
  // the scout card follows the hero's three phases: scan the field, analyze while consensus forms, report once it lands
  const STATES = [
    ['SCANNING', 'Scanning', 'the market', 'Scanning'],
    ['ANALYZING', 'Analyzing', 'a setup', 'Analyzing'],
    ['REPORTING', 'Reporting', 'to the watch list', 'Reporting']
  ];

  let W, Hc, DPR, phone, tablet, R, core, maxD, RAD, TH0, PD, L, V, walk, dist, parent, hops, innerNext, glowEl, tintCv, lastG = -1, lastTilt = '';
  let rects, floorY = 1e9, Sx, rnd, resolved, resolveT, absorbed, routed, flashT, pinged, simT, END, fieldKey, phaseIdx, lastDot;
  // 3D state
  let G3 = null, mode3 = false, B3 = null, F = 1000, traffic, hgt, hd, hcap, edgeCells, coreI = 0, glShown = true, glGone = false;

  /* ---------- the copy, in screen space ---------- */
  function measure() {
    const hr = hero.getBoundingClientRect();
    rects = [];
    const add = (r, m) => { if (r.width && r.height) rects.push([r.left - hr.left - m, r.top - hr.top - m, r.right - hr.left + m, r.bottom - hr.top + m]); };
    hero.querySelectorAll('[data-avoid]').forEach(el => {
      if (el.offsetParent === null) return;
      if (el.dataset.avoid === 'lines') { const rg = document.createRange(); rg.selectNodeContents(el); for (const r of rg.getClientRects()) add(r, phone ? 4 : 8); }
      else add(el.getBoundingClientRect(), 6);
    });
    if (window.scrollY < 10) document.querySelectorAll('.nav-logo, .nav .btn-line').forEach(el => add(el.getBoundingClientRect(), 6));
    // the members rail closes the first screen on wide layouts: agents stay above its line
    const rail = hero.querySelector('.hero-rail .hr-in');
    floorY = rail && rail.offsetParent !== null ? rail.getBoundingClientRect().top - hr.top : 1e9;
  }
  // 1 in the open, MASK behind the copy, with a soft 22px edge; everything fades out at the bottom of the art
  function maskAt(x, y) {
    let d = 1e9;
    for (const r of rects) {
      const dx = Math.max(r[0] - x, 0, x - r[2]), dy = Math.max(r[1] - y, 0, y - r[3]);
      const dd = dx > 0 || dy > 0 ? Math.hypot(dx, dy) : 0;
      if (dd < d) { d = dd; if (!d) break; }
    }
    return (MASK + (1 - MASK) * sm(0, 22, d)) * (1 - sm(Hc - 150, Hc - 8, y)) * (floorY < 1e8 ? 1 - sm(floorY - 64, floorY - 6, y) : 1);
  }

  /* ---------- the 2D opening camera: a receding plane that straightens out (fallback only) ---------- */
  function projAt(t) {
    if (mode3) return null;
    const k = 1 - inOut(t / T.tilt);
    if (k <= 0.0005) return null;
    const th = TH0 * k, c = Math.cos(th), s = Math.sin(th), z0 = 1 + 0.05 * k;
    return (x, y) => { const dy = y - core.y, f = PD / (PD - dy * s) * z0; return [core.x + (x - core.x) * f, core.y + dy * c * f, f]; };
  }
  // the same camera as a CSS transform, so the compositor tilts the canvases instead of re-drawing every cell
  function tiltCSS(t) {
    if (mode3) return '';
    const k = 1 - inOut(t / T.tilt);
    if (k <= 0.0005) return '';
    return `scale(${(1 + 0.05 * k).toFixed(4)}) perspective(${PD}px) rotateX(${(TH0 * k).toFixed(5)}rad)`;
  }

  /* ---------- the 3D camera ----------
     World units are CSS px of the settled layout, x right, y up (screen-up), z out of the field, origin on the core.
     The camera orbits the core from a low angle and cranes to exactly top-down at distance F; the projection is
     off-axis with its centre on the core's screen position, so the core never moves on screen and the top-down
     view maps the field 1:1 onto the 2D layout. */
  function camAt(t) {
    const u = inOut(Math.min(t, C3.drift) / C3.drift);
    const cr = resolved ? inOut((t - resolveT - C3.crane0) / C3.crane) : 0;
    let phi = C3.phi0 + (C3.phi1 - C3.phi0) * u, yaw = C3.yaw0 + (C3.yaw1 - C3.yaw0) * u, dk = C3.dk0 + (C3.dk1 - C3.dk0) * u;
    const c = cr;
    phi += (90 - phi) * c; yaw *= 1 - c; dk += (1 - dk) * c;
    phi *= D2R; yaw *= D2R;
    const d = dk * F, cp = Math.cos(phi), sp = Math.sin(phi), sy = Math.sin(yaw), cy = Math.cos(yaw);
    const z = [-sy * cp, -cy * cp, sp], x = [cy, -sy, 0], y = [sp * sy, sp * cy, cp];
    return { x, y, z, d, eye: [z[0] * d, z[1] * d, z[2] * d], py: core.y + C3.lift * Hc * (1 - c) };
  }
  function viewOf(c) { const { x, y, z, d } = c; return [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, 0, 0, -d, 1]; }
  function projOf(c) {
    const n = 20, f = 12 * F, P = new Array(16).fill(0);
    P[0] = 2 * F / W; P[5] = 2 * F / Hc; P[8] = (W - 2 * core.x) / W; P[9] = (2 * c.py - Hc) / Hc;
    P[10] = -(f + n) / (f - n); P[11] = -1; P[14] = -2 * f * n / (f - n);
    return P;
  }
  // a field point (in settled screen px) as seen by the camera at time t
  function projector(t) {
    const c = camAt(t);
    return (sx, sy, wz = 0) => {
      const px = sx - core.x - c.eye[0], py = core.y - sy - c.eye[1], pz = wz - c.eye[2];
      const xc = c.x[0] * px + c.x[1] * py, yc = c.y[0] * px + c.y[1] * py + c.y[2] * pz, zc = c.z[0] * px + c.z[1] * py + c.z[2] * pz;
      if (zc > -1) return null;
      return [core.x + F * xc / -zc, c.py - F * yc / -zc, F / -zc];
    };
  }
  // where a screen pixel's ray meets the field, in settled screen px (clamped far away)
  function groundAt(c, sx, sy, far) {
    const a = (sx - core.x) / F, b = -(sy - c.py) / F;
    const dir = [c.x[0] * a + c.y[0] * b - c.z[0], c.x[1] * a + c.y[1] * b - c.z[1], c.y[2] * b - c.z[2]];
    let s = dir[2] < -1e-4 ? -c.eye[2] / dir[2] : 1e9;
    let gx = c.eye[0] + dir[0] * s, gy = c.eye[1] + dir[1] * s;
    const r = Math.hypot(gx, gy);
    if (r > far) { const k = far / r; gx *= k; gy *= k; }
    return [gx + core.x, core.y - gy];
  }

  /* ---------- lattice, routes and agents ---------- */
  function setup() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = hero.clientWidth;
    const vh = window.innerHeight || 900;
    Hc = Math.round(Math.min(hero.clientHeight, Math.max(vh, 640) + 120));
    phone = W <= 640; tablet = !phone && W < 1100;
    if (!glowEl) {
      glowEl = document.createElement('div'); glowEl.className = 'hero-glow';
      tintCv = document.createElement('canvas'); tintCv.className = 'hero-tint';
      (G3 ? G3.canvas : fc).after(glowEl); glowEl.after(tintCv);
    }
    for (const c of [fc, ac, tintCv]) { c.width = Math.round(W * DPR); c.height = Math.round(Hc * DPR); c.style.width = W + 'px'; c.style.height = Hc + 'px'; }
    R = parseFloat(getComputedStyle(hero).getPropertyValue('--R')) || (phone ? 19 : 28);   // the CSS lays the copy out around the same cell size
    const hr = hero.getBoundingClientRect(), ar = anchor.getBoundingClientRect();
    core = { x: Math.round(W / 2), y: Math.round(ar.top - hr.top) };
    const Sz = 7.5 * R;
    Object.assign(mark.style, { width: Sz + 'px', height: Sz + 'px', left: (core.x - Sz / 2) + 'px', top: (core.y - Sz / 2) + 'px' });
    maxD = Math.hypot(Math.max(core.x, W - core.x), Math.max(core.y, Hc - core.y));
    RAD = phone ? 400 : (tablet ? 500 : 640);
    TH0 = (phone ? 30 : 40) * Math.PI / 180; PD = phone ? 820 : 1250;
    F = Hc / (2 * Math.tan(C3.fov * D2R / 2));
    measure();
    for (const c of [fc, ac]) c.style.transformOrigin = `${core.x}px ${core.y}px`;
    // the core's warm light (the one glow the kit allows): a static layer the compositor fades and opens
    const sx = phone ? 1.12 : 1.5, st = [[0, 0.36], [8, 0.24], [20, 0.14], [36, 0.075], [56, 0.034], [78, 0.012], [100, 0]];
    Object.assign(glowEl.style, { width: W + 'px', height: Hc + 'px', transformOrigin: `${core.x}px ${core.y}px`,
      background: `radial-gradient(ellipse ${Math.round(RAD * sx)}px ${RAD}px at ${core.x}px ${core.y}px, ${st.map(([o, a]) => `rgba(245,197,66,${a}) ${o}%`).join(', ')})` });
    tintCv.style.transformOrigin = `${core.x}px ${core.y}px`;
    lastG = -1; lastTilt = '-';
    resolved = false; resolveT = Infinity;
    const P = 1.95 * R;
    let box = { x0: -0.32 * W, y0: -7 * P, x1: 1.32 * W, y1: Hc + 2 * P };
    if (mode3) {
      // the low camera sees much more field than the settled layout: cover its footprint too
      const far = 2.4 * F;
      for (const t of [0, C3.drift]) {
        const c = camAt(t);
        for (let k = 0; k <= 16; k++) {
          const u = k / 16;
          for (const [px, py] of [[u * W, 0], [u * W, Hc], [0, u * Hc], [W, u * Hc]]) {
            const g = groundAt(c, px, py, far);
            box.x0 = Math.min(box.x0, g[0] - 2 * P); box.x1 = Math.max(box.x1, g[0] + 2 * P);
            box.y0 = Math.min(box.y0, g[1] - 2 * P); box.y1 = Math.max(box.y1, g[1] + 2 * P);
          }
        }
      }
    }
    L = lattice({ R, ox: core.x, oy: core.y, ...box });
    V = L.V;
    rnd = rng(11);
    { const g = tintCv.getContext('2d'), k = RAD * 0.5;
      g.setTransform(DPR, 0, 0, DPR, 0, 0); g.clearRect(0, 0, W, Hc);
      drawField(g, L, c => c.ring >= 2 ? 0.26 * Math.exp(-(c.d * c.d) / (k * k)) * fieldAlpha(c, 1e9) : 0, { color: COL.gold }); }

    // where agents may walk, and what crossing the copy costs (routes go around it). The 3D hero plans on what
    // the low camera shows, so routes avoid the copy as it is seen while they form.
    const pr = mode3 ? projector(1500) : null;
    const SP = mode3 ? V.map(v => pr(v.x, v.y)) : V.map(v => [v.x, v.y]);
    walk = V.map((v, i) => {
      if (v.core || v.perim || v.ring < 2) return false;
      const p = SP[i];
      if (!p) return false;
      return p[0] > -0.14 * W && p[0] < 1.14 * W && p[1] > -4 * P && p[1] < Math.min(Hc + P, floorY - 8);
    });
    const cost = V.map((v, i) => SP[i] && maskAt(SP[i][0], SP[i][1]) < 0.6 ? 2 : 1);
    dist = new Float64Array(V.length).fill(Infinity);
    parent = new Int32Array(V.length).fill(-1);
    const heap = [];
    const push = (d, i) => { heap.push([d, i]); let k = heap.length - 1; while (k) { const p = (k - 1) >> 1; if (heap[p][0] <= heap[k][0]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; } };
    const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let k = 0; for (;;) { const l = 2 * k + 1, r = l + 1; let m = k; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m; } } return top; };
    V.forEach((v, i) => { if (v.perim) { dist[i] = 0; push(0, i); } });
    while (heap.length) {
      const [d, i] = pop(); if (d > dist[i]) continue;
      for (const j of V[i].nb) { if (!walk[j]) continue; const nd = d + cost[i] + cost[j]; if (nd < dist[j]) { dist[j] = nd; push(nd, j); } }
    }
    // among equally short ways in, prefer the one closest to the six arteries leaving the cluster, so routes merge
    const art6 = V.filter(v => v.perim && v.cells.filter(c => c.ring === 1).length === 2).map(v => Math.atan2(v.y - core.y, v.x - core.x));
    const artDev = (x, y) => { const a = Math.atan2(y - core.y, x - core.x); let m = 9; for (const b of art6) { let d = Math.abs(a - b); if (d > Math.PI) d = 2 * Math.PI - d; m = Math.min(m, d); } return m; };
    V.forEach((v, i) => {
      if (!walk[i] || dist[i] === Infinity) return;
      let best = -1, bs = 1e9;
      for (const j of v.nb) {
        if (dist[j] === Infinity || Math.abs(dist[j] + cost[i] + cost[j] - dist[i]) > 1e-6) continue;
        const s = artDev(V[j].x, V[j].y) * (0.6 + 0.4 * Math.min(1, V[j].d / (6 * P))) + V[j].d * 1e-5;
        if (s < bs) { bs = s; best = j; }
      }
      parent[i] = best;
    });
    hops = new Int32Array(V.length).fill(-1);
    const hopOf = i => { let n = 0, k = i; const seen = []; while (k >= 0 && !V[k].perim && hops[k] < 0 && n < 400) { seen.push(k); k = parent[k]; n++; } let base = k < 0 ? 9999 : (V[k].perim ? 0 : hops[k]); for (let m = seen.length - 1; m >= 0; m--) hops[seen[m]] = ++base; return hops[i]; };
    V.forEach((v, i) => { if (walk[i]) hopOf(i); });
    // inside the cluster: from the outer corners to the core's own corners
    innerNext = new Int32Array(V.length).fill(-1);
    const dIn = new Int32Array(V.length).fill(-1), q = [];
    V.forEach((v, i) => { if (v.core) { dIn[i] = 0; q.push(i); } });
    for (let h = 0; h < q.length; h++) for (const j of V[q[h]].nb) { if (dIn[j] >= 0 || !(V[j].perim || V[j].core)) continue; dIn[j] = dIn[q[h]] + 1; innerNext[j] = q[h]; q.push(j); }

    // the swarm: spread across the whole first screen, thinning toward the edges and behind the copy
    const N = phone ? 86 : (tablet ? 136 : 196);
    const pw = mode3 ? projector(700) : null;
    const SW = mode3 ? V.map(v => pw(v.x, v.y)) : SP;
    const c7 = mode3 ? camAt(700) : null, cs = mode3 ? [core.x, c7.py] : null, sc0 = mode3 ? c7.d / F : 1;
    const pool = [];
    V.forEach((v, i) => { const p = SW[i]; if (walk[i] && v.ring >= 3 && p && p[0] > 6 && p[0] < W - 6 && p[1] > 8 && p[1] < Math.min(Hc - 40, floorY - 40)) pool.push(i); });
    Sx = sim(L, 23, 600);
    const used = new Set();
    for (let n = 0; n < N && pool.length; n++) {
      let id = pool[0];
      for (let tries = 0; tries < 60; tries++) {
        id = pool[(rnd() * pool.length) | 0];
        if (used.has(id)) continue;
        const v = V[id], p = SW[id], dd = mode3 ? Math.hypot(p[0] - cs[0], p[1] - cs[1]) : v.d;
        // in 3D, far corners crowd the top of the screen: weight by on-screen area so the swarm spreads evenly
        const dens = mode3 ? Math.min(1, Math.pow(p[2] * sc0, 2)) : 1;
        const w = (0.32 + 0.68 * Math.exp(-dd / (0.55 * maxD))) * (maskAt(p[0], p[1]) < 0.6 ? 0.35 : 1) * dens;
        if (rnd() < w) break;
      }
      used.add(id);
      const v = V[id];
      const kind = rnd() < 0.7 ? 1 : 0;
      const a = Sx.add(id, { kind, born: T.wake + v.ring * T.ringMs + rnd() * 260, ct: T.commit0 + rnd() * (T.commit1 - T.commit0), jit: rnd() * 260 });
      const nx = v.nb.filter(j => walk[j]);
      if (nx.length) Sx.hop(a, nx[(rnd() * nx.length) | 0], a.born + 40 + rnd() * 220, hopD());
    }
    pinged = []; absorbed = 0; routed = 0; flashT = -1e9;
    simT = 0; END = Infinity; fieldKey = ''; phaseIdx = -1; lastDot = -2;
    if (mode3) setup3();
  }
  const hopD = () => 175 + rnd() * 85;
  const pick = arr => arr[(rnd() * arr.length) | 0];

  /* ---------- the skyline: route traffic raises the cells beside each crossed edge ---------- */
  function setup3() {
    const n = L.cells.length, P = 1.95 * R;
    traffic = new Float32Array(n); hgt = new Float32Array(n); hd = new Float32Array(n); hcap = new Float32Array(n);
    edgeCells = new Map();
    L.cells.forEach((c, i) => { hcap[i] = C3.hMax * R * (0.25 + 0.75 * Math.exp(-c.d / (C3.lam * P))); });
    glShown = true; glGone = false;
    if (!G3) { B3 = null; return; }
    G3.canvas.style.opacity = '1'; G3.canvas.style.visibility = '';
    B3 = G3.build({ W, H: Hc, dpr: DPR, n, na: Sx.agents.length, ns: 900, nodeR: phone ? 2.6 : 3.3, nodeH: phone ? 2.2 : 2.8 });
    for (let i = 0; i < n; i++) {
      const c = L.cells[i], o = i * 4;
      B3.cellP[o] = c.x - core.x; B3.cellP[o + 1] = core.y - c.y; B3.cellP[o + 2] = R * (c.ring === 0 ? 0.825 : 0.97); B3.cellP[o + 3] = 0;
    }
    // the copy mask (R) and the field's bottom fade (G), sampled by the shaders in screen space
    const mw = Math.ceil(W / 4), mh = Math.ceil(Hc / 4), data = new Uint8Array(mw * mh * 4);
    for (let j = 0; j < mh; j++) {
      const y = Hc - (j + 0.5) * Hc / mh, g = 1 - sm(Hc - 170, Hc - 6, y);
      for (let i = 0; i < mw; i++) { const o = (j * mw + i) * 4; data[o] = Math.round(255 * maskAt((i + 0.5) * W / mw, y)); data[o + 1] = Math.round(255 * g); data[o + 3] = 255; }
    }
    G3.setMask(data, mw, mh);
  }
  function cellsOf(a, b) {
    const k = ekey(a, b);
    let r = edgeCells.get(k);
    if (!r) { r = []; for (const c of V[a].cells) if (V[b].cells.includes(c)) r.push(c.i); edgeCells.set(k, r); }
    return r;
  }
  function addTraffic(a, b) { for (const i of cellsOf(a, b)) traffic[i] += 1; }
  // an edge sits on the roof of the taller of its two cells
  function edgeH(a, b) { let h = 0; for (const i of cellsOf(a, b)) if (hd[i] > h) h = hd[i]; return h; }
  function stepHeights(t) {
    const k = 1 - Math.exp(-DT / C3.rise), HC = C3.hCore * R, cells = L.cells;
    let top = 0;
    for (let i = 0; i < cells.length; i++) {
      const c = cells[i];
      let tg;
      if (c.ring === 0) { coreI = i; continue; }
      else {
        // a cell a route only brushed stays flat; the trunks, where routes merge, rise
        tg = traffic[i] > C3.t0 ? hcap[i] * Math.pow(sm(C3.t0, C3.t1, traffic[i]), 0.8) : 0;
        if (c.ring === 1 && c.lit > -1e8 && t >= c.lit) tg = Math.max(tg, 0.52 * HC);
      }
      hgt[i] += (tg - hgt[i]) * k;
      if (hgt[i] > top) top = hgt[i];
    }
    // the core column always stands clear of the skyline it gathers, and lights at full height
    const tc = resolved ? 1.08 * HC : Math.min(HC, Math.max(HC * (0.14 + 0.86 * charge()), 1.45 * top));
    hgt[coreI] += (tc - hgt[coreI]) * k;
  }

  function policy(a, at) {
    if (mode3 && a.prev >= 0 && (a.mode === 'route' || a.mode === 'inner')) addTraffic(a.prev, a.from);
    const v = V[a.from];
    if (a.mode === 'scan') {
      // sense one of the three cells that meet at this corner
      if (!resolved && rnd() < (at < 900 ? 0.5 : 0.34)) {
        let live = 0; for (const c of pinged) if (at - c.ping < 800) live++;
        if (live < (phone ? 7 : 16)) {
          const cs = v.cells.filter(c => c.ring >= 3 && at - c.ping > 800);
          if (cs.length) { const c = pick(cs); c.ping = at; pinged.push(c); if (pinged.length > 40) pinged.splice(0, pinged.length - 40); }
        }
      }
      if (a.kind === 1 && !resolved && at >= a.ct && hops[a.from] > 0 && hops[a.from] < 9999) {
        a.mode = 'route'; routed++;
        a.hd = Math.min(205, Math.max(68, (Math.max(180, T.arrive + a.jit - at)) / hops[a.from]));
        return policy(a, at);
      }
      if (resolved) { if (a.fadeT < 0) { a.fadeT = at; a.fadeD = 300; } return; }
      const minRing = at > T.commit0 ? 3 : 2;
      let opts = v.nb.filter(j => j !== a.prev && walk[j] && V[j].ring >= minRing);
      if (!opts.length) opts = v.nb.filter(j => walk[j] && V[j].ring >= 2);
      if (!opts.length) return;
      const bias = a.kind ? 0.62 * sm(350, T.commit0, at) : 0;
      if (bias && rnd() < bias) { const down = opts.filter(j => dist[j] < dist[a.from]); if (down.length) opts = down; }
      Sx.hop(a, pick(opts), at + 20 + rnd() * 140, hopD());
      return;
    }
    if (v.perim && a.mode === 'route') {
      for (const c of v.cells) if (c.ring === 1 && c.lit < -1e8) c.lit = at;
      if (resolved) { a.fadeT = at; a.fadeD = 140; return; }
      a.mode = 'inner';
    }
    if (a.mode === 'inner') {
      if (v.core) { a.dead = true; absorbed++; flashT = at; return; }
      const nx = innerNext[a.from];
      if (nx < 0) { a.dead = true; return; }
      Sx.hop(a, nx, at, 110);
      return;
    }
    const p = parent[a.from];
    if (p < 0) { a.mode = 'scan'; return; }
    Sx.hop(a, p, at, a.hd);
  }

  const markDelay = () => mode3 ? C3.mark : 0;
  function step(t) {
    Sx.advance(t, policy);
    const rMax = mode3 ? C3.resolveMax : T.resolveMax;
    if (!resolved && ((t >= T.resolveMin && routed > 0 && absorbed >= 0.6 * routed) || t >= rMax)) {
      resolved = true; resolveT = t; END = t + (mode3 ? C3.mark + T.glowIn + 100 : 1500);
      for (const c of L.rings[1] || []) if (c.lit < -1e8) c.lit = t;
      for (const a of Sx.agents) {
        if (a.dead || a.fadeT >= 0) continue;
        if (a.mode === 'scan') { a.fadeT = t + 90 + rnd() * 520; a.fadeD = 300; }
        else if (a.mode === 'route') { a.fadeT = t + 520 + rnd() * 260; a.fadeD = 220; }
      }
    }
    if (mode3) stepHeights(t);
  }
  const charge = () => Math.min(1, absorbed / Math.max(1, 0.6 * routed));
  const handAt = t => resolved ? outCubic((t - resolveT - markDelay()) / T.markIn) : 0;

  /* ---------- drawing ---------- */
  function glowAt(t) {
    const pre = 0.2 * charge() * sm(T.commit0, T.resolveMin, t);
    return Math.max(pre, resolved ? outCubic((t - resolveT - markDelay()) / T.glowIn) : 0);
  }
  function fieldAlpha(c, t) {
    if (c.ring <= 1) return 0;
    const reveal = sm(c.ring * T.ringMs, c.ring * T.ringMs + 320, t);
    return reveal * Math.max(0.16, 1 - sm(0.3 * maxD, 1.05 * maxD, c.d)) * (1 - sm(Hc - 170, Hc - 6, c.y));
  }
  function renderGlow(t) {
    const G = glowAt(t);
    if (Math.abs(G - lastG) > 0.002 || (G === 0) !== (lastG === 0)) {
      glowEl.style.opacity = G.toFixed(3); tintCv.style.opacity = G.toFixed(3);
      glowEl.style.transform = G < 1 ? `scale(${(0.5 + 0.5 * G).toFixed(4)})` : '';
      lastG = G;
    }
  }
  function renderField(t) {
    const tilt = tiltCSS(t);
    if (tilt !== lastTilt) { fc.style.transform = ac.style.transform = tilt; lastTilt = tilt; }
    const proj = null;
    const key = t < 40 * T.ringMs + 1150 ? 'f' + Math.round(t / 16) : 's';
    if (key === fieldKey) return;
    fieldKey = key;
    const g = fx;
    g.setTransform(DPR, 0, 0, DPR, 0, 0); g.clearRect(0, 0, W, Hc);
    drawField(g, L, c => fieldAlpha(c, t), { proj });
    // boot: a wave runs out from the core and draws the network before the agents wake
    if (t < 40 * T.ringMs + 1100) {
      drawField(g, L, c => {
        if (c.ring <= 1) return 0;
        const e = t - c.ring * T.ringMs;
        if (e < 0 || e > 1000) return 0;
        const env = e < 110 ? e / 110 : 1 - Math.pow((e - 110) / 890, 0.7);
        return env * 0.5 * Math.max(0.3, 1 - sm(0.3 * maxD, 1.05 * maxD, c.d)) * (1 - sm(Hc - 170, Hc - 6, c.y));
      }, { proj, color: COL.hive });
    }
  }

  function renderAgents(t, projM) {
    const g = ax, proj = null;
    g.setTransform(DPR, 0, 0, DPR, 0, 0); g.clearRect(0, 0, W, Hc);
    const mP = projM ? (x, y) => { const p = projM(x, y); return maskAt(p[0], p[1]); } : maskAt;
    const hand = handAt(t);
    // the signal: one ring wave runs out across the field as the mark lands
    if (resolved && t < resolveT + 1450) {
      drawField(g, L, c => {
        if (c.ring < 2) return 0;
        const e = t - (resolveT + 60 + c.ring * 30);
        if (e < 0) return 0;
        const env = e < 90 ? e / 90 : Math.max(0, 1 - (e - 90) / 520);
        return env * 0.5 * Math.max(0.25, 1 - c.ring / 28) * mP(c.x, c.y);
      }, { proj, color: COL.hive });
    }
    // sensing: a visited cell's outline brightens briefly
    if (pinged.length) {
      drawField(g, L, c => {
        const e = t - c.ping; if (e < 0 || e > 800) return 0;
        const env = e < 120 ? e / 120 : e < 280 ? 1 : 1 - (e - 280) / 520;
        return env * 0.85 * mP(c.x, c.y);
      }, { proj, color: COL.hive });
    }
    // routes: the edges agents cross
    drawEdges(g, Sx, t, { proj, alphaAt: mP, base: [0.44, 0.78], lw: phone ? 1.25 : 1.5 });
    // the cluster before the mark lands: neighbours light as agents reach their corners, the core charges
    if (hand < 1) {
      const ring1 = L.rings[1] || [];
      const rev1 = sm(T.ringMs, T.ringMs + 320, t);
      g.lineWidth = 1; g.strokeStyle = COL.faint; g.globalAlpha = rev1 * (1 - hand); g.beginPath();
      for (const c of ring1) if (c.lit < -1e8 || t < c.lit) proj ? SL.hexPathP(g, c.x, c.y, R * 0.97, proj) : hexPath(g, c.x, c.y, R * 0.97);
      g.stroke();
      g.lineWidth = 1.5; g.strokeStyle = COL.hive;
      for (const c of ring1) {
        if (c.lit < -1e8 || t < c.lit) continue;
        g.globalAlpha = sm(c.lit, c.lit + 220, t) * (1 - hand); g.beginPath();
        proj ? SL.hexPathP(g, c.x, c.y, R * 0.97, proj) : hexPath(g, c.x, c.y, R * 0.97); g.stroke();
      }
      const coreA = coreAt(t) * (1 - hand);
      if (coreA > 0.01) {
        g.globalAlpha = coreA; g.strokeStyle = COL.gold; g.lineWidth = 1.5; g.beginPath();
        proj ? SL.hexPathP(g, core.x, core.y, R * 0.825, proj) : hexPath(g, core.x, core.y, R * 0.825); g.stroke();
      }
      g.globalAlpha = 1;
    }
    // the agents: small hexagonal nodes, scouts muted, committed bright
    drawAgents(g, Sx, t, { proj, alphaAt: mP, r: phone ? 2.4 : 3, base: [0.92, 1] });
  }
  function coreAt(t) {
    const flash = Math.max(0, 1 - (t - flashT) / 220);
    const a = Math.min(1, sm(0, 260, t) * (0.34 + 0.56 * charge()) + 0.25 * flash);
    return mode3 && resolved ? Math.max(a, sm(resolveT, resolveT + 200, t)) : a;
  }
  function renderMark(t) {
    const hand = handAt(t);
    mark.style.opacity = hand ? hand.toFixed(3) : '0';
    mark.style.transform = hand < 1 ? `scale(${(0.93 + 0.07 * hand).toFixed(4)})` : '';
  }

  /* ---------- the 3D frame ---------- */
  const rgbOf = h => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];
  const C_GROUND = rgbOf('#0B0B0D'), C_FAINT = rgbOf(COL.faint), C_HIVE = rgbOf(COL.hive), C_MUTED = rgbOf(COL.muted), C_TEXT = rgbOf(COL.text), C_GOLD = rgbOf(COL.gold), C_ROOF = rgbOf('#0B0B0D');
  const mix3 = (a, b, k, out, o) => { out[o] = a[0] + (b[0] - a[0]) * k; out[o + 1] = a[1] + (b[1] - a[1]) * k; out[o + 2] = a[2] + (b[2] - a[2]) * k; };
  const tmpC = [0, 0, 0];
  function render3(t) {
    const B = B3, cells = L.cells, n = cells.length;
    const sink = resolved ? 1 - inOut((t - resolveT - C3.sink0) / (C3.sink1 - C3.sink0)) : 1;
    const sinkC = resolved ? 1 - inOut((t - resolveT - C3.core0) / (C3.core1 - C3.core0)) : 1;
    for (let i = 0; i < n; i++) hd[i] = hgt[i] * (cells[i].ring === 0 ? sinkC : sink);
    const hand = handAt(t), rev1 = sm(T.ringMs, T.ringMs + 320, t), HM = C3.hMax * R;
    const coreA = coreAt(t), gold = resolved ? sm(resolveT, resolveT + 260, t) : 0;
    const waveOn = resolved && t < resolveT + 1450, bootOn = t < 40 * T.ringMs + 1100;
    // column outlines return to the field's own grey ahead of the sink, so the frame before the mark lands is the
    // base composition: the field, the six lit neighbours and the gold core
    const tone = resolved ? 1 - sm(resolveT + C3.sink0, resolveT + C3.sink1 - 220, t) : 1;
    let nb = 0;
    for (let i = 0; i < n; i++) {
      const c = cells[i], o = i * 4, h = hd[i];
      B.cellP[o + 3] = h;
      const hn = h / HM, rise = sm(0, 0.2, hn) * tone;
      let baseA = 0, U = 0, w = 1, topS = 0, sideS = 0;
      if (c.ring >= 2) {
        const reveal = sm(c.ring * T.ringMs, c.ring * T.ringMs + 320, t), far = Math.max(0.16, 1 - sm(0.3 * maxD, 1.05 * maxD, c.d));
        baseA = reveal * far;
        if (bootOn) { const e = t - c.ring * T.ringMs; if (e >= 0 && e <= 1000) U = (e < 110 ? e / 110 : 1 - Math.pow((e - 110) / 890, 0.7)) * 0.5 * Math.max(0.3, far); }
        let ping = 0; const e = t - c.ping; if (e >= 0 && e <= 800) ping = (e < 120 ? e / 120 : e < 280 ? 1 : 1 - (e - 280) / 520) * 0.85;
        let wave = 0; if (waveOn) { const e2 = t - (resolveT + 60 + c.ring * 30); if (e2 >= 0) wave = (e2 < 90 ? e2 / 90 : Math.max(0, 1 - (e2 - 90) / 520)) * 0.5 * Math.max(0.25, 1 - c.ring / 28); }
        topS = Math.max(rise * 0.94, ping, wave);
        mix3(C_HIVE, C_MUTED, sm(0.35, 1.05, hn), tmpC, 0);
        B.cellTop[o] = tmpC[0]; B.cellTop[o + 1] = tmpC[1]; B.cellTop[o + 2] = tmpC[2];
        sideS = rise * 0.9;
        mix3(C_FAINT, tmpC, 0.74, B.cellSide, o);
      } else if (c.ring === 1) {
        const lit = c.lit > -1e8 && t >= c.lit ? sm(c.lit, c.lit + 220, t) : 0;
        baseA = rev1 * (1 - hand);
        U = lit * (1 - hand); w = lit > 0 ? 1.5 : 1;
        mix3(C_HIVE, C_MUTED, sm(0.35, 1.05, hn) * (1 - hand), B.cellTop, o);
        topS = rise * 0.94 * (1 - hand);
        mix3(C_FAINT, C_HIVE, 0.9, B.cellSide, o); sideS = rise * 0.9;
      } else {
        U = coreA * (1 - hand); w = 1.5;
        B.cellTop[o] = C_GOLD[0]; B.cellTop[o + 1] = C_GOLD[1]; B.cellTop[o + 2] = C_GOLD[2];
        B.cellSide[o] = C_GOLD[0]; B.cellSide[o + 1] = C_GOLD[1]; B.cellSide[o + 2] = C_GOLD[2];
        sideS = Math.max(coreA * 0.55, gold * 0.9);
      }
      B.cellTop[o + 3] = topS; B.cellSide[o + 3] = sideS;
      B.cellBase[o] = baseA; B.cellBase[o + 1] = w; B.cellBase[o + 2] = U; B.cellBase[o + 3] = sm(0.4, 2.4, h);
      // the column body hides what is behind it; its roof turns surface-grey as it rises, the core's turns gold
      const isCore = c.ring === 0;
      if (h > 0.35 || (isCore && gold > 0.004)) {
        const b = nb * 4;
        B.bodyP[b] = B.cellP[o]; B.bodyP[b + 1] = B.cellP[o + 1]; B.bodyP[b + 2] = B.cellP[o + 2]; B.bodyP[b + 3] = Math.max(h, 0.01);
        mix3(C_GROUND, C_ROOF, sm(0, 0.35 * HM, h), B.bodyR, b); B.bodyR[b + 3] = isCore ? gold : 0;
        nb++;
      }
    }
    // lit edges, on the roofs they run along
    let ns = 0;
    const lw = phone ? 1.25 : 1.5, EB = [0.44, 0.78], EC = [C_MUTED, C_TEXT], NSMAX = B.segA.length / 4;
    const seg = (x0, y0, x1, y1, z, k, a) => {
      if (ns >= NSMAX || a < 0.01) return;
      const o = ns * 4;
      B.segA[o] = x0 - core.x; B.segA[o + 1] = core.y - y0; B.segA[o + 2] = z + 0.6; B.segA[o + 3] = lw;
      B.segB[o] = x1 - core.x; B.segB[o + 1] = core.y - y1; B.segB[o + 2] = z + 0.6;
      B.segC[o] = EC[k][0]; B.segC[o + 1] = EC[k][1]; B.segC[o + 2] = EC[k][2]; B.segC[o + 3] = a;
      ns++;
    };
    for (const e of Sx.edges.values()) {
      const age = t - e.t; if (age < 0 || age > Sx.edgeFade) continue;
      const A = V[e.a], Bv = V[e.b];
      seg(A.x, A.y, Bv.x, Bv.y, edgeH(e.a, e.b), e.k, EB[e.k] * (1 - age / Sx.edgeFade));
    }
    for (const ag of Sx.agents) {
      if (ag.dead || ag.to < 0 || t <= ag.t0) continue;
      const A = V[ag.from];
      seg(A.x, A.y, ag.x, ag.y, edgeH(ag.from, ag.to), ag.kind, EB[ag.kind] * Sx.vis(ag, t));
    }
    // the agents ride the roofs; at a corner they climb or drop to the next edge's roof during the first part of the hop
    let nn = 0;
    const NB = [0.92, 1], NC = [C_MUTED, C_TEXT];
    for (const ag of Sx.agents) {
      const vis = Sx.vis(ag, t); if (vis <= 0) continue;
      let z;
      if (ag.to >= 0 && t > ag.t0) {
        const zc = edgeH(ag.from, ag.to), zp = ag.prev >= 0 ? edgeH(ag.prev, ag.from) : zc;
        z = zp + (zc - zp) * sm(0, 0.45, (t - ag.t0) / ag.d);
      } else z = ag.prev >= 0 ? edgeH(ag.prev, ag.from) : 0;
      const o = nn * 4;
      B.nodeA[o] = ag.x - core.x; B.nodeA[o + 1] = core.y - ag.y; B.nodeA[o + 2] = z + 0.4; B.nodeA[o + 3] = 1;
      const col = NC[ag.kind];
      B.nodeC[o] = col[0]; B.nodeC[o + 1] = col[1]; B.nodeC[o + 2] = col[2]; B.nodeC[o + 3] = NB[ag.kind] * vis;
      nn++;
    }
    const cm = camAt(t);
    G3.draw(viewOf(cm), projOf(cm), { bodies: nb, segs: ns, nodes: nn });
  }

  function updatePhase(t) {
    const idx = t < T.commit0 ? 0 : (!resolved ? 1 : 2);
    if (card) {
      const dots = card.querySelectorAll('.spin i');
      const on = idx < 2 && !S.reduce ? Math.floor(t / 80) % 6 : -1;
      if (dots.length && on !== lastDot) { dots.forEach((d, k) => d.classList.toggle('on', k === on)); lastDot = on; }
      const sp = card.querySelector('.spin'); if (sp) sp.classList.toggle('done', on < 0);
    }
    if (idx === phaseIdx) return;
    phaseIdx = idx;
    if (card) {
      const [state, verb, obj, label] = STATES[idx];
      card.dataset.state = state;
      const st = card.querySelector('#sc-state'), vb = card.querySelector('#sc-verb'), ob = card.querySelector('#sc-obj');
      if (st) st.textContent = label;
      if (vb) vb.textContent = verb;
      if (ob) ob.textContent = obj;
    }
  }

  // the 3D view runs until the field is flat, top-down and under the mark, then the 2D canvases take over
  const glActive = t => mode3 && G3 && B3 && !glGone && !(resolved && t >= resolveT + C3.hand);
  function render(t) {
    renderGlow(t);
    if (glActive(t)) {
      if (!glShown) { G3.canvas.style.opacity = '1'; G3.canvas.style.visibility = ''; glShown = true; }
      render3(t);
    } else {
      renderField(t);
      renderAgents(t, projAt(t));
      if (mode3 && G3 && glShown) {
        const op = resolved ? 1 - clamp01((t - resolveT - C3.hand) / C3.fadeGL) : 0;
        G3.canvas.style.opacity = op.toFixed(3);
        if (op <= 0) { G3.canvas.style.visibility = 'hidden'; glShown = false; }
      }
    }
    renderMark(t);
    updatePhase(t);
  }
  function simulateTo(target) { while (simT + DT <= target) { simT += DT; step(simT); } }

  /* ---------- lifecycle ---------- */
  let raf = 0, last = 0, acc = 0, visible = true, motionOff = false, done = false, begun = false, pendingSeek = null;
  let slowN = 0, slowSum = 0, slowDone = false;
  const live = !S.reduce && S.freeze == null;
  const canRun = () => begun && live && !done && visible && !document.hidden && !motionOff;
  function release3() { if (G3) { G3.dispose(); G3 = null; B3 = null; glGone = true; } }
  function finish() {
    simulateTo(Math.max(simT, (END === Infinity ? 0 : END) + 50, 6200)); render(simT);
    done = true; document.documentElement.dataset.heroReady = '1';
    if (live) release3();   // the sequence is over: give the GPU back
  }
  function frame(now) {
    raf = 0;
    if (!canRun()) return;
    // fixed-step simulation on wall-clock time, so the sequence lands on time even at low frame rates
    const dt = last ? now - last : DT;
    acc += last ? Math.min(2500, dt) : DT;
    last = now;
    while (acc >= DT) { simT += DT; step(simT); acc -= DT; }
    if (simT > END) { finish(); return; }
    render(simT);
    // phone budget: if the 3D frames come slowly, drop to 1x pixels once
    if (glActive(simT) && !slowDone && last && dt < 500) {
      slowN++; slowSum += dt;
      if (slowN >= 18) { slowDone = true; if (slowSum / slowN > 40 && DPR > 1) { DPR = 1; G3.setDpr(1, W, Hc); } }
    }
    raf = requestAnimationFrame(frame);
  }
  function kick() { if (!raf && canRun()) { last = 0; acc = 0; raf = requestAnimationFrame(frame); } }

  function begin() {
    if (begun) return;
    begun = true;
    mode3 = !!G3;
    document.documentElement.dataset.hero = mode3 ? '3d' : '2d';
    setup();
    if (!live) {
      if (S.reduce) { finish(); return; }
      simulateTo(S.freeze); render(simT);
      document.documentElement.dataset.heroReady = '1';
      if (pendingSeek != null) { const t = pendingSeek; pendingSeek = null; seek(t); }
      return;
    }
    render(0);
    kick();
  }
  // the 3D view needs WebGL, the Three.js module and a capable device; anything else gets the 2D hero
  function wants3D() {
    if (S.reduce || Q.get('flat') === '1') return false;
    const n = navigator;
    if (n.connection && n.connection.saveData) return false;
    if (n.deviceMemory && n.deviceMemory < 4) return false;
    if (n.hardwareConcurrency && n.hardwareConcurrency < 4) return false;
    return true;
  }
  function start() {
    if (!wants3D()) { begin(); return; }
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const fonts = document.fonts && document.fonts.ready ? Promise.race([document.fonts.ready, wait(live ? 900 : 4000)]) : Promise.resolve();
    const gl = import('./hero3d.js').then(m => {
      if (begun) return;
      G3 = m.createRising(art, ac);
      if (G3) G3.canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); glGone = true; if (live && !done) finish(); }, false);
    }).catch(() => { G3 = null; });
    Promise.all([gl, fonts]).then(begin, begin);
    setTimeout(begin, live ? 1800 : 9000);
  }
  // rebuild with the same seed and replay to the current time (the simulation is deterministic)
  function rebuild() {
    if (!begun) return;
    const keep = simT, wasDone = done;
    setup();
    if (!live) { if (S.reduce) finish(); else { simulateTo(S.freeze); render(simT); } return; }
    if (wasDone || motionOff) { finish(); return; }
    simulateTo(keep); render(simT); kick();
  }
  function seek(t) { if (t < simT) setup(); simulateTo(t); render(simT); return simT; }

  start();
  if (Q.has('debug')) window.__h1 = () => ({ G3, B3, L, Sx, core, F, W, Hc, camAt, projector, viewOf, projOf, hd, traffic, resolveT, routed, absorbed });
  // frame-accurate captures: with ?t=<ms>, window.__heroSeek(ms) steps the frozen hero to another time
  if (!live && !S.reduce) window.__heroSeek = t => { if (!begun) { pendingSeek = t; return t; } return seek(t); };

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(es => { for (const e of es) { visible = e.isIntersecting; if (visible) kick(); } }, { threshold: 0 }).observe(hero);
  }
  document.addEventListener('visibilitychange', kick);
  window.addEventListener('swarm:motion', e => { motionOff = !!(e.detail && e.detail.off); if (motionOff && live && begun && !done) finish(); });

  let lastW = hero.clientWidth, rt = 0;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      if (hero.clientWidth === lastW) return;
      lastW = hero.clientWidth;
      rebuild();
    }, 160);
  });
  // once the real type metrics are in, the copy's boxes move: re-measure the reading zone and replay
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (!begun) return; lastW = hero.clientWidth; rebuild(); });
})();
