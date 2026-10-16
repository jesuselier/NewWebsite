/* Swarm A, Core Glow: hero swarm (Canvas 2D).
   Independent agents scan the honeycomb, sense cells, reach consensus and stream into the one core cell
   at the top of the hero. As they arrive, the core's warm falloff opens (the light from above), a hex-ring
   wave runs outward and the official swarm-mark.svg fades in exactly on the core cell.
   No text is drawn on canvas. ?t=<ms> freezes a frame, ?reduce=1 forces the settled still. */
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
  if (!hero || !fc || !ac || !fc.getContext) return;
  const fx = fc.getContext('2d'), ax = ac.getContext('2d');
  if (!fx || !ax) return;

  const COL = { faint: '#1C1C21', hive: '#55555B', muted: '#8E8A80', text: '#EEEBE4', gold: '#F5C542' };
  const T = { scanEnd: 2400, consEnd: 3600, resolve: 4400, fade: 240 };
  const DT = 1000 / 60;
  const SQ3 = Math.sqrt(3);
  const NB = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
  const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const clamp01 = x => Math.min(1, Math.max(0, x));
  const easeOut = x => 1 - Math.pow(1 - clamp01(x), 3);
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const key = (q, r) => q + ',' + r;

  let W, H, Hv, HA, DPR, phone, R, P, core, cells, cellMap, rings, agents, maxD, commitN, avoid, pulses;
  let charge, resolved, resolveT, simT, fieldDone, fieldKey, phaseIdx, SEP2, ALI2, pulseCap, pingCapBase;

  function measureAvoid() {
    const hr = hero.getBoundingClientRect();
    avoid = [];
    hero.querySelectorAll('[data-avoid]').forEach(el => {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      // the text block itself (tight horizontally around centred text lines)
      avoid.push({ x0: r.left - hr.left - 12, y0: r.top - hr.top - 8, x1: r.right - hr.left + 12, y1: r.bottom - hr.top + 8 });
    });
    if (cells) for (const c of cells) c.avoid = inAvoid(c.x, c.y, R * 0.7);
  }
  function inAvoid(x, y, m) {
    for (const b of avoid) if (x > b.x0 - m && x < b.x1 + m && y > b.y0 - m && y < b.y1 + m) return true;
    return false;
  }

  function setup() {
    seed = 7;
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = hero.clientWidth; H = hero.clientHeight;
    Hv = Math.min(H, window.innerHeight || H);
    phone = W <= 640;
    fc.width = Math.round(W * DPR); fc.height = Math.round(H * DPR); fc.style.width = W + 'px'; fc.style.height = H + 'px';
    HA = Math.min(H, Hv + 80);   // agents only live in the first screen
    ac.width = Math.round(W * DPR); ac.height = Math.round(HA * DPR); ac.style.width = W + 'px'; ac.style.height = HA + 'px';
    R = phone ? 22 : 34; P = 1.95 * R;
    SEP2 = (0.42 * P) ** 2; ALI2 = (1.1 * P) ** 2;
    pulseCap = phone ? 3 : 6; pingCapBase = phone ? 4 : 8;
    const hr = hero.getBoundingClientRect(), ar = anchor.getBoundingClientRect();
    core = { x: Math.round(W / 2), y: Math.round(ar.top - hr.top) };
    const Sz = 7.5 * R;
    Object.assign(mark.style, { width: Sz + 'px', height: Sz + 'px', left: (core.x - Sz / 2) + 'px', top: (core.y - Sz / 2) + 'px' });
    maxD = Math.hypot(Math.max(core.x, W - core.x), Math.max(core.y, Hv - core.y));
    cells = []; cellMap = new Map(); rings = [];
    measureAvoid();
    const far = Math.hypot(Math.max(core.x, W - core.x), Math.max(core.y, H - core.y));
    const rq = Math.ceil(far / P) + 2;
    let maxRing = 0;
    for (let q = -rq; q <= rq; q++) for (let r = -rq; r <= rq; r++) {
      const x = core.x + P * (q + r / 2), y = core.y + P * (SQ3 / 2) * r;
      if (x < -P || x > W + P || y < -P || y > H + P) continue;
      const ring = (Math.abs(q) + Math.abs(q + r) + Math.abs(r)) / 2;
      const d = Math.hypot(x - core.x, y - core.y);
      const c = { q, r, x, y, ring, d, ping: 0, pingT: -1, avoid: inAvoid(x, y, R * 0.7) };
      cells.push(c); cellMap.set(key(q, r), c);
      (rings[ring] || (rings[ring] = [])).push(c);
      if (y < Hv + P) maxRing = Math.max(maxRing, ring);
    }
    fieldDone = maxRing * 45 + 320;
    const N = phone ? 90 : (W < 1100 ? 160 : 260);
    agents = [];
    for (let i = 0; i < N; i++) {
      const c0 = pickCell(0, false, true);
      const a = {
        x: c0.x + (rnd() - 0.5) * R, y: c0.y + (rnd() - 0.5) * R, vx: 0, vy: 0,
        mode: 'travel', target: null, dwell: 0, dwellMax: 260 + rnd() * 340,
        commit: rnd() < 0.72, delay: 200 + rnd() * 600, hist: [], alive: true, lane: null
      };
      a.target = pickCell(0, a.commit, false);
      agents.push(a);
    }
    commitN = agents.filter(a => a.commit).length || 1;
    pulses = []; charge = 0; resolved = false; resolveT = Infinity; simT = 0; fieldKey = ''; phaseIdx = -1;
  }

  // Choose a cell to sense. Denser near the core, never on the copy, inside the first screen.
  function pickCell(t, commit, spawn) {
    const bias = commit ? sm(800, T.scanEnd, t) : 0;
    const minRing = resolved ? 3 : 1;
    for (let tries = 0; tries < 48; tries++) {
      const c = cells[(rnd() * cells.length) | 0];
      if (c.ring < minRing || c.avoid) continue;
      if (c.x < R || c.x > W - R || c.y < R + 6 || c.y > Hv - R) continue;
      const w = 0.22 + 0.78 * Math.exp(-c.d / (0.4 * maxD));
      if (rnd() > w) continue;
      if (bias && c.ring > 4 && rnd() < bias) continue;
      if (spawn && c.ring < 2) continue;
      return c;
    }
    const ring = rings[3] || rings[2];
    return ring[(rnd() * ring.length) | 0];
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
    const p = t < T.scanEnd ? 0.35 : 1;
    if (rnd() > p) return;
    const path = hexLine(cell);
    if (path.length > 1) pulses.push({ path, t0: t + 120 });
  }

  function step(t, dt) {
    const s = dt / 1000;
    const cons = sm(T.scanEnd, T.consEnd, t);
    const vBase = P * (phone ? 2.0 : 2.2);
    const scoutK = resolved ? 0.6 : 1;
    const grid = new Map();
    for (const a of agents) {
      if (!a.alive || t < a.delay) continue;
      const k = (((a.x / P) | 0) + 4) * 8192 + (((a.y / P) | 0) + 4);
      let b = grid.get(k); if (!b) grid.set(k, b = []); b.push(a);
    }
    let active = 0; for (const c of cells) if (c.pingT >= 0) active++;
    const pingCap = resolved ? 3 : pingCapBase;
    const coreCell = cellMap.get('0,0');

    for (const a of agents) {
      if (!a.alive || t < a.delay) continue;
      if (a.commit && t > T.scanEnd && a.mode !== 'final') {
        if (!a.lane) {
          let best = null, bd = 1e9;
          for (const [q, r] of NB) { const c = cellMap.get(key(q, r)); if (!c) continue; const d = Math.hypot(c.x - a.x, c.y - a.y); if (d < bd) { bd = d; best = c; } }
          a.lane = best || coreCell; a.target = a.lane; a.mode = 'commit';
        }
        if (t > T.consEnd - 200 && Math.hypot(a.lane.x - a.x, a.lane.y - a.y) < R * 1.2) { a.mode = 'final'; a.target = coreCell; }
      }
      const ox = a.target.x - a.x, oy = a.target.y - a.y, dist = Math.hypot(ox, oy) || 1e-6;
      const vmax = a.mode === 'travel' ? vBase * scoutK : vBase * (1 + 1.2 * cons);
      const sp = Math.min(vmax, vmax * dist / (P * 0.9));
      const dvx = ox / dist * sp - a.vx, dvy = oy / dist * sp - a.vy;
      let sx = 0, sy = 0, avx = 0, avy = 0, cx = 0, cy = 0, n = 0;
      const gx = (a.x / P) | 0, gy = (a.y / P) | 0;
      for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
        const b = grid.get((gx + i + 4) * 8192 + (gy + j + 4)); if (!b) continue;
        for (const o of b) {
          if (o === a) continue;
          const dx = a.x - o.x, dy = a.y - o.y, d2 = dx * dx + dy * dy;
          if (d2 < SEP2 && d2 > 0.01) { const d = Math.sqrt(d2); sx += dx / d / d; sy += dy / d / d; }
          if (d2 < ALI2) { avx += o.vx; avy += o.vy; cx += o.x; cy += o.y; n++; }
        }
      }
      let fxx = dvx * 3.2 + sx * vmax * 9, fyy = dvy * 3.2 + sy * vmax * 9;
      if (n && a.mode !== 'travel') {
        fxx += (avx / n - a.vx) * 1.4 * cons + (cx / n - a.x) * 0.6 * cons;
        fyy += (avy / n - a.vy) * 1.4 * cons + (cy / n - a.y) * 0.6 * cons;
      }
      const w = (1 - cons) * vmax * 1.2;
      fxx += (rnd() - 0.5) * w; fyy += (rnd() - 0.5) * w;
      a.vx += fxx * s; a.vy += fyy * s;
      const v = Math.hypot(a.vx, a.vy), lim = vmax * 1.15;
      if (v > lim) { a.vx *= lim / v; a.vy *= lim / v; }
      a.x += a.vx * s; a.y += a.vy * s;
      a.hist.push(a.x, a.y); if (a.hist.length > 20) a.hist.splice(0, 2);

      if (a.mode === 'travel' && dist < R * 0.35) {
        a.dwell += dt;
        const c = a.target;
        if (a.dwell > 120 && c.pingT < 0 && active < pingCap && !(t > T.scanEnd && c.ring <= 2)) { c.pingT = t; active++; spawnPulse(c, t); }
        if (a.dwell > a.dwellMax) { a.dwell = 0; a.dwellMax = 260 + rnd() * 340; a.target = pickCell(t, a.commit && !resolved, false); }
      }
      const dc = Math.hypot(core.x - a.x, core.y - a.y);
      if ((a.mode === 'final' && dist < R * 0.45) || (resolved && a.mode !== 'travel' && dc < P * 1.5)) {
        a.alive = false; charge = Math.min(1, charge + 1 / commitN);
      }
    }
    for (const c of cells) if (c.pingT >= 0) {
      const e = t - c.pingT;
      c.ping = e < 120 ? e / 120 : e < 280 ? 1 : Math.max(0, 1 - (e - 280) / 520);
      if (e > 800) { c.pingT = -1; c.ping = 0; }
    }
    for (let i = pulses.length - 1; i >= 0; i--) if (t > pulses[i].t0 + pulses[i].path.length * 70 + 600) pulses.splice(i, 1);
    if (!resolved && (charge >= 0.9 || t >= T.resolve)) { resolved = true; resolveT = t; }
  }

  function hexSub(g, x, y, r) {
    for (let k = 0; k < 6; k++) {
      const ang = Math.PI / 180 * (60 * k - 90), px = x + r * Math.cos(ang), py = y + r * Math.sin(ang);
      k ? g.lineTo(px, py) : g.moveTo(px, py);
    }
    g.closePath();
  }
  function glowAt(t) {
    const pre = 0.32 * sm(T.consEnd - 500, T.resolve, t) + 0.25 * charge;
    const post = resolved ? sm(resolveT, resolveT + 760, t) : 0;
    return Math.min(1, Math.max(pre, post));
  }

  function drawField(t, G) {
    const g = fx;
    g.setTransform(DPR, 0, 0, DPR, 0, 0); g.clearRect(0, 0, W, H); g.lineWidth = 1;
    // bucket by alpha so the field is a handful of stroke() calls
    const buckets = new Map();
    const bottom0 = H - 240;
    for (const c of cells) {
      if (c.ring === 0) continue;
      const reveal = sm(c.ring * 45, c.ring * 45 + 300, t);
      if (reveal <= 0) continue;
      const fade = Math.max(0.12, 1 - sm(0.25 * maxD, maxD, c.d)) * (1 - sm(bottom0, H, c.y));
      const a = Math.round(reveal * fade * 20) / 20;
      if (a < 0.04) continue;
      let b = buckets.get(a); if (!b) buckets.set(a, b = []); b.push(c);
    }
    g.strokeStyle = COL.faint;
    for (const [a, list] of buckets) { g.globalAlpha = a; g.beginPath(); for (const c of list) hexSub(g, c.x, c.y, R * 0.97); g.stroke(); }
    // the core's light falling on the field
    if (G > 0.01) {
      g.strokeStyle = COL.hive;
      for (let k = 2; k <= 7; k++) {
        if (!rings[k]) continue;
        const a = G * 0.36 * (1 - sm(1.5, 7.6, k));
        if (a < 0.01) continue;
        g.globalAlpha = a; g.beginPath(); for (const c of rings[k]) hexSub(g, c.x, c.y, R * 0.97); g.stroke();
      }
    }
    g.globalAlpha = 1;
    // the core's warm falloff: the only glow the kit allows, and only around the lit cell
    if (G > 0.01) {
      const rad = phone ? Math.min(W * 1.05, 440) : Math.min(W * 0.5, 700);
      g.save(); g.translate(core.x, core.y); g.scale(phone ? 1.0 : 1.35, 1);
      const grd = g.createRadialGradient(0, 0, 0, 0, 0, rad);
      grd.addColorStop(0, `rgba(245,197,66,${(0.30 * G).toFixed(3)})`);
      grd.addColorStop(0.14, `rgba(245,197,66,${(0.15 * G).toFixed(3)})`);
      grd.addColorStop(0.42, `rgba(245,197,66,${(0.05 * G).toFixed(3)})`);
      grd.addColorStop(0.7, `rgba(245,197,66,${(0.015 * G).toFixed(3)})`);
      grd.addColorStop(1, 'rgba(245,197,66,0)');
      g.fillStyle = grd; g.fillRect(-rad, -rad, rad * 2, rad * 2);
      g.restore();
    }
  }

  function drawLayer(t, G) {
    const g = ax;
    g.setTransform(DPR, 0, 0, DPR, 0, 0); g.clearRect(0, 0, W, HA);
    g.lineWidth = 1; g.strokeStyle = COL.hive;
    // sensing pings
    for (const c of cells) if (c.ping > 0.01) { g.globalAlpha = c.ping * 0.85; g.beginPath(); hexSub(g, c.x, c.y, R * 0.97); g.stroke(); }
    // signal pulses hop toward the core and stop at ring 1
    for (const p of pulses) {
      for (let i = 0; i < p.path.length; i++) {
        const e = t - (p.t0 + i * 70);
        if (e < 0) break;
        const a = e < 160 ? 0.9 : 0.9 * (1 - (e - 160) / 400);
        if (a <= 0) continue;
        const c = p.path[i]; g.globalAlpha = a; g.beginPath(); hexSub(g, c.x, c.y, R * 0.97); g.stroke();
      }
    }
    // arrival: a hex-ring wave runs outward from the core
    if (resolved) {
      for (let k = 2; k <= 11; k++) {
        if (!rings[k]) continue;
        const e = t - (resolveT + 90 + (k - 2) * 52);
        if (e < 0) break;
        const env = e < 90 ? e / 90 : Math.max(0, 1 - (e - 90) / 560);
        const a = env * 0.62 * (1 - (k - 2) / 11);
        if (a <= 0.01) continue;
        g.globalAlpha = a; g.beginPath(); for (const c of rings[k]) hexSub(g, c.x, c.y, R * 0.97); g.stroke();
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
    // core: a 1.5px gold outline whose strength is the swarm's charge; gradient and halo come only from the SVG
    const coreA = Math.max(charge, sm(T.consEnd, T.resolve, t)) * (1 - handoff);
    if (coreA > 0.01) { g.globalAlpha = coreA; g.lineWidth = 1.5; g.strokeStyle = COL.gold; g.beginPath(); hexSub(g, core.x, core.y, R * 0.82); g.stroke(); }

    // agents: trails and 2.5px heads, batched by kind
    const lowK = 1 - 0.45 * (resolved ? sm(resolveT, resolveT + 900, t) : 0);
    const B = [[], [], [], []]; // scout, committed, scout behind copy, committed behind copy
    for (const a of agents) {
      if (!a.alive || t < a.delay || a.hist.length < 6) continue;
      const committed = a.mode !== 'travel';
      const behind = inAvoid(a.x, a.y, 0);
      B[(committed ? 1 : 0) + (behind ? 2 : 0)].push(a);
    }
    const trailA = [0.3 * lowK, 0.6, 0.3 * lowK * 0.3, 0.6 * 0.3];
    const headA = [0.85 * lowK, 1, 0.85 * lowK * 0.32, 0.32];
    const colr = [COL.muted, COL.text, COL.muted, COL.text];
    g.lineWidth = 1;
    for (let b = 0; b < 4; b++) {
      if (!B[b].length) continue;
      g.globalAlpha = trailA[b]; g.strokeStyle = colr[b]; g.beginPath();
      for (const a of B[b]) {
        const h = a.hist, sp = Math.hypot(a.vx, a.vy);
        const k = Math.max(3, Math.min(9, Math.round(3 + (sp / P) * 1.3)));
        const start = Math.max(0, h.length - k * 2);
        g.moveTo(h[start], h[start + 1]);
        for (let i = start + 2; i < h.length; i += 2) g.lineTo(h[i], h[i + 1]);
      }
      g.stroke();
      g.globalAlpha = headA[b]; g.fillStyle = colr[b]; g.beginPath();
      for (const a of B[b]) g.rect(a.x - 1.25, a.y - 1.25, 2.5, 2.5);
      g.fill();
    }
    g.globalAlpha = 1;
    // the official mark lands on the core cell (240ms, cubic-bezier(.2,.7,.2,1) approximated)
    mark.style.opacity = resolved ? easeOut((t - resolveT) / T.fade).toFixed(3) : '0';
  }

  function updatePhase(t) {
    const idx = t < T.scanEnd ? 0 : (!resolved ? 1 : 2);
    if (idx === phaseIdx) return;
    phaseIdx = idx;
    if (phaseEl) phaseEl.textContent = ['Scanning', 'Consensus', 'Signal'][idx];
    segs.forEach((s, i) => s.classList.toggle('on', i <= idx));
  }

  function render(t) {
    const G = glowAt(t);
    const k = (t < fieldDone ? 'r' + Math.round(t / 16) : 'd') + '|' + G.toFixed(2);
    if (k !== fieldKey) { drawField(t, G); fieldKey = k; }
    drawLayer(t, G);
    updatePhase(t);
  }
  function simulateTo(target) { while (simT + DT <= target) { simT += DT; step(simT, DT); } }

  // ---- lifecycle ----
  let raf = 0, last = 0, acc = 0, visible = true, motionOff = false;
  const live = !S.reduce && S.freeze == null;
  const canRun = () => live && visible && !document.hidden && !motionOff;
  function frame(now) {
    raf = 0;
    if (!canRun()) return;
    // fixed-step simulation that keeps wall-clock time, so the choreography settles on time even at low frame rates
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
      const target = S.reduce ? 4700 : S.freeze;
      simulateTo(target); render(simT);
      document.documentElement.dataset.heroReady = '1';
      return;
    }
    render(0);
    kick();
  }

  start();

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(es => { for (const e of es) { visible = e.isIntersecting; if (visible) kick(); } }, { threshold: 0 }).observe(hero);
  }
  document.addEventListener('visibilitychange', kick);
  window.addEventListener('swarm:motion', e => { motionOff = !!(e.detail && e.detail.off); if (!motionOff) kick(); });

  // rebuild on width changes (not on mobile URL-bar height changes); keep the timeline position
  let lastW = W, rt = 0;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      if (hero.clientWidth === lastW && Math.abs(hero.clientHeight - H) < 140) { measureAvoid(); return; }
      lastW = hero.clientWidth;
      const keep = simT;
      setup();
      simulateTo(Math.min(keep, 6500));
      if (keep > simT) simT = keep;
      fieldKey = ''; render(simT);
    }, 160);
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => {
    if (!live) start();       // re-render the still once the real type metrics are in
    else measureAvoid();
  });
})();
