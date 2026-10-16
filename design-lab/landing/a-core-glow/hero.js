/* Swarm A, Core Glow: hero swarm (Canvas 2D).
   Agents run the honeycomb's corridors (the channels between cells), sense the cells they pass, then reach
   consensus and stream along the lattice to the core at the top of the hero. Eighteen of them come to rest on
   the outer corners of the six neighbour cells; the rest are absorbed by the core, whose warm falloff opens
   (the light from above) while the official swarm-mark.svg fades in on the core cell.
   Agents stay out of the reading zone: routes avoid the copy, and anything that does cross it is drawn at 12%.
   No text is drawn on canvas. ?t=<ms> freezes a frame, ?reduce=1 forces the settled still (no trails). */
(() => {
  'use strict';
  const S = window.SWARM || { reduce: false, freeze: null };
  const hero = document.getElementById('top');
  const fc = document.getElementById('hero-field');
  const ac = document.getElementById('hero-agents');
  const mark = document.getElementById('hero-mark');
  const anchor = document.getElementById('core-anchor');
  const phaseEl = document.getElementById('hero-phase');
  const segs = document.querySelectorAll('#hero-seg i');
  const card = document.getElementById('scout-card');
  if (!hero || !fc || !ac || !fc.getContext) return;
  const fx = fc.getContext('2d'), ax = ac.getContext('2d');
  if (!fx || !ax) return;

  const COL = { faint: '#1C1C21', hive: '#55555B', muted: '#8E8A80', text: '#EEEBE4', gold: '#F5C542' };
  const T = { scanEnd: 2400, consEnd: 3600, arrive: 4250, resolve: 4400, fade: 240 };
  const DT = 1000 / 60;
  const SQ3 = Math.sqrt(3);
  const MASK = 0.12;                       // agent opacity inside the reading zone
  const NB = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
  const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const clamp01 = x => Math.min(1, Math.max(0, x));
  const easeOut = x => 1 - Math.pow(1 - clamp01(x), 3);
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const pick = arr => arr[(rnd() * arr.length) | 0];
  const key = (q, r) => q + ',' + r;
  const STATES = [
    ['SCANNING', 'Scanning', 'the watch list'],
    ['WATCHING', 'Watching', 'where attention is moving'],
    ['FLAGGED FOR REVIEW', 'Flagged', 'a change on the watch list for Jesus to review']
  ];

  let W, H, DPR, phone, R, P, Rc, vScan, core, cells, cellMap, rings, maxD, avoid, pulses, V, agents;
  let charge, resolved, resolveT, simT, fieldDone, fieldKey, phaseIdx, pulseCap, pingCapBase, keepN, restN, lastDot = -2;

  /* ---------- the reading zone ---------- */
  function measureAvoid() {
    const hr = hero.getBoundingClientRect();
    avoid = [];
    const add = (r, m) => { if (r.width && r.height) avoid.push({ x0: r.left - hr.left - m, y0: r.top - hr.top - m, x1: r.right - hr.left + m, y1: r.bottom - hr.top + m }); };
    hero.querySelectorAll('[data-avoid]').forEach(el => {
      if (el.offsetParent === null && getComputedStyle(el).position !== 'fixed') return;
      if (el.dataset.avoid === 'lines') {
        const rg = document.createRange(); rg.selectNodeContents(el);
        for (const r of rg.getClientRects()) add(r, 10);
      } else add(el.getBoundingClientRect(), 8);
    });
    const navR = document.querySelector('.nav-r');
    if (navR && window.scrollY < 10) add(navR.getBoundingClientRect(), 6);
  }
  function inAvoid(x, y, m) {
    for (const b of avoid) if (x > b.x0 - m && x < b.x1 + m && y > b.y0 - m && y < b.y1 + m) return true;
    return false;
  }

  /* ---------- field, lattice and agents ---------- */
  function setup() {
    seed = 7;
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = hero.clientWidth; H = hero.clientHeight;
    phone = W <= 640;
    for (const c of [fc, ac]) { c.width = Math.round(W * DPR); c.height = Math.round(H * DPR); c.style.width = W + 'px'; c.style.height = H + 'px'; }
    R = phone ? 20 : 22; P = 1.95 * R; Rc = P / SQ3;
    vScan = P * (phone ? 2.0 : 2.2);
    pulseCap = phone ? 3 : 6; pingCapBase = phone ? 4 : 8;
    const hr = hero.getBoundingClientRect(), ar = anchor.getBoundingClientRect();
    core = { x: Math.round(W / 2), y: Math.round(ar.top - hr.top) };
    const Sz = 7.5 * R;
    Object.assign(mark.style, { width: Sz + 'px', height: Sz + 'px', left: (core.x - Sz / 2) + 'px', top: (core.y - Sz / 2) + 'px' });
    maxD = Math.hypot(Math.max(core.x, W - core.x), Math.max(core.y, H - core.y));
    measureAvoid();

    cells = []; cellMap = new Map(); rings = [];
    const rq = Math.ceil(maxD / P) + 2;
    let maxRing = 0;
    for (let q = -rq; q <= rq; q++) for (let r = -rq; r <= rq; r++) {
      const x = core.x + P * (q + r / 2), y = core.y + P * (SQ3 / 2) * r;
      if (x < -P || x > W + P || y < -P || y > H + P) continue;
      const ring = (Math.abs(q) + Math.abs(q + r) + Math.abs(r)) / 2;
      const c = { q, r, x, y, ring, d: Math.hypot(x - core.x, y - core.y), ping: 0, pingT: -1, text: inAvoid(x, y, R * 0.5) };
      cells.push(c); cellMap.set(key(q, r), c);
      (rings[ring] || (rings[ring] = [])).push(c);
      maxRing = Math.max(maxRing, ring);
    }
    fieldDone = maxRing * 45 + 320;
    buildLattice();

    const N = phone ? 80 : (W < 1100 ? 140 : 210);
    keepN = phone ? 8 : 18;
    const spawn = [];
    // spawn under the light: dense near the core, thinning out, and none in the bottom band of the hero
    for (let i = 0; i < V.length; i++) if (V[i].walk && V[i].ring >= 3 && V[i].nb.length === 3 && V[i].y < H - 120) spawn.push(i);
    agents = [];
    let kept = 0;
    for (let i = 0; i < N && spawn.length; i++) {
      let id = spawn[0];
      for (let tries = 0; tries < 40; tries++) {
        id = pick(spawn);
        const v = V[id];
        if (rnd() < 0.03 + 0.97 * Math.exp(-v.d / (0.26 * maxD))) break;
      }
      const opts = V[id].nb.filter(j => V[j].walk && V[j].ring >= 2);
      const a = {
        from: id, to: opts.length ? pick(opts) : V[id].nb[0], s: rnd() * Rc, x: V[id].x, y: V[id].y,
        mode: 'scan', commit: rnd() < 0.72, delay: 200 + rnd() * 600, cdelay: rnd() * 480,
        speed: vScan * (0.85 + 0.3 * rnd()), cur: 0, target: 0, hist: [], dead: false, keep: false, fadeT: -1, restV: -1
      };
      if (!a.commit && kept < keepN) { a.keep = true; kept++; }
      agents.push(a);
    }
    pulses = []; charge = 0; commitCount = 0; resolved = false; resolveT = Infinity; simT = 0; fieldKey = ''; phaseIdx = -1; restN = 0;
  }

  // The corridors between cells form their own honeycomb: its corners sit at P / sqrt(3) from each cell centre.
  function buildLattice() {
    V = [];
    const vmap = new Map();
    const vk = (x, y) => Math.round(x * 2) + ':' + Math.round(y * 2);
    for (const c of cells) {
      const ids = [];
      for (let k = 0; k < 6; k++) {
        const ang = Math.PI / 180 * (60 * k - 90);
        const x = c.x + Rc * Math.cos(ang), y = c.y + Rc * Math.sin(ang);
        const kk = vk(x, y);
        let id = vmap.get(kk);
        if (id === undefined) { id = V.length; vmap.set(kk, id); V.push({ x, y, nb: [], cells: [], ring: 99, core: false, dist: Infinity, distIn: Infinity, rest: null }); }
        const v = V[id];
        v.cells.push(c); v.ring = Math.min(v.ring, c.ring); if (c.ring === 0) v.core = true;
        ids.push(id);
      }
      for (let k = 0; k < 6; k++) {
        const a = ids[k], b = ids[(k + 1) % 6];
        if (!V[a].nb.includes(b)) V[a].nb.push(b);
        if (!V[b].nb.includes(a)) V[b].nb.push(a);
      }
    }
    for (const v of V) {
      v.d = Math.hypot(v.x - core.x, v.y - core.y);
      v.text = inAvoid(v.x, v.y, 6);
      v.out = v.x < 8 || v.x > W - 8 || v.y < 8 || v.y > H - 8 || v.d > maxD * 0.92;
      v.perim = v.ring === 1 && !v.core;
      v.walk = !v.text && !v.out;
    }
    // distance (in corridor hops) to the cluster's 18 outer corners, routed around the copy
    const q = [];
    V.forEach((v, i) => { if (v.perim) { v.dist = 0; q.push(i); } });
    for (let h = 0; h < q.length; h++) {
      const v0 = V[q[h]];
      for (const j of v0.nb) { const v = V[j]; if (v.dist !== Infinity || !v.walk || v.ring <= 1) continue; v.dist = v0.dist + 1; q.push(j); }
    }
    // inside the cluster: outer corner to the core's own corners
    const q2 = [];
    V.forEach((v, i) => { if (v.core) { v.distIn = 0; q2.push(i); } });
    for (let h = 0; h < q2.length; h++) {
      const v0 = V[q2[h]];
      for (const j of v0.nb) { const v = V[j]; if (v.distIn !== Infinity || v.ring > 1) continue; v.distIn = v0.distIn + 1; q2.push(j); }
    }
  }

  function hexLine(c) {
    const out = [], n = c.ring;
    for (let i = 0; i < n; i++) {
      const f = i / n;
      const q = c.q * (1 - f) + 1e-6, r = c.r * (1 - f) + 1e-6, s = -q - r;
      let rq = Math.round(q), rr = Math.round(r); const rs = Math.round(s);
      const dq = Math.abs(rq - q), dr = Math.abs(rr - r), ds = Math.abs(rs - s);
      if (dq > dr && dq > ds) rq = -rr - rs; else if (dr > ds) rr = -rq - rs;
      const cell = cellMap.get(key(rq, rr));
      if (cell && cell.ring >= 1) out.push(cell);
    }
    return out;
  }
  function spawnPulse(cell, t) {
    if (resolved || pulses.length >= pulseCap) return;
    if (rnd() > (t < T.scanEnd ? 0.35 : 1)) return;
    const path = hexLine(cell);
    if (path.length > 1) pulses.push({ path, t0: t + 120 });
  }

  let activePings = 0;
  function arrive(a, t) {
    const prev = a.from; a.from = a.to;
    const v = V[a.from];
    if (a.mode === 'scan') {
      const minRing = t > T.scanEnd || resolved ? 3 : 2;
      // sense one of the three cells around this corner
      const pingCap = resolved ? 3 : pingCapBase;
      if (rnd() < 0.42 && activePings < pingCap) {
        const cs = v.cells.filter(c => c.ring >= minRing && !c.text && c.pingT < 0);
        if (cs.length) { const c = pick(cs); c.pingT = t; activePings++; spawnPulse(c, t); }
      }
      let opts = v.nb.filter(j => j !== prev && V[j].walk && V[j].ring >= minRing);
      if (!opts.length) opts = v.nb.filter(j => V[j].walk && V[j].ring >= 2);
      if (!opts.length) opts = [prev];
      // committed agents drift toward the core before consensus, so the swarm gathers under the light
      const bias = a.commit && !resolved ? 0.55 * sm(700, T.scanEnd, t) : 0;
      if (bias && rnd() < bias) { const down = opts.filter(j => V[j].dist < v.dist); if (down.length) opts = down; }
      a.to = pick(opts);
      return;
    }
    if (a.mode === 'commit') {
      if (v.perim) {
        if (v.rest === null && restN < 18) { v.rest = a; restN++; a.mode = 'rest'; a.restV = a.from; a.s = 0; a.to = a.from; return; }
        a.mode = 'absorb';
      } else {
        let opts = v.nb.filter(j => V[j].dist < v.dist);
        if (!opts.length) opts = v.nb.filter(j => j !== prev && V[j].dist <= v.dist);
        a.to = opts.length ? pick(opts) : prev;
        return;
      }
    }
    if (a.mode === 'absorb') {
      // never cross the lit core: after the handoff, agents still arriving vanish at the cluster's edge
      if (v.core || resolved) { a.dead = true; charge = Math.min(1, charge + 1 / Math.max(1, commitCount)); return; }
      const opts = v.nb.filter(j => V[j].distIn < v.distIn);
      if (!opts.length) { a.dead = true; return; }
      a.to = pick(opts);
    }
  }

  let commitCount = 0;
  function step(t, dt) {
    const s = dt / 1000;
    activePings = 0; for (const c of cells) if (c.pingT >= 0) activePings++;
    let inFlight = 0;
    for (const a of agents) {
      if (a.dead || t < a.delay) continue;
      if (a.commit && a.mode === 'scan' && t >= T.scanEnd + a.cdelay && !resolved) {
        const v = V[a.to];
        const L = (v.dist + 2) * Rc + (Rc - a.s);
        const need = v.dist === Infinity ? Infinity : L / Math.max(350, T.arrive - t) * 1000;
        if (need <= vScan * 3.4) { a.mode = 'commit'; a.cur = a.speed; a.target = Math.max(vScan * 1.15, need); commitCount++; }
        else a.commit = false;
      }
      let sp = 0;
      if (a.mode === 'scan') sp = a.speed * (resolved ? 0.6 : 1);
      else if (a.mode === 'commit' || a.mode === 'absorb') { a.cur += (a.target - a.cur) * Math.min(1, s * 6); sp = a.cur; inFlight++; }
      if (sp > 0) {
        a.s += sp * s;
        let guard = 0;
        while (a.s >= Rc && !a.dead && a.mode !== 'rest' && guard++ < 6) { a.s -= Rc; arrive(a, t); }
      }
      if (a.dead) continue;
      if (a.mode === 'rest') { a.x = V[a.restV].x; a.y = V[a.restV].y; }
      else { const A = V[a.from], B = V[a.to], f = a.s / Rc; a.x = A.x + (B.x - A.x) * f; a.y = A.y + (B.y - A.y) * f; }
      a.hist.push(a.x, a.y); if (a.hist.length > 20) a.hist.splice(0, 2);
      if (resolved && a.mode === 'scan' && !a.keep) {
        if (a.fadeT < 0) a.fadeT = t + rnd() * 400;
        if (t > a.fadeT + 700) a.dead = true;
      }
    }
    for (const c of cells) if (c.pingT >= 0) {
      const e = t - c.pingT;
      c.ping = e < 120 ? e / 120 : e < 280 ? 1 : Math.max(0, 1 - (e - 280) / 520);
      if (e > 800) { c.pingT = -1; c.ping = 0; }
    }
    for (let i = pulses.length - 1; i >= 0; i--) if (t > pulses[i].t0 + pulses[i].path.length * 70 + 600) pulses.splice(i, 1);
    if (!resolved && (t >= T.resolve || charge >= 0.9 || (t > 3800 && inFlight === 0))) { resolved = true; resolveT = t; }
  }

  /* ---------- drawing ---------- */
  function hexSub(g, x, y, r) {
    for (let k = 0; k < 6; k++) {
      const ang = Math.PI / 180 * (60 * k - 90), px = x + r * Math.cos(ang), py = y + r * Math.sin(ang);
      k ? g.lineTo(px, py) : g.moveTo(px, py);
    }
    g.closePath();
  }
  function glowAt(t) {
    const pre = 0.3 * sm(T.consEnd - 500, T.resolve, t) + 0.25 * charge;
    const post = resolved ? sm(resolveT, resolveT + 760, t) : 0;
    return Math.min(1, Math.max(pre, post));
  }

  function drawField(t, G) {
    const g = fx;
    g.setTransform(DPR, 0, 0, DPR, 0, 0); g.clearRect(0, 0, W, H); g.lineWidth = 1;
    const buckets = new Map();
    for (const c of cells) {
      if (c.ring === 0) continue;
      const reveal = sm(c.ring * 45, c.ring * 45 + 300, t);
      if (reveal <= 0) continue;
      const fade = Math.max(0.12, 1 - sm(0.25 * maxD, maxD, c.d)) * (1 - sm(H - 220, H - 10, c.y));
      const a = Math.round(reveal * fade * 20) / 20;
      if (a < 0.04) continue;
      let b = buckets.get(a); if (!b) buckets.set(a, b = []); b.push(c);
    }
    g.strokeStyle = COL.faint;
    for (const [a, list] of buckets) { g.globalAlpha = a; g.beginPath(); for (const c of list) hexSub(g, c.x, c.y, R * 0.97); g.stroke(); }
    // the core's light falling on the nearby field (kept off the copy)
    if (G > 0.01) {
      g.strokeStyle = COL.hive;
      for (let k = 2; k <= 7; k++) {
        if (!rings[k]) continue;
        const a = G * 0.38 * (1 - sm(1.5, 7.6, k));
        if (a < 0.01) continue;
        g.globalAlpha = a; g.beginPath(); for (const c of rings[k]) if (!c.text) hexSub(g, c.x, c.y, R * 0.97); g.stroke();
      }
    }
    g.globalAlpha = 1;
    // the core's warm falloff: the only glow the kit allows, centred on the lit cell
    if (G > 0.01) {
      const rad = phone ? Math.min(W * 0.95, 380) : Math.min(W * 0.4, 560);
      g.save(); g.translate(core.x, core.y); g.scale(phone ? 1.0 : 1.45, 1);
      const grd = g.createRadialGradient(0, 0, 0, 0, 0, rad);
      grd.addColorStop(0, `rgba(245,197,66,${(0.3 * G).toFixed(3)})`);
      grd.addColorStop(0.16, `rgba(245,197,66,${(0.14 * G).toFixed(3)})`);
      grd.addColorStop(0.42, `rgba(245,197,66,${(0.045 * G).toFixed(3)})`);
      grd.addColorStop(0.72, `rgba(245,197,66,${(0.012 * G).toFixed(3)})`);
      grd.addColorStop(1, 'rgba(245,197,66,0)');
      g.fillStyle = grd; g.fillRect(-rad, -rad, rad * 2, rad * 2);
      g.restore();
    }
  }

  function drawLayer(t) {
    const g = ax, still = S.reduce;
    g.setTransform(DPR, 0, 0, DPR, 0, 0); g.clearRect(0, 0, W, H);
    g.lineWidth = 1; g.strokeStyle = COL.hive;
    if (!still) {
      // sensing pings
      for (const c of cells) if (c.ping > 0.01) { g.globalAlpha = c.ping * 0.85 * (c.text ? MASK : 1); g.beginPath(); hexSub(g, c.x, c.y, R * 0.97); g.stroke(); }
      // signal pulses hop toward the core and stop at ring 1
      for (const p of pulses) {
        for (let i = 0; i < p.path.length; i++) {
          const e = t - (p.t0 + i * 70);
          if (e < 0) break;
          const c = p.path[i];
          const a = (e < 160 ? 0.9 : 0.9 * (1 - (e - 160) / 400)) * (c.text ? MASK : 1);
          if (a <= 0.01) continue;
          g.globalAlpha = a; g.beginPath(); hexSub(g, c.x, c.y, R * 0.97); g.stroke();
        }
      }
      // arrival: one hex-ring wave runs outward from the core, faint behind the copy
      if (resolved) {
        for (let k = 2; k <= 10; k++) {
          if (!rings[k]) continue;
          const e = t - (resolveT + 90 + (k - 2) * 52);
          if (e < 0) break;
          const env = e < 90 ? e / 90 : Math.max(0, 1 - (e - 90) / 560);
          const a = env * 0.6 * (1 - (k - 2) / 10);
          if (a <= 0.01) continue;
          g.globalAlpha = a; g.beginPath(); for (const c of rings[k]) if (!c.text) hexSub(g, c.x, c.y, R * 0.97); g.stroke();
        }
      }
    }
    // six neighbours turn hive grey as consensus forms, then hand over to the SVG's own outlines
    const handoff = resolved ? clamp01((t - resolveT) / T.fade) : 0;
    const nb = sm(T.scanEnd + 400, T.resolve, t) * (1 - handoff);
    if (nb > 0.01) {
      g.lineWidth = 1.5; g.globalAlpha = nb; g.beginPath();
      for (const [q, r] of NB) { const c = cellMap.get(key(q, r)); if (c) hexSub(g, c.x, c.y, R * 0.97); }
      g.stroke();
    }
    // core: a 1.5px gold outline whose strength is the swarm's charge; the gradient and halo come only from the SVG
    const coreA = Math.max(charge, sm(T.consEnd, T.resolve, t)) * (1 - handoff);
    if (coreA > 0.01) { g.globalAlpha = coreA; g.lineWidth = 1.5; g.strokeStyle = COL.gold; g.beginPath(); hexSub(g, core.x, core.y, R * 0.82); g.stroke(); }

    // agents: trails follow the corridors, 2.5px heads; batched by kind and by whether they cross the copy
    const lowK = 1 - 0.5 * (resolved ? sm(resolveT, resolveT + 900, t) : 0);
    const B = [[], [], [], [], []]; // scout, committed, scout in copy, committed in copy, resting
    for (const a of agents) {
      if (a.dead || t < a.delay || a.hist.length < 2) continue;
      if (still && !(a.mode === 'rest' || a.keep)) continue;
      if (a.mode === 'rest') { B[4].push(a); continue; }
      const committed = a.mode !== 'scan';
      B[(committed ? 1 : 0) + (inAvoid(a.x, a.y, 2) ? 2 : 0)].push(a);
    }
    const wake = a => clamp01((t - a.delay) / 300) * (a.fadeT >= 0 ? 1 - clamp01((t - a.fadeT) / 700) : 1);
    const trailA = [0.32 * lowK, 0.6, 0.32 * lowK * MASK, 0.6 * MASK];
    const headA = [0.85 * lowK, 1, 0.85 * lowK * MASK, MASK];
    const colr = [COL.muted, COL.text, COL.muted, COL.text];
    g.lineWidth = 1;
    for (let b = 0; b < 4; b++) {
      if (!B[b].length) continue;
      if (!still) {
        g.strokeStyle = colr[b];
        // two alpha passes: fully awake agents, and those waking up or fading out
        for (const pass of [0, 1]) {
          g.beginPath(); let any = false, aSum = 0, n = 0;
          for (const a of B[b]) {
            const w = wake(a); if ((w > 0.98) !== (pass === 0)) continue;
            const h = a.hist, k = Math.max(3, Math.min(10, Math.round(3 + ((a.mode === 'scan' ? a.speed : a.cur) / P) * 1.4)));
            const start = Math.max(0, h.length - k * 2);
            g.moveTo(h[start], h[start + 1]);
            for (let i = start + 2; i < h.length; i += 2) g.lineTo(h[i], h[i + 1]);
            any = true; aSum += w; n++;
          }
          if (any) { g.globalAlpha = trailA[b] * (pass === 0 ? 1 : aSum / n); g.stroke(); }
        }
      }
      g.fillStyle = colr[b];
      for (const pass of [0, 1]) {
        g.beginPath(); let any = false, aSum = 0, n = 0;
        for (const a of B[b]) { const w = wake(a); if ((w > 0.98) !== (pass === 0)) continue; g.rect(a.x - 1.25, a.y - 1.25, 2.5, 2.5); any = true; aSum += w; n++; }
        if (any) { g.globalAlpha = headA[b] * (pass === 0 ? 1 : aSum / n) * (still ? 0.8 : 1); g.fill(); }
      }
    }
    // the eighteen agents resting on the neighbour cells' outer corners
    if (B[4].length) {
      g.fillStyle = COL.text; g.globalAlpha = resolved ? 0.92 - 0.22 * sm(resolveT, resolveT + 900, t) : 0.95;
      g.beginPath(); for (const a of B[4]) g.rect(a.x - 1.25, a.y - 1.25, 2.5, 2.5); g.fill();
    }
    g.globalAlpha = 1;
    // the official mark lands on the core cell (240ms, cubic-bezier(.2,.7,.2,1) approximated)
    mark.style.opacity = resolved ? easeOut((t - resolveT) / T.fade).toFixed(3) : '0';
  }

  function updatePhase(t) {
    const idx = t < T.scanEnd ? 0 : (!resolved ? 1 : 2);
    if (card) {
      const dots = card.querySelectorAll('.spin i');
      const on = idx < 2 && !S.reduce ? Math.floor(t / 80) % 6 : 0;
      if (dots.length && on !== lastDot) { dots.forEach((d, k) => d.classList.toggle('on', k === on)); lastDot = on; }
    }
    if (idx === phaseIdx) return;
    phaseIdx = idx;
    if (phaseEl) phaseEl.textContent = ['Scanning', 'Consensus', 'Signal'][idx];
    segs.forEach((s, i) => s.classList.toggle('on', i <= idx));
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
    const G = glowAt(t);
    const k = (t < fieldDone ? 'r' + Math.round(t / 16) : 'd') + '|' + G.toFixed(2);
    if (k !== fieldKey) { drawField(t, G); fieldKey = k; }
    drawLayer(t);
    updatePhase(t);
  }
  function simulateTo(target) { while (simT + DT <= target) { simT += DT; step(simT, DT); } }

  /* ---------- lifecycle ---------- */
  let raf = 0, last = 0, acc = 0, visible = true, motionOff = false;
  const live = !S.reduce && S.freeze == null;
  const canRun = () => live && visible && !document.hidden && !motionOff;
  function frame(now) {
    raf = 0;
    if (!canRun()) return;
    // fixed-step simulation on wall-clock time, so the choreography settles on time even at low frame rates
    acc += last ? Math.min(2500, now - last) : DT;
    last = now;
    while (acc >= DT) { simT += DT; step(simT, DT); acc -= DT; }
    render(simT);
    raf = requestAnimationFrame(frame);
  }
  function kick() { if (!raf && canRun()) { last = 0; acc = 0; raf = requestAnimationFrame(frame); } }

  function start() {
    setup();
    if (!live) {
      simulateTo(S.reduce ? 4800 : S.freeze); render(simT);
      document.documentElement.dataset.heroReady = '1';
      return;
    }
    render(0);
    kick();
  }
  // rebuild with the same seed and replay to the current time (the simulation is deterministic)
  function rebuild() {
    const keep = simT;
    setup();
    simulateTo(live ? Math.min(keep, 7000) : (S.reduce ? 4800 : S.freeze));
    if (live && keep > simT) simT = keep;
    fieldKey = ''; render(simT);
  }

  start();

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(es => { for (const e of es) { visible = e.isIntersecting; if (visible) kick(); } }, { threshold: 0 }).observe(hero);
  }
  document.addEventListener('visibilitychange', kick);
  window.addEventListener('swarm:motion', e => { motionOff = !!(e.detail && e.detail.off); if (!motionOff) kick(); });

  // rebuild on width changes (not on mobile URL-bar height changes)
  let lastW = W, rt = 0;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      if (hero.clientWidth === lastW && Math.abs(hero.clientHeight - H) < 40) return;
      lastW = hero.clientWidth;
      rebuild();
    }, 160);
  });
  // once the real type metrics are in, the copy's boxes move: re-measure the reading zone and replay
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { lastW = hero.clientWidth; rebuild(); });
})();
