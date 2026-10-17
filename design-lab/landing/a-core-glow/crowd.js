/* Swarm A, Core Glow: "The crowd" (Canvas 2D).
   A 1px bell curve draws once over a faint honeycomb. Every person in the cycle is one agent in the page's agent
   glyph (a hex outline with a head node), sitting on a corner of the honeycomb's channels, one per cell, with clear
   space between the three groups. Motion is position change only, and the spacing never shrinks: a group that moves,
   moves as one rigid block, so no two agents ever come closer than they are at rest.
   One pass when the card comes into view (settled by 4.4s, then it stops for good):
     YOU   the tick walks the curve with the story: first cycle on the left slope, then the middle, and it ends on the
           right slope. The lit group, the tab and the copy always follow it (one state).
     LEFT  the herd: the whole group drifts right toward the peak, front first, and later drifts back, back first.
     MID   overthinking: agents keep checking (a small ring opens around them); about a third of them sell early: they
           drop half a channel, dim and go hollow, and stay there.
     RIGHT calm and still while the others move; when YOU arrives, every head lights at once and the whole group steps
           out to the right together, and stays out.
   Positions are a pure function of time, so the settled frame, ?t= and the reduced-motion still are the same picture.
   No text on canvas. */
(() => {
  'use strict';
  const S = window.SWARM || { reduce: false, freeze: null };
  const SL = window.SwarmLattice;
  const fig = document.getElementById('crowd');
  const cv = document.getElementById('crowd-canvas');
  const you = document.getElementById('crowd-you');
  if (!fig || !cv || !cv.getContext || !SL) return;
  const g = cv.getContext('2d');
  const yl = you.querySelector('.yl'), yt = you.querySelector('.yt');
  const zoneEls = fig.querySelectorAll('[data-zone]'), tagEls = fig.querySelectorAll('[data-ztag]');
  const COL = SL.COL, SQ3 = SL.SQ3, clamp01 = SL.clamp01, inOut = SL.inOut, sm = SL.sm, hexPath = SL.hexPath;
  const ZB = [0.34, 0.66];
  // timeline (ms after the card comes into view)
  const T = { draw: 1300, fadeIn: 260, herd: 850, herdDur: 820, herdBack: 2350, ripple: 420,
              midFrom: 1150, midTo: 3000, decide: 2900, out: 3100, outDur: 520, end: 4400 };
  // YOU walks the curve: left slope, the middle, then the right slope
  // (each group is lit while it does its own thing: LEFT through the herd drift, MID through the checks, RIGHT as it decides)
  const YOU = [[0, 0.17], [1250, 0.17], [1950, 0.5], [2450, 0.5], [3050, 0.73]];
  const bell = u => Math.exp(-0.5 * ((u - 0.5) / 0.2) ** 2);

  let W, H, DPR, phone, base, peak, x0, x1, Rc, P, r, nodes = [], field = null, appearAt = null;
  let activeZone = -1, clock = 0;
  const live = !S.reduce && S.freeze == null;
  const cy = x => base - peak * bell((x - x0) / (x1 - x0));
  const uOf = x => (x - x0) / (x1 - x0);
  function youU(t) {
    for (let i = 1; i < YOU.length; i++) if (t <= YOU[i][0]) { const [ta, ua] = YOU[i - 1], [tb, ub] = YOU[i]; return ua + (ub - ua) * inOut((t - ta) / Math.max(1, tb - ta)); }
    return YOU[YOU.length - 1][1];
  }
  const zoneOf = u => u < ZB[0] ? 0 : (u < ZB[1] ? 1 : 2);

  // the curve's reveal: ease-in-out over T.draw; appear(x) is when the drawn curve reaches x
  function buildAppear() {
    const n = 200, xs = new Float32Array(n + 1);
    for (let i = 0; i <= n; i++) xs[i] = x0 + inOut(i / n) * (x1 - x0);
    appearAt = x => { let i = 0; while (i < n && xs[i] < x) i++; return (i / n) * T.draw; };
  }

  function setup() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = cv.parentElement.clientWidth; phone = W < 600;
    H = phone ? 250 : 330;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR); cv.style.height = H + 'px';
    base = H - (phone ? 38 : 44);
    peak = base - (phone ? 30 : 34);
    x0 = phone ? 6 : 20; x1 = W - x0;
    Rc = phone ? 10 : 14;                  // channel length (corner to corner)
    P = SQ3 * Rc;                          // agent pitch at rest (one agent per cell)
    r = phone ? 3.9 : 5.4;                 // glyph circumradius
    buildAppear();
    const rnd = SL.rng(7);
    const xd0 = x0 + ZB[0] * (x1 - x0), xd1 = x0 + ZB[1] * (x1 - x0);
    const clear = 0.55 * P + r;              // empty space on either side of each divider
    const under = (x, y) => x > x0 + r + 4 && x < x1 - r - 4 && y - r >= cy(x) + 6 && y + r <= base - 6;
    const yBottom = base - Rc * 0.9 - r;
    nodes = [];
    for (let k = 0; ; k++) {
      const y = yBottom - 1.5 * Rc * k;
      if (y < base - peak) break;
      const off = (k % 2) ? P / 2 : 0;
      const jMax = Math.ceil(W / P) + 1;
      for (let j = -jMax; j <= jMax; j++) {
        const x = W / 2 + off + j * P;     // centred, so the crowd is mirror-symmetric about the peak
        let zone;
        if (x + P <= xd0 - clear) zone = 0;                       // the herd drifts right one pitch
        else if (x >= xd0 + clear && x <= xd1 - clear) zone = 1;
        else if (x >= xd1 + clear) zone = 2;                      // the right group steps out one pitch
        else continue;
        if (!under(x, y)) continue;
        if ((zone === 0 || zone === 2) && !under(x + P, y)) continue;
        if (zone === 1 && !under(x, y + Rc * 0.5)) continue;
        // the column next to a divider is quieter, so a group's edge reads soft, not as a wall
        const dEdge = zone === 0 ? xd0 - (x + P) : (zone === 2 ? x - xd1 : Math.min(x - xd0, xd1 - x));
        const edge = dEdge < clear + P * 0.9 ? 0.6 : (dEdge < clear + P * 1.9 ? 0.82 : 1);
        nodes.push({ x, y, zone, edge, u: uOf(x) });
      }
    }
    // LEFT: one ripple out (front first) and one back (back first), as a rigid block
    const L = nodes.filter(n => n.zone === 0);
    const lx = L.map(n => n.x), lmin = Math.min(...lx), lmax = Math.max(...lx), lspan = Math.max(1, lmax - lmin);
    for (const n of L) { n.t1 = T.herd + (lmax - n.x) / lspan * T.ripple; n.t2 = T.herdBack + (n.x - lmin) / lspan * T.ripple; }
    // MID: checks (rings) and early sells
    for (const n of nodes) {
      if (n.zone !== 1) continue;
      const q = rnd();
      n.checks = [];
      const nChecks = q < 0.55 ? 1 + (rnd() < 0.4 ? 1 : 0) : 0;
      for (let i = 0; i < nChecks; i++) n.checks.push(T.midFrom + rnd() * (T.midTo - T.midFrom));
      n.checks.sort((a, b) => a - b);
      n.sell = q < 0.32 && n.checks.length ? n.checks[n.checks.length - 1] + 300 + rnd() * 200 : -1;
    }
    for (const n of nodes) n.appear = appearAt(n.x + r);
    buildField();
  }

  // the area under the curve, above the baseline (the field never leaves it)
  function underCurve(c) {
    c.beginPath(); c.moveTo(x0, base);
    for (let x = x0; x <= x1; x += 2) c.lineTo(x, cy(x) + 3);
    c.lineTo(x1, base); c.closePath();
  }
  // the faint honeycomb under the curve (drawn once): the agents sit on its corners
  function buildField() {
    const c2 = document.createElement('canvas');
    c2.width = cv.width; c2.height = cv.height;
    const f = c2.getContext('2d'); f.setTransform(DPR, 0, 0, DPR, 0, 0);
    f.save(); underCurve(f); f.clip();
    const cr = 0.97 * (P / 1.95);
    const yBottom = base - Rc * 0.9 - r;
    f.strokeStyle = COL.faint; f.lineWidth = 1; f.beginPath();
    for (let k = -2; k < 40; k++) {
      const y = yBottom - 1.5 * Rc * k - Rc;
      if (y < base - peak - 2 * Rc) break;
      const off = (k % 2 + 2) % 2 ? P / 2 : 0;
      const jMax = Math.ceil(W / P) + 1;
      for (let j = -jMax; j <= jMax; j++) hexPath(f, W / 2 + off + j * P, y, cr);
    }
    f.stroke();
    f.restore();
    field = c2;
  }

  // where an agent is at time t, how bright, and whether its head is lit
  function at(n, t, out) {
    let x = n.x, y = n.y, a = 1, hollow = false;
    if (n.zone === 0) {
      x += P * (inOut((t - n.t1) / T.herdDur) - inOut((t - n.t2) / T.herdDur));
    } else if (n.zone === 1) {
      if (n.sell >= 0 && t > n.sell) { const f = inOut((t - n.sell) / 420); y += Rc * 0.5 * f; a = 1 - 0.5 * f; hollow = f > 0.5; }
    } else {
      x += P * inOut((t - T.out) / T.outDur);
    }
    out.x = x; out.y = y; out.a = a * n.edge; out.hollow = hollow;
    return out;
  }

  function draw(t) {
    g.setTransform(DPR, 0, 0, DPR, 0, 0); g.clearRect(0, 0, W, H);
    const drawP = live ? inOut(t / T.draw) : 1;
    const xe = x0 + drawP * (x1 - x0);
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
    const zNow = zoneOf(live ? youU(t) : YOU[YOU.length - 1][1]);
    // checks: a small ring opens around a mid agent; the right group's decision: one ring on every agent at once
    const o = {};
    g.strokeStyle = COL.muted; g.lineWidth = 1;
    const rings = new Map();
    const ring = (x, y, e, amp) => { const al = amp * (1 - e); const b = Math.round(al * 10); if (b <= 0) return; let arr = rings.get(b); if (!arr) rings.set(b, arr = []); arr.push(x, y, r + (phone ? 5 : 7) * SL.outCubic(e)); };
    if (live) for (const n of nodes) {
      const v = clamp01((t - n.appear) / T.fadeIn); if (v <= 0) continue;
      if (n.zone === 1) for (const c of n.checks) { const e = (t - c) / 420; if (e >= 0 && e <= 1) { at(n, t, o); ring(o.x, o.y, e, 0.55); } }
      if (n.zone === 2) { const e = (t - T.decide) / 420; if (e >= 0 && e <= 1) { at(n, t, o); ring(o.x, o.y, e, 0.5); } }
    }
    for (const [b, arr] of rings) { g.globalAlpha = b / 10; g.beginPath(); for (let i = 0; i < arr.length; i += 3) hexPath(g, arr[i], arr[i + 1], arr[i + 2]); g.stroke(); }
    g.globalAlpha = 1;
    // the agents: the group YOU is in is bright, the others muted; sold mid agents are hollow
    const list = [], hollow = [];
    for (const n of nodes) {
      const v = live ? clamp01((t - n.appear) / T.fadeIn) : 1; if (v <= 0) continue;
      at(n, t, o);
      const lit = n.zone === zNow && !o.hollow;
      const al = v * o.a * (lit ? 1 : 0.78);
      if (o.hollow) hollow.push({ x: o.x, y: o.y, a: al });
      else list.push({ x: o.x, y: o.y, a: al, k: lit ? 1 : 0 });
    }
    SL.drawGlyphs(g, list, { r, lw: phone ? 1 : 1.15, head: phone ? 1.25 : 1.7 });
    if (hollow.length) {
      g.lineWidth = phone ? 1 : 1.15; g.strokeStyle = COL.muted;
      for (const h of hollow) { g.globalAlpha = h.a; g.beginPath(); hexPath(g, h.x, h.y, r); g.stroke(); }
      g.globalAlpha = 1;
    }
    // the curve, drawn once
    g.globalAlpha = 0.92; g.strokeStyle = COL.text; g.lineWidth = 1; g.beginPath();
    for (let x = x0; x <= xe; x += 2) { const y = cy(x); x === x0 ? g.moveTo(x, y) : g.lineTo(x, y); }
    g.stroke(); g.globalAlpha = 1;
    placeYou(t);
  }

  // one state drives the YOU tick, the lit group, the tab and the copy
  function placeYou(t) {
    const u = live ? youU(t) : YOU[YOU.length - 1][1];
    const x = x0 + u * (x1 - x0), y = cy(x);
    you.style.transform = `translateX(${x.toFixed(1)}px)`;
    // the tag clears the curve across its whole width (on a steep slope the curve rises under one side of it)
    const hw = (yt.offsetWidth || 44) / 2 + 4;
    let ymin = y; for (let xx = x - hw; xx <= x + hw; xx += 2) ymin = Math.min(ymin, cy(Math.max(x0, Math.min(x1, xx))));
    const tagB = ymin - 12;
    yt.style.top = tagB + 'px';
    yl.style.top = tagB + 'px'; yl.style.height = Math.max(0, base - tagB) + 'px';
    const z = zoneOf(u);
    if (z !== activeZone) {
      activeZone = z;
      zoneEls.forEach(el => el.classList.toggle('on', +el.dataset.zone === z));
      tagEls.forEach(el => el.classList.toggle('on', +el.dataset.ztag === z));
    }
    you.style.opacity = (!live || x0 + inOut(t / T.draw) * (x1 - x0) >= x - 2) ? '1' : '0';
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
    draw(clock);
    if (!settled) raf = requestAnimationFrame(frame);
  }
  function kick() { if (!raf && canRun()) { last = 0; raf = requestAnimationFrame(frame); } }

  setup();
  clock = live ? 0 : T.end;
  draw(clock);

  if (live && 'IntersectionObserver' in window) {
    new IntersectionObserver(es => {
      for (const e of es) {
        visible = e.isIntersecting;
        if (visible && !started) started = true;
        if (visible) kick();
      }
    }, { threshold: 0.3 }).observe(fig);
  } else if (live) { clock = T.end; settled = true; draw(clock); }

  document.addEventListener('visibilitychange', kick);
  let lastW = cv.parentElement.clientWidth, rt = 0;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      const w = cv.parentElement.clientWidth; if (w === lastW) return; lastW = w;
      setup(); draw(clock);
    }, 160);
  });
  // frame renders and tests can read the crowd at any time
  window.__crowdAt = t => { if (raf) cancelAnimationFrame(raf); raf = 0; settled = true; clock = t; draw(t); return nodes.length; };
  window.__crowdGap = t => {           // smallest centre distance between two agents at time t, in glyph widths
    const o = {}, pts = nodes.map(n => { at(n, t, o); return [o.x, o.y]; });
    let m = 1e9;
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) m = Math.min(m, Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]));
    return { n: nodes.length, minPx: +m.toFixed(2), glyphW: 2 * r, ratio: +(m / (2 * r)).toFixed(2) };
  };
})();
