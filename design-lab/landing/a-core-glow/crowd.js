/* Swarm A, Core Glow: "The crowd" (Canvas 2D).
   A 1px bell curve draws once; people in the cycle are packed under it as a beeswarm of agents, drawn in the
   page's agent language (small hexagonal nodes, no tails). LEFT drifts as one herd, MID twitches and keeps stepping
   out to the sideline, RIGHT holds still, then steps out together. It runs two cycles, then settles and stops.
   A DOM "YOU" tick rides left to right with scroll (fixed under reduced motion). No text is drawn on canvas. */
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
  const COL = { line: '#232328', muted: '#8E8A80', text: '#EEEBE4' };
  const hexPath = (window.SwarmLattice && window.SwarmLattice.hexPath) || ((c, x, y, r) => c.rect(x - r, y - r, 2 * r, 2 * r));
  const RUN = 14.5, SETTLE = 0.9;
  const ZB = [0.34, 0.66];
  const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  let seed = 3;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const bell = u => Math.exp(-0.5 * ((u - 0.5) / 0.2) ** 2);

  let W, H, DPR, phone, base, peak, x0, x1, agents = [], nextOut = 0;
  let drawP = 0, introStart = -1, tau = 0, activeZone = 0, youU = 0.04;
  const live = !S.reduce && S.freeze == null;
  const cy = x => base - peak * bell((x - x0) / (x1 - x0));

  function setup() {
    seed = 3;
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = cv.parentElement.clientWidth; phone = W < 600;
    H = phone ? 250 : 320;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR); cv.style.height = H + 'px';
    base = H - (phone ? 40 : 46);
    peak = base - (phone ? 36 : 42);
    x0 = phone ? 6 : 20; x1 = W - x0;
    const N = phone ? 130 : 300;
    let A = 0; for (let x = x0; x <= x1; x += 2) A += (base - cy(x)) * 2;
    const s = Math.sqrt(A / (N * 0.866));
    agents = [];
    let row = 0;
    for (let y = base - s * 0.62; y > base - peak; y -= s * 0.866, row++) {
      for (let x = x0 + (row % 2 ? s * 0.5 : 0) + s * 0.25; x < x1; x += s) {
        const hx = x + (rnd() - 0.5) * s * 0.34, hy = y + (rnd() - 0.5) * s * 0.28;
        if (hy < cy(hx) + s * 0.42) continue;
        const u = (hx - x0) / (x1 - x0);
        agents.push({
          hx, hy, x: hx, y: hy, px: hx, py: hy, u, zone: u < ZB[0] ? 0 : (u < ZB[1] ? 1 : 2),
          ang: -Math.PI / 2, a2: rnd() * Math.PI * 2, jx: 0, jy: 0, tjx: 0, tjy: 0, next: rnd() * 0.5, outT: -99, sx: 0
        });
      }
    }
    nextOut = 0;
  }

  function update(t, dt) {
    const s = Math.max(dt, 1) / 1000;
    const th = -0.2 + 0.8 * Math.sin(t * 0.34);            // LEFT: one shared, drifting heading
    if (t > nextOut) {                                       // MID: someone keeps stepping out
      nextOut = t + 0.3 + rnd() * 0.32;
      for (let tries = 0; tries < 8; tries++) {
        const a = agents[(rnd() * agents.length) | 0];
        if (a.zone === 1 && t - a.outT > 3.2) { a.outT = t; a.sx = (rnd() - 0.5) * 26; break; }
      }
    }
    const cyc = 6.6, e = (t + 1.2) % cyc;                     // RIGHT: hold, then step out together
    const stepR = e < 4.3 ? 0 : e < 4.95 ? ease((e - 4.3) / 0.65) : e < 5.8 ? 1 : 1 - ease((e - 5.8) / 0.8);
    for (const a of agents) {
      a.px = a.x; a.py = a.y;
      let nx, ny, ang;
      if (a.zone === 0) {
        const d = 7 * Math.sin(t * 0.95 - a.hx * 0.011);
        nx = a.hx + Math.cos(th) * d; ny = a.hy + Math.sin(th) * d * 0.7; ang = th;
      } else if (a.zone === 1) {
        if (t > a.next) { a.next = t + 0.14 + rnd() * 0.5; a.a2 = rnd() * Math.PI * 2; a.tjx = (rnd() - 0.5) * 5; a.tjy = (rnd() - 0.5) * 5; }
        const k = Math.min(1, s * 16);
        a.jx += (a.tjx - a.jx) * k; a.jy += (a.tjy - a.jy) * k;
        nx = a.hx + a.jx; ny = a.hy + a.jy; ang = a.a2;
        const o = t - a.outT;
        if (o >= 0 && o < 2.7) {
          const m = o < 0.55 ? ease(o / 0.55) : o < 1.95 ? 1 : 1 - ease((o - 1.95) / 0.75);
          nx += a.sx * m; ny += (base + 15 - a.hy) * m;
          ang = o < 0.55 ? Math.PI / 2 : o < 1.95 ? a.a2 : -Math.PI / 2;
        }
      } else {
        nx = a.hx + 15 * stepR; ny = a.hy - 22 * stepR; ang = -0.66;
      }
      a.x = nx; a.y = ny; a.ang = ang;
    }
  }

  function draw() {
    g.setTransform(DPR, 0, 0, DPR, 0, 0); g.clearRect(0, 0, W, H);
    g.lineWidth = 1; g.globalAlpha = 1; g.strokeStyle = COL.line;
    g.beginPath(); g.moveTo(0, base + 0.5); g.lineTo(W, base + 0.5); g.stroke();
    const xe = x0 + drawP * (x1 - x0);
    g.beginPath();
    for (const b of ZB) { const x = Math.round(x0 + b * (x1 - x0)) + 0.5; if (x > xe) continue; g.moveTo(x, base); g.lineTo(x, cy(x) + 8); }
    g.stroke();
    // agents as hexagonal nodes, bucketed: active zone bright, others muted
    const groups = [[], []];
    for (const a of agents) { if (a.hx > xe - 6) continue; groups[a.zone === activeZone ? 1 : 0].push(a); }
    const headA = [0.7, 1], colr = [COL.muted, COL.text], r = phone ? 2.2 : 2.7;
    for (let i = 0; i < 2; i++) {
      const list = groups[i]; if (!list.length) continue;
      g.globalAlpha = headA[i]; g.fillStyle = colr[i]; g.beginPath();
      for (const a of list) hexPath(g, a.x, a.y, r);
      g.fill();
    }
    // the curve, drawn once
    g.globalAlpha = 0.92; g.strokeStyle = COL.text; g.lineWidth = 1; g.beginPath();
    for (let x = x0; x <= xe; x += 2) { const y = cy(x); x === x0 ? g.moveTo(x, y) : g.lineTo(x, y); }
    g.stroke(); g.globalAlpha = 1;
  }

  function placeYou() {
    if (S.reduce) youU = 0.5;
    else {
      const r = fig.getBoundingClientRect(), vh = window.innerHeight || 800;
      const p = Math.min(1, Math.max(0, (vh * 0.92 - r.top) / (vh * 0.92 + r.height * 0.35)));
      youU = 0.04 + 0.92 * p;
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
      if (!raf) draw();
    }
    you.style.opacity = drawP > 0.05 ? '1' : '0';
  }

  // ---- lifecycle ----
  let raf = 0, last = 0, visible = false, motionOff = false, started = false, settled = false;
  const canRun = () => live && !settled && visible && !document.hidden && !motionOff;
  function frame(now) {
    raf = 0;
    if (!canRun()) return;
    const dt = last ? Math.min(400, now - last) : 16.7;
    last = now;
    if (drawP < 1) { introStart += dt; drawP = ease(introStart / 1500); }
    tau += dt / 1000; update(tau, dt);
    if (tau > RUN) {
      // settle: everyone eases back home, then the loop stops for good
      const k = ease((tau - RUN) / SETTLE);
      for (const a of agents) { a.x += (a.hx - a.x) * k; a.y += (a.hy - a.y) * k; }
      if (tau > RUN + SETTLE) { for (const a of agents) { a.x = a.hx; a.y = a.hy; } draw(); placeYou(); settled = true; fig.classList.add('settled'); return; }
    }
    draw(); placeYou();
    raf = requestAnimationFrame(frame);
  }
  function kick() { if (!raf && canRun()) { last = 0; raf = requestAnimationFrame(frame); } }

  setup();
  zoneEls.forEach(el => el.classList.toggle('on', +el.dataset.zone === 0));
  tagEls.forEach(el => el.classList.toggle('on', +el.dataset.ztag === 0));
  if (!live) { drawP = 1; update(0, 16.7); draw(); placeYou(); }
  else { drawP = 0; draw(); placeYou(); }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(es => {
      for (const e of es) {
        visible = e.isIntersecting;
        if (visible && !started && live) { started = true; introStart = 0; }
        if (visible) kick();
      }
    }, { threshold: 0.25 }).observe(fig);
  } else { drawP = 1; draw(); }

  let ticking = false;
  if (!S.reduce) window.addEventListener('scroll', () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => { ticking = false; placeYou(); });
  }, { passive: true });
  document.addEventListener('visibilitychange', kick);
  window.addEventListener('swarm:motion', e => {
    motionOff = !!(e.detail && e.detail.off);
    if (motionOff && drawP < 1) { drawP = 1; draw(); placeYou(); }
    if (!motionOff) kick();
  });
  let lastW = 0, rt = 0;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      const w = cv.parentElement.clientWidth; if (w === lastW) return; lastW = w;
      setup(); update(tau, 16.7); draw(); placeYou();
    }, 160);
  });
  lastW = cv.parentElement.clientWidth;
})();
