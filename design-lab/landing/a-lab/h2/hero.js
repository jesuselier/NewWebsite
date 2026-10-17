/* Swarm A, Core Glow: the hero (Canvas 2D, two canvases, official swarm-mark.svg on the core cell).
   The honeycomb fills the first screen. Agents are small hexagonal nodes that hop corner to corner along the
   channels between cells; every edge they cross lights for 600ms, and the cells they sense brighten briefly, so the
   field reads as a network being worked. The opening is seen at an angle and straightens out as consensus forms:
   committed agents route along shared paths (around the copy) toward the core, the six neighbours light as agents
   reach their corners, and the official mark lands on the core as its warm light opens over the whole screen.
   SIGNAL HANDOFF (lab concept h2): once the core lights, one bright #EEEBE4 pulse leaves the core along the lattice
   channels, routes around the headline (never across the copy or behind a card) and lands on the gold Join Swarm
   button, whose revolving highlight ignites at that exact point: a fast first lap that eases into the normal pace,
   then the CSS loop takes over. The Scout 03 card follows the same timeline (Scan, Analyze, Report bars fill as the
   swarm scans, agrees and hands the signal off). The pulse is never gold: gold stays the core and the button.
   Everything settles before 5s and the loop stops; the settled frame is the reduced-motion still.
   No text is drawn on canvas. ?t=<ms> freezes a frame, ?reduce=1 forces the still. */
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
  const cta = hero.querySelector('.hero-copy .btn-gold');
  if (!SL || !hero || !fc || !ac || !fc.getContext) return;
  const fx = fc.getContext('2d'), ax = ac.getContext('2d');
  if (!fx || !ax) return;
  const { COL, clamp01, sm, inOut, outCubic, rng, hexPath, lattice, sim, drawEdges, drawAgents, drawField } = SL;

  const T = { ringMs: 20, wake: 120, commit0: 980, commit1: 1400, arrive: 2320, resolveMin: 2200, resolveMax: 2780, markIn: 380, glowIn: 1000, tilt: 2350 };
  const DT = 1000 / 60;
  const MASK = 0.13;
  // the handoff: the pulse leaves as the mark lands, crosses in about a second, and the ring's first lap is fast
  const SIG = { delay: 220, fade: 760, floor: 0.3, Dmin: 700, Dmax: 900, lap1: 1000, lapN: 3600 };
  // the scout card follows the hero's three phases: scan the field, analyze while consensus forms, report once it lands
  const STATES = [
    ['SCANNING', 'Scanning', 'the market', 'Scanning'],
    ['ANALYZING', 'Analyzing', 'a setup', 'Analyzing'],
    ['REPORTING', 'Reporting', 'to the watch list', 'Reporting']
  ];

  let W, Hc, DPR, phone, tablet, R, core, maxD, RAD, TH0, PD, L, V, walk, dist, parent, hops, innerNext, glowEl, tintCv, lastG = -1, lastTilt = '';
  let rects, floorY = 1e9, Sx, rnd, resolved, resolveT, absorbed, routed, flashT, pinged, simT, END, fieldKey, phaseIdx, lastDot;
  let planMs = 0, prects, blocks, relay, ringBox, route, sigT0 = Infinity, sigArr = Infinity, ringHanded = false, ringEls = null, lastBars = '', lastTouch = -1, canvasQuiet = false;

  /* ---------- the copy, in screen space ---------- */
  function measure() {
    const hr = hero.getBoundingClientRect();
    rects = []; prects = []; blocks = []; relay = null;
    const box = (r, m) => [r.left - hr.left - m, r.top - hr.top - m, r.right - hr.left + m, r.bottom - hr.top + m];
    const add = (r, m, isCta) => { if (r.width && r.height) { const b = box(r, m); rects.push(b); if (!isCta) prects.push(b); } };
    hero.querySelectorAll('[data-avoid]').forEach(el => {
      if (el.offsetParent === null) return;
      if (el.dataset.avoid === 'lines') {
        const rg = document.createRange(); rg.selectNodeContents(el);
        for (const r of rg.getClientRects()) if (r.width && r.height) rects.push(box(r, phone ? 4 : 8));
        // the pulse reads the glyphs' own line boxes (text nodes only, not the full-width block spans)
        const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        for (let n = tw.nextNode(); n; n = tw.nextNode()) {
          if (!n.nodeValue.trim()) continue;
          const tr = document.createRange(); tr.selectNodeContents(n);
          for (const r of tr.getClientRects()) if (r.width && r.height) prects.push(box(r, phone ? 4 : 8));
        }
      }
      else add(el.getBoundingClientRect(), 6, el === cta);
    });
    if (window.scrollY < 10) document.querySelectorAll('.nav-logo, .nav .btn-line').forEach(el => add(el.getBoundingClientRect(), 6));
    // the floating cards are opaque: the pulse never runs behind them
    // the floating cards are opaque: the pulse never runs behind the quote card. Where Scout 03 floats beside the copy
    // (wide screens), it is a relay: the pulse may pass behind it, and the card reports as the signal goes through
    hero.querySelectorAll('.qcard').forEach(el => {
      const r = el.getBoundingClientRect(); if (!r.width) return;
      if (el === card && getComputedStyle(el).position === 'absolute') relay = box(r, -3);
      else blocks.push(box(r, 4));
    });
    // the ring sits 4px outside the gold button (core-glow.css .ring), corner radius 22
    if (cta && cta.offsetParent !== null) {
      const r = cta.getBoundingClientRect();
      ringBox = { x0: r.left - hr.left - 4, y0: r.top - hr.top - 4, x1: r.right - hr.left + 4, y1: r.bottom - hr.top + 4 };
      ringBox.w = ringBox.x1 - ringBox.x0; ringBox.h = ringBox.y1 - ringBox.y0;
      ringBox.rx = Math.min(22, ringBox.w / 2, ringBox.h / 2);
      ringBox.cx = (ringBox.x0 + ringBox.x1) / 2; ringBox.cy = (ringBox.y0 + ringBox.y1) / 2;
      ringBox.per = 2 * (ringBox.w - 2 * ringBox.rx) + 2 * (ringBox.h - 2 * ringBox.rx) + 2 * Math.PI * ringBox.rx;
    } else ringBox = null;
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

  // the pulse's own reading mask: dimmer behind the copy (never full strength on a glyph), full up to the button
  function pulseMaskAt(x, y) {
    let d = 1e9;
    for (const r of prects) {
      const dx = Math.max(r[0] - x, 0, x - r[2]), dy = Math.max(r[1] - y, 0, y - r[3]);
      const dd = dx > 0 || dy > 0 ? Math.hypot(dx, dy) : 0;
      if (dd < d) { d = dd; if (!d) break; }
    }
    return SIG.floor + (1 - SIG.floor) * sm(0, 12, d);
  }
  const inBox = (b, x, y) => x > b[0] && x < b[2] && y > b[1] && y < b[3];
  const inBlock = (x, y) => blocks.some(b => inBox(b, x, y));

  /* ---------- the ring's geometry (rounded rect, SVG rect path order, pathLength 100) ---------- */
  function ringSD(x, y) {
    const b = ringBox, hx = b.w / 2 - b.rx, hy = b.h / 2 - b.rx;
    const qx = Math.abs(x - b.cx) - hx, qy = Math.abs(y - b.cy) - hy;
    return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - b.rx;
  }
  // position of a point on the ring outline, in pathLength units: the SVG rect path starts at (x + rx, y) and runs clockwise
  function ringPos(x, y) {
    const b = ringBox, r = b.rx, sw = b.w - 2 * r, sh = b.h - 2 * r, arc = Math.PI * r / 2;
    const segs = [
      ['l', b.x0 + r, b.y0, b.x1 - r, b.y0], ['a', b.x1 - r, b.y0 + r, -Math.PI / 2], ['l', b.x1, b.y0 + r, b.x1, b.y1 - r], ['a', b.x1 - r, b.y1 - r, 0],
      ['l', b.x1 - r, b.y1, b.x0 + r, b.y1], ['a', b.x0 + r, b.y1 - r, Math.PI / 2], ['l', b.x0, b.y1 - r, b.x0, b.y0 + r], ['a', b.x0 + r, b.y0 + r, Math.PI]
    ];
    let acc = 0, best = 1e9, pos = 0;
    for (const sg of segs) {
      if (sg[0] === 'l') {
        const [, ax, ay, bx, by] = sg, len = Math.hypot(bx - ax, by - ay);
        const u = len ? clamp01(((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / (len * len)) : 0;
        const d = Math.hypot(ax + (bx - ax) * u - x, ay + (by - ay) * u - y);
        if (d < best) { best = d; pos = acc + u * len; }
        acc += len;
      } else {
        const [, cx, cy, a0] = sg;
        let a = Math.atan2(y - cy, x - cx) - a0; while (a < 0) a += 2 * Math.PI; while (a >= 2 * Math.PI) a -= 2 * Math.PI;
        const u = a <= Math.PI / 2 ? a / (Math.PI / 2) : (a < 1.25 * Math.PI ? 1 : 0);
        const aa = a0 + u * Math.PI / 2, d = Math.hypot(cx + r * Math.cos(aa) - x, cy + r * Math.sin(aa) - y);
        if (d < best) { best = d; pos = acc + u * arc; }
        acc += arc;
      }
    }
    return 100 * pos / acc;
  }

  /* ---------- the handoff route: core, around the copy, into the ring ---------- */
  function planRoute() {
    route = null;
    if (!ringBox) return;
    const b = ringBox, yMax = Math.min(Hc - 10, floorY - 10);
    const ok = V.map(v => v.x > 3 && v.x < W - 3 && v.y > 4 && v.y < yMax && !inBlock(v.x, v.y) && (v.core || ringSD(v.x, v.y) > 0));
    // the reading mask at each corner, once (only for corners the pulse may use)
    const pm = new Float32Array(V.length);
    V.forEach((v, i) => { if (ok[i]) pm[i] = pulseMaskAt(v.x, v.y); });
    const ecost = (i, j) => {
      const A = V[i], B = V[j], len = Math.hypot(B.x - A.x, B.y - A.y);
      if (A.core && B.core) return len * 40;
      if (relay && inBox(relay, A.x, A.y) && inBox(relay, B.x, B.y)) return len;
      const m2 = Math.min(pm[i], pm[j]), m = m2 < 0.98 ? m2 : pulseMaskAt((A.x + B.x) / 2, (A.y + B.y) / 2);
      // brushing the soft edge of the reading zone is cheap, running behind a glyph is not
      const q = (1 - Math.min(m, m2)) / (1 - SIG.floor);
      return len * (1 + 60 * q * q);
    };
    // contacts: lattice edges that cut the ring outline on its right half, above the bottom edge (so the pulse
    // never passes under "Cancel anytime."); the pulse runs along that edge until it touches the ring
    const dist = new Float64Array(V.length).fill(Infinity), next = new Int32Array(V.length).fill(-1), hit = new Array(V.length);
    const heap = [];
    const push = (d, i) => { heap.push([d, i]); let k = heap.length - 1; while (k) { const p = (k - 1) >> 1; if (heap[p][0] <= heap[k][0]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; } };
    const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let k = 0; for (;;) { const l = 2 * k + 1, r = l + 1; let m = k; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m; } } return top; };
    V.forEach((v, i) => {
      if (!ok[i] || v.core) return;
      for (const j of v.nb) {
        const w = V[j];
        if (ringSD(w.x, w.y) >= 0) continue;
        let lo = 0, hi = 1;
        for (let it = 0; it < 24; it++) { const m = (lo + hi) / 2; if (ringSD(v.x + (w.x - v.x) * m, v.y + (w.y - v.y) * m) > 0) lo = m; else hi = m; }
        const cx = v.x + (w.x - v.x) * lo, cy = v.y + (w.y - v.y) * lo;
        if (cx < b.cx + 0.18 * b.w / 2 || cy > b.cy + 0.3 * b.h / 2) continue;
        const d0 = Math.hypot(cx - v.x, cy - v.y);
        if (d0 < dist[i]) { dist[i] = d0; hit[i] = { x: cx, y: cy }; }
      }
      if (dist[i] < Infinity) push(dist[i], i);
    });
    let start = -1;
    while (heap.length) {
      const [d, i] = pop(); if (d > dist[i]) continue;
      if (V[i].core) { start = i; break; }
      for (const j of V[i].nb) { if (!ok[j]) continue; const nd = d + ecost(i, j); if (nd < dist[j]) { dist[j] = nd; next[j] = i; push(nd, j); } }
    }
    if (start < 0) return;
    const pts = [];
    let k = start, guard = 0;
    while (k >= 0 && guard++ < 600) { pts.push({ x: V[k].x, y: V[k].y }); if (hit[k] && next[k] < 0) break; k = next[k]; }
    const last = pts[pts.length - 1], end = hit[k];
    if (!end) return;
    pts.push({ x: end.x, y: end.y });
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
    const len = cum[cum.length - 1];
    // the speed profile: a short launch, a cruise, then it slows into the ring's own starting speed
    const D = Math.max(SIG.Dmin, Math.min(SIG.Dmax, len / (phone ? 0.95 : 1.8)));
    const v0r = (200 / (SIG.lap1 / 1000) - 100 / (SIG.lapN / 1000)) / 100 * b.per / 1000;   // ring head launch speed, px per ms
    const ta = 0.16 * D, tb = 0.3 * D;
    let vA = v0r, vmax = (len - tb * vA / 2) / (D - ta / 2 - tb / 2);
    if (vA > 0.8 * vmax) { vA = 0.8 * vmax; vmax = (len - tb * vA / 2) / (D - ta / 2 - tb / 2); }
    // where the pulse goes behind Scout 03 and comes out again (arc lengths), if it relays through the card
    let inS = -1, outS = -1;
    if (relay) {
      const at = (i, f) => [pts[i - 1].x + (pts[i].x - pts[i - 1].x) * f, pts[i - 1].y + (pts[i].y - pts[i - 1].y) * f];
      for (let i = 1; i < pts.length; i++) {
        const a = inBox(relay, pts[i - 1].x, pts[i - 1].y), c = inBox(relay, pts[i].x, pts[i].y);
        if (a === c) continue;
        let lo = 0, hi = 1;
        for (let it = 0; it < 16; it++) { const m = (lo + hi) / 2, q = at(i, m); if (inBox(relay, q[0], q[1]) === a) lo = m; else hi = m; }
        const sAt = cum[i - 1] + (cum[i] - cum[i - 1]) * hi;
        if (!a && inS < 0) inS = sAt; else if (a) outS = sAt;
      }
      if (inS < 0 || outS < inS) inS = outS = -1;
    }
    route = { pts, cum, len, D, ta, tb, vA, vmax, pos: ringPos(end.x, end.y), inS, outS, lw: phone ? 1.75 : 2.25, hr: phone ? 3.4 : 4.5 };
  }
  // distance travelled by the pulse after tau ms
  function sigS(tau) {
    const r = route; if (tau <= 0) return 0; if (tau >= r.D) return r.len;
    const { ta, tb, vmax, vA, D } = r;
    if (tau < ta) return 0.5 * vmax / ta * tau * tau;
    const s1 = 0.5 * vmax * ta;
    if (tau < D - tb) return s1 + vmax * (tau - ta);
    const u = tau - (D - tb);
    return s1 + vmax * (D - tb - ta) + vmax * u + (vA - vmax) * u * u / (2 * tb);
  }
  // time (ms after departure) at which the pulse reaches distance s
  function sigTau(s) { let lo = 0, hi = route.D; for (let i = 0; i < 22; i++) { const m = (lo + hi) / 2; if (sigS(m) < s) lo = m; else hi = m; } return hi; }

  /* ---------- the opening camera: a receding plane that straightens out ---------- */
  function projAt(t) {
    const k = 1 - inOut(t / T.tilt);
    if (k <= 0.0005) return null;
    const th = TH0 * k, c = Math.cos(th), s = Math.sin(th), z0 = 1 + 0.05 * k;
    return (x, y) => { const dy = y - core.y, f = PD / (PD - dy * s) * z0; return [core.x + (x - core.x) * f, core.y + dy * c * f, f]; };
  }
  const ID = (x, y) => [x, y, 1];
  // the same camera as a CSS transform, so the compositor tilts the canvases instead of re-drawing every cell
  function tiltCSS(t) {
    const k = 1 - inOut(t / T.tilt);
    if (k <= 0.0005) return '';
    return `scale(${(1 + 0.05 * k).toFixed(4)}) perspective(${PD}px) rotateX(${(TH0 * k).toFixed(5)}rad)`;
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
      fc.after(glowEl); glowEl.after(tintCv);
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
    measure();
    for (const c of [fc, ac]) c.style.transformOrigin = `${core.x}px ${core.y}px`;
    // the core's warm light (the one glow the kit allows): a static layer the compositor fades and opens
    const sx = phone ? 1.12 : 1.5, st = [[0, 0.36], [8, 0.24], [20, 0.14], [36, 0.075], [56, 0.034], [78, 0.012], [100, 0]];
    Object.assign(glowEl.style, { width: W + 'px', height: Hc + 'px', transformOrigin: `${core.x}px ${core.y}px`,
      background: `radial-gradient(ellipse ${Math.round(RAD * sx)}px ${RAD}px at ${core.x}px ${core.y}px, ${st.map(([o, a]) => `rgba(245,197,66,${a}) ${o}%`).join(', ')})` });
    tintCv.style.transformOrigin = `${core.x}px ${core.y}px`;
    lastG = -1; lastTilt = '-';
    const P = 1.95 * R;
    L = lattice({ R, ox: core.x, oy: core.y, x0: -0.32 * W, y0: -7 * P, x1: 1.32 * W, y1: Hc + 2 * P });
    V = L.V;
    rnd = rng(11);
    { const g = tintCv.getContext('2d'), k = RAD * 0.5;
      g.setTransform(DPR, 0, 0, DPR, 0, 0); g.clearRect(0, 0, W, Hc);
      drawField(g, L, c => c.ring >= 2 ? 0.26 * Math.exp(-(c.d * c.d) / (k * k)) * fieldAlpha(c, 1e9) : 0, { color: COL.gold }); }

    // where agents may walk, and what crossing the copy costs (routes go around it)
    walk = V.map(v => !v.core && !v.perim && v.ring >= 2 && v.x > -0.14 * W && v.x < 1.14 * W && v.y > -4 * P && v.y < Math.min(Hc + P, floorY - 8));
    const cost = V.map(v => maskAt(v.x, v.y) < 0.6 ? 2 : 1);
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
    const art = V.filter(v => v.perim && v.cells.filter(c => c.ring === 1).length === 2).map(v => Math.atan2(v.y - core.y, v.x - core.x));
    const artDev = (x, y) => { const a = Math.atan2(y - core.y, x - core.x); let m = 9; for (const b of art) { let d = Math.abs(a - b); if (d > Math.PI) d = 2 * Math.PI - d; m = Math.min(m, d); } return m; };
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
    const pool = [];
    V.forEach((v, i) => { if (walk[i] && v.ring >= 3 && v.x > 6 && v.x < W - 6 && v.y > 8 && v.y < Math.min(Hc - 40, floorY - 40)) pool.push(i); });
    Sx = sim(L, 23, 600);
    const used = new Set();
    for (let n = 0; n < N && pool.length; n++) {
      let id = pool[0];
      for (let tries = 0; tries < 60; tries++) {
        id = pool[(rnd() * pool.length) | 0];
        if (used.has(id)) continue;
        const v = V[id], w = (0.32 + 0.68 * Math.exp(-v.d / (0.55 * maxD))) * (maskAt(v.x, v.y) < 0.6 ? 0.35 : 1);
        if (rnd() < w) break;
      }
      used.add(id);
      const v = V[id];
      const kind = rnd() < 0.7 ? 1 : 0;
      const a = Sx.add(id, { kind, born: T.wake + v.ring * T.ringMs + rnd() * 260, ct: T.commit0 + rnd() * (T.commit1 - T.commit0), jit: rnd() * 260 });
      const nx = v.nb.filter(j => walk[j]);
      if (nx.length) Sx.hop(a, nx[(rnd() * nx.length) | 0], a.born + 40 + rnd() * 220, hopD());
    }
    pinged = []; resolved = false; resolveT = Infinity; absorbed = 0; routed = 0; flashT = -1e9;
    simT = 0; END = Infinity; fieldKey = ''; phaseIdx = -1; lastDot = -2;
    { const t0 = performance.now(); planRoute(); planMs = performance.now() - t0; }
    sigT0 = Infinity; sigArr = Infinity; lastBars = ''; lastTouch = -1; canvasQuiet = false;
    // the hero's own ring is driven from here until its first lap is done (dark until the pulse lands)
    if (cta && route && !S.reduce && !ringHanded) {
      cta.classList.add('sig-drive');
      if (!ringEls) {
        const q = sel => cta.querySelector(sel);
        ringEls = { line: q('.ring-line'), halo: q('.ring-halo'), track: q('.r-track'),
          dash: [[q('.r-head'), 4.5, 4.5], [q('.r-t1'), 8, 8], [q('.r-t2'), 12, 12], [q('.r-t3'), 17, 17], [q('.r-t4'), 24, 24], [q('.ring-halo rect'), 10, 9]].filter(d => d[0]) };
      }
    }
  }
  const hopD = () => 175 + rnd() * 85;
  const pick = arr => arr[(rnd() * arr.length) | 0];

  function policy(a, at) {
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

  function step(t) {
    Sx.advance(t, policy);
    if (!resolved && ((t >= T.resolveMin && routed > 0 && absorbed >= 0.6 * routed) || t >= T.resolveMax)) {
      resolved = true; resolveT = t; END = t + 1500;
      if (route) { sigT0 = t + SIG.delay; sigArr = sigT0 + route.D; END = Math.max(END, sigArr + SIG.fade + 40, sigArr + SIG.lap1 + 40); }
      for (const c of L.rings[1] || []) if (c.lit < -1e8) c.lit = t;
      for (const a of Sx.agents) {
        if (a.dead || a.fadeT >= 0) continue;
        if (a.mode === 'scan') { a.fadeT = t + 90 + rnd() * 520; a.fadeD = 300; }
        else if (a.mode === 'route') { a.fadeT = t + 520 + rnd() * 260; a.fadeD = 220; }
      }
    }
  }
  const charge = () => Math.min(1, absorbed / Math.max(1, 0.6 * routed));

  /* ---------- drawing ---------- */
  function glowAt(t) {
    const pre = 0.2 * charge() * sm(T.commit0, T.resolveMin, t);
    return Math.max(pre, resolved ? outCubic((t - resolveT) / T.glowIn) : 0);
  }
  function fieldAlpha(c, t) {
    if (c.ring <= 1) return 0;
    const reveal = sm(c.ring * T.ringMs, c.ring * T.ringMs + 320, t);
    return reveal * Math.max(0.16, 1 - sm(0.3 * maxD, 1.05 * maxD, c.d)) * (1 - sm(Hc - 170, Hc - 6, c.y));
  }
  function renderField(t) {
    const G = glowAt(t);
    if (Math.abs(G - lastG) > 0.002 || (G === 0) !== (lastG === 0)) {
      glowEl.style.opacity = G.toFixed(3); tintCv.style.opacity = G.toFixed(3);
      glowEl.style.transform = G < 1 ? `scale(${(0.5 + 0.5 * G).toFixed(4)})` : '';
      lastG = G;
    }
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
    // the handoff clears the stage: once the core lights, the swarm's own lit edges and nodes settle out quickly, so the
    // one pulse that leaves the core is the only thing moving
    const calm = resolved && route ? 1 - sm(resolveT + 60, resolveT + 380, t) : 1;
    const mA = calm < 1 ? (x, y) => mP(x, y) * calm : mP;
    const hand = resolved ? outCubic((t - resolveT) / T.markIn) : 0;
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
    if (calm > 0) drawEdges(g, Sx, t, { proj, alphaAt: mA, base: [0.44, 0.78], lw: phone ? 1.25 : 1.5 });
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
      const flash = Math.max(0, 1 - (t - flashT) / 220);
      const coreA = Math.min(1, sm(0, 260, t) * (0.34 + 0.56 * charge()) + 0.25 * flash) * (1 - hand);
      if (coreA > 0.01) {
        g.globalAlpha = coreA; g.strokeStyle = COL.gold; g.lineWidth = 1.5; g.beginPath();
        proj ? SL.hexPathP(g, core.x, core.y, R * 0.825, proj) : hexPath(g, core.x, core.y, R * 0.825); g.stroke();
      }
      g.globalAlpha = 1;
    }
    // the agents: small hexagonal nodes, scouts muted, committed bright
    if (calm > 0) drawAgents(g, Sx, t, { proj, alphaAt: mA, r: phone ? 2.4 : 3, base: [0.92, 1] });
    // the handoff: one bright pulse from the core to the gold button
    drawPulse(g, t);
    // the official mark lands on the core cell
    mark.style.opacity = hand ? hand.toFixed(3) : '0';
    mark.style.transform = hand < 1 ? `scale(${(0.93 + 0.07 * hand).toFixed(4)})` : '';
  }

  function drawPulse(g, t) {
    if (!route || t < sigT0 || t > sigArr + SIG.fade) return;
    const r = route, P = r.pts, tau = t - sigT0, s = sigS(tau);
    const B = 10, groups = new Map();
    for (let i = 1; i < P.length; i++) {
      if (r.cum[i - 1] >= s) break;
      const seg = r.cum[i] - r.cum[i - 1];
      const done = r.cum[i] <= s;
      // a crossed edge fades over SIG.fade from the moment the pulse left it; the edge being crossed is lit to the head
      const tEnd = done ? sigTau(r.cum[i]) : tau;
      let a = 1 - clamp01((tau - tEnd) / SIG.fade);
      const x1 = done ? P[i].x : P[i - 1].x + (P[i].x - P[i - 1].x) * (s - r.cum[i - 1]) / seg;
      const y1 = done ? P[i].y : P[i - 1].y + (P[i].y - P[i - 1].y) * (s - r.cum[i - 1]) / seg;
      a *= pulseMaskAt((P[i - 1].x + x1) / 2, (P[i - 1].y + y1) / 2);
      const k = Math.round(a * B); if (k <= 0) continue;
      let arr = groups.get(k); if (!arr) groups.set(k, arr = []); arr.push(P[i - 1].x, P[i - 1].y, x1, y1);
    }
    g.strokeStyle = COL.text; g.lineWidth = r.lw; g.lineCap = 'round';
    for (const [k, arr] of groups) {
      g.globalAlpha = k / B; g.beginPath();
      for (let i = 0; i < arr.length; i += 4) { g.moveTo(arr[i], arr[i + 1]); g.lineTo(arr[i + 2], arr[i + 3]); }
      g.stroke();
    }
    g.lineCap = 'butt';
    // the head: a hexagonal node like the agents, a size up; it is absorbed into the ring on arrival
    if (tau < r.D) {
      let i = 1; while (i < P.length - 1 && r.cum[i] < s) i++;
      const f = (s - r.cum[i - 1]) / Math.max(1e-6, r.cum[i] - r.cum[i - 1]);
      const x = P[i - 1].x + (P[i].x - P[i - 1].x) * f, y = P[i - 1].y + (P[i].y - P[i - 1].y) * f;
      g.globalAlpha = sm(0, 90, tau) * pulseMaskAt(x, y); g.fillStyle = COL.text; g.beginPath(); hexPath(g, x, y, r.hr); g.fill();
    }
    g.globalAlpha = 1;
  }

  /* ---------- the ring on the hero's gold button ---------- */
  const V1 = 100 / SIG.lapN, V0 = 200 / SIG.lap1 - 100 / SIG.lapN;   // pathLength units per ms: normal pace, launch speed
  // where the ring's light leads at hero time t (pathLength units, unwrapped), and how far it has travelled
  function ringLead(t) {
    const tau = t - sigArr;
    if (tau < SIG.lap1) return [route.pos + V0 * tau + (V1 - V0) * tau * tau / (2 * SIG.lap1), V0 * tau + (V1 - V0) * tau * tau / (2 * SIG.lap1)];
    return [route.pos + 100 + V1 * (tau - SIG.lap1), 100 + V1 * (tau - SIG.lap1)];
  }
  function ringAt(t) {
    if (!ringEls || ringHanded) return;
    if (t < sigArr) {
      ringEls.line.style.opacity = '0'; ringEls.halo.style.opacity = '0';
      return;
    }
    const tau = t - sigArr, [L, run] = ringLead(t);
    ringEls.line.style.opacity = ''; ringEls.halo.style.opacity = '';
    // ignition: the track flares as the pulse lands, then settles to its normal 22%
    ringEls.track.style.opacity = (0.22 + 0.4 * Math.max(0, 1 - tau / 650) * sm(0, 60, tau)).toFixed(3);
    for (const [el, dl, k] of ringEls.dash) {
      // the light grows out of the contact point: no tail behind it on the first lap until it has travelled that far
      const len = Math.max(0.01, Math.min(dl, run + (dl - k) + dl * 0.15));
      const off = (((k - dl + len) - L) % 100 + 100) % 100;
      el.style.strokeDasharray = len.toFixed(3) + ' ' + (100 - len).toFixed(3);
      el.style.strokeDashoffset = off.toFixed(3);
    }
  }
  // live: once the first lap is done, the CSS loop takes over in step with where the light is
  function handRing(t) {
    if (!ringEls || ringHanded) return;
    ringHanded = true;
    const L = isFinite(sigArr) ? ringLead(Math.max(t, sigArr + SIG.lap1))[0] : 0;
    const phase = (((L % 100) + 100) % 100) / 100 * SIG.lapN;
    ringEls.line.style.opacity = ''; ringEls.halo.style.opacity = ''; ringEls.track.style.opacity = '';
    for (const [el] of ringEls.dash) { el.style.strokeDasharray = ''; el.style.strokeDashoffset = ''; el.style.animationDelay = (-phase / 1000).toFixed(3) + 's'; }
    cta.classList.remove('sig-drive');
  }

  // Scout 03 reports when the signal reaches it: as the pulse goes behind the card on wide screens, at departure elsewhere
  const repT = () => !route ? resolveT : sigT0 + (route.inS >= 0 ? sigTau(route.inS) : 0);
  const outT = () => !route || route.outS < 0 ? repT() : sigT0 + sigTau(route.outS);
  function updatePhase(t) {
    const tRep = repT();
    const idx = t < T.commit0 ? 0 : (t < tRep ? 1 : 2);
    if (card) {
      // the three step bars fill with the hero: scan while agents scan, analyze while they agree and the signal
      // travels to the scout, report while the signal goes on to the button
      const pre = x => 0.8 * clamp01((x - T.commit0) / (T.resolveMax - T.commit0));
      const pS = clamp01(t / T.commit0);
      const pA = !resolved ? pre(t) : pre(resolveT) + (1 - pre(resolveT)) * clamp01((t - resolveT) / Math.max(1, tRep - resolveT));
      const pR = !resolved ? 0 : route ? clamp01((t - tRep) / Math.max(1, sigArr - tRep)) : 1;
      const key = [pS, pA, pR].map(v => v.toFixed(3)).join(',');
      if (key !== lastBars) {
        lastBars = key;
        const li = card.querySelectorAll('.sc-steps li');
        [pS, pA, pR].forEach((v, k) => { if (li[k]) { li[k].style.setProperty('--p', v.toFixed(3)); li[k].classList.toggle('on', v > 0); li[k].classList.toggle('full', v >= 1); } });
      }
      // wide screens: the card's edge answers while the signal passes through it
      if (route && route.inS >= 0 && resolved) {
        const t1 = outT(), e = t - tRep;
        const k = e < 0 ? 0 : e < 90 ? e / 90 : t < t1 ? 1 : Math.max(0, 1 - (t - t1) / 640);
        const kk = Math.round(k * 40);
        if (kk !== lastTouch) {
          lastTouch = kk;
          const c = [0x23 + (0x55 - 0x23) * kk / 40, 0x23 + (0x55 - 0x23) * kk / 40, 0x28 + (0x5B - 0x28) * kk / 40].map(Math.round);
          card.style.borderColor = kk ? `rgb(${c[0]},${c[1]},${c[2]})` : '';
        }
      }
      const dots = card.querySelectorAll('.spin i');
      const on = t < sigArr && !S.reduce && !(resolved && !route) ? Math.floor(t / 80) % 6 : -1;
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

  function render(t) {
    renderField(t);
    // once the pulse has faded and the scouts are gone, the canvas is final: stop redrawing it
    const quiet = resolved && t > Math.max(resolveT + 1500, sigArr + SIG.fade) + 20;
    if (!quiet || !canvasQuiet) {
      renderAgents(t, projAt(t));
      // a clear-only frame can present a stale buffer in Chrome (seen in headless captures): one near-invisible pixel
      // makes every frame a real draw, so the settled canvas is truly empty
      ax.setTransform(1, 0, 0, 1, 0, 0); ax.globalAlpha = 1; ax.fillStyle = 'rgba(0,0,0,0.01)'; ax.fillRect(0, 0, 1, 1);
    }
    canvasQuiet = quiet;
    updatePhase(t);
    ringAt(t);
  }
  function simulateTo(target) { while (simT + DT <= target) { simT += DT; step(simT); } }

  /* ---------- lifecycle ---------- */
  let raf = 0, last = 0, acc = 0, visible = true, motionOff = false, done = false;
  const live = !S.reduce && S.freeze == null;
  const canRun = () => live && !done && visible && !document.hidden && !motionOff;
  function finish() {
    const tNow = simT;
    simulateTo(Math.max(simT, (END === Infinity ? 0 : END) + 50, 6200)); canvasQuiet = false; render(simT); done = true;
    if (live) handRing(tNow);
    document.documentElement.dataset.heroReady = '1';
  }
  function frame(now) {
    raf = 0;
    if (!canRun()) return;
    // fixed-step simulation on wall-clock time, so the sequence lands on time even at low frame rates
    acc += last ? Math.min(2500, now - last) : DT;
    last = now;
    while (acc >= DT) { simT += DT; step(simT); acc -= DT; }
    if (simT > END) { finish(); return; }
    render(simT);
    raf = requestAnimationFrame(frame);
  }
  function kick() { if (!raf && canRun()) { last = 0; acc = 0; raf = requestAnimationFrame(frame); } }

  function start() {
    setup();
    if (!live) {
      if (S.reduce) { finish(); return; }
      simulateTo(S.freeze); render(simT);
      document.documentElement.dataset.heroReady = '1';
      return;
    }
    render(0);
    kick();
  }
  // rebuild with the same seed and replay to the current time (the simulation is deterministic)
  function rebuild() {
    const keep = simT, wasDone = done;
    setup();
    if (!live) { if (S.reduce) finish(); else { simulateTo(S.freeze); render(simT); } return; }
    if (wasDone || motionOff) { finish(); return; }
    simulateTo(keep); render(simT); kick();
  }

  start();
  // frame-accurate captures: with ?t=<ms>, window.__heroSeek(ms) steps the frozen hero to another time
  if (!live && !S.reduce) window.__heroSeek = t => { if (t < simT) setup(); simulateTo(t); canvasQuiet = false; render(simT); return simT; };
  // read-only timing for captures and reviews: when the core lit, when the pulse left and landed
  window.__heroInfo = () => ({ planMs: +planMs.toFixed(2), resolveT, sigT0, sigArr, lapEnd: sigArr + SIG.lap1, end: END, route: route ? { len: Math.round(route.len), D: Math.round(route.D), pos: +route.pos.toFixed(2), pts: route.pts.length, relayIn: route.inS >= 0 ? Math.round(sigT0 + sigTau(route.inS)) : null, relayOut: route.outS >= 0 ? Math.round(sigT0 + sigTau(route.outS)) : null } : null });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(es => { for (const e of es) { visible = e.isIntersecting; if (visible) kick(); } }, { threshold: 0 }).observe(hero);
  }
  document.addEventListener('visibilitychange', kick);
  window.addEventListener('swarm:motion', e => { motionOff = !!(e.detail && e.detail.off); if (motionOff && live && !done) finish(); });

  let lastW = W, rt = 0;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      if (hero.clientWidth === lastW) return;
      lastW = hero.clientWidth;
      rebuild();
    }, 160);
  });
  // once the real type metrics are in, the copy's boxes move: re-measure the reading zone and replay
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { lastW = hero.clientWidth; rebuild(); });
})();
