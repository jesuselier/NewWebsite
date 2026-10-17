/* Swarm A, Core Glow: "The crowd" (Canvas 2D).
   A 1px bell curve draws once over a faint honeycomb. Every person in the cycle is one agent, drawn in the page's
   agent language: a small hexagonal node sitting on a corner of the honeycomb's channels (the corridor lattice the
   hero uses), one node per cell, so the crowd is evenly spread with real space between nodes (at rest about three
   node widths apart, never closer than 1.7 node widths while moving). Motion is only position change: a node hops
   corner to corner along a channel and the channel it crosses lights briefly, as in the hero. No tails, streaks,
   heads or blur.
   One pass when the card comes into view, then it stops for good (no pause control needed):
     LEFT  a herd: the whole zone steps right together, one ripple from the front to the back, then steps home the
           same way (it follows whoever moved first).
     MID   nodes keep stepping back toward the baseline: one at a time, all over the zone, a node drops a corner,
           hesitates, and climbs back.
     RIGHT calm and still while the others move, then the whole zone steps at once, in perfect unison, and comes back.
   Everything is home and every lit channel has faded by 4.8s. Positions are a pure function of time, so the settled
   frame, ?t= and the reduced-motion still are the same picture. A DOM "YOU" tick rides with scroll. No text on canvas. */
(() => {
  'use strict';
  const S = window.SWARM || { reduce: false, freeze: null };
  const fig = document.getElementById('crowd');
  const cv = document.getElementById('crowd-canvas');
  const you = document.getElementById('crowd-you');
  if (!fig || !cv || !cv.getContext) return;
  const g = cv.getContext('2d');
  const yl = you.querySelector('.yl'), yt = you.querySelector('.yt');
  const zoneEls = fig.querySelectorAll('[data-zone]'), tagEls = fig.querySelectorAll('[data-ztag]');
  const COL = { faint: '#1C1C21', line: '#232328', hive: '#55555B', muted: '#8E8A80', text: '#EEEBE4' };
  const SQ3 = Math.sqrt(3);
  const ZB = [0.34, 0.66];
  // timeline (ms after the card comes into view)
  const T = { draw: 1400, fadeIn: 260, herd: 850, herdBack: 2200, ripple: 360, hop: 230, gap: 40,
              midFrom: 950, midTo: 3300, right: 2850, rightBack: 3650, flash: 620, end: 4800 };
  const clamp01 = x => Math.min(1, Math.max(0, x));
  const inOut = x => { x = clamp01(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const CS = [], SN = [];
  for (let k = 0; k < 6; k++) { const a = Math.PI / 180 * (60 * k - 90); CS.push(Math.cos(a)); SN.push(Math.sin(a)); }
  const hexPath = (c, x, y, r) => { c.moveTo(x + r * CS[0], y + r * SN[0]); for (let k = 1; k < 6; k++) c.lineTo(x + r * CS[k], y + r * SN[k]); c.closePath(); };
  function rng(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
  const bell = u => Math.exp(-0.5 * ((u - 0.5) / 0.2) ** 2);

  let W, H, DPR, phone, base, peak, x0, x1, Rc, P, r, nodes = [], field = null, appearAt = null;
  let activeZone = 0, youU = 0.04, clock = 0;
  const live = !S.reduce && S.freeze == null;
  const cy = x => base - peak * bell((x - x0) / (x1 - x0));
  const uOf = x => (x - x0) / (x1 - x0);

  // the curve's reveal: ease-in-out over T.draw; appear(x) is when the drawn curve reaches x
  function buildAppear() {
    const n = 200, xs = new Float32Array(n + 1);
    for (let i = 0; i <= n; i++) xs[i] = x0 + inOut(i / n) * (x1 - x0);
    appearAt = x => { let i = 0; while (i < n && xs[i] < x) i++; return (i / n) * T.draw; };
  }

  function hop(n, t0, ax, ay, bx, by, d, flash = 0) { n.hops.push({ t0, d, ax, ay, bx, by, flash }); return t0 + d; }

  function setup() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = cv.parentElement.clientWidth; phone = W < 600;
    H = phone ? 250 : 320;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR); cv.style.height = H + 'px';
    base = H - (phone ? 40 : 46);
    peak = base - (phone ? 36 : 42);
    x0 = phone ? 6 : 20; x1 = W - x0;
    Rc = phone ? 9 : 12.5;                 // channel length (corner to corner)
    P = SQ3 * Rc;                          // node pitch at rest (one node per cell)
    r = phone ? 2.55 : 3.5;                // node circumradius: channel >= 1.7 node widths
    buildAppear();
    const rnd = rng(7);
    const xd0 = x0 + ZB[0] * (x1 - x0), xd1 = x0 + ZB[1] * (x1 - x0);
    const pad = r + (phone ? 3 : 5);
    const yBottom = base - Rc - r - 5;       // nodes rest on the bottom corners of cells; a dip (one channel down) stays clear of the baseline
    nodes = [];
    for (let k = 0; ; k++) {
      const y = yBottom - 1.5 * Rc * k;
      if (y < base - peak + r + 6 + Rc / 2) break;
      const off = (k % 2) ? P / 2 : 0;
      const jMax = Math.ceil(W / P) + 1;
      for (let j = -jMax; j <= jMax; j++) {
        const x = W / 2 + off + j * P;     // centred, so the crowd is mirror-symmetric about the peak
        if (x < x0 + pad || x > x1 - pad) continue;
        if (y < cy(x) + r + 7 + Rc / 2) continue;   // clear of the curve line, even mid-step
        let zone;
        if (x <= xd0 - P - pad) zone = 0;                     // the herd steps right by one pitch
        else if (x >= xd0 + pad && x <= xd1 - pad) zone = 1;
        else if (x >= xd1 + P + pad) zone = 2;                // the right zone steps left by one pitch
        else continue;
        nodes.push({ x, y, zone, u: uOf(x), hops: [], });
      }
    }
    // LEFT: the herd steps right one pitch (two hops along the channels), front first, then home, back first
    const L = nodes.filter(n => n.zone === 0);
    if (L.length) {
      const xmin = Math.min(...L.map(n => n.x)), xmax = Math.max(...L.map(n => n.x)), span = Math.max(1, xmax - xmin);
      for (const n of L) {
        let t = T.herd + (xmax - n.x) / span * T.ripple;
        t = hop(n, t, n.x, n.y, n.x + P / 2, n.y - Rc / 2, T.hop) + T.gap;
        hop(n, t, n.x + P / 2, n.y - Rc / 2, n.x + P, n.y, T.hop, -1);
        t = T.herdBack + (n.x - xmin) / span * T.ripple;
        t = hop(n, t, n.x + P, n.y, n.x + P / 2, n.y - Rc / 2, T.hop) + T.gap;
        hop(n, t, n.x + P / 2, n.y - Rc / 2, n.x, n.y, T.hop, -1);
      }
    }
    // RIGHT: still, then every node steps left one pitch at the same moment, holds, and steps home together
    for (const n of nodes) {
      if (n.zone !== 2) continue;
      let t = hop(n, T.right, n.x, n.y, n.x - P / 2, n.y - Rc / 2, T.hop) + T.gap;
      hop(n, t, n.x - P / 2, n.y - Rc / 2, n.x - P, n.y, T.hop, -1);
      t = hop(n, T.rightBack, n.x - P, n.y, n.x - P / 2, n.y - Rc / 2, T.hop) + T.gap;
      hop(n, t, n.x - P / 2, n.y - Rc / 2, n.x, n.y, T.hop, -1);
    }
    // MID: nodes keep stepping back toward the baseline: a node drops one channel, straight down to the free corner
    // under it (every node has its own, so two nodes never meet), hesitates, and climbs back. Some do it twice.
    for (const n of nodes) {
      if (n.zone !== 1) continue;
      const q = rnd(), dips = q < 0.2 ? 1 : (q < 0.26 ? 2 : 0);
      let earliest = T.midFrom;
      for (let i = 0; i < dips; i++) {
        const room = T.midTo - earliest; if (room < 500) break;
        const start = earliest + rnd() * (dips === 2 && i === 0 ? room * 0.4 : room);
        const down = 200 + rnd() * 40, hold = 240 + rnd() * 320, up = 320;
        hop(n, start, n.x, n.y, n.x, n.y + Rc, down, 1);
        hop(n, start + down + hold, n.x, n.y + Rc, n.x, n.y, up);
        earliest = start + down + hold + up + 260;
      }
    }
    for (const n of nodes) n.appear = appearAt(n.x + r);
    buildField();
  }

  // the area under the curve, above the baseline (the field and the sensed cells never leave it)
  function underCurve(c) {
    c.beginPath(); c.moveTo(x0, base);
    for (let x = x0; x <= x1; x += 2) c.lineTo(x, cy(x) + 3);
    c.lineTo(x1, base); c.closePath();
  }

  // the faint honeycomb under the curve (drawn once): cells whose top corners are the nodes' corners
  function buildField() {
    const c2 = document.createElement('canvas');
    c2.width = cv.width; c2.height = cv.height;
    const f = c2.getContext('2d'); f.setTransform(DPR, 0, 0, DPR, 0, 0);
    f.save(); underCurve(f); f.clip();
    const cr = 0.97 * (P / 1.95);
    const yBottom = base - Rc - r - 5;
    f.strokeStyle = COL.faint; f.lineWidth = 1; f.beginPath();
    for (let k = -2; k < 40; k++) {
      const y = yBottom - 1.5 * Rc * k - Rc;           // cell centre one channel above its bottom corner
      if (y < base - peak - 2 * Rc) break;
      const off = (k % 2 + 2) % 2 ? P / 2 : 0;
      const jMax = Math.ceil(W / P) + 1;
      for (let j = -jMax; j <= jMax; j++) hexPath(f, W / 2 + off + j * P, y, cr);
    }
    f.stroke();
    f.restore();
    field = c2;
  }

  function posAt(n, t, out) {
    let x = n.x, y = n.y;
    for (const h of n.hops) {
      if (t >= h.t0 + h.d) { x = h.bx; y = h.by; continue; }
      if (t > h.t0) { const f = inOut((t - h.t0) / h.d); x = h.ax + (h.bx - h.ax) * f; y = h.ay + (h.by - h.ay) * f; }
      break;
    }
    out[0] = x; out[1] = y;
  }

  const BK = 12;
  function draw(t) {
    g.setTransform(DPR, 0, 0, DPR, 0, 0); g.clearRect(0, 0, W, H);
    const drawP = live ? inOut(t / T.draw) : 1;
    const xe = x0 + drawP * (x1 - x0);
    // field, revealed with the curve
    if (field) {
      g.save(); g.beginPath(); g.rect(0, 0, Math.min(W, xe + 1), H); g.clip();
      g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(field, 0, 0); g.restore();
      g.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    g.lineWidth = 1; g.globalAlpha = 1; g.strokeStyle = COL.line;
    g.beginPath(); g.moveTo(0, base + 0.5); g.lineTo(W, base + 0.5); g.stroke();
    g.beginPath();
    for (const b of ZB) { const x = Math.round(x0 + b * (x1 - x0)) + 0.5; if (x > xe) continue; g.moveTo(x, base); g.lineTo(x, cy(x) + 8); }
    g.stroke();
    // sensed cells: when a node lands on a corner, the cell it sits on brightens and fades (no line ever trails a node)
    const cb = new Map(), p = [0, 0], cr = 0.97 * (P / 1.95);
    if (live) for (const n of nodes) {
      const a0 = n.zone === activeZone ? 0.75 : 0.55;
      for (const h of n.hops) {
        if (!h.flash) continue;
        const age = t - (h.t0 + h.d); if (age < 0) break;
        if (age > T.flash) continue;
        const a = a0 * (age < 90 ? age / 90 : 1 - (age - 90) / (T.flash - 90));
        const b = Math.round(a * BK); if (b <= 0) continue;
        let arr = cb.get(b); if (!arr) cb.set(b, arr = []); arr.push(h.bx, h.by + h.flash * Rc);
      }
    }
    g.save(); underCurve(g); g.clip();
    g.lineWidth = 1; g.strokeStyle = COL.hive;
    for (const [b, arr] of cb) {
      g.globalAlpha = b / BK; g.beginPath();
      for (let i = 0; i < arr.length; i += 2) hexPath(g, arr[i], arr[i + 1], cr);
      g.stroke();
    }
    g.restore(); g.globalAlpha = 1;
    // the nodes: active zone bright, the others muted
    const nb = [new Map(), new Map()];
    for (const n of nodes) {
      const v = live ? clamp01((t - n.appear) / T.fadeIn) : 1; if (v <= 0) continue;
      const k = n.zone === activeZone ? 1 : 0;
      const b = Math.round(v * (k ? 1 : 0.84) * BK); if (b <= 0) continue;
      let arr = nb[k].get(b); if (!arr) nb[k].set(b, arr = []);
      posAt(n, t, p); arr.push(p[0], p[1]);
    }
    for (let k = 0; k < 2; k++) {
      g.fillStyle = k ? COL.text : COL.muted;
      for (const [b, arr] of nb[k]) {
        g.globalAlpha = b / BK; g.beginPath();
        for (let i = 0; i < arr.length; i += 2) hexPath(g, arr[i], arr[i + 1], r);
        g.fill();
      }
    }
    // the curve, drawn once
    g.globalAlpha = 0.92; g.strokeStyle = COL.text; g.lineWidth = 1; g.beginPath();
    for (let x = x0; x <= xe; x += 2) { const y = cy(x); x === x0 ? g.moveTo(x, y) : g.lineTo(x, y); }
    g.stroke(); g.globalAlpha = 1;
  }

  function placeYou() {
    if (S.reduce) youU = uOf(W / 2 + P / 4);           // the middle of the curve, between two columns of nodes
    else {
      const rr = fig.getBoundingClientRect(), vh = window.innerHeight || 800;
      const q = Math.min(1, Math.max(0, (vh * 0.92 - rr.top) / (vh * 0.92 + rr.height * 0.35)));
      youU = 0.04 + 0.92 * q;
    }
    const x = x0 + youU * (x1 - x0), y = cy(x);
    you.style.transform = `translateX(${x.toFixed(1)}px)`;
    yl.style.top = y + 'px'; yl.style.height = Math.max(0, base - y) + 'px';
    yt.style.top = (y - 8) + 'px';
    const z = youU < ZB[0] ? 0 : (youU < ZB[1] ? 1 : 2);
    if (z !== activeZone) {
      activeZone = z;
      zoneEls.forEach(el => el.classList.toggle('on', +el.dataset.zone === z));
      tagEls.forEach(el => el.classList.toggle('on', +el.dataset.ztag === z));
      if (!raf) draw(clock);
    }
    you.style.opacity = (!live || x0 + inOut(clock / T.draw) * (x1 - x0) >= x - 2) ? '1' : '0';
  }

  // ---- lifecycle: a wall clock that only runs while the card is on screen and the tab is visible ----
  let raf = 0, last = 0, visible = false, started = false, settled = !live;
  const canRun = () => live && started && !settled && visible && !document.hidden;
  function frame(now) {
    raf = 0;
    if (!canRun()) return;
    const dt = last ? Math.min(400, now - last) : 16.7;   // a slow device gets fewer frames, never a longer pass
    last = now;
    clock = Math.min(T.end, clock + dt);
    if (clock >= T.end) settled = true;
    draw(clock); placeYou();
    if (!settled) raf = requestAnimationFrame(frame);
  }
  function kick() { if (!raf && canRun()) { last = 0; raf = requestAnimationFrame(frame); } }

  setup();
  zoneEls.forEach(el => el.classList.toggle('on', +el.dataset.zone === 0));
  tagEls.forEach(el => el.classList.toggle('on', +el.dataset.ztag === 0));
  clock = live ? 0 : T.end;
  draw(clock); placeYou();

  if (live && 'IntersectionObserver' in window) {
    new IntersectionObserver(es => {
      for (const e of es) {
        visible = e.isIntersecting;
        if (visible && !started) started = true;
        if (visible) kick();
      }
    }, { threshold: 0.3 }).observe(fig);
  } else if (live) { clock = T.end; settled = true; draw(clock); placeYou(); }

  let ticking = false;
  if (!S.reduce) window.addEventListener('scroll', () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => { ticking = false; placeYou(); });
  }, { passive: true });
  document.addEventListener('visibilitychange', kick);
  let lastW = cv.parentElement.clientWidth, rt = 0;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      const w = cv.parentElement.clientWidth; if (w === lastW) return; lastW = w;
      setup(); draw(clock); placeYou();
    }, 160);
  });
  // frame renders and tests can read the crowd at any time
  window.__crowdAt = t => { if (raf) cancelAnimationFrame(raf); raf = 0; settled = true; clock = t; draw(t); placeYou(); return nodes.length; };
  window.__crowdGap = t => {           // smallest centre distance between two nodes at time t, in node widths
    const pts = nodes.map(n => { const q = [0, 0]; posAt(n, t, q); return q; });
    let m = 1e9;
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) m = Math.min(m, Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]));
    return { n: nodes.length, minPx: +m.toFixed(2), nodeW: 2 * r, ratio: +(m / (2 * r)).toFixed(2) };
  };
})();
