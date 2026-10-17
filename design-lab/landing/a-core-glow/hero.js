/* Swarm A, Core Glow: the hero (Canvas 2D, two canvases, official swarm-mark.svg on the core cell).
   The honeycomb and the unlit Hive Core outline are drawn at first paint. Once the fonts are in, the swarm wakes:
   72 agents (36 on phones), small hexagonal nodes, wander corner to corner along the channels between cells, each
   crossed edge lit briefly in muted grey. At 1.25s every agent stops on a node for 120ms and pulses a small hex ring
   (sensing). Then 18 chosen agents (12 on phones) go bright and travel to the core along six paths, one through each
   neighbour cell, while the rest dim to 12% and come to rest. Each neighbour lights grey as its path lands, the core
   charges, and at 2.6s it ignites: the official mark lands with a small scale pulse and its warm light opens over
   0.7s, under the honeycomb lines. Trails fade, and everything is settled by 3.9s, when the loop stops for good.
   Nothing ever crosses the hero copy: the copy column is off limits to agents and trails, and the field is quieter
   behind the small text. No text is drawn on canvas. ?t=<ms> freezes a frame, ?reduce=1 forces the still. */
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
  const { COL, clamp01, sm, outCubic, rng, hexPath, lattice, sim, drawEdges, drawAgents, drawField } = SL;

  // the timeline (ms after the swarm wakes)
  const T = { wake: 150, sense: 1250, pause: 120, arrive0: 2340, stagger: 40, follow: 95, ignite: 2600, markIn: 280, pulse: 560, glowIn: 700, end: 3900 };
  const DT = 1000 / 60;
  const STATES = [
    ['SCANNING', 'Scanning', 'the market', 'Scanning'],
    ['ANALYZING', 'Analyzing', 'a setup', 'Analyzing'],
    ['REPORTING', 'Reporting', 'to the watch list', 'Reporting']
  ];

  let W, Hc, DPR, phone, tablet, R, core, maxD, L, V, walk, glowEl, lastG = -1;
  let zone, navRects, quiet, floorY = 1e9, Sx, rnd, spokes, ring1, absorbed, flashT, pinged, simT, phaseIdx, lastDot, lastMark = '';

  /* ---------- the copy, in screen space ---------- */
  function measure() {
    const hr = hero.getBoundingClientRect();
    const box = r => [r.left - hr.left, r.top - hr.top, r.right - hr.left, r.bottom - hr.top];
    let u = null; quiet = []; navRects = [];
    const grow = b => { u = u ? [Math.min(u[0], b[0]), Math.min(u[1], b[1]), Math.max(u[2], b[2]), Math.max(u[3], b[3])] : b.slice(); };
    hero.querySelectorAll('.hero-copy [data-avoid]').forEach(el => {
      if (el.offsetParent === null) return;
      if (el.dataset.avoid === 'lines') {
        const rg = document.createRange(); rg.selectNodeContents(el);
        for (const r of rg.getClientRects()) if (r.width && r.height) { const b = box(r); grow(b); if (el.tagName !== 'H1') quiet.push(b); }
      } else { const r = el.getBoundingClientRect(); if (r.width && r.height) grow(box(r)); }
    });
    // the copy column: one clean block from the chips to the last line, never crossed by agents or trails
    const pad = phone ? 14 : 26;
    zone = u ? [u[0] - pad, u[1] - pad, u[2] + pad, u[3] + pad] : [0, 0, 0, 0];
    if (window.scrollY < 10) document.querySelectorAll('.nav-logo, .nav .btn-line').forEach(el => { const b = box(el.getBoundingClientRect()); navRects.push([b[0] - 8, b[1] - 8, b[2] + 8, b[3] + 8]); });
    const rail = hero.querySelector('.hero-rail .hr-in');
    floorY = rail && rail.offsetParent !== null ? rail.getBoundingClientRect().top - hr.top : 1e9;
  }
  const dRect = (r, x, y) => { const dx = Math.max(r[0] - x, 0, x - r[2]), dy = Math.max(r[1] - y, 0, y - r[3]); return dx || dy ? Math.hypot(dx, dy) : 0; };
  // 1 in the open, 0 in the copy column and on the nav, with a soft edge; fades out at the bottom of the art
  function maskAt(x, y) {
    let d = dRect(zone, x, y);
    for (const r of navRects) d = Math.min(d, dRect(r, x, y));
    return sm(0, 26, d) * (1 - sm(Hc - 150, Hc - 8, y)) * (floorY < 1e8 ? 1 - sm(floorY - 64, floorY - 6, y) : 1);
  }
  // the field is quieter behind the small text (a clear zone feathered over 40px)
  function quietAt(x, y) {
    let d = 1e9; for (const r of quiet) d = Math.min(d, dRect(r, x, y));
    return 0.28 + 0.72 * sm(0, 40, d);
  }

  /* ---------- lattice, the six paths in, and the swarm ---------- */
  function setup() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = hero.clientWidth;
    const vh = window.innerHeight || 900;
    Hc = Math.round(Math.min(hero.clientHeight, Math.max(vh, 640) + 120));
    phone = W <= 640; tablet = !phone && W < 1100;
    if (!glowEl) { glowEl = document.createElement('div'); glowEl.className = 'hero-glow'; fc.before(glowEl); }
    for (const c of [fc, ac]) { c.width = Math.round(W * DPR); c.height = Math.round(Hc * DPR); c.style.width = W + 'px'; c.style.height = Hc + 'px'; }
    R = parseFloat(getComputedStyle(hero).getPropertyValue('--R')) || (phone ? 21 : 28);
    const hr = hero.getBoundingClientRect(), ar = anchor.getBoundingClientRect();
    core = { x: Math.round(W / 2), y: Math.round(ar.top - hr.top) };
    const Sz = 7.5 * R;
    Object.assign(mark.style, { width: Sz + 'px', height: Sz + 'px', left: (core.x - Sz / 2) + 'px', top: (core.y - Sz / 2) + 'px' });
    maxD = Math.hypot(Math.max(core.x, W - core.x), Math.max(core.y, Hc - core.y));
    measure();
    // the core's warm light (the one glow the kit allows): an ellipse that fades to nothing inside its own box, so
    // scaling it never shows an edge. It sits under the field, so the #1C1C21 lines read against it.
    const RAD = phone ? 165 : (tablet ? 250 : 300), sx = phone ? 1.15 : 1.3, gw = Math.round(RAD * sx), gh = RAD;
    const st = [[0, 0.34], [10, 0.25], [24, 0.14], [42, 0.065], [64, 0.022], [100, 0]];
    Object.assign(glowEl.style, { left: (core.x - gw) + 'px', top: (core.y - gh) + 'px', width: 2 * gw + 'px', height: 2 * gh + 'px',
      background: `radial-gradient(closest-side, ${st.map(([o, a]) => `rgba(245,197,66,${a}) ${o}%`).join(', ')})` });
    lastG = -1; lastMark = '';
    const P = 1.95 * R;
    L = lattice({ R, ox: core.x, oy: core.y, x0: -0.12 * W, y0: -3 * P, x1: 1.12 * W, y1: Hc + 2 * P });
    V = L.V;
    rnd = rng(11);
    walk = V.map(v => !v.core && !v.perim && v.ring >= 2 && v.x > -0.08 * W && v.x < 1.08 * W && v.y > -2 * P && v.y < Math.min(Hc - 60, floorY - 10) && maskAt(v.x, v.y) > 0.5);

    // the six paths in: one through each neighbour cell, from its outer corner along its edge to the core
    ring1 = (L.rings[1] || []).slice().sort((a, b) => ang(a) - ang(b));
    for (const c of ring1) c.lit = -1e9;
    const used = new Set(), OUT = phone ? 4 : 5;
    spokes = ring1.map((nc, k) => {
      const dir = [(nc.x - core.x) / nc.d, (nc.y - core.y) / nc.d];
      const outer = V.filter(v => v.perim && v.cells.includes(nc) && v.cells.filter(c => c.ring === 1).length === 1);
      // the clockwise outer corner, so the six paths read as one turning motion
      outer.sort((a, b) => cross(dir, b) - cross(dir, a));
      const O = outer[0] ? outer[0].i : -1;
      if (O < 0) return null;
      const valley = V[O].nb.find(j => V[j].perim && V[j].cells.includes(nc) && V[j].cells.filter(c => c.ring === 1).length === 2);
      const cc = valley !== undefined ? V[valley].nb.find(j => V[j].core) : undefined;
      // outward from the corner: the walkable vertex OUT hops away that lies closest to this neighbour's direction
      const depth = new Map([[O, 0]]), par = new Map(), q = [O];
      for (let h = 0; h < q.length; h++) {
        const i = q[h], dd = depth.get(i); if (dd >= OUT) continue;
        for (const j of V[i].nb) if (!depth.has(j) && walk[j] && !used.has(j)) { depth.set(j, dd + 1); par.set(j, i); q.push(j); }
      }
      let best = -1, bs = -1e9, bd = 0;
      for (const [i, dd] of depth) {
        if (!dd) continue;
        const v = V[i], s = ((v.x - core.x) * dir[0] + (v.y - core.y) * dir[1]) / v.d + dd * 0.6;
        if (dd > bd || (dd === bd && s > bs)) { best = i; bs = s; bd = dd; }
      }
      const out = [];
      for (let i = best; i >= 0 && i !== O; i = par.has(i) ? par.get(i) : -1) out.push(i);
      out.reverse();
      out.forEach(i => used.add(i));
      const path = [...out.slice().reverse(), O];                 // start ... O (outside in)
      if (valley !== undefined) path.push(valley);
      if (cc !== undefined) path.push(cc);
      const start = path[0];
      // the chosen agents wait within two hops of the path's start
      const home = new Map([[start, 0]]), hq = [start];
      for (let h = 0; h < hq.length; h++) { const i = hq[h], dd = home.get(i); if (dd >= 2) continue; for (const j of V[i].nb) if (!home.has(j) && walk[j] && !used.has(j)) { home.set(j, dd + 1); hq.push(j); } }
      return { k, cell: nc, path, start, home, O };
    });

    // the swarm
    Sx = sim(L, 23, 650);
    const N = phone ? 36 : (tablet ? 56 : 72), per = phone ? 2 : 3;
    const taken = new Set();
    spokes.forEach(sp => {
      if (!sp) return;
      const cand = [...sp.home.keys()].filter(i => i !== sp.start).sort((a, b) => sp.home.get(b) - sp.home.get(a));
      for (let r = 0; r < per; r++) {
        let id = cand.length ? cand[(rnd() * cand.length) | 0] : sp.start;
        for (let tries = 0; tries < 8 && taken.has(id) && cand.length; tries++) id = cand[(rnd() * cand.length) | 0];
        taken.add(id);
        const a = Sx.add(id, { kind: 0, chosen: true, sp: sp.k, rank: r, born: T.wake + rnd() * 260, sensed: false, pulseT: -1e9 });
        const nx = V[id].nb.filter(j => sp.home.has(j));
        if (nx.length) Sx.hop(a, nx[(rnd() * nx.length) | 0], a.born + 60 + rnd() * 220, hopD());
      }
    });
    const pool = [];
    V.forEach((v, i) => { if (walk[i] && v.ring >= 3 && v.x > 8 && v.x < W - 8 && v.y > 8 && !taken.has(i)) pool.push(i); });
    const nW = N - Sx.agents.length;
    for (let n = 0; n < nW && pool.length; n++) {
      let id = pool[0];
      for (let tries = 0; tries < 60; tries++) {
        id = pool[(rnd() * pool.length) | 0];
        if (taken.has(id)) continue;
        if (rnd() < 0.3 + 0.7 * Math.exp(-V[id].d / (0.5 * maxD))) break;
      }
      taken.add(id);
      const a = Sx.add(id, { kind: 0, chosen: false, born: T.wake + rnd() * 300, sensed: false, pulseT: -1e9 });
      const nx = V[id].nb.filter(j => walk[j]);
      if (nx.length) Sx.hop(a, nx[(rnd() * nx.length) | 0], a.born + 40 + rnd() * 240, hopD());
    }
    pinged = []; absorbed = 0; flashT = -1e9;
    simT = 0; phaseIdx = -1; lastDot = -2;
  }
  const ang = c => { const a = Math.atan2(c.y - core.y, c.x - core.x); return a < -1e-6 ? a + 2 * Math.PI : a; };
  const cross = (d, v) => d[0] * (v.y - core.y) - d[1] * (v.x - core.x);
  const hopD = () => 210 + rnd() * 70;
  const pick = arr => arr[(rnd() * arr.length) | 0];
  function bfsPath(from, to, allowed) {
    if (from === to) return [];
    const par = new Map([[from, -1]]), q = [from];
    for (let h = 0; h < q.length; h++) {
      const i = q[h];
      for (const j of V[i].nb) if (!par.has(j) && allowed(j)) { par.set(j, i); if (j === to) { const p = []; for (let k = j; k !== from; k = par.get(k)) p.push(k); return p.reverse(); } q.push(j); }
    }
    return null;
  }

  function policy(a, at) {
    const v = V[a.from];
    if (a.mode === 'route') {
      const sp = spokes[a.sp];
      if (a.from === sp.O && sp.cell.lit < -1e8) sp.cell.lit = at;
      if (v.core) { a.dead = true; absorbed++; flashT = at; return; }
      const nx = a.route[a.ri++];
      if (nx === undefined) { a.dead = true; return; }
      Sx.hop(a, nx, at, a.hd);
      return;
    }
    // every agent stops once on a node to sense, then the chosen set off and the rest wind down
    if (!a.sensed && at >= T.sense) {
      a.sensed = true; a.pulseT = at; a.pulseX = v.x; a.pulseY = v.y;
      if (a.chosen) {
        const sp = spokes[a.sp];
        const lead = bfsPath(a.from, sp.start, j => sp.home.has(j) || j === sp.start) || [];
        a.route = [...lead, ...sp.path.slice(1)];
        if (a.from !== sp.start && !lead.length) a.route = sp.path.slice();
        a.ri = 0; a.mode = 'route'; a.kind = 1;
        const depart = at + T.pause, target = T.arrive0 + a.sp * T.stagger + a.rank * T.follow;
        a.hd = Math.max(80, Math.min(210, (target - depart) / Math.max(1, a.route.length)));
        const nx = a.route[a.ri++];
        if (nx !== undefined) Sx.hop(a, nx, depart, a.hd);
        return;
      }
      if (a.fadeT < 0) { a.fadeT = T.ignite + 80 + rnd() * 520; a.fadeD = 420; }
    }
    if (at >= T.ignite) return;                                   // rest where it is
    // wandering: sense one of the three cells that meet at this corner now and then
    if (at < T.sense && rnd() < 0.3) {
      let live = 0; for (const c of pinged) if (at - c.ping < 800) live++;
      if (live < (phone ? 3 : 6)) {
        const cs = v.cells.filter(c => c.ring >= 3 && at - c.ping > 800);
        if (cs.length) { const c = pick(cs); c.ping = at; pinged.push(c); if (pinged.length > 30) pinged.splice(0, pinged.length - 30); }
      }
    }
    const ok = a.chosen ? (j => spokes[a.sp].home.has(j)) : (j => walk[j]);
    let opts = v.nb.filter(j => j !== a.prev && ok(j));
    if (!opts.length) opts = v.nb.filter(ok);
    if (!opts.length) return;
    const pauseMs = a.sensed ? 60 + rnd() * 220 : 30 + rnd() * 150;
    Sx.hop(a, pick(opts), at + (a.pulseT === at ? T.pause : 0) + pauseMs, a.sensed ? 260 + rnd() * 80 : hopD());
  }

  /* ---------- drawing ---------- */
  const scoutMul = t => 1 - 0.88 * sm(T.sense + 140, T.sense + 740, t);
  const charge = () => Math.min(1, absorbed / Math.max(1, spokes.filter(Boolean).length));
  function glowAt(t) {
    const pre = 0.16 * charge() * sm(T.arrive0 - 200, T.ignite, t);
    return Math.max(pre, t >= T.ignite ? sm(0, 1, (t - T.ignite) / T.glowIn) : 0);
  }
  function fieldA(c) {
    if (c.ring <= 1) return 0;
    return Math.max(0.16, 1 - sm(0.3 * maxD, 1.05 * maxD, c.d)) * (1 - sm(Hc - 170, Hc - 6, c.y)) * quietAt(c.x, c.y);
  }
  // the honeycomb itself never moves: drawn once, at first paint, and again only when the layout changes
  function renderField() {
    fx.setTransform(DPR, 0, 0, DPR, 0, 0); fx.clearRect(0, 0, W, Hc);
    drawField(fx, L, fieldA);
  }

  function renderAgents(t) {
    const g = ax;
    g.setTransform(DPR, 0, 0, DPR, 0, 0); g.clearRect(0, 0, W, Hc);
    const hand = t >= T.ignite ? outCubic((t - T.ignite) / T.markIn) : 0;
    // the signal: one ring wave runs out across the field as the core ignites
    if (t >= T.ignite && t < T.ignite + 1200) {
      drawField(g, L, c => {
        if (c.ring < 2 || c.ring > 24) return 0;
        const e = t - (T.ignite + 60 + c.ring * 26);
        if (e < 0) return 0;
        const env = e < 90 ? e / 90 : Math.max(0, 1 - (e - 90) / 420);
        return env * 0.42 * Math.max(0.2, 1 - c.ring / 24) * maskAt(c.x, c.y);
      }, { color: COL.hive });
    }
    // sensing: a visited cell's outline brightens briefly
    if (pinged.length && t < T.sense + 1200) {
      drawField(g, L, c => {
        const e = t - c.ping; if (e < 0 || e > 800) return 0;
        const env = e < 120 ? e / 120 : e < 280 ? 1 : 1 - (e - 280) / 520;
        return env * 0.6 * maskAt(c.x, c.y);
      }, { color: COL.hive });
    }
    // trails: muted while scanning, bright on the six paths in
    const kMul = (e, tt) => e.k ? 1 : scoutMul(tt);
    const aMul = (a, tt) => a.chosen ? 1 : scoutMul(tt);
    drawEdges(g, Sx, t, { alphaAt: maskAt, base: [0.3, 0.62], lw: phone ? 1.25 : 1.5, edgeMul: kMul, agentMul: aMul });
    // the sensing beat: each agent pulses a small hex ring as it stops
    g.lineWidth = 1; g.strokeStyle = COL.text;
    for (const a of Sx.agents) {
      const e = (t - a.pulseT) / 520; if (e < 0 || e > 1 || a.dead) continue;
      const al = 0.35 * (1 - e) * (a.chosen ? 1 : 0.8) * maskAt(a.pulseX, a.pulseY); if (al < 0.02) continue;
      g.globalAlpha = al; g.beginPath(); hexPath(g, a.pulseX, a.pulseY, 3 + 10 * outCubic(e)); g.stroke();
    }
    g.globalAlpha = 1;
    // the cluster before the mark lands: unlit outlines, each neighbour lights grey as its path lands, the core charges
    if (hand < 1) {
      g.lineWidth = 1; g.strokeStyle = COL.line; g.globalAlpha = 1 - hand; g.beginPath();
      for (const c of ring1) if (c.lit < -1e8 || t < c.lit) hexPath(g, c.x, c.y, R * 0.97);
      g.stroke();
      g.lineWidth = 1.5; g.strokeStyle = COL.hive;
      for (const c of ring1) {
        if (c.lit < -1e8 || t < c.lit) continue;
        g.globalAlpha = sm(c.lit, c.lit + 200, t) * (1 - hand); g.beginPath(); hexPath(g, c.x, c.y, R * 0.97); g.stroke();
      }
      const flash = Math.max(0, 1 - (t - flashT) / 220);
      const coreA = Math.min(1, (0.3 + 0.6 * charge()) + 0.25 * flash) * (1 - hand);
      if (coreA > 0.01) { g.globalAlpha = coreA; g.strokeStyle = COL.gold; g.lineWidth = 1.5; g.beginPath(); hexPath(g, core.x, core.y, R * 0.825); g.stroke(); }
      g.globalAlpha = 1;
    }
    // the agents: small hexagonal nodes, scouts muted, the chosen bright
    drawAgents(g, Sx, t, { alphaAt: maskAt, r: phone ? 2.2 : 2.4, base: [0.72, 1], agentMul: aMul });
    // the official mark lands on the core cell, with a small pulse; the warm light opens under the field
    const pe = clamp01((t - T.ignite) / T.pulse), bump = t >= T.ignite ? Math.sin(Math.PI * Math.pow(pe, 0.7)) : 0;
    const ms = (hand ? hand.toFixed(3) : '0') + '|' + (bump > 0.001 ? (1 + 0.08 * bump).toFixed(4) : '');
    if (ms !== lastMark) { mark.style.opacity = hand ? hand.toFixed(3) : '0'; mark.style.transform = bump > 0.001 ? `scale(${(1 + 0.08 * bump).toFixed(4)})` : ''; lastMark = ms; }
    const G = glowAt(t);
    if (Math.abs(G - lastG) > 0.002 || (G === 0) !== (lastG === 0) || (G === 1) !== (lastG === 1)) {
      glowEl.style.opacity = G.toFixed(3);
      glowEl.style.transform = G < 1 ? `scale(${(0.72 + 0.28 * G).toFixed(4)})` : '';
      lastG = G;
    }
  }

  function updatePhase(t) {
    const idx = t < T.sense ? 0 : (t < T.ignite ? 1 : 2);
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
  // one fixed step; an agent that is resting when the sensing beat comes still senses, so nothing is left behind
  function step(t) {
    Sx.advance(t, policy);
    if (t >= T.sense) for (const a of Sx.agents) if (!a.dead && !a.sensed && a.to < 0 && t >= a.born) policy(a, t);
  }
  function simulateTo(target) { while (simT + DT <= target) { simT += DT; step(simT); } }

  /* ---------- lifecycle ---------- */
  let raf = 0, last = 0, acc = 0, visible = true, done = false, started = false;
  const live = !S.reduce && S.freeze == null;
  const canRun = () => live && started && !done && visible && !document.hidden;
  function finish() { simulateTo(Math.max(simT, T.end + 2300)); render(simT); done = true; document.documentElement.dataset.heroReady = '1'; }
  function frame(now) {
    raf = 0;
    if (!canRun()) return;
    // fixed-step simulation on wall-clock time, so the sequence lands on time even at low frame rates
    acc += last ? Math.min(2500, now - last) : DT;
    last = now;
    while (acc >= DT) { simT += DT; step(simT); acc -= DT; }
    if (simT > T.end) { finish(); return; }
    render(simT);
    raf = requestAnimationFrame(frame);
  }
  function kick() { if (!raf && canRun()) { last = 0; acc = 0; raf = requestAnimationFrame(frame); } }

  // first paint: the honeycomb and the unlit core outline, before any font or motion
  setup(); renderField(); render(0);

  // rebuild with the same seed and replay to the current time (the simulation is deterministic)
  function rebuild() {
    const keep = simT;
    setup(); renderField();
    if (!live) { if (S.reduce) finish(); else { simulateTo(S.freeze); render(simT); document.documentElement.dataset.heroReady = '1'; } return; }
    if (done) { finish(); return; }
    simulateTo(keep); render(simT); kick();
  }
  // once the real type metrics are in, the copy's boxes are final: re-measure, then wake the swarm 150ms later
  const fontsReady = (S.fontsReady && S.fontsReady.then) ? S.fontsReady : Promise.resolve();
  fontsReady.then(() => {
    rebuild();
    if (live) setTimeout(() => { started = true; kick(); }, 150);
  });
  // frame-accurate captures: with ?t=<ms>, window.__heroSeek(ms) steps the frozen hero to another time
  if (!live && !S.reduce) window.__heroSeek = t => { if (t < simT) { setup(); renderField(); } simulateTo(t); render(simT); return simT; };

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
