/* Swarm A, Core Glow, lab h4: Scroll Convergence (Canvas 2D, official swarm-mark.svg on the core cell).
   The honeycomb fills the first screen and the agents (small hexagonal nodes hopping corner to corner along the
   channels between cells, lighting each edge they cross) scan it on their own for about two seconds. Then the hero
   holds (CSS position: sticky, for about 120vh of scroll) and the visitor's scroll drives the rest: scouts commit one
   by one (grey turns bright), route along shared paths to the core, the six neighbours light as they arrive, and the
   official mark lands with its warm light at the end of the hold; then the page releases. Scrolling back before the
   end plays it back. If the visitor does not scroll within about 2.4s (or stops scrolling for 1s), the rest plays on
   its own, so the first screen is complete at rest and every motion settles inside 5s. Reduced motion: the settled
   still and no hold. No text is drawn on canvas.
   ?t=<ms> freezes a frame (window.__heroSeek(ms) steps it), ?reduce=1 forces the still, ?t=0&pin=1 keeps the hold so
   a capture script can scroll the frozen page and seek: the scroll position is read at each seek. */
(() => {
  'use strict';
  const SL = window.SwarmLattice;
  const S = window.SWARM || { reduce: false, freeze: null };
  const root = document.documentElement;
  const hero = document.getElementById('top');
  const pinEl = document.getElementById('hero-pin');
  const room = document.getElementById('pin-room');
  const fc = document.getElementById('hero-field');
  const ac = document.getElementById('hero-agents');
  const mark = document.getElementById('hero-mark');
  const anchor = document.getElementById('core-anchor');
  const card = document.getElementById('scout-card');
  if (!SL || !hero || !fc || !ac || !fc.getContext) return;
  const fx = fc.getContext('2d'), ax = ac.getContext('2d');
  if (!fx || !ax) return;
  const { COL, clamp01, sm, inOut, outCubic, rng, hexPath, lattice, sim, drawField } = SL;

  /* ---------- timing ----------
     Wall clock (ms): the boot wave, the opening camera and the scan. Progress P (0 to 1, the visitor's scroll through
     the hold, or the autoplay) drives everything from consensus to the lit core. */
  const T = { ringMs: 20, wake: 120, tilt: 2350, scan: 2000, earliest: 500, autoAt: 2400, autoD: 1800, idle: 1000, settle: 650 };
  const PZ = {
    commit0: 0.02, commit1: 0.30, commitMax: 0.68, arriveMax: 0.84,   // scouts commit, then route in
    res: 0.85, markEnd: 0.94,                                         // consensus: the mark lands, the light opens to P = 1
    fade0: 0.78, fade1: 0.93, wave0: 0.84, wave1: 0.985,              // scouts fade, one ring wave runs out
    hold: 0.92                                                        // P reaches 1 at 92% of the hold; the rest is a still beat
  };
  const V0 = 34;                     // route speed: edges per unit of progress (about one edge per 30px of scroll at 1440x900)
  const TRAIL = 5;                   // a committed agent's lit edges also fade by distance: at most about five behind it
  const TAU = 70, VMAX = 1 / 700;    // the scroll is followed with a 70ms ease and at most a full run per 0.7s
  const DT = 1000 / 60;
  const MASK = 0.13;
  const THR = 12 * Math.PI / 180;    // the field keeps a slight recline while it waits; the scroll brings it flat
  const q = new URLSearchParams(location.search);
  const live = !S.reduce && S.freeze == null;
  const PINLAB = !S.reduce && S.freeze != null && q.get('pin') === '1';
  const pinOn = !!(pinEl && room) && (live || PINLAB);
  root.classList.add('h4-hero');
  if (pinOn) root.classList.add('h4-pin');
  const STATES = [
    ['SCANNING', 'Scanning', 'the market', 'Scanning'],
    ['ANALYZING', 'Analyzing', 'a setup', 'Analyzing'],
    ['REPORTING', 'Reporting', 'to the watch list', 'Reporting']
  ];

  let W, Hc, DPR, phone, tablet, R, core, maxD, RAD, TH0, PD, L, V, walk, dist, parent, hops, innerNext, glowEl, tintCv, lastG = -1, lastTilt = '';
  let rects, floorY = 1e9, Sx, rnd, flashT, pinged, simT, END, fieldKey, phaseIdx, lastDot, ring1, ringVis, barP;
  // progress controller
  let P, spPrev, spSeen, lastMove, autoT0, autoFrom, autoDur, complete, completeT, absorbed, routing, inputs;

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
    // the nav sits over the hero for as long as the hero is at the top or held
    if (hr.top > -10) document.querySelectorAll('.nav-logo, .nav .btn-line').forEach(el => add(el.getBoundingClientRect(), 6));
    const rail = hero.querySelector('.hero-rail .hr-in');
    floorY = rail && rail.offsetParent !== null ? rail.getBoundingClientRect().top - hr.top : 1e9;
  }
  function maskAt(x, y) {
    let d = 1e9;
    for (const r of rects) {
      const dx = Math.max(r[0] - x, 0, x - r[2]), dy = Math.max(r[1] - y, 0, y - r[3]);
      const dd = dx > 0 || dy > 0 ? Math.hypot(dx, dy) : 0;
      if (dd < d) { d = dd; if (!d) break; }
    }
    return (MASK + (1 - MASK) * sm(0, 22, d)) * (1 - sm(Hc - 150, Hc - 8, y)) * (floorY < 1e8 ? 1 - sm(floorY - 64, floorY - 6, y) : 1);
  }

  /* ---------- the camera: a receding plane that straightens to a slight recline, then flat as P reaches consensus ---------- */
  function tiltK(t) {
    const wallK = 1 - inOut(t / T.tilt);
    const th = (THR + (TH0 - THR) * wallK) * (1 - sm(0.02, PZ.res, P));
    return th / TH0;
  }
  function projAt(t) {
    const k = tiltK(t);
    if (k <= 0.0005) return null;
    const th = TH0 * k, c = Math.cos(th), s = Math.sin(th), z0 = 1 + 0.05 * k;
    return (x, y) => { const dy = y - core.y, f = PD / (PD - dy * s) * z0; return [core.x + (x - core.x) * f, core.y + dy * c * f, f]; };
  }
  function tiltCSS(t) {
    const k = tiltK(t);
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
    R = parseFloat(getComputedStyle(hero).getPropertyValue('--R')) || (phone ? 19 : 28);
    const hr = hero.getBoundingClientRect(), ar = anchor.getBoundingClientRect();
    core = { x: Math.round(W / 2), y: Math.round(ar.top - hr.top) };
    const Sz = 7.5 * R;
    Object.assign(mark.style, { width: Sz + 'px', height: Sz + 'px', left: (core.x - Sz / 2) + 'px', top: (core.y - Sz / 2) + 'px' });
    maxD = Math.hypot(Math.max(core.x, W - core.x), Math.max(core.y, Hc - core.y));
    RAD = phone ? 400 : (tablet ? 500 : 640);
    TH0 = (phone ? 30 : 40) * Math.PI / 180; PD = phone ? 820 : 1250;
    measure();
    for (const c of [fc, ac]) c.style.transformOrigin = `${core.x}px ${core.y}px`;
    const sx = phone ? 1.12 : 1.5, st = [[0, 0.36], [8, 0.24], [20, 0.14], [36, 0.075], [56, 0.034], [78, 0.012], [100, 0]];
    Object.assign(glowEl.style, { width: W + 'px', height: Hc + 'px', transformOrigin: `${core.x}px ${core.y}px`,
      background: `radial-gradient(ellipse ${Math.round(RAD * sx)}px ${RAD}px at ${core.x}px ${core.y}px, ${st.map(([o, a]) => `rgba(245,197,66,${a}) ${o}%`).join(', ')})` });
    tintCv.style.transformOrigin = `${core.x}px ${core.y}px`;
    lastG = -1; lastTilt = '-';
    const P1 = 1.95 * R;
    L = lattice({ R, ox: core.x, oy: core.y, x0: -0.32 * W, y0: -7 * P1, x1: 1.32 * W, y1: Hc + 2 * P1 });
    V = L.V;
    ring1 = L.rings[1] || [];
    ringVis = 0; for (const c of L.cells) if (c.x > 0 && c.x < W && c.y > 0 && c.y < Hc && c.ring > ringVis) ringVis = c.ring;
    rnd = rng(11);
    { const g = tintCv.getContext('2d'), k = RAD * 0.5;
      g.setTransform(DPR, 0, 0, DPR, 0, 0); g.clearRect(0, 0, W, Hc);
      drawField(g, L, c => c.ring >= 2 ? 0.26 * Math.exp(-(c.d * c.d) / (k * k)) * fieldAlpha(c, 1e9) : 0, { color: COL.gold }); }

    // where agents may walk, and what crossing the copy costs (routes go around it)
    walk = V.map(v => !v.core && !v.perim && v.ring >= 2 && v.x > -0.14 * W && v.x < 1.14 * W && v.y > -4 * P1 && v.y < Math.min(Hc + P1, floorY - 8));
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
        const s = artDev(V[j].x, V[j].y) * (0.6 + 0.4 * Math.min(1, V[j].d / (6 * P1))) + V[j].d * 1e-5;
        if (s < bs) { bs = s; best = j; }
      }
      parent[i] = best;
    });
    hops = new Int32Array(V.length).fill(-1);
    const hopOf = i => { let n = 0, k = i; const seen = []; while (k >= 0 && !V[k].perim && hops[k] < 0 && n < 400) { seen.push(k); k = parent[k]; n++; } let base = k < 0 ? 9999 : (V[k].perim ? 0 : hops[k]); for (let m = seen.length - 1; m >= 0; m--) hops[seen[m]] = ++base; return hops[i]; };
    V.forEach((v, i) => { if (walk[i]) hopOf(i); });
    innerNext = new Int32Array(V.length).fill(-1);
    const dIn = new Int32Array(V.length).fill(-1), qq = [];
    V.forEach((v, i) => { if (v.core) { dIn[i] = 0; qq.push(i); } });
    for (let h = 0; h < qq.length; h++) for (const j of V[qq[h]].nb) { if (dIn[j] >= 0 || !(V[j].perim || V[j].core)) continue; dIn[j] = dIn[qq[h]] + 1; innerNext[j] = qq[h]; qq.push(j); }

    // the swarm: every agent starts as a grey scout; 70% will commit when the visitor's scroll reaches their threshold
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
      const chosen = rnd() < 0.7;
      // nearer agents tend to agree first, with plenty of individual spread
      const pc = PZ.commit0 + (PZ.commit1 - PZ.commit0) * (0.62 * rnd() + 0.38 * Math.min(1, v.d / maxD));
      const a = Sx.add(id, { kind: 0, chosen, pc, born: T.wake + v.ring * T.ringMs + rnd() * 260, path: null, k: 0, kp: 0, ps: 0, pe: 1 });
      const nx = v.nb.filter(j => walk[j]);
      if (nx.length) Sx.hop(a, nx[(rnd() * nx.length) | 0], a.born + 40 + rnd() * 220, hopD());
    }
    pinged = []; flashT = -1e9;
    for (const c of ring1) c.lv = 0;
    simT = 0; END = Infinity; fieldKey = ''; phaseIdx = -1; lastDot = -2; barP = [-1, -1, -1];
    P = 0; spPrev = 0; spSeen = 0; lastMove = 0; autoT0 = -1; autoFrom = 0; autoDur = T.autoD; complete = false; completeT = 0; absorbed = 0; routing = 0;
  }
  const hopD = () => 175 + rnd() * 85;
  const pick = arr => arr[(rnd() * arr.length) | 0];

  /* ---------- a committed agent's way in: down the shared tree to the cluster, then to the core's own corners ---------- */
  function routeFrom(i) {
    if (!(hops[i] > 0 && hops[i] < 9999)) return null;
    const p = [i]; let k = i, n = 0;
    while (!V[k].perim && n++ < 400) { k = parent[k]; if (k < 0) return null; p.push(k); }
    const kp = p.length - 1;
    n = 0;
    while (!V[k].core && n++ < 8) { k = innerNext[k]; if (k < 0) return null; p.push(k); }
    return V[k].core ? { p, kp } : null;
  }
  function commit(a, at) {
    const r = routeFrom(a.from);
    if (!r) return false;
    const n = r.p.length - 1;
    a.mode = 'route'; a.kind = 1; a.path = r.p; a.kp = r.kp; a.k = 0; a.ps = P;
    a.pe = Math.min(PZ.arriveMax, Math.max(P + 0.1, P + n / V0));
    a.to = r.p[1]; a.t0 = -1e9; a.d = 1e12;    // the engine never completes this hop: P places the agent from here on
    a.x = V[a.from].x; a.y = V[a.from].y;
    routing++;
    return true;
  }
  // the visitor scrolled back past this agent's decision: it turns grey again and resumes scanning where it decided
  function uncommit(a, t) {
    if (a.dead) { a.dead = false; absorbed--; }
    a.mode = 'scan'; a.kind = 0; a.from = a.path[0]; a.prev = -1; a.path = null; a.k = 0; routing--;
    a.x = V[a.from].x; a.y = V[a.from].y; a.to = -1;
    const nx = V[a.from].nb.filter(j => walk[j] && V[j].ring >= 3);
    if (nx.length) Sx.hop(a, pick(nx), t + 30 + rnd() * 120, hopD());
  }

  function policy(a, at) {
    if (a.mode !== 'scan') return;
    const v = V[a.from];
    if (complete) return;                  // scouts are gone by then: they rest where they are, unseen
    if (P < PZ.fade0 && rnd() < (at < 900 ? 0.5 : 0.34)) {
      let livePing = 0; for (const c of pinged) if (at - c.ping < 800) livePing++;
      if (livePing < (phone ? 7 : 16)) {
        const cs = v.cells.filter(c => c.ring >= 3 && at - c.ping > 800);
        if (cs.length) { const c = pick(cs); c.ping = at; pinged.push(c); if (pinged.length > 40) pinged.splice(0, pinged.length - 40); }
      }
    }
    if (a.chosen && P >= a.pc && P < PZ.commitMax && at >= a.born + 120 && commit(a, at)) return;
    const minRing = (at > 980 || P > 0.02) ? 3 : 2;
    let opts = v.nb.filter(j => j !== a.prev && walk[j] && V[j].ring >= minRing);
    if (!opts.length) opts = v.nb.filter(j => walk[j] && V[j].ring >= 2);
    if (!opts.length) return;
    // chosen scouts drift toward the open field around the core while they scan, and lean in harder as the swarm agrees
    const bias = a.chosen ? 0.26 * sm(300, 1600, at) + 0.3 * sm(0, PZ.commit1, P) : 0;
    if (bias && rnd() < bias) { const down = opts.filter(j => dist[j] < dist[a.from]); if (down.length) opts = down; }
    Sx.hop(a, pick(opts), at + 20 + rnd() * 140, hopD());
  }

  /* ---------- the progress controller: scroll in, eased and rate-limited; autoplay when the visitor is idle ---------- */
  function control(t, sp) {
    if (complete) { P = 1; return; }
    if (Math.abs(sp - spSeen) > 1e-4) { spSeen = sp; lastMove = t; }
    if (autoT0 < 0 && t >= T.autoAt && t - lastMove >= T.idle) { autoT0 = t; autoFrom = P; autoDur = Math.max(500, T.autoD * (1 - P)); }
    const cap = clamp01((t - T.earliest) / (T.scan - T.earliest));   // the swarm always scans first: the core can light at 2s at the earliest
    const tgt = Math.min(sp, cap);
    let np = P + (tgt - P) * (1 - Math.exp(-DT / TAU));
    if (Math.abs(tgt - np) < 0.0025) np = tgt;
    np = Math.max(P - VMAX * DT, Math.min(P + VMAX * DT, np));
    if (autoT0 >= 0) np = Math.max(np, autoFrom + (1 - autoFrom) * sm(0, autoDur, t - autoT0));
    P = clamp01(np);
    if (P >= 0.9995) { P = 1; complete = true; completeT = t; END = t + T.settle; }
  }

  function step(t, sp) {
    control(t, sp);
    Sx.advance(t, policy);
    // committed agents: their place on the way in is a function of P, so scrolling back plays them back
    for (const a of Sx.agents) {
      if (a.mode !== 'route') continue;
      const n = a.path.length - 1;
      const s = (P - a.ps) / (a.pe - a.ps);
      // a little hysteresis, so a finger's jitter does not flip an agent back and forth
      if (P < a.ps - 0.012) { uncommit(a, t); continue; }
      const pos = Math.min(1, Math.max(0, s)) * n;
      a.pos = pos;
      const k = Math.min(n, Math.floor(pos));
      if (k !== a.k) {
        const lo = Math.min(k, a.k), hi = Math.max(k, a.k);
        for (let j = lo; j < hi; j++) Sx.edges.set(SL.ekey(a.path[j], a.path[j + 1]), { a: a.path[j], b: a.path[j + 1], t, k: 1, ag: a, j });
        a.k = k;
      }
      if (s >= 1) { if (!a.dead) { a.dead = true; absorbed++; flashT = t; } continue; }
      if (a.dead) { a.dead = false; absorbed--; }
      const A = V[a.path[k]], f = pos - k;
      a.from = a.path[k];
      if (k < n) { const B = V[a.path[k + 1]], e = inOut(f); a.to = a.path[k + 1]; a.x = A.x + (B.x - A.x) * e; a.y = A.y + (B.y - A.y) * e; }
      else { a.to = -1; a.x = A.x; a.y = A.y; }
    }
    // the six neighbours light as agents reach their corners (and dim again if the visitor scrolls back)
    for (const c of ring1) c.on = P >= PZ.res ? 1 : 0;
    if (P < PZ.res) for (const a of Sx.agents) {
      if (a.mode !== 'route' || a.k < a.kp) continue;
      for (const c of V[a.path[a.kp]].cells) if (c.ring === 1) c.on = 1;
    }
    const kl = 1 - Math.exp(-DT / 90);
    for (const c of ring1) c.lv += (c.on - c.lv) * kl;
  }
  const charge = () => Math.min(1, absorbed / Math.max(8, 0.6 * routing));
  function advanceTo(target, sp) {
    const t0 = simT, s0 = spPrev;
    while (simT + DT <= target) {
      simT += DT;
      step(simT, s0 + (sp - s0) * Math.min(1, (simT - t0) / Math.max(DT, target - t0)));
    }
    spPrev = sp;
  }

  /* ---------- drawing ---------- */
  const handAt = () => outCubic((P - PZ.res) / (PZ.markEnd - PZ.res));
  function glowAt() {
    const pre = 0.2 * charge() * sm(0.05, PZ.res, P);
    return Math.max(pre, P > PZ.res ? outCubic((P - PZ.res) / (1 - PZ.res)) : 0);
  }
  const scoutVis = () => 1 - sm(PZ.fade0, PZ.fade1, P);
  function fieldAlpha(c, t) {
    if (c.ring <= 1) return 0;
    const reveal = sm(c.ring * T.ringMs, c.ring * T.ringMs + 320, t);
    return reveal * Math.max(0.16, 1 - sm(0.3 * maxD, 1.05 * maxD, c.d)) * (1 - sm(Hc - 170, Hc - 6, c.y));
  }
  function renderField(t) {
    const G = glowAt();
    if (Math.abs(G - lastG) > 0.002 || (G === 0) !== (lastG === 0)) {
      glowEl.style.opacity = G.toFixed(3); tintCv.style.opacity = G.toFixed(3);
      glowEl.style.transform = G < 1 ? `scale(${(0.5 + 0.5 * G).toFixed(4)})` : '';
      lastG = G;
    }
    const tilt = tiltCSS(t);
    if (tilt !== lastTilt) { fc.style.transform = ac.style.transform = tintCv.style.transform = tilt; lastTilt = tilt; }
    const key = t < 40 * T.ringMs + 1150 ? 'f' + Math.round(t / 16) : 's';
    if (key === fieldKey) return;
    fieldKey = key;
    const g = fx;
    g.setTransform(DPR, 0, 0, DPR, 0, 0); g.clearRect(0, 0, W, Hc);
    drawField(g, L, c => fieldAlpha(c, t));
    if (t < 40 * T.ringMs + 1100) {
      drawField(g, L, c => {
        if (c.ring <= 1) return 0;
        const e = t - c.ring * T.ringMs;
        if (e < 0 || e > 1000) return 0;
        const env = e < 110 ? e / 110 : 1 - Math.pow((e - 110) / 890, 0.7);
        return env * 0.5 * Math.max(0.3, 1 - sm(0.3 * maxD, 1.05 * maxD, c.d)) * (1 - sm(Hc - 170, Hc - 6, c.y));
      }, { color: COL.hive });
    }
  }

  // lit edges and hexagonal nodes (the shared engine's drawing, plus a per-agent visibility so scouts can fade with P)
  const BK = 12;
  function drawEdgesP(g, t, alphaAt, lw) {
    const base = [0.56, 0.78], groups = [new Map(), new Map()];   // scouts a little brighter than the base hero: at rest they carry the first screen
    const put = (k, a, x0, y0, x1, y1) => { const b = Math.round(a * BK); if (b <= 0) return; const m = groups[k]; let arr = m.get(b); if (!arr) m.set(b, arr = []); arr.push(x0, y0, x1, y1); };
    const sv = scoutVis();
    for (const e of Sx.edges.values()) {
      const age = t - e.t; if (age < 0 || age > Sx.edgeFade) continue;
      const A = V[e.a], B = V[e.b];
      let al = base[e.k] * (1 - age / Sx.edgeFade);
      if (e.k === 0) al *= sv;
      else if (e.ag && e.ag.mode === 'route') al *= clamp01(1 - Math.max(e.ag.pos - e.j - 1, e.j - e.ag.pos) / TRAIL);   // behind it going in, ahead of it going back
      put(e.k, al * alphaAt((A.x + B.x) / 2, (A.y + B.y) / 2), A.x, A.y, B.x, B.y);
    }
    for (const ag of Sx.agents) {
      if (ag.dead || ag.to < 0 || t <= ag.t0) continue;
      const A = V[ag.from];
      put(ag.kind, base[ag.kind] * Sx.vis(ag, t) * (ag.mode === 'scan' ? sv : 1) * alphaAt(ag.x, ag.y), A.x, A.y, ag.x, ag.y);
    }
    g.lineWidth = lw; g.lineCap = 'round';
    const colr = [COL.muted, COL.text];
    for (let k = 0; k < 2; k++) {
      g.strokeStyle = colr[k];
      for (const [b, arr] of groups[k]) {
        g.globalAlpha = Math.min(1, b / BK); g.beginPath();
        for (let i = 0; i < arr.length; i += 4) { g.moveTo(arr[i], arr[i + 1]); g.lineTo(arr[i + 2], arr[i + 3]); }
        g.stroke();
      }
    }
    g.globalAlpha = 1; g.lineCap = 'butt';
  }
  function drawAgentsP(g, t, alphaAt, r) {
    const base = [1, 1], groups = [new Map(), new Map()], sv = scoutVis();
    for (const a of Sx.agents) {
      let al = Sx.vis(a, t); if (al <= 0) continue;
      al *= base[a.kind] * (a.mode === 'scan' ? sv : 1) * alphaAt(a.x, a.y);
      const b = Math.round(al * BK); if (b <= 0) continue;
      const m = groups[a.kind]; let arr = m.get(b); if (!arr) m.set(b, arr = []); arr.push(a);
    }
    const colr = [COL.muted, COL.text];
    for (let k = 0; k < 2; k++) {
      g.fillStyle = colr[k];
      for (const [b, arr] of groups[k]) {
        g.globalAlpha = Math.min(1, b / BK); g.beginPath();
        for (const a of arr) hexPath(g, a.x, a.y, r);
        g.fill();
      }
    }
    g.globalAlpha = 1;
  }

  function renderAgents(t, projM) {
    const g = ax;
    g.setTransform(DPR, 0, 0, DPR, 0, 0); g.clearRect(0, 0, W, Hc);
    const mP = projM ? (x, y) => { const p = projM(x, y); return maskAt(p[0], p[1]); } : maskAt;
    const hand = handAt();
    // the signal: one ring wave runs out across the field over the last stretch of the hold
    const wu = (P - PZ.wave0) / (PZ.wave1 - PZ.wave0);
    if (wu > 0 && wu < 1) {
      const front = wu * (ringVis + 18);
      drawField(g, L, c => {
        if (c.ring < 2) return 0;
        const e = front - c.ring;
        if (e < 0 || e > 18) return 0;
        const env = e < 3 ? e / 3 : 1 - (e - 3) / 15;
        return env * 0.5 * Math.max(0.25, 1 - c.ring / 28) * mP(c.x, c.y);
      }, { color: COL.hive });
    }
    // sensing: a visited cell's outline brightens briefly
    if (pinged.length) {
      const sv = scoutVis();
      drawField(g, L, c => {
        const e = t - c.ping; if (e < 0 || e > 800) return 0;
        const env = e < 120 ? e / 120 : e < 280 ? 1 : 1 - (e - 280) / 520;
        return env * 0.85 * sv * mP(c.x, c.y);
      }, { color: COL.hive });
    }
    drawEdgesP(g, t, mP, phone ? 1.25 : 1.5);
    // the cluster before the mark lands: neighbours light as agents reach their corners, the core charges
    if (hand < 1) {
      const rev1 = sm(T.ringMs, T.ringMs + 320, t);
      g.lineWidth = 1; g.strokeStyle = COL.faint; g.globalAlpha = rev1 * (1 - hand); g.beginPath();
      for (const c of ring1) if (c.lv < 0.999) hexPath(g, c.x, c.y, R * 0.97);
      g.stroke();
      g.lineWidth = 1.5; g.strokeStyle = COL.hive;
      for (const c of ring1) {
        if (c.lv < 0.01) continue;
        g.globalAlpha = c.lv * (1 - hand); g.beginPath(); hexPath(g, c.x, c.y, R * 0.97); g.stroke();
      }
      const flash = Math.max(0, 1 - (t - flashT) / 220);
      const coreA = Math.min(1, sm(0, 260, t) * (0.34 + 0.56 * charge()) + 0.25 * flash) * (1 - hand);
      if (coreA > 0.01) {
        g.globalAlpha = coreA; g.strokeStyle = COL.gold; g.lineWidth = 1.5; g.beginPath();
        hexPath(g, core.x, core.y, R * 0.825); g.stroke();
      }
      g.globalAlpha = 1;
    }
    drawAgentsP(g, t, mP, phone ? 2.4 : 3);
    mark.style.opacity = hand ? hand.toFixed(3) : '0';
    mark.style.transform = hand < 1 ? `scale(${(0.93 + 0.07 * hand).toFixed(4)})` : '';
  }

  // Scout 03 follows the swarm: Scan fills over the scan, Analyze with the visitor's scroll, Report as the core lights
  function updatePhase(t) {
    const idx = P < 0.012 ? 0 : (P < PZ.res ? 1 : 2);
    if (card) {
      const dots = card.querySelectorAll('.spin i');
      const on = !complete && !S.reduce ? Math.floor(t / 80) % 6 : -1;
      if (dots.length && on !== lastDot) { dots.forEach((d, k) => d.classList.toggle('on', k === on)); lastDot = on; }
      const sp = card.querySelector('.spin'); if (sp) sp.classList.toggle('done', on < 0);
      const bars = card.querySelectorAll('.sc-steps li');
      const ps = [clamp01(Math.max(t / T.scan, P / 0.02)), clamp01(P / PZ.res), clamp01((P - PZ.res) / (PZ.markEnd - PZ.res))];
      bars.forEach((li, k) => {
        const v = Math.round(ps[k] * 400) / 400;
        if (v === barP[k]) return;
        barP[k] = v; li.style.setProperty('--p', v); li.classList.toggle('filling', v > 0 && v < 1);
      });
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
    renderAgents(t, projAt(t));
    updatePhase(t);
  }

  /* ---------- the hold ---------- */
  let pinTop = 0, roomPx = 0, released = false, touching = false, idleT = 0;
  function measurePin() {
    if (!pinOn) { roomPx = 0; return; }
    pinTop = pinEl.getBoundingClientRect().top + window.scrollY;
    roomPx = room.offsetHeight;
  }
  // how far the visitor is through the hold (0 to 1); P reaches 1 at PZ.hold, the rest is a still beat before release
  function readSP() {
    if (!pinOn) return 0;
    const y = window.scrollY - pinTop;
    if (roomPx <= 0) return y > 0 ? 1 : 0;
    return clamp01(y / (PZ.hold * roomPx));
  }
  function updatePinned() {
    if (!pinOn) return;
    root.classList.toggle('h4-pinned', window.scrollY - pinTop < roomPx + 8);
  }
  // once the core has lit, the hold ends where the visitor is: the rest of the room below goes (nothing on screen moves)
  function release() {
    if (released || !pinOn) return;
    released = true;
    const y = Math.max(0, window.scrollY - pinTop);
    if (y < roomPx) { room.style.height = Math.round(y) + 'px'; roomPx = room.offsetHeight; updatePinned(); }
  }
  // after the visitor has moved on, the remaining room above them collapses while they are idle, with the scroll
  // position compensated in the same frame, so scrolling back up never passes through a dead hold
  function collapse() {
    if (!released || roomPx <= 0 || touching) return;
    if (pinEl.getBoundingClientRect().bottom > -40) return;
    const y = window.scrollY, h = roomPx;
    const sb = root.style.scrollBehavior, oa = root.style.overflowAnchor;
    root.style.scrollBehavior = 'auto'; root.style.overflowAnchor = 'none';
    room.style.height = '0px'; roomPx = 0;
    window.scrollTo(0, Math.max(0, y - h));
    requestAnimationFrame(() => { root.style.scrollBehavior = sb; root.style.overflowAnchor = oa; });
    updatePinned();
  }

  /* ---------- lifecycle ---------- */
  let raf = 0, last = 0, wall = 0, visible = true, motionOff = false, done = false;
  const canRun = () => live && !done && visible && !document.hidden && !motionOff;
  function finish() {
    if (!complete) { complete = true; completeT = simT; P = 1; END = simT + T.settle; }
    advanceTo(Math.max(simT + DT, END + 320, 6200), 1);
    render(simT); done = true; document.documentElement.dataset.heroReady = '1';
    release();
  }
  function frame(now) {
    raf = 0;
    if (!canRun()) return;
    wall += last ? Math.min(2500, now - last) : DT;
    last = now;
    const sp = readSP();
    if (!complete) inputs.push([wall, sp]);
    advanceTo(wall, sp);
    if (complete) release();
    if (complete && simT > END) { finish(); return; }
    render(simT);
    raf = requestAnimationFrame(frame);
  }
  function kick() { if (!raf && canRun()) { last = 0; raf = requestAnimationFrame(frame); } }

  function start() {
    measurePin();
    setup();
    inputs = []; wall = 0;
    if (!live) {
      if (S.reduce) { finish(); return; }
      advanceTo(S.freeze, readSP()); render(simT);
      if (complete) release();
      document.documentElement.dataset.heroReady = '1';
      return;
    }
    render(0);
    kick();
  }
  // rebuild for a new layout and replay the same inputs (the simulation is deterministic given its inputs)
  function rebuild() {
    measurePin();
    const wasDone = done, wasComplete = complete, log = inputs;
    setup();
    if (!live) { if (S.reduce) finish(); else { advanceTo(S.freeze, readSP()); render(simT); } return; }
    if (wasDone || wasComplete || motionOff) { done = false; finish(); return; }
    inputs = log;
    for (const [t, sp] of log) advanceTo(t, sp);
    render(simT); kick();
  }

  start();
  updatePinned();
  // frame-accurate captures: with ?t=<ms>, window.__heroSeek(ms) steps the frozen hero (with ?pin=1 it reads the scroll too)
  if (!live && !S.reduce) window.__heroSeek = t => {
    if (t < simT) { setup(); released = false; }
    advanceTo(t, readSP()); render(simT);
    if (complete) release();
    updatePinned();
    return simT;
  };
  window.__heroInfo = () => ({ t: Math.round(simT), P: +P.toFixed(4), complete, auto: autoT0, routing, absorbed, roomPx, pinTop });

  if (pinOn) {
    window.addEventListener('scroll', () => {
      updatePinned();
      clearTimeout(idleT); idleT = setTimeout(collapse, 350);
      if (live && !done && !complete) kick();
    }, { passive: true });
    window.addEventListener('touchstart', () => { touching = true; }, { passive: true });
    window.addEventListener('touchend', () => { touching = false; clearTimeout(idleT); idleT = setTimeout(collapse, 350); }, { passive: true });
    window.addEventListener('touchcancel', () => { touching = false; }, { passive: true });
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(es => {
      for (const e of es) {
        visible = e.isIntersecting;
        // a hero that leaves the screen unfinished is finished, so it is never found frozen halfway
        if (!visible && live && !done) finish();
        if (visible) kick();
      }
    }, { threshold: 0 }).observe(hero);
  }
  document.addEventListener('visibilitychange', kick);
  window.addEventListener('swarm:motion', e => { motionOff = !!(e.detail && e.detail.off); if (motionOff && live && !done) finish(); });

  let lastW = W, rt = 0;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      measurePin(); updatePinned();
      if (hero.clientWidth === lastW) return;
      lastW = hero.clientWidth;
      rebuild();
    }, 160);
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { lastW = hero.clientWidth; rebuild(); });
})();
