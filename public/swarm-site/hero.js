/* Swarm A, Core Glow: the hero (Canvas 2D, two canvases, official swarm-mark.svg on the core cell).
   The honeycomb and the unlit Hive Core are drawn at first paint, and the swarm starts at once (it does not wait for
   the fonts). Every agent is the page's agent glyph: a hex outline with a head node.
     0 to 0.6s   72 agents (28 on phones) spread over the whole first screen, outside the copy: the top band, the
                 outer columns, the gaps beside the cards. Each drifts one channel of the honeycomb, dim.
     0.15 to 0.9s each one senses: a hex ring opens around it (0 to 20px, muted, 420ms), it holds 120ms, then its head
                 lights: decided.
     ~0.8 to 1.5s twelve routes light along the honeycomb (six on phones), one into each side of each neighbour cell,
                 and the decided agents commit along them as trains, in step, never closing the gap between them.
                 The lower routes climb the outer columns and turn in above the chips.
     1.6 to 2.35s arrivals, clockwise. Each neighbour cell lights grey as its first train reaches it; the core charges.
     2.4s        ignition: the official mark lands (scale 1, 1.08, 1) and the warm light opens to its peak at 2.8s,
                 reaching the chip row; one ring wave runs out across the field.
     3.2s        still (phones run 8% faster: 2.95s). The rest frame keeps the twelve routes as quiet #232328 traces
                 on the honeycomb and twelve dim agents parked around the core (eight on phones).
   Positions are a pure function of time, so ?t=<ms>, the reduced-motion still (?reduce=1) and the settled frame are
   exact. No agent, route or ring ever enters the copy. No text is drawn on canvas. */
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
  const { COL, clamp01, sm, outCubic, rng, hexPath, lattice, drawField, drawGlyphs } = SL;

  const BASE = { drift: 380, ring: 420, hold: 120, draw: 300, ignite: 2400, markIn: 280, pulse: 560, glowIn: 400, end: 3200 };
  let T = BASE;
  const STATES = [
    ['SCANNING', 'Scanning', 'the market', 'Scanning'],
    ['ANALYZING', 'Analyzing', 'a setup', 'Analyzing'],
    ['REPORTING', 'Reporting', 'to the watch list', 'Reporting']
  ];

  let W, Hc, DPR, phone, tablet, R, P, Rc, core, maxD, L, V, glowEl, rects, quiet, floorY, walk, ring1;
  let streams, agents, edgesLit, gR, lastG = -1, lastMark = '', phaseIdx = -1, lastDot = -2, sig = '';

  /* ---------- the copy, the cards and the nav, in hero space ---------- */
  function measure() {
    const hr = hero.getBoundingClientRect();
    const box = r => [r.left - hr.left, r.top - hr.top, r.right - hr.left, r.bottom - hr.top];
    rects = []; quiet = [];
    const pad = phone ? 12 : 22;
    hero.querySelectorAll('.hero-copy [data-avoid]').forEach(el => {
      if (el.offsetParent === null) return;
      if (el.dataset.avoid === 'lines') {
        // the real glyph boxes, line by line (text nodes, so a block span never reads as a full-width box)
        const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), rg = document.createRange();
        for (let n = tw.nextNode(); n; n = tw.nextNode()) {
          if (!n.textContent.trim()) continue;
          rg.selectNodeContents(n);
          for (const r of rg.getClientRects()) if (r.width > 1 && r.height > 1) {
            const b = box(r); rects.push([b[0] - pad, b[1] - pad * 0.75, b[2] + pad, b[3] + pad * 0.75]);
            if (el.tagName !== 'H1') quiet.push(b);
          }
        }
      } else { const r = el.getBoundingClientRect(); if (r.width && r.height) { const b = box(r); rects.push([b[0] - pad, b[1] - pad, b[2] + pad, b[3] + pad]); } }
    });
    // on phones the copy fills the width: keep the whole column clear, so nothing flickers in the gaps between lines
    if (phone) {
      const cp = hero.querySelector('.hero-copy'), r = cp && cp.getBoundingClientRect();
      if (r) { const b = box(r); rects.push([-20, b[1] - pad, W + 20, b[3] + pad]); }
    }
    hero.querySelectorAll('.qcard').forEach(el => { if (el.offsetParent === null) return; const b = box(el.getBoundingClientRect()); rects.push([b[0] - 12, b[1] - 12, b[2] + 12, b[3] + 12]); });
    if (window.scrollY < 10) document.querySelectorAll('.nav-logo, .nav .btn-line').forEach(el => { const b = box(el.getBoundingClientRect()); rects.push([b[0] - 10, b[1] - 10, b[2] + 10, b[3] + 10]); });
    const rail = hero.querySelector('.hero-rail .hr-in');
    floorY = rail && rail.offsetParent !== null ? rail.getBoundingClientRect().top - hr.top : 1e9;
    return rects.map(r => r.map(Math.round).join(',')).join('|');
  }
  const inRect = (x, y, m) => { for (const r of rects) if (x > r[0] - m && x < r[2] + m && y > r[1] - m && y < r[3] + m) return true; return false; };
  const dRect = (r, x, y) => { const dx = Math.max(r[0] - x, 0, x - r[2]), dy = Math.max(r[1] - y, 0, y - r[3]); return dx || dy ? Math.hypot(dx, dy) : 0; };
  function quietAt(x, y) { let d = 1e9; for (const r of quiet) d = Math.min(d, dRect(r, x, y)); return 0.28 + 0.72 * sm(0, 40, d); }

  /* ---------- geometry helpers ---------- */
  const ang = (x, y) => Math.atan2(y - core.y, x - core.x);
  const angDiff = (a, b) => { let d = Math.abs(a - b) % (2 * Math.PI); return d > Math.PI ? 2 * Math.PI - d : d; };
  let eCache = new Map();
  const edgeOK = (a, b) => {
    const k = a < b ? a * 65536 + b : b * 65536 + a; let r = eCache.get(k);
    if (r === undefined) { const A = V[a], B = V[b], m = phone ? 6 : 9; r = true; for (const f of [0.25, 0.5, 0.75]) if (inRect(A.x + (B.x - A.x) * f, A.y + (B.y - A.y) * f, m)) { r = false; break; } eCache.set(k, r); }
    return r;
  };
  // cheapest route on the walkable lattice (Dijkstra; cost per hop 1 plus a penalty on vertices other routes use)
  function route(from, goalSet, cost) {
    const dist = new Map([[from, 0]]), par = new Map(), heap = [[0, from]];
    const push = e => { heap.push(e); let i = heap.length - 1; while (i > 0) { const p2 = (i - 1) >> 1; if (heap[p2][0] <= heap[i][0]) break; [heap[p2], heap[i]] = [heap[i], heap[p2]]; i = p2; } };
    const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
    while (heap.length) {
      const [d, i] = pop();
      if (d > dist.get(i)) continue;
      if (goalSet.has(i)) { const p = [i]; for (let k = i; par.has(k); k = par.get(k)) p.push(par.get(k)); return p.reverse(); }
      for (const j of V[i].nb) {
        if (!(walk[j] || goalSet.has(j)) || !edgeOK(i, j)) continue;
        const nd = d + 1 + (cost ? cost(j) : 0);
        if (nd < (dist.has(j) ? dist.get(j) : 1e9)) { dist.set(j, nd); par.set(j, i); push([nd, j]); }
      }
    }
    return null;
  }
  // a velocity profile with a soft start and a short settle: the trains move in step, mostly at cruise speed
  const ACC = 0.3, DEC = 0.14, VMAX = 1 / (1 - ACC / 2 - DEC / 2);
  const prof = u => u <= 0 ? 0 : u >= 1 ? 1 : u < ACC ? VMAX * u * u / (2 * ACC) : u < 1 - DEC ? VMAX * (u - ACC / 2) : 1 - VMAX * (1 - u) * (1 - u) / (2 * DEC);
  const profInv = y => { let lo = 0, hi = 1; for (let i = 0; i < 32; i++) { const m = (lo + hi) / 2; if (prof(m) < y) lo = m; else hi = m; } return (lo + hi) / 2; };
  function along(path, cum, s, out) {
    if (s <= 0) { out[0] = V[path[0]].x; out[1] = V[path[0]].y; return 0; }
    const n = path.length - 1;
    if (s >= cum[n]) { out[0] = V[path[n]].x; out[1] = V[path[n]].y; return n; }
    let i = 0; while (i < n - 1 && cum[i + 1] < s) i++;
    const f = (s - cum[i]) / (cum[i + 1] - cum[i]), A = V[path[i]], B = V[path[i + 1]];
    out[0] = A.x + (B.x - A.x) * f; out[1] = A.y + (B.y - A.y) * f; return i + f;
  }
  const cumOf = path => { const c = [0]; for (let i = 1; i < path.length; i++) c.push(c[i - 1] + Math.hypot(V[path[i]].x - V[path[i - 1]].x, V[path[i]].y - V[path[i - 1]].y)); return c; };

  /* ---------- the plan: lattice, twelve routes, the trains, the parkers ---------- */
  function setup(fieldOnly) {
    const t0 = performance.now();
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = hero.clientWidth;
    const vh = window.innerHeight || 900;
    Hc = Math.round(Math.min(hero.clientHeight, Math.max(vh, 640) + 120));
    phone = W <= 640; tablet = !phone && W < 1240;
    const k = phone ? 0.92 : 1;
    T = {}; for (const key in BASE) T[key] = BASE[key] * k;
    if (!glowEl) { glowEl = document.createElement('div'); glowEl.className = 'hero-glow'; fc.before(glowEl); }
    for (const c of [fc, ac]) { c.width = Math.round(W * DPR); c.height = Math.round(Hc * DPR); c.style.width = W + 'px'; c.style.height = Hc + 'px'; }
    R = parseFloat(getComputedStyle(hero).getPropertyValue('--R')) || (phone ? 25 : 38);
    P = 1.95 * R; Rc = P / SL.SQ3;
    const hr = hero.getBoundingClientRect(), ar = anchor.getBoundingClientRect();
    core = { x: Math.round(W / 2), y: Math.round(ar.top - hr.top) };
    const Sz = 7.5 * R;
    Object.assign(mark.style, { width: Sz + 'px', height: Sz + 'px', left: (core.x - Sz / 2) + 'px', top: (core.y - Sz / 2) + 'px' });
    maxD = Math.hypot(Math.max(core.x, W - core.x), Math.max(core.y, Hc - core.y));
    sig = measure();
    // the core's warm light: one soft ellipse under the field, wide enough to reach the chip row
    const gw = phone ? 230 : (tablet ? 420 : 600), gh = phone ? 200 : (tablet ? 320 : 430);
    const st = [[0, 0.36], [7, 0.29], [16, 0.18], [30, 0.095], [48, 0.042], [70, 0.013], [100, 0]];
    Object.assign(glowEl.style, { left: (core.x - gw) + 'px', top: (core.y - gh) + 'px', width: 2 * gw + 'px', height: 2 * gh + 'px',
      background: `radial-gradient(closest-side, ${st.map(([o, a]) => `rgba(245,197,66,${a}) ${o}%`).join(', ')})` });
    lastG = -1; lastMark = ''; phaseIdx = -1; lastDot = -2;

    L = lattice({ R, ox: core.x, oy: core.y, x0: -0.1 * W, y0: -3 * P, x1: 1.1 * W, y1: Hc + 2 * P });
    V = L.V; eCache = new Map();
    const yMax = Math.min(Hc - 40, floorY - 26), m = phone ? 7 : 10;
    walk = V.map(v => !v.core && !v.perim && v.x > 10 && v.x < W - 10 && v.y > 8 && v.y < yMax && !inRect(v.x, v.y, m));
    gR = phone ? 6.5 : 9;
    ring1 = (L.rings[1] || []).slice();
    for (const c of ring1) c.lit = 1e9;
    if (fieldOnly) { streams = []; agents = []; edgesLit = []; return; }
    const rnd = rng(phone ? 17 : 11);

    // twelve gates (six on phones): each outer corner of each neighbour cell, down that neighbour's side to the core
    const gates = [];
    for (const nc of ring1) {
      for (const v of V) {
        if (!v.perim || !v.cells.includes(nc) || v.cells.filter(c => c.ring === 1).length !== 1) continue;
        const valley = v.nb.find(j => V[j].perim && V[j].cells.includes(nc) && V[j].cells.filter(c => c.ring === 1).length === 2);
        if (valley === undefined) continue;
        const cc = V[valley].nb.find(j => V[j].core);
        if (cc === undefined) continue;
        gates.push({ O: v.i, valley, cc, cell: nc, a: ang(v.x, v.y) });
      }
    }
    // a gate is usable when the open lattice reaches its corner
    for (const gt of gates) gt.ok = V[gt.O].nb.some(j => walk[j] && edgeOK(gt.O, j));
    // where the routes start: the far ends of the free field, in twelve directions (the lower ones climb the outer columns)
    const reach = new Set(), rq = [];
    for (const gt of gates) if (gt.ok) for (const j of V[gt.O].nb) if (walk[j] && edgeOK(gt.O, j) && !reach.has(j)) { reach.add(j); rq.push(j); }
    for (let h = 0; h < rq.length; h++) for (const j of V[rq[h]].nb) if (walk[j] && !reach.has(j) && edgeOK(rq[h], j)) { reach.add(j); rq.push(j); }
    const dirsD = [146, 172, 188, 203, 218, 236, 34, 8, -8, -23, -38, -56], dirsP = [170, 196, 222, 10, -16, -42];
    const dirs = (phone ? dirsP : dirsD).map(d => d * Math.PI / 180);
    const usedV = new Map(), starts = new Set();
    const cost = j => (usedV.get(j) || 0) * 30;
    streams = [];
    const gateLoad = new Map();
    for (const dir of dirs) {
      // the farthest open vertex inside a narrow cone around this direction
      let best = -1, bd = 0;
      for (let cone = 7; cone <= 32 && best < 0; cone += 5) {
        for (let i = 0; i < V.length; i++) {
          if (!reach.has(i) || starts.has(i)) continue;
          const v = V[i]; if (angDiff(ang(v.x, v.y), dir) > cone * Math.PI / 180) continue;
          if (v.d > bd && v.d > (phone ? 2.2 : 1.9) * P) { bd = v.d; best = i; }
        }
      }
      if (best < 0) continue;
      starts.add(best);
      // the closest usable gate by angle (at most two routes share a gate)
      const cand = gates.filter(g => g.ok && (gateLoad.get(g) || 0) < 2).sort((a, b) => (angDiff(a.a, dir) + 0.6 * (gateLoad.get(a) || 0)) - (angDiff(b.a, dir) + 0.6 * (gateLoad.get(b) || 0)));
      let path = null, gate = null;
      for (const gt of cand.slice(0, 4)) { path = route(best, new Set([gt.O]), cost); if (path) { gate = gt; break; } }
      if (!path || path.length < 3) continue;
      // keep every route within reach of one smooth run: start the longest ones further in
      const maxHops = phone ? 12 : 26;
      if (path.length > maxHops) path = path.slice(path.length - maxHops);
      gateLoad.set(gate, (gateLoad.get(gate) || 0) + 1);
      for (const i of path) usedV.set(i, (usedV.get(i) || 0) + 1);
      path.push(gate.valley, gate.cc);
      streams.push({ dir, path, cum: cumOf(path), gate, hO: path.length - 3 });
    }
    // order the arrivals clockwise from the left
    streams.sort((a, b) => ((a.dir + 2 * Math.PI) % (2 * Math.PI)) - ((b.dir + 2 * Math.PI) % (2 * Math.PI)));
    const onRoute = new Set(); for (const s of streams) for (const i of s.path) onRoute.add(i);

    agents = [];
    const per = phone ? 3 : 4, perLong = phone ? 3 : 7;
    const taken = new Set();
    const nbOff = i => V[i].nb.filter(j => walk[j] && !onRoute.has(j) && !taken.has(j) && edgeOK(i, j));
    const kT = T.end / BASE.end;
    // a train's timing from its last arrival A: the cruise speed sets when it leaves, and each agent senses before that
    function timeStream(st) {
      const tr = agents.filter(a => a.st === st); if (!tr.length) return;
      const total = st.cum[st.cum.length - 1], pRear = Math.min(...tr.map(a => a.p));
      st.Lr = total - pRear;
      const vCruise = phone ? 0.34 : 0.62;                               // px per ms
      let D = st.A - st.Lr / (vCruise * VMAX * 0.82);
      const senseBase = Math.max(150 * kT, Math.min(700 * kT, D - 40 - T.ring - T.hold - (tr.length - 1) * 60));
      D = Math.max(D, senseBase + (tr.length - 1) * 60 + T.ring + T.hold + 40);
      st.D = D; st.drawT = D - 300 * kT;
      tr.sort((x, y) => x.p - y.p).forEach((a, r) => { a.sense = senseBase + r * 60; a.arr = st.D + profInv((total - a.p) / st.Lr) * (st.A - st.D); a.park = undefined; });
      // the rear of each train stops two corners short of its neighbour cell and stays there, dim: the rest frame
      // keeps one agent on every route
      const parkOne = (a, k) => { const stop = st.cum[Math.max(0, st.hO - k)]; if (stop > a.p + 1) { a.park = stop; a.parkT = st.D + profInv((stop - a.p) / st.Lr) * (st.A - st.D); a.arr = 1e9; return true; } return false; };
      if (tr.length >= 2) { if (!parkOne(tr[0], 2)) parkOne(tr[0], 1); }
    }
    streams.forEach((st, si) => {
      const n = st.path.length - 2;                                     // vertices up to the gate
      const want = n > 18 ? perLong : per;
      const gap = Math.max(1, Math.min(3, Math.floor((n - 1) / want)));
      const idx = [];
      for (let ix = 0; ix <= n - 1 && idx.length < want; ix++) {
        if (taken.has(st.path[ix]) || (idx.length && ix - idx[idx.length - 1] < gap)) continue;
        if (st.path.slice(Math.max(0, ix - 1), ix + 2).some(v => taken.has(v))) continue;
        idx.push(ix);
      }
      // the last arrival of this train: clockwise from the left, 1.95s to 2.2s (conflicts below may push it later)
      st.A = (1950 + (streams.length > 1 ? si / (streams.length - 1) : 0) * 250) * kT;
      idx.forEach(ix => {
        const home = st.path[ix];
        taken.add(home);
        const offs = nbOff(home); const q = offs.length ? offs[(rnd() * offs.length) | 0] : home;
        if (q !== home) taken.add(q);
        agents.push({ kind: 'train', st, p: st.cum[ix], q, home, born: rnd() * 140, d0: 80 + rnd() * 180, sense: 0, arr: 0 });
      });
      timeStream(st);
    });
    const nFade = phone ? 9 : 22;
    const free = V.map((v, i) => i).filter(i => walk[i] && !onRoute.has(i) && !taken.has(i));
    const pickFree = (near) => {
      let best = -1, bs = -1e9;
      for (let tries = 0; tries < 40; tries++) {
        const i = free[(rnd() * free.length) | 0]; if (taken.has(i)) continue;
        const s = near ? -Math.abs(V[i].d - near) + rnd() * 30 : rnd();
        if (s > bs) { bs = s; best = i; }
      }
      return best;
    };
    // scouts that sense and stand down: they fade where they are
    for (let k2 = 0; k2 < nFade; k2++) {
      const home = pickFree(0); if (home < 0) break;
      taken.add(home);
      const offs = nbOff(home); const q = offs.length ? offs[(rnd() * offs.length) | 0] : home;
      if (q !== home) taken.add(q);
      const s0 = (300 + rnd() * 600) * (T.end / BASE.end);
      agents.push({ kind: 'fade', q, home, born: rnd() * 140, d0: 80 + rnd() * 200, sense: s0, out: s0 + T.ring + T.hold + 200 + rnd() * 500 });
    }
    // never let two agents touch: where two would come closer than 1.25 glyph widths (outside the core's own cells,
    // where they merge into the core), a later train waits a beat, or the less important agent is left out
    const prio = a => a.kind === 'train' ? 2 : 1;
    const AMAX = 2360 * kT;
    const cellSz = 2.5 * gR;
    for (let pass = 0; pass < 16; pass++) {
      const drop = new Set(), shift = new Set(), o = {};
      for (let t = 0; t <= T.end; t += 40) {
        const grid = new Map();
        for (const a of agents) {
          if (drop.has(a)) continue; agentAt(a, t, o);
          if (o.a <= 0.25 || Math.hypot(o.x - core.x, o.y - core.y) <= 1.75 * P) continue;
          const gx = Math.floor(o.x / cellSz), gy = Math.floor(o.y / cellSz);
          for (let ix = gx - 1; ix <= gx + 1; ix++) for (let iy = gy - 1; iy <= gy + 1; iy++) {
            const cell = grid.get(ix * 4096 + iy); if (!cell) continue;
            for (const [x, y, B] of cell) {
              if (Math.hypot(o.x - x, o.y - y) >= cellSz) continue;
              if (a.kind === 'train' && B.kind === 'train' && a.st !== B.st) {
                const late = a.st.A >= B.st.A ? a.st : B.st;
                if (late.A + 130 * kT <= AMAX) { shift.add(late); continue; }
              }
              drop.add(prio(a) < prio(B) ? a : (prio(B) < prio(a) ? B : (a.p > B.p ? a : B)));
            }
          }
          const k = gx * 4096 + gy; let cell = grid.get(k); if (!cell) grid.set(k, cell = []); cell.push([o.x, o.y, a]);
        }
      }
      if (!drop.size && !shift.size) break;
      // shifts first (a later train may clear the clash on its own); drops only when nothing moved
      if (shift.size) { for (const st of shift) st.A += 130 * kT; }
      else agents = agents.filter(a => !drop.has(a));
      for (const st of streams) timeStream(st);
    }
    streams = streams.filter(st => agents.some(a => a.st === st));
    for (const st of streams) {
      // when the train first reaches the gate, that neighbour lights
      const front = Math.max(...agents.filter(a => a.st === st).map(a => a.p));
      st.gate.cell.lit = Math.min(st.gate.cell.lit, st.D + profInv(Math.max(0, st.cum[st.hO] - front) / st.Lr) * (st.A - st.D));
    }
    // the scouts nearest the core (but clear of the cluster) stay where they are, dim, with the parked train ends
    const nearFades = agents.filter(a => a.kind === 'fade').sort((x, y) => V[x.home].d - V[y.home].d);
    let stay = 0;
    for (const a of nearFades) {
      if (stay >= (phone ? 2 : 5)) break;
      if (V[a.home].d < 2.2 * P || V[a.home].d > 10 * P || V[a.home].y > core.y + 2.4 * R) continue;
      a.stay = true; stay++;
    }
    // all the route edges, for the lit routes and the rest-frame traces
    edgesLit = [];
    for (const st of streams) {
      const pRear = Math.min(...agents.filter(a => a.st === st).map(a => a.p));
      for (let i = 0; i < st.path.length - 1; i++) {
        // when the rear of the train has passed this edge, it settles to a trace
        const pass = st.D + profInv(clamp01((st.cum[i + 1] - pRear) / st.Lr)) * (st.A - st.D);
        edgesLit.push({ a: st.path[i], b: st.path[i + 1], on: st.drawT + (i / Math.max(1, st.path.length - 2)) * 300 * kT, pass });
      }
    }
    window.__heroPlan = { streams: streams.length, agents: agents.length, trains: agents.filter(a => a.kind === 'train').length, parked: agents.filter(a => a.park !== undefined).length, fades: agents.filter(a => a.kind === 'fade').length, rest: agents.filter(a => a.park !== undefined || a.stay).length, R, core, setupMs: Math.round(performance.now() - t0) };
  }

  /* ---------- where everything is at time t ---------- */
  const pt = [0, 0];
  function agentAt(a, t, out) {
    // drift: one channel, from q to home
    {
      const A = V[a.q], B = V[a.home];
      const f = a.d0 < 0 ? 1 : SL.inOut((t - a.d0) / T.drift);
      out.x = A.x + (B.x - A.x) * f; out.y = A.y + (B.y - A.y) * f; out.moving = f > 0 && f < 1; out.edge = f > 0 ? [a.q, a.home, a.d0 + T.drift] : null;
    }
    out.a = 0.35 * clamp01((t - a.born) / 200); out.k = 0; out.r = gR;
    const decided = sm(a.sense + T.ring, a.sense + T.ring + T.hold, t);
    if (a.kind === 'train') {
      const st = a.st;
      if (t >= st.D) {
        const G = st.Lr * prof((t - st.D) / (st.A - st.D));
        const s = a.park !== undefined ? Math.min(a.park, a.p + G) : a.p + G;
        along(st.path, st.cum, s, pt); out.x = pt[0]; out.y = pt[1]; out.moving = t < a.arr;
        out.edge = null;
        const toEnd = st.cum[st.cum.length - 1] - s;
        out.a = toEnd < 0.6 * Rc ? clamp01(toEnd / (0.6 * Rc)) : 1;
        if (t >= a.arr) out.a = 0;
        if (a.park !== undefined && t >= a.parkT) { out.moving = false; const f = sm(a.parkT, a.parkT + 500, t); out.a = 1 - 0.45 * f; if (f > 0.5) out.k = 0; }
      } else out.a = out.a + (1 - out.a) * decided;
      if (!(a.park !== undefined && t >= a.parkT + 250)) out.k = decided > 0.5 ? 1 : 0;
    } else {
      if (!a.stay) out.a *= 1 - sm(a.out, a.out + 420, t);
      else out.a *= 1 + 0.25 * sm(a.out, a.out + 420, t);
      out.a = Math.max(out.a, 0) ;
      if (t < a.out) out.a = out.a + (0.55 - out.a) * decided * 0.6;
    }
    return out;
  }
  const absorbedAt = t => { let n = 0, tot = 0; for (const a of agents) if (a.kind === 'train' && a.park === undefined) { tot++; if (t >= a.arr) n++; } return [n, tot]; };

  /* ---------- drawing ---------- */
  function fieldA(c) {
    if (c.ring <= 1) return 0;
    return Math.max(0.16, 1 - sm(0.3 * maxD, 1.05 * maxD, c.d)) * (1 - sm(Hc - 170, Hc - 6, c.y)) * quietAt(c.x, c.y);
  }
  function renderField() {
    fx.setTransform(DPR, 0, 0, DPR, 0, 0); fx.clearRect(0, 0, W, Hc);
    drawField(fx, L, fieldA);
  }
  function glowAt(t) {
    const [n, tot] = absorbedAt(t);
    const pre = 0.18 * (tot ? n / tot : 0);
    return Math.max(pre, t >= T.ignite ? outCubic((t - T.ignite) / T.glowIn) : 0);
  }

  const tmp = {};
  function renderAgents(t) {
    const g = ax;
    g.setTransform(DPR, 0, 0, DPR, 0, 0); g.clearRect(0, 0, W, Hc);
    const hand = t >= T.ignite ? outCubic((t - T.ignite) / T.markIn) : 0;
    // the signal: one ring wave runs out across the field as the core ignites
    if (t >= T.ignite && t < T.ignite + 900) {
      drawField(g, L, c => {
        if (c.ring < 2 || c.ring > 22) return 0;
        const e = t - (T.ignite + 40 + c.ring * 18);
        if (e < 0) return 0;
        const env = e < 80 ? e / 80 : Math.max(0, 1 - (e - 80) / 300);
        return inRect(c.x, c.y, 0) ? 0 : env * 0.42 * Math.max(0.2, 1 - c.ring / 22);
      }, { color: COL.hive });
    }
    // the routes: drawn in as the trains decide, bright while the train runs, then a quiet trace on the honeycomb
    const traces = [], lit = new Map();
    for (const e of edgesLit) {
      if (t < e.on) continue;
      const A = V[e.a], B = V[e.b];
      const f = clamp01((t - e.on) / 70);
      const bx = A.x + (B.x - A.x) * f, by = A.y + (B.y - A.y) * f;
      traces.push(A.x, A.y, bx, by);
      const h = 0.46 * (1 - sm(e.pass, e.pass + 420, t));
      const bk = Math.round(h * 12); if (bk > 0) { let arr = lit.get(bk); if (!arr) lit.set(bk, arr = []); arr.push(A.x, A.y, bx, by); }
    }
    g.lineCap = 'round';
    if (traces.length) {
      g.globalAlpha = 0.42; g.strokeStyle = COL.hive; g.lineWidth = phone ? 1.1 : 1.25; g.beginPath();
      for (let i = 0; i < traces.length; i += 4) { g.moveTo(traces[i], traces[i + 1]); g.lineTo(traces[i + 2], traces[i + 3]); }
      g.stroke();
    }
    g.strokeStyle = COL.hive;
    for (const [bk, arr] of lit) { g.globalAlpha = bk / 12; g.beginPath(); for (let i = 0; i < arr.length; i += 4) { g.moveTo(arr[i], arr[i + 1]); g.lineTo(arr[i + 2], arr[i + 3]); } g.stroke(); }
    g.lineCap = 'butt'; g.globalAlpha = 1;

    const list = [];
    g.lineWidth = 1; g.strokeStyle = COL.muted;
    for (const a of agents) {
      const o = agentAt(a, t, tmp);
      // the channel a drifting agent crosses lights briefly
      if (o.edge && t < o.edge[2] + 500) {
        const A = V[o.edge[0]], B = V[o.edge[1]];
        const al = 0.3 * (t < o.edge[2] ? 1 : 1 - (t - o.edge[2]) / 500);
        if (al > 0.02) { g.globalAlpha = al; g.beginPath(); g.moveTo(A.x, A.y); g.lineTo(o.x, o.y); g.stroke(); }
      }
      // sensing: a hex ring opens around the agent
      const e = (t - a.sense) / T.ring;
      if (e >= 0 && e <= 1 && o.a > 0.01) {
        g.globalAlpha = 0.5 * (1 - e); g.beginPath(); hexPath(g, o.x, o.y, gR + (phone ? 10 : 14) * outCubic(e)); g.stroke();
      }
      if (o.a > 0.01) list.push({ x: o.x, y: o.y, a: o.a, k: o.k });
    }
    g.globalAlpha = 1;
    // the cluster before the mark lands: unlit outlines; each neighbour lights grey as its first train arrives; the core charges
    if (hand < 1) {
      g.lineWidth = 1; g.strokeStyle = COL.line; g.globalAlpha = 1 - hand; g.beginPath();
      for (const c of ring1) if (t < c.lit) hexPath(g, c.x, c.y, R * 0.97);
      g.stroke();
      g.lineWidth = 1.5; g.strokeStyle = COL.hive;
      for (const c of ring1) {
        if (t < c.lit) continue;
        g.globalAlpha = sm(c.lit, c.lit + 200, t) * (1 - hand); g.beginPath(); hexPath(g, c.x, c.y, R * 0.97); g.stroke();
      }
      const [n, tot] = absorbedAt(t);
      let flash = 0; for (const a of agents) if (a.kind === 'train' && t >= a.arr && t < a.arr + 220) flash = Math.max(flash, 1 - (t - a.arr) / 220);
      const coreA = Math.min(1, (0.3 + 0.6 * (tot ? n / tot : 0)) + 0.25 * flash) * (1 - hand);
      if (coreA > 0.01) { g.globalAlpha = coreA; g.strokeStyle = COL.gold; g.lineWidth = 1.5; g.beginPath(); hexPath(g, core.x, core.y, R * 0.825); g.stroke(); }
      g.globalAlpha = 1;
    }
    drawGlyphs(g, list, { r: gR, lw: phone ? 1.1 : 1.3, head: phone ? 1.6 : 2.1 });
    // the official mark lands on the core cell with a small pulse; the warm light opens under the field
    const pe = clamp01((t - T.ignite) / T.pulse), bump = t >= T.ignite ? Math.sin(Math.PI * Math.pow(pe, 0.7)) : 0;
    const ms = (hand ? hand.toFixed(3) : '0') + '|' + (bump > 0.001 ? (1 + 0.08 * bump).toFixed(4) : '');
    if (ms !== lastMark) { mark.style.opacity = hand ? hand.toFixed(3) : '0'; mark.style.transform = bump > 0.001 ? `scale(${(1 + 0.08 * bump).toFixed(4)})` : ''; lastMark = ms; }
    const G = glowAt(t);
    if (Math.abs(G - lastG) > 0.002 || (G === 0) !== (lastG === 0) || (G === 1) !== (lastG === 1)) {
      glowEl.style.opacity = G.toFixed(3);
      glowEl.style.transform = G < 1 ? `scale(${(0.7 + 0.3 * G).toFixed(4)})` : '';
      lastG = G;
    }
  }

  function updatePhase(t) {
    const idx = t < 900 * (T.end / BASE.end) ? 0 : (t < T.ignite ? 1 : 2);
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
  function render(t) { renderAgents(t); updatePhase(t); }

  /* ---------- lifecycle: a wall clock from first paint, paused offscreen and while the tab is hidden ---------- */
  let raf = 0, last = 0, clock = 0, visible = true, done = false;
  const live = !S.reduce && S.freeze == null;
  const canRun = () => live && !done && visible && !document.hidden;
  function finish() { clock = T.end; render(T.end + 1); done = true; document.documentElement.dataset.heroReady = '1'; }
  function frame(now) {
    raf = 0;
    if (!canRun()) return;
    clock += last ? Math.min(1000, now - last) : 0;          // wall clock; a hidden tab or an offscreen hero resets `last`, so it never jumps
    last = now;
    if (clock >= T.end) { finish(); return; }
    render(clock);
    raf = requestAnimationFrame(frame);
  }
  function kick() { if (!raf && canRun()) { last = 0; raf = requestAnimationFrame(frame); } }

  // first paint: the honeycomb and the unlit core at once; the swarm is planned in the next frame, then starts
  if (!live) { setup(); renderField(); render(S.reduce ? T.end + 1 : S.freeze); document.documentElement.dataset.heroReady = '1'; }
  else {
    setup(true); renderField(); render(0);
    window.SWARM.heroT0 = performance.now() + 40;
    requestAnimationFrame(() => {
      setup(); render(0);
      window.SWARM.heroT0 = performance.now();
      document.dispatchEvent(new CustomEvent('swarm:hero-start', { detail: { phone } }));
      kick();
    });
  }

  // the real type metrics can move the copy a little: replan only if a box moved by more than 8px
  function rebuild() {
    setup(); renderField();
    if (!live) render(S.reduce ? T.end + 1 : S.freeze);
    else if (done) render(T.end + 1);
    else render(clock);
  }
  const fontsReady = (S.fontsReady && S.fontsReady.then) ? S.fontsReady : Promise.resolve();
  fontsReady.then(() => {
    const before = sig, now = measure();
    const a = before.split('|'), b = now.split('|');
    const moved = a.length !== b.length || a.some((x, i) => x.split(',').some((v, j) => Math.abs(+v - +(b[i].split(',')[j])) > 8));
    if (moved) rebuild(); else sig = before;
  });
  window.__heroBench = n => { const t0 = performance.now(); for (let i = 0; i < n; i++) setup(); return (performance.now() - t0) / n; };
  // tests: the closest two visible agents over the pass, in glyph widths
  window.__heroGap = () => {
    let worst = { d: 1e9 };
    for (let t = 0; t <= T.end; t += 20) {
      const pts = agents.map(a => { const o = agentAt(a, t, {}); return { x: o.x, y: o.y, a: o.a, kind: a.kind }; }).filter(o => o.a > 0.3 && Math.hypot(o.x - core.x, o.y - core.y) > 1.75 * P);
      for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
        const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
        if (d < worst.d) worst = { d: +d.toFixed(1), t, k: pts[i].kind + '/' + pts[j].kind, x: Math.round(pts[i].x), y: Math.round(pts[i].y) };
      }
    }
    return Object.assign(worst, { ratio: +(worst.d / (2 * gR)).toFixed(2) });
  };
  // frame-accurate captures: with ?t=<ms>, window.__heroSeek(ms) draws the frozen hero at another time
  if (!live) window.__heroSeek = t => { render(t); return t; };

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(es => { for (const e of es) { visible = e.isIntersecting; if (visible) kick(); } }, { threshold: 0 }).observe(hero);
  }
  document.addEventListener('visibilitychange', kick);

  let lastW = W, rt = 0;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      if (hero.clientWidth === lastW) return;
      lastW = hero.clientWidth;
      rebuild();
    }, 160);
  });
})();
