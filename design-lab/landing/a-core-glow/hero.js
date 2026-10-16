/* Swarm A, Core Glow: the hero (Canvas 2D, two canvases, official swarm-mark.svg on the core cell).
   The honeycomb fills the first screen. Agents are small hexagonal nodes that hop corner to corner along the
   channels between cells; every edge they cross lights for 600ms, and the cells they sense brighten briefly, so the
   field reads as a network being worked. The opening is seen at an angle and straightens out as consensus forms:
   committed agents route along shared paths (around the copy) toward the core, the six neighbours light as agents
   reach their corners, and the official mark lands on the core as its warm light opens over the whole screen.
   Everything settles by about 4.3s and the loop stops; the settled frame is the reduced-motion still.
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
  if (!SL || !hero || !fc || !ac || !fc.getContext) return;
  const fx = fc.getContext('2d'), ax = ac.getContext('2d');
  if (!fx || !ax) return;
  const { COL, clamp01, sm, inOut, outCubic, rng, hexPath, lattice, sim, drawEdges, drawAgents, drawField } = SL;

  const T = { ringMs: 20, wake: 120, commit0: 980, commit1: 1400, arrive: 2320, resolveMin: 2200, resolveMax: 2780, markIn: 380, glowIn: 1000, tilt: 2350 };
  const DT = 1000 / 60;
  const MASK = 0.13;
  const STATES = [
    ['SCANNING', 'Scanning', 'the watch list'],
    ['WATCHING', 'Watching', 'where attention is moving'],
    ['FLAGGED FOR REVIEW', 'Flagged', 'a change on the watch list for Jesus to review']
  ];

  let W, Hc, DPR, phone, tablet, R, core, maxD, RAD, TH0, PD, L, V, walk, dist, parent, hops, innerNext, glowEl, tintCv, lastG = -1, lastTilt = '';
  let rects, Sx, rnd, resolved, resolveT, absorbed, routed, flashT, pinged, simT, END, fieldKey, phaseIdx, lastDot;

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
  }
  // 1 in the open, MASK behind the copy, with a soft 22px edge; everything fades out at the bottom of the art
  function maskAt(x, y) {
    let d = 1e9;
    for (const r of rects) {
      const dx = Math.max(r[0] - x, 0, x - r[2]), dy = Math.max(r[1] - y, 0, y - r[3]);
      const dd = dx > 0 || dy > 0 ? Math.hypot(dx, dy) : 0;
      if (dd < d) { d = dd; if (!d) break; }
    }
    return (MASK + (1 - MASK) * sm(0, 22, d)) * (1 - sm(Hc - 150, Hc - 8, y));
  }

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
    walk = V.map(v => !v.core && !v.perim && v.ring >= 2 && v.x > -0.14 * W && v.x < 1.14 * W && v.y > -4 * P && v.y < Hc + P);
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
    V.forEach((v, i) => { if (walk[i] && v.ring >= 3 && v.x > 6 && v.x < W - 6 && v.y > 8 && v.y < Hc - 40) pool.push(i); });
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
      const flash = Math.max(0, 1 - (t - flashT) / 220);
      const coreA = Math.min(1, sm(0, 260, t) * (0.34 + 0.56 * charge()) + 0.25 * flash) * (1 - hand);
      if (coreA > 0.01) {
        g.globalAlpha = coreA; g.strokeStyle = COL.gold; g.lineWidth = 1.5; g.beginPath();
        proj ? SL.hexPathP(g, core.x, core.y, R * 0.825, proj) : hexPath(g, core.x, core.y, R * 0.825); g.stroke();
      }
      g.globalAlpha = 1;
    }
    // the agents: small hexagonal nodes, scouts muted, committed bright
    drawAgents(g, Sx, t, { proj, alphaAt: mP, r: phone ? 2.4 : 3, base: [0.92, 1] });
    // the official mark lands on the core cell
    mark.style.opacity = hand ? hand.toFixed(3) : '0';
    mark.style.transform = hand < 1 ? `scale(${(0.93 + 0.07 * hand).toFixed(4)})` : '';
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
      const [state, verb, obj] = STATES[idx];
      card.dataset.state = state;
      const st = card.querySelector('#sc-state'), vb = card.querySelector('#sc-verb'), ob = card.querySelector('#sc-obj');
      if (st) st.textContent = state.toLowerCase();
      if (vb) vb.textContent = verb;
      if (ob) ob.textContent = obj;
    }
  }

  function render(t) {
    renderField(t);
    renderAgents(t, projAt(t));
    updatePhase(t);
  }
  function simulateTo(target) { while (simT + DT <= target) { simT += DT; step(simT); } }

  /* ---------- lifecycle ---------- */
  let raf = 0, last = 0, acc = 0, visible = true, motionOff = false, done = false;
  const live = !S.reduce && S.freeze == null;
  const canRun = () => live && !done && visible && !document.hidden && !motionOff;
  function finish() { simulateTo(Math.max(simT, (END === Infinity ? 0 : END) + 50, 6200)); render(simT); done = true; document.documentElement.dataset.heroReady = '1'; }
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
  if (!live && !S.reduce) window.__heroSeek = t => { if (t < simT) setup(); simulateTo(t); render(simT); return simT; };

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
