/* Swarm A, Core Glow: the hero (Canvas 2D, two canvases, official swarm-mark.svg on the core cell).
   The honeycomb and the ghost of the Hive Core (its six neighbours in grey, the core's outline dim gold) are painted
   in the first frame, and the swarm starts at once. Every agent is the page's agent glyph: a hex outline with a head.
     0 to 0.7s    the field wakes: one soft wave runs out from the core across the honeycomb.
     0.15 to 0.6s 36 agents (18 on phones) appear in four waves over the whole first screen, outside the copy: the top
                  band, the outer columns and the pockets beside the cards. Each one is its own decider: it hops from
                  corner to corner along the honeycomb's channels at its own speed (0.8 to 1.3 times the mean), and
                  every corner it reaches opens a small sensing ring. About one in four stops at a junction, senses,
                  and turns down a different branch before it commits. A few stand down and fade where they are.
                  Scouting agents are muted; once an agent has decided it turns bright and heads for the core.
     1.25 to 1.8s arrivals, clockwise: twelve gates, one at each outer corner of the six neighbour cells. Each
                  neighbour lights grey as its first agent reaches it; the core's outline charges with every arrival.
     2.0s         ignition: the official mark lands (scale 1, 1.08, 1), the warm light opens, and one ripple runs out
                  from the core to the edges of the screen, lighting the honeycomb as it passes (never under the copy).
     2.12s        the handoff: one bright agent leaves the core along the honeycomb, around the copy, passes behind
                  Scout 03 on wide screens (the card reports as it goes through) and lands on the hero's Join Swarm
                  button by 2.8s. The button lifts once and its light starts at that contact point (page.js).
     2.9s         the swarm is still (phones run 8% faster); the pulse's lit edges fade by about 3.3s and the loop
                  stops. The rest frame keeps every route as a quiet #55555B trace, the pulse's path a step brighter,
                  and the dim agents parked two corners short of their gates. Phones, and any layout with no clean
                  route, get no pulse: the ring starts just after ignition from the point nearest the core.
   Positions are a pure function of time, so ?t=<ms>, the reduced-motion still (?reduce=1) and the settled frame are
   exact. No agent, route, ring or pulse ever enters the copy (32px clearance from every text line and card). No text
   is drawn on canvas. window.SWARM.heroSignal (and the swarm:hero-signal event) tells page.js when and where the pulse
   lands. */
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
  const { COL, clamp01, sm, inOut, outCubic, rng, hexPath, lattice, drawField, drawGlyphs } = SL;

  // ms; phones run 8% faster (K = 0.92)
  // agents are on screen and moving from the first frame (40% opacity, full by 0.4s); they gather in queues behind the
  // twelve gates, the rush goes clockwise from about 1.45s, and the core ignites at about 2.0s
  const BASE = { wake: 700, enter: 0, wave: 60, move: 30, arr0: 1420, arr1: 1900, rush: 1560, rushSpan: 200, slot: 48, ignite: 2000, markIn: 250, pulse: 450, glowIn: 520, ripple: 900, end: 2900, ring: 300, fadeOut: 650 };
  let T = BASE;
  const STATES = [
    ['SCANNING', 'Scanning', 'the market', 'Scanning'],
    ['ANALYZING', 'Analyzing', 'what changed', 'Analyzing'],
    ['REPORTING', 'Reporting', 'to the watch list', 'Reporting']
  ];

  // the handoff: the pulse leaves 120ms after ignition, crosses in 560 to 680ms (so it lands by 2.8s), its lit edges
  // fade over 450ms; it keeps 16px more than the swarm's own margins from every glyph; the ring's lap is 1.4s (page.js)
  const SIG = { delay: 140, fade: 600, Dmin: 560, Dmax: 660, gap: 8, lap: 1400, trace: 0.6 };

  let W, Hc, DPR, phone, tablet, R, P, Rc, core, maxD, ripR, L, V, glowEl, rects, quiet, floorY, walk, ring1, K = 1;
  let agents, traceEdges, gR, lastG = -1, lastMark = '', phaseIdx = -1, lastDot = -2, sig = '', lastBars = '', arrLast = 0;
  let ringBox = null, relay = null, sroute = null, sigT0 = Infinity, sigArr = Infinity, sigEdges = [], btnIdx = -1, cardIdx = -1, planMs = 0;

  /* ---------- the copy, the cards and the nav, in hero space ---------- */
  function measure() {
    const hr = hero.getBoundingClientRect();
    const box = r => [r.left - hr.left, r.top - hr.top, r.right - hr.left, r.bottom - hr.top];
    rects = []; quiet = []; relay = null; btnIdx = -1; cardIdx = -1;
    const pad = phone ? 12 : 22;
    hero.querySelectorAll('.hero-copy [data-avoid]').forEach(el => {
      if (el.offsetParent === null) return;
      if (el.classList.contains('btn-hero')) btnIdx = rects.length;
      if (el.dataset.avoid === 'lines') {
        // the real glyph boxes, line by line (text nodes, so a block span never reads as a full-width box)
        const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), rg = document.createRange();
        for (let n = tw.nextNode(); n; n = tw.nextNode()) {
          if (!n.textContent.trim()) continue;
          rg.selectNodeContents(n);
          for (const r of rg.getClientRects()) if (r.width > 1 && r.height > 1) {
            const b = box(r); rects.push([b[0] - pad, b[1] - pad * 0.75, b[2] + pad, b[3] + pad * 0.75]);
            quiet.push(b);
          }
        }
      } else { const r = el.getBoundingClientRect(); if (r.width && r.height) { const b = box(r); rects.push([b[0] - pad, b[1] - pad, b[2] + pad, b[3] + pad]); quiet.push(b); } }
    });
    // on phones the copy fills the width: keep the whole column clear, so nothing flickers in the gaps between lines
    if (phone) {
      const cp = hero.querySelector('.hero-copy'), r = cp && cp.getBoundingClientRect();
      if (r) { const b = box(r); rects.push([-20, b[1] - pad, W + 20, b[3] + pad]); }
    }
    hero.querySelectorAll('.qcard').forEach(el => {
      if (el.offsetParent === null) return;
      const b = box(el.getBoundingClientRect());
      // where Scout 03 floats beside the copy (1240px and up) it is the handoff's relay: the pulse may pass behind it
      if (el === card) { cardIdx = rects.length; if (getComputedStyle(el).position === 'absolute') relay = [b[0] + 3, b[1] + 3, b[2] - 3, b[3] - 3]; }
      // the cards are panels above the canvas: agents keep 22px from them (32px from every line of text)
      const cp = phone ? 10 : 12;
      rects.push([b[0] - cp, b[1] - cp, b[2] + cp, b[3] + cp]);
    });
    if (window.scrollY < 10) document.querySelectorAll('.nav-logo, .nav .btn-line').forEach(el => { const b = box(el.getBoundingClientRect()); rects.push([b[0] - 10, b[1] - 10, b[2] + 10, b[3] + 10]); });
    const rail = hero.querySelector('.hero-rail .hr-in');
    floorY = rail && rail.offsetParent !== null ? rail.getBoundingClientRect().top - hr.top : 1e9;
    if (phone && rail && rail.offsetParent !== null) { const b = box(rail.getBoundingClientRect()); rects.push([b[0] - pad, b[1] - pad, b[2] + pad, b[3] + pad]); floorY = 1e9; }
    // the hero button's ring: 6px outside the button, corner radius 24 (core-glow.css .ring, the SVG rects' rx)
    const btn = hero.querySelector('.btn-hero');
    if (btn && btn.offsetParent !== null) {
      const b = box(btn.getBoundingClientRect());
      ringBox = { x0: b[0] - 6, y0: b[1] - 6, x1: b[2] + 6, y1: b[3] + 6 };
      ringBox.w = ringBox.x1 - ringBox.x0; ringBox.h = ringBox.y1 - ringBox.y0;
      ringBox.rx = Math.min(24, ringBox.w / 2, ringBox.h / 2);
      ringBox.cx = (ringBox.x0 + ringBox.x1) / 2; ringBox.cy = (ringBox.y0 + ringBox.y1) / 2;
      ringBox.per = 2 * (ringBox.w - 2 * ringBox.rx) + 2 * (ringBox.h - 2 * ringBox.rx) + 2 * Math.PI * ringBox.rx;
    } else ringBox = null;
    return rects.map(r => r.map(Math.round).join(',')).join('|');
  }
  const inRect = (x, y, m) => { for (const r of rects) if (x > r[0] - m && x < r[2] + m && y > r[1] - m && y < r[3] + m) return true; return false; };
  const dRect = (r, x, y) => { const dx = Math.max(r[0] - x, 0, x - r[2]), dy = Math.max(r[1] - y, 0, y - r[3]); return dx || dy ? Math.hypot(dx, dy) : 0; };
  const quietD = (x, y) => { let d = 1e9; for (const r of quiet) d = Math.min(d, dRect(r, x, y)); return d; };
  // the field steps back behind the copy (to 12% inside the line boxes, full strength 56px out)
  function quietAt(x, y) { return 0.12 + 0.88 * sm(0, 56, quietD(x, y)); }


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


  /* ---------- the handoff: the ring's geometry (a rounded rect in SVG path order, pathLength 100; from the lab's h2) ---------- */
  function ringSD(x, y) {
    const b = ringBox, hx = b.w / 2 - b.rx, hy = b.h / 2 - b.rx;
    const qx = Math.abs(x - b.cx) - hx, qy = Math.abs(y - b.cy) - hy;
    return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - b.rx;
  }
  // position of a point on the ring outline, in pathLength units: the SVG rect path starts at (x + rx, y) and runs clockwise
  function ringPos(x, y) {
    const b = ringBox, r = b.rx, arc = Math.PI * r / 2;
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

  /* ---------- the handoff route: from the core, around the copy (through Scout 03 where it floats), into the ring ---------- */
  const inBox = (b, x, y) => x > b[0] && x < b[2] && y > b[1] && y < b[3];
  // a point the pulse may use: inside the hero above the rail, and SIG.gap further from every glyph box than the swarm's
  // own margin, except the hero button (the last leg reaches its ring) and Scout 03 when it is the relay (free inside)
  function sigFree(x, y, yMax, m = SIG.gap) {
    if (x < 3 || x > W - 3 || y < 4 || y > yMax) return false;
    if (relay && inBox(relay, x, y)) return true;
    for (let i = 0; i < rects.length; i++) {
      if (i === btnIdx || (relay && i === cardIdx)) continue;
      const r = rects[i];
      if (x > r[0] - m && x < r[2] + m && y > r[1] - m && y < r[3] + m) return false;
    }
    return true;
  }
  function planSignal() {
    sroute = null;
    if (!ringBox || phone) return null;                                // phones: the copy fills the width, no clean route
    const t0 = performance.now();
    const b = ringBox, yMax = Math.min(Hc - 10, floorY - 10);
    const ok = V.map(v => v.core || (ringSD(v.x, v.y) > 0 && sigFree(v.x, v.y, yMax)));
    // an edge is allowed only if its 0.25, 0.5 and 0.75 points are free too (the reading zone is a hard exclusion)
    const eOK = (i, j) => { const A = V[i], B = V[j]; if (A.core && B.core) return true; for (const f of [0.25, 0.5, 0.75]) if (!sigFree(A.x + (B.x - A.x) * f, A.y + (B.y - A.y) * f, yMax)) return false; return true; };
    // the corners where the rest of the swarm parks cost a little more, so the pulse does not run over a resting agent
    const rest = new Set(); for (const a of agents) if (a.parkV !== undefined) rest.add(a.parkV);
    // contacts: lattice edges that cut the ring on its right half, above "Cancel anytime."; the pulse runs along that
    // edge until it touches the ring. Multi-source Dijkstra from the contacts outward, to the first core corner.
    const dist = new Float64Array(V.length).fill(Infinity), next = new Int32Array(V.length).fill(-1), hit = new Array(V.length);
    const heap = [];
    const push = (d, i) => { heap.push([d, i]); let k = heap.length - 1; while (k) { const p = (k - 1) >> 1; if (heap[p][0] <= heap[k][0]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; } };
    const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let k = 0; for (;;) { const l = 2 * k + 1, r = l + 1; let m = k; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m; } } return top; };
    V.forEach((v, i) => {
      if (!ok[i] || v.core) return;
      for (const j of v.nb) {
        const w = V[j];
        // a corner on the ring's own outline counts as touching it (the lattice can land a corner exactly on the edge)
        if (ringSD(w.x, w.y) >= 1.5 || ringSD(v.x, v.y) < 1.5) continue;
        let lo = 0, hi = 1;
        for (let it = 0; it < 24; it++) { const m = (lo + hi) / 2; if (ringSD(v.x + (w.x - v.x) * m, v.y + (w.y - v.y) * m) > 0) lo = m; else hi = m; }
        const cx = v.x + (w.x - v.x) * lo, cy = v.y + (w.y - v.y) * lo;
        // the right half, above the bottom edge; or the right end cap when the last leg comes in from the right
        // (both keep the pulse from passing under "Cancel anytime.")
        // anywhere on the ring's right part (top, end cap or bottom); the last leg below keeps it out from under
        // "Cancel anytime."
        if (cx < b.cx + 0.4 * b.w / 2) continue;
        // the last leg, into the ring: clear of the glyph boxes by the swarm's own margin
        if (!sigFree((v.x + cx) / 2, (v.y + cy) / 2, yMax, 0)) continue;
        const d0 = Math.hypot(cx - v.x, cy - v.y);
        if (d0 < dist[i]) { dist[i] = d0; hit[i] = { x: cx, y: cy }; }
      }
      if (dist[i] < Infinity) push(dist[i], i);
    });
    let start = -1, settled = 0;
    const nContacts = heap.length;
    while (heap.length) {
      const [d, i] = pop(); if (d > dist[i]) continue;
      settled++;
      if (V[i].core) { start = i; break; }
      for (const j of V[i].nb) {
        if (!ok[j] || !eOK(i, j)) continue;
        const A = V[i], B = V[j], len = Math.hypot(B.x - A.x, B.y - A.y);
        // through Scout 03 costs half, so on wide screens the pulse goes behind the card and the card reports
        const inRelay = relay && inBox(relay, A.x, A.y) && inBox(relay, B.x, B.y);
        const nd = d + (A.core && B.core ? len * 40 : inRelay ? len * 0.5 : len) + (rest.has(j) ? 2 * P : 0);
        if (nd < dist[j]) { dist[j] = nd; next[j] = i; push(nd, j); }
      }
    }
    planMs = performance.now() - t0;
    window.__heroSigPlan = { contacts: nContacts, settled, start };
    if (start < 0) return null;
    const pts = [];
    let k = start, guard = 0;
    while (k >= 0 && guard++ < 800) { pts.push({ x: V[k].x, y: V[k].y }); if (hit[k] && next[k] < 0) break; k = next[k]; }
    const end = k >= 0 ? hit[k] : null;
    if (!end) return null;
    pts.push({ x: end.x, y: end.y });
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
    const len = cum[cum.length - 1];
    // the swarm's motion language: a soft start, cruise, a short settle into the ring
    const D = Math.max(SIG.Dmin, Math.min(SIG.Dmax, len / 1.9));
    const tau = cum.map(s => D * profInv(clamp01(s / len)));
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
    sroute = { pts, cum, len, D, tau, pos: ringPos(end.x, end.y), inS, outS };
    return sroute;
  }
  const sigTauAt = s => sroute.D * profInv(clamp01(s / sroute.len));
  // tell page.js when and where the pulse lands (or, with no route, when the ring starts after ignition)
  function publishSignal() {
    let info = null;
    if (sroute) info = { depart: sigT0, land: sigArr, pos: sroute.pos, relayIn: sroute.inS >= 0 ? sigT0 + sigTauAt(sroute.inS) : null, relayOut: sroute.outS >= 0 ? sigT0 + sigTauAt(sroute.outS) : null, lap: SIG.lap, fallback: false };
    else if (ringBox) info = { land: ripAt(Math.hypot(ringBox.cx - core.x, ringBox.y0 - core.y)), pos: ringPos(ringBox.cx, ringBox.y0), lap: SIG.lap, fallback: true };
    if (window.SWARM) window.SWARM.heroSignal = info;
    document.dispatchEvent(new CustomEvent('swarm:hero-signal', { detail: info }));
  }

  /* ---------- the plan: lattice, gates, and the agents (each with its own route, speed and choices) ---------- */
  // a hop's ease: mostly steady, a little slower at each corner, so the agents step from corner to corner
  const hopE = x => 0.6 * x + 0.4 * x * x * (3 - 2 * x);
  function setup(fieldOnly) {
    const t0 = performance.now();
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = hero.clientWidth;
    const vh = window.innerHeight || 900;
    Hc = Math.round(Math.min(hero.clientHeight, Math.max(vh, 640) + 120));
    phone = W <= 640; tablet = !phone && W < 1240;
    K = phone ? 0.92 : 1;
    T = {}; for (const key in BASE) T[key] = BASE[key] * K;
    sroute = null; sigT0 = sigArr = Infinity; sigEdges = []; lastBars = '';
    if (!glowEl) { glowEl = document.createElement('div'); glowEl.className = 'hero-glow'; fc.before(glowEl); }
    for (const c of [fc, ac]) { const cw = Math.round(W * DPR), ch = Math.round(Hc * DPR); if (c.width !== cw || c.height !== ch) { c.width = cw; c.height = ch; } c.style.width = W + 'px'; c.style.height = Hc + 'px'; }
    R = parseFloat(getComputedStyle(hero).getPropertyValue('--R')) || (phone ? 25 : 38);
    P = 1.95 * R; Rc = P / SL.SQ3;
    const hr = hero.getBoundingClientRect(), ar = anchor.getBoundingClientRect();
    core = { x: Math.round(W / 2), y: Math.round(ar.top - hr.top) };
    const Sz = 7.5 * R;
    Object.assign(mark.style, { width: Sz + 'px', height: Sz + 'px', left: (core.x - Sz / 2) + 'px', top: (core.y - Sz / 2) + 'px' });
    maxD = Math.hypot(Math.max(core.x, W - core.x), Math.max(core.y, Hc - core.y));
    ripR = Math.max(phone ? 0 : 1100, maxD * 1.06);                     // the ignition ripple reaches every edge of the screen
    sig = measure();
    // the core's warm light: one soft ellipse under the field, reaching across the top of the screen and down past the
    // chip row (the reference's light from above, as the core's own glow)
    const gw = phone ? 330 : (tablet ? 560 : Math.min(840, W * 0.56)), gh = phone ? 330 : (tablet ? 440 : 560);
    const st = [[0, 0.44], [5, 0.36], [12, 0.27], [22, 0.18], [34, 0.11], [48, 0.06], [64, 0.027], [82, 0.009], [100, 0]];
    Object.assign(glowEl.style, { left: (core.x - gw) + 'px', top: (core.y - gh) + 'px', width: 2 * gw + 'px', height: 2 * gh + 'px',
      background: `radial-gradient(closest-side, ${st.map(([o, a]) => `rgba(245,197,66,${a}) ${o}%`).join(', ')})` });
    lastG = -1; lastMark = ''; phaseIdx = -1; lastDot = -2;

    L = lattice({ R, ox: core.x, oy: core.y, x0: -0.1 * W, y0: -3 * P, x1: 1.1 * W, y1: Hc + 2 * P });
    V = L.V; eCache = new Map();
    for (const c of L.cells) c.qd = quietD(c.x, c.y);
    const yMax = Math.min(Hc - 40, floorY - 26), m = phone ? 7 : 10;
    // the swarm may also come in from just off the screen's edges, so it is already on its way in the first frame
    walk = V.map(v => !v.core && !v.perim && v.x > -1.3 * P && v.x < W + 1.3 * P && v.y > -1.3 * P && v.y < yMax && !inRect(v.x, v.y, m));
    gR = phone ? 8 : 11;
    ring1 = (L.rings[1] || []).slice();
    for (const c of ring1) c.lit = 1e9;
    agents = []; traceEdges = []; arrLast = T.arr1;
    if (fieldOnly) return;
    const rnd = rng(phone ? 17 : 11);

    // twelve gates: each outer corner of each neighbour cell, down that neighbour's side to the core
    const gates = [];
    for (const nc of ring1) {
      for (const v of V) {
        if (!v.perim || !v.cells.includes(nc) || v.cells.filter(c => c.ring === 1).length !== 1) continue;
        const valley = v.nb.find(j => V[j].perim && V[j].cells.includes(nc) && V[j].cells.filter(c => c.ring === 1).length === 2);
        if (valley === undefined) continue;
        const cc = V[valley].nb.find(j => V[j].core);
        if (cc === undefined) continue;
        gates.push({ O: v.i, valley, cc, cell: nc, a: ang(v.x, v.y), load: 0 });
      }
    }
    for (const gt of gates) gt.ok = V[gt.O].nb.some(j => walk[j] && edgeOK(gt.O, j));
    const okGates = gates.filter(g => g.ok);
    // the open field the gates can reach
    const reach = new Set(), rq = [];
    for (const gt of okGates) for (const j of V[gt.O].nb) if (walk[j] && edgeOK(gt.O, j) && !reach.has(j)) { reach.add(j); rq.push(j); }
    for (let h = 0; h < rq.length; h++) for (const j of V[rq[h]].nb) if (walk[j] && !reach.has(j) && edgeOK(rq[h], j)) { reach.add(j); rq.push(j); }

    // the routes form a forest: breadth-first from the twelve gates, every open corner gets one next hop toward its
    // nearest gate, so two routes can merge but never cross
    const par = new Int32Array(V.length).fill(-1), gOf = new Int32Array(V.length).fill(-1), dG = new Int32Array(V.length).fill(-1);
    {
      const qq = [];
      okGates.forEach((gt, gi) => { dG[gt.O] = 0; gOf[gt.O] = gi; qq.push(gt.O); });
      for (let h = 0; h < qq.length; h++) { const i = qq[h]; for (const j of V[i].nb) if (walk[j] && dG[j] < 0 && edgeOK(i, j)) { dG[j] = dG[i] + 1; qq.push(j); } }
      // among the equally near next hops, each corner takes the one closest to its own bearing from the core, so the
      // routes run in like spokes (more of them stay apart for longer) rather than along the rows
      for (const i of qq) {
        if (dG[i] <= 0) continue;
        const th = ang(V[i].x, V[i].y);
        let best = -1, bd = 1e9;
        for (const j of V[i].nb) if (dG[j] === dG[i] - 1 && edgeOK(i, j)) { const dd = angDiff(ang(V[j].x, V[j].y), th) + 1e-4 * V[j].d; if (dd < bd) { bd = dd; best = j; } }
        par[i] = best;
      }
      for (const i of qq) { if (dG[i] <= 0) continue; let k = i, guard = 0; while (par[k] >= 0 && guard++ < 400) k = par[k]; gOf[i] = gOf[k]; }
    }
    const treePath = s0 => { const out = []; for (let k = s0; k >= 0; k = par[k]) out.push(k); return out; };   // start ... gate corner
    const isAnc = (x, y) => { for (let k = par[y]; k >= 0; k = par[k]) if (k === x) return true; return false; };

    // where they start: spread over the whole open field, far from the core first; on wide screens a share of them
    // starts in the pockets beside the cards and the button, below the headline
    const N = phone ? 18 : (tablet ? 34 : 44), NS = phone ? 0 : 4;
    const maxHops = phone ? 10 : (tablet ? 14 : 16);
    const cand = [...reach].filter(i => dG[i] > 1 && V[i].d > (phone ? 2.3 : 2.5) * P);
    const subEl = hero.querySelector('.hero-sub');
    const yLow = subEl && subEl.offsetParent !== null ? subEl.getBoundingClientRect().top - hr.top : Hc * 0.55;
    const picked = [], gLoad = new Int32Array(okGates.length);
    const sep = phone ? 1.7 * Rc : 1.9 * Rc;
    function sample(pool, n) {
      for (let k = 0; k < n; k++) {
        let best = -1, bs = -1e9;
        for (const i of pool) {
          if (picked.includes(i)) continue;
          let md = 1e9, shared = 0;
          for (const j of picked) { md = Math.min(md, Math.hypot(V[i].x - V[j].x, V[i].y - V[j].y)); if (isAnc(i, j) || isAnc(j, i)) shared++; }
          if (md < sep) continue;
          // prefer a branch of its own, so it can scout at its own pace before its route meets another, and a gate
          // with a short queue, so the swarm comes in from all around the hive
          const s2 = Math.min(md, 6 * P) + 0.22 * Math.min(V[i].d, maxHops * Rc) - 1.6 * P * shared - 1.1 * P * (gOf[i] >= 0 ? gLoad[gOf[i]] : 0) + rnd() * 18;
          if (s2 > bs) { bs = s2; best = i; }
        }
        if (best < 0) break;
        picked.push(best); if (gOf[best] >= 0) gLoad[gOf[best]]++;
      }
    }
    const lowPool = cand.filter(i => V[i].y > yLow), highPool = cand.filter(i => V[i].y <= yLow);
    const nLow = phone ? 0 : Math.min(Math.round((N - NS) * 0.38), lowPool.length);
    sample(lowPool, nLow);
    sample(highPool, N - NS - picked.length);
    const plans = [];
    for (const s0 of picked) {
      let path = treePath(s0);
      if (path.length > maxHops + 1) path = path.slice(path.length - maxHops - 1);
      const gate = okGates[gOf[s0]];
      plans.push({ path, gate });
    }
    // how many routes use each corner (a probe only ever steps onto a corner no route uses)
    const useN = new Int32Array(V.length);
    for (const pl of plans) for (const i of pl.path) useN[i]++;
    const startSet = new Set(plans.map(pl => pl.path[0]));
    const probeUsed = new Set();
    const vMean = phone ? 0.36 : 0.56;                                    // px per ms: the mean pace
    plans.sort((x, y) => y.path.length - x.path.length);
    plans.forEach((pl, r) => {
      const path = pl.path, nG = path.length - 1;                         // hops to the gate corner
      // about one in four stops at a junction, senses, leans down one branch, and takes the other: then it commits
      let probe = -1;
      if (nG >= 4 && rnd() < 0.3) {
        const lo = 1, hi = Math.max(1, Math.round(nG * 0.6));
        for (let tries = 0; tries < 5 && probe < 0; tries++) {
          const k = lo + ((rnd() * (hi - lo + 1)) | 0), u = path[k];
          const w = V[u].nb.find(j => walk[j] && j !== path[k - 1] && j !== path[k + 1] && edgeOK(u, j));
          if (w !== undefined) { probe = k; pl.w = w; }
        }
      }
      const wave = Math.min(3, Math.floor(r * 4 / plans.length));
      // on screen from the first frame; the four waves only stagger when each one sets off
      const pace = 0.8 + rnd() * 0.5;                                     // its own speed: 0.8 to 1.3 times the mean
      const full = path.concat([pl.gate.valley, pl.gate.cc]);
      agents.push({ kind: 'go', path: full, gate: pl.gate, valley: pl.gate.valley, probeAt: probe, leanTo: probe >= 0 ? pl.w : -1, pauseD: probe >= 0 ? (110 + rnd() * 120) * K : 0, born: 0, move0: T.move + wave * T.wave + rnd() * 40 * K, pace, dPre: Rc / (vMean * pace) });
    });
    // timing: each agent moves at its own pace. They are scheduled one after another, earliest natural arrival first,
    // and a later one yields wherever it would catch up: it leaves a corner only a beat after the one ahead left it,
    // and reaches the next corner only a beat after the one ahead has gone on (a short wait at a junction, like a
    // scout checking before it moves). One that starts on another's route appears only after that one has passed.
    const Dt = T.slot, AMAX = T.arr1 + 180 * K;
    const lastDep = new Float64Array(V.length).fill(-1e9);
    // the rush: each gate opens in turn, clockwise from the top, from T.rush over T.rushSpan; until its gate opens an
    // agent holds at the gate corner and the ones behind it queue on the corners behind, so the swarm crowds the hive
    {
      const cw = g => (g.a + 2.5 * Math.PI) % (2 * Math.PI);
      const og = okGates.slice().sort((x, y) => cw(x) - cw(y));
      og.forEach((g, i) => { g.rushT = T.rush + (og.length > 1 ? i / (og.length - 1) : 0) * T.rushSpan; });
    }
    // once an agent decides it commits: it turns bright and moves 1.6 times faster into the hive
    const BOOST = 1.6;
    const kDecOf = a => a.probeAt >= 0 ? a.probeAt : Math.max(1, Math.round((a.path.length - 1) * 0.4));
    const effN = a => { const n = a.path.length - 1, kd = Math.min(n, a.kDec); return kd + (n - kd) / BOOST; };
    // the beat: full in the open field; at the cluster's own corners, where they merge into the core, a short one
    const gap = i => V[i].d < 1.62 * P ? 34 * K : Dt;
    const schedule = (a, d0, rec) => {
      const n = a.path.length - 1;
      const iO = a.kind === 'go' ? a.path.indexOf(a.gate.O) : -1, kd = a.kind === 'go' ? a.kDec : 1e9;
      a.tArr = new Float64Array(n + 1); a.tDep = new Float64Array(n + 1);
      if (rec) { const s0 = a.path[0], need = lastDep[s0] + Dt; if (a.born < need) { a.born = need; a.move0 = Math.max(a.move0, need + 60); } }
      a.tArr[0] = a.move0;
      for (let k = 0; k <= n; k++) {
        let dep = a.tArr[k] + (k === a.probeAt ? a.pauseD : 0);
        if (k === iO) dep = Math.max(dep, a.gate.rushT);
        if (k < n) {
          const d = d0 * (V[a.path[k + 1]].core || V[a.path[k]].perim ? 0.85 : 1) / (k >= kd ? BOOST : 1);
          if (rec) { dep = Math.max(dep, lastDep[a.path[k]] + gap(a.path[k]), lastDep[a.path[k + 1]] + gap(a.path[k + 1]) - d); }
          a.tDep[k] = dep; a.tArr[k + 1] = dep + d;
        } else a.tDep[k] = dep;
      }
      a.arr = a.tArr[n];
    };
    for (const a of agents) { a.kDec = kDecOf(a); a.want = a.move0 + a.pauseD + effN(a) * a.dPre; }
    agents.sort((x, y) => x.want - y.want);
    const dropped = new Set();
    for (const a of agents) {
      a.cum = cumOf(a.path);
      // a long way to go: it keeps up a little faster (up to 1.3 times the mean) or starts a corner or two further in
      const fit = () => { const room = AMAX - 120 * K - a.move0 - a.pauseD; return room / effN(a); };
      while (fit() < Rc / (vMean * 1.3) && a.path.length > 6) { a.path.shift(); if (a.probeAt >= 0) { a.probeAt--; if (a.probeAt < 1) { a.probeAt = -1; a.pauseD = 0; } } a.kDec = kDecOf(a); }
      a.dPre = Math.max(Rc / (vMean * 1.3), Math.min(a.dPre, fit()));
      // a short way to go: it takes its time (down to 0.8 times the mean), so the arrivals gather toward ignition
      { const early = (T.arr0 - a.move0 - a.pauseD) / effN(a); if (early > a.dPre) a.dPre = Math.min(Rc / (vMean * 0.8), early); }
      a.cum = cumOf(a.path);
      schedule(a, a.dPre, true);
      if (a.arr > AMAX) { dropped.add(a); a.why = [Math.round(a.born), Math.round(a.move0), Math.round(a.arr), a.path.length, Math.round(a.want), Math.round(a.dPre)]; continue; }
      for (let k = 0; k < a.path.length; k++) lastDep[a.path[k]] = Math.max(lastDep[a.path[k]], a.tDep[k]);
    }
    agents = agents.filter(a => !dropped.has(a));
    // the last agent at every other valley parks two corners short of its gate and stays, dim: the rest frame keeps them
    const groups = new Map();
    for (const a of agents) { if (!groups.has(a.valley)) groups.set(a.valley, []); groups.get(a.valley).push(a); }
    const nPark = 0;                                                       // the rest frame is clean: every agent merges into the core
    [...groups.values()].filter(l => l.length >= 2).map(l => l.sort((x, y) => x.arr - y.arr))
      .sort((x, y) => ang(V[x[0].valley].x, V[x[0].valley].y) - ang(V[y[0].valley].x, V[y[0].valley].y))
      .forEach((l, gi) => {
        if (gi % 2 || agents.filter(a => a.parkV !== undefined).length >= nPark) return;
        const a = l[l.length - 1], iO = a.path.indexOf(a.gate.O), ip = iO - 2;
        if (ip < 1 || ip <= a.probeAt) return;
        // nobody passes its parking corner after it stops there
        if (agents.some(b => b !== a && b.path.includes(a.path[ip]) && b.tDep[b.path.indexOf(a.path[ip])] > a.tArr[ip] - Dt)) return;
        a.parkIdx = ip; a.parkV = a.path[ip]; a.parkT = a.tArr[ip];
      });
    // when each agent decides (it turns bright): back from its probe, or about 40% of the way in
    for (const a of agents) a.tDecide = a.probeAt >= 0 ? a.tDep[a.probeAt] - 40 * K : a.tArr[Math.min(a.path.length - 1, a.kDec)];
    const busy = new Set();
    for (const a of agents) for (const i of a.path) { busy.add(i); for (const j of V[i].nb) busy.add(j); }
    // pocket scouts: in the pockets beside the cards and the button that no route reaches (32px clear of the copy),
    // a few agents appear, sense, check a corner or two and hold their position, dim: the lower band stays alive
    if (!phone) {
      const pocket = V.map((v, i) => i).filter(i => walk[i] && dG[i] < 0 && V[i].y > yLow - 20 && !busy.has(i));
      const nPocket = Math.min(tablet ? 4 : 8, pocket.length);
      const chosen = [];
      for (let k = 0; k < nPocket; k++) {
        let best = -1, bs = -1e9;
        for (const i of pocket) { if (busy.has(i)) continue; let md = 1e9; for (const j of chosen) md = Math.min(md, Math.hypot(V[i].x - V[j].x, V[i].y - V[j].y)); const sc = Math.min(md, 400) + rnd() * 30; if (sc > bs) { bs = sc; best = i; } }
        if (best < 0) break;
        chosen.push(best);
        const path = [best]; let cur = best;
        for (let h = 0; h < 2; h++) { const nx = V[cur].nb.filter(j => walk[j] && !busy.has(j) && !path.includes(j) && edgeOK(cur, j)); if (!nx.length) break; cur = nx[(rnd() * nx.length) | 0]; path.push(cur); }
        for (const i of path) { busy.add(i); for (const j of V[i].nb) busy.add(j); }
        const born = 0;
        const a = { kind: 'hold', path, probeAt: -1, pauseD: 0, born, move0: T.move + 60 + (k % 4) * T.wave + rnd() * 200 };
        a.cum = cumOf(path); schedule(a, (260 + rnd() * 80) * K, false); a.tDecide = a.arr + 120; agents.push(a);
      }
    }
    // stand-downs: a few sense, hop once or twice on corners no route uses, and fade where they are
    const sdPool = cand.filter(i => !busy.has(i) && V[i].d < 0.75 * maxD);
    for (let k = 0; k < NS && sdPool.length; k++) {
      const s0 = sdPool.splice((rnd() * sdPool.length) | 0, 1)[0];
      if (busy.has(s0)) { k--; continue; }
      const path = [s0]; let cur = s0;
      for (let h = 0; h < 2; h++) { const nx = V[cur].nb.filter(j => walk[j] && !busy.has(j) && !path.includes(j) && edgeOK(cur, j)); if (!nx.length) break; cur = nx[(rnd() * nx.length) | 0]; path.push(cur); }
      for (const i of path) { busy.add(i); for (const j of V[i].nb) busy.add(j); }
      const born = 0;
      const a = { kind: 'stand', path, probeAt: -1, pauseD: 0, born, move0: T.move + 80 + (k % 2) * T.wave, out: (900 + rnd() * 300) * K };
      a.cum = cumOf(path); schedule(a, 300 * K, false); agents.push(a);
    }
    const nPre = agents.length;
    window.__heroForest = () => ({ par: [...par].map((p2, i) => p2 >= 0 ? [Math.round(V[i].x), Math.round(V[i].y), Math.round(V[p2].x), Math.round(V[p2].y)] : null).filter(Boolean), starts: picked.map(i => [Math.round(V[i].x), Math.round(V[i].y)]), kept: agents.map(a2 => [Math.round(V[a2.path[0]].x), Math.round(V[a2.path[0]].y), a2.probeAt, a2.kind]), walk: V.filter((v, i) => walk[i]).map(v => [Math.round(v.x), Math.round(v.y)]) });
    // a last check (a safety net; the forest and the beats should leave nothing to settle): never let two agents come
    // closer than 1.25 glyph widths outside the core's own cells
    const cellSz = 2.6 * gR, o2 = {};
    const visAt = (a, t, oo) => { agentAt(a, t, oo); return oo.a > 0.25 && oo.x > -gR && oo.x < W + gR && oo.y > -gR && Math.hypot(oo.x - core.x, oo.y - core.y) > 1.75 * P; };
    {
      const steps = Math.floor(T.end / 20) + 1;
      const track = a => { const xs = new Float32Array(steps * 2).fill(NaN); for (let s2 = 0; s2 < steps; s2++) if (visAt(a, s2 * 20, o2)) { xs[2 * s2] = o2.x; xs[2 * s2 + 1] = o2.y; } return xs; };
      const prio = a => a.kind === 'go' ? (a.parkV !== undefined ? 1 : 2) : (a.kind === 'hold' ? 1 : 0);
      const order = agents.slice().sort((x, y) => (prio(y) - prio(x)) || (x.arr - y.arr));
      const kept = [], tracks = [], clashes = [];
      for (const a of order) {
        const tr = track(a); let ok = true;
        for (let ib = 0; ib < tracks.length && ok; ib++) {
          const tb = tracks[ib];
          for (let s2 = 0; s2 < steps; s2++) {
            const x = tr[2 * s2]; if (x !== x) continue; const xb = tb[2 * s2]; if (xb !== xb) continue;
            if (Math.abs(x - xb) < cellSz && Math.hypot(x - xb, tr[2 * s2 + 1] - tb[2 * s2 + 1]) < cellSz) { ok = false; clashes.push({ t: s2 * 20, x: Math.round(x), y: Math.round(tr[2 * s2 + 1]) }); break; }
          }
        }
        if (ok) { kept.push(a); tracks.push(tr); }
      }
      window.__heroClash = clashes;
      agents = agents.filter(a => kept.includes(a));
    }
    // each neighbour lights when its first agent reaches its gate
    arrLast = 0;
    for (const a of agents) {
      if (a.kind !== 'go') continue;
      const iO = a.path.indexOf(a.gate.O);
      if (iO >= 0 && (a.parkIdx === undefined || iO <= a.parkIdx)) a.gate.cell.lit = Math.min(a.gate.cell.lit, a.tDep[iO]);
      if (a.parkV === undefined) arrLast = Math.max(arrLast, a.arr);
    }
    // ignition follows the last arrival (about 2.0s)
    T.ignite = Math.min(2100 * K, Math.max(1750 * K, arrLast + 90 * K));
    T.end = T.ignite + Math.max(T.ripple, T.fadeOut) + 120 * K;
    // every crossed edge, for the rest-frame traces
    const seenE = new Set();
    for (const a of agents) {
      const n = a.parkIdx !== undefined ? a.parkIdx : a.path.length - 1;
      for (let k = 0; k < n; k++) {
        const u = a.path[k], v = a.path[k + 1]; if (V[u].core || V[v].core) continue;
        const key = u < v ? u * 65536 + v : v * 65536 + u; if (seenE.has(key)) continue; seenE.add(key);
        traceEdges.push([u, v]);
      }
    }
    // the handoff: plan the pulse's route from the core to the hero button, extend the end to cover its fade, and tell
    // page.js when and where it lands (the end is extended last, so every swarm timing above is unchanged)
    planSignal();
    if (sroute) {
      sigT0 = T.ignite + SIG.delay * K; sigArr = sigT0 + sroute.D;
      T.end = Math.max(T.end, sigArr + SIG.fade);
      const p = sroute.pts;
      for (let i = 1; i < p.length; i++) sigEdges.push({ x0: p[i - 1].x, y0: p[i - 1].y, x1: p[i].x, y1: p[i].y, on: sigT0 + sroute.tau[i - 1], off: sigT0 + sroute.tau[i] });
    }
    publishSignal();
    const goN = agents.filter(a => a.kind === 'go');
    window.__heroPlan = { dropped: [...dropped].map(a => a.why), picked: picked.length, plans: plans.length, pre: nPre, lowPool: lowPool.length, highPool: highPool.length, nLow, agents: agents.length, go: goN.length, probes: goN.filter(a => a.probeAt >= 0).length, parked: goN.filter(a => a.parkV !== undefined).length, stand: agents.filter(a => a.kind === 'stand').length, hold: agents.filter(a => a.kind === 'hold').length,
      low: agents.filter(a => V[a.path[0]].y > yLow).length, lastArrival: Math.round(arrLast), firstMove: Math.round(Math.min(...agents.map(a => a.move0))), paces: goN.map(a => +(Rc / a.dPre / vMean).toFixed(2)), R, core, setupMs: Math.round(performance.now() - t0) };
  }

  /* ---------- where everything is at time t ---------- */
  function agentAt(a, t, out) {
    const n = (a.parkIdx !== undefined ? a.parkIdx : a.path.length - 1);
    let x, y, k = 0, moving = false, e = -1;
    if (t <= a.tDep[0]) { x = V[a.path[0]].x; y = V[a.path[0]].y; }
    else if (t >= a.tArr[n]) { x = V[a.path[n]].x; y = V[a.path[n]].y; k = n; }
    else {
      while (k < n && t >= a.tArr[k + 1]) k++;
      const A = V[a.path[k]];
      if (t < a.tDep[k]) {
        x = A.x; y = A.y;
        // at its junction: it leans down the branch it is checking, then comes back and takes the other
        if (k === a.probeAt && a.leanTo >= 0) { const Wv = V[a.leanTo], ph = (t - a.tArr[k]) / Math.max(1, a.tDep[k] - a.tArr[k]), l = 0.3 * Math.sin(Math.PI * Math.min(1, ph / 0.75)); x += (Wv.x - A.x) * l; y += (Wv.y - A.y) * l; out.lean = l; }
      }
      else { const B = V[a.path[k + 1]], f = hopE((t - a.tDep[k]) / (a.tArr[k + 1] - a.tDep[k])); x = A.x + (B.x - A.x) * f; y = A.y + (B.y - A.y) * f; moving = true; e = k; }
    }
    out.x = x; out.y = y; out.moving = moving; out.e = e; out.k = 0;
    if (!(k === a.probeAt && t >= a.tArr[k] && t < a.tDep[k])) out.lean = 0;
    // on screen from the first frame at 40%, full by 0.4s (scouting agents in the muted colour until they decide)
    // (one that starts on a corner another agent passes appears there only once that one has gone, fading in)
    let al = t < a.born ? 0 : 0.85 * (0.4 + 0.6 * clamp01((t - a.born) / 400)) * (a.born > 0 ? clamp01((t - a.born) / 160) : 1);
    if (a.kind === 'stand') { al *= 1 - sm(a.out, a.out + 420, t); out.a = al; return out; }
    // pocket scouts hold dim until the ignition ripple passes them, then stand down, so the rest frame stays clean
    if (a.kind === 'hold') { out.a = al * (1 - 0.25 * sm(a.arr, a.arr + 500, t)) * (1 - sm(T.ignite + 250, T.ignite + 750, t)); return out; }
    const dec = sm(a.tDecide, a.tDecide + 160, t);
    al = al + (1 - al) * dec; out.k = dec > 0.5 ? 1 : 0;
    if (a.parkV !== undefined) {
      if (t >= a.parkT) { const f = sm(a.parkT, a.parkT + 500, t); al *= 1 - 0.45 * f; if (f > 0.5) out.k = 0; }
    } else {
      const toEnd = a.cum[a.cum.length - 1] - (k < a.cum.length ? a.cum[k] + (moving ? (a.cum[k + 1] - a.cum[k]) * hopE((t - a.tDep[k]) / (a.tArr[k + 1] - a.tDep[k])) : 0) : 0);
      if (toEnd < 0.6 * Rc) al *= clamp01(toEnd / (0.6 * Rc));
      if (t >= a.arr) al = 0;
    }
    out.a = al;
    return out;
  }
  const absorbedAt = t => { let n = 0, tot = 0; for (const a of agents) if (a.kind === 'go' && a.parkV === undefined) { tot++; if (t >= a.arr) n++; } return [n, tot]; };

  /* ---------- drawing ---------- */
  function fieldA(c) {
    if (c.ring <= 1) return 0;
    return Math.max(0.16, 1 - sm(0.3 * maxD, 1.05 * maxD, c.d)) * (1 - sm(Hc - 170, Hc - 6, c.y)) * (0.12 + 0.88 * sm(0, 56, c.qd));
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
  // the ignition ripple: its front's radius at hero time t (a soft ease-out over T.ripple), and when it crosses distance d
  const ripE = t => clamp01((t - T.ignite) / T.ripple);
  const ripRad = t => ripR * (1 - Math.pow(1 - ripE(t), 2));
  function ripAt(d) { return T.ignite + T.ripple * (1 - Math.sqrt(Math.max(0, 1 - d / ripR))); }
  // the field around the core reads a step brighter, as if lit by it (more once it ignites), fading toward the edges
  // and stepping back behind the copy
  function liftA(c, G) {
    if (c.ring <= 1) return 0;
    const f = 1 - sm(0.08 * maxD, 0.6 * maxD, c.d);
    if (f <= 0) return 0;
    return f * (0.15 + 0.17 * G) * (0.12 + 0.88 * sm(0, 56, c.qd)) * (1 - sm(Hc - 170, Hc - 6, c.y));
  }
  // the ripple's front: one hexagonal ring from the core to the edges of the screen, 35% fading to 0, drawn in short
  // segments so it steps out of the way of every line of copy
  function drawRipple(g, r, al) {
    if (al <= 0.01) return;
    const per = Math.max(2, Math.round(r / 22)), groups = new Map();
    for (let k = 0; k < 6; k++) {
      const a0 = Math.PI / 180 * (60 * k - 90), a1 = a0 + Math.PI / 3;
      const x0 = core.x + r * Math.cos(a0), y0 = core.y + r * Math.sin(a0), x1 = core.x + r * Math.cos(a1), y1 = core.y + r * Math.sin(a1);
      for (let j = 0; j < per; j++) {
        const ax = x0 + (x1 - x0) * j / per, ay = y0 + (y1 - y0) * j / per, bx = x0 + (x1 - x0) * (j + 1) / per, by = y0 + (y1 - y0) * (j + 1) / per;
        const mx = (ax + bx) / 2, my = (ay + by) / 2;
        if (mx < -30 || mx > W + 30 || my < -30 || my > Hc - 4) continue;
        const b = Math.round(al * sm(4, 40, quietD(mx, my)) * (1 - sm(Hc - 150, Hc - 6, my)) * 20); if (b <= 0) continue;
        let arr = groups.get(b); if (!arr) groups.set(b, arr = []); arr.push(ax, ay, bx, by);
      }
    }
    g.strokeStyle = COL.text; g.lineWidth = phone ? 1.25 : 1.5; g.lineCap = 'round';
    for (const [b, arr] of groups) { g.globalAlpha = b / 20; g.beginPath(); for (let i = 0; i < arr.length; i += 4) { g.moveTo(arr[i], arr[i + 1]); g.lineTo(arr[i + 2], arr[i + 3]); } g.stroke(); }
    g.globalAlpha = 1; g.lineCap = 'butt';
  }
  // a wave across the honeycomb: cells near the front (at radius r from the core) light in hive grey; never under
  // the copy (16px clear of every line box)
  function wave(g, r, width, peak) {
    drawField(g, L, c => {
      if (c.ring < 2 || c.qd < R + 16) return 0;
      const e = 1 - Math.abs(c.d - r) / width;
      return e > 0 ? peak * e * e * (1 - sm(Hc - 150, Hc - 6, c.y)) : 0;
    }, { color: COL.hive });
  }

  // the handoff (from the lab's h2): distance along the route at hero time t, and the pulse itself. Lit edges in the text
  // colour at 2.25px fade over SIG.fade once the head has left them; the route never comes near the copy, and the
  // cards sit above the canvas, so the pulse goes behind Scout 03 by itself
  const sigS = t => sroute ? sroute.len * prof(clamp01((t - sigT0) / sroute.D)) : 0;
  function drawPulse(g, t, list) {
    if (!sroute || t < sigT0 || t > sigArr + SIG.fade) return;
    const r = sroute, Pp = r.pts, s = sigS(t), B = 12, groups = new Map();
    for (let i = 1; i < Pp.length; i++) {
      if (r.cum[i - 1] >= s) break;
      const done = r.cum[i] <= s;
      const tLeft = done ? sigT0 + r.tau[i] : t;
      const a = 1 - clamp01((t - tLeft) / SIG.fade);
      const u = done ? 1 : (s - r.cum[i - 1]) / Math.max(1e-6, r.cum[i] - r.cum[i - 1]);
      const x1 = Pp[i - 1].x + (Pp[i].x - Pp[i - 1].x) * u, y1 = Pp[i - 1].y + (Pp[i].y - Pp[i - 1].y) * u;
      const k = Math.round(a * B); if (k <= 0) continue;
      let arr = groups.get(k); if (!arr) groups.set(k, arr = []); arr.push(Pp[i - 1].x, Pp[i - 1].y, x1, y1);
    }
    g.strokeStyle = COL.text; g.lineWidth = 2.25; g.lineCap = 'round';
    for (const [k, arr] of groups) {
      g.globalAlpha = k / B; g.beginPath();
      for (let i = 0; i < arr.length; i += 4) { g.moveTo(arr[i], arr[i + 1]); g.lineTo(arr[i + 2], arr[i + 3]); }
      g.stroke();
    }
    g.lineCap = 'butt'; g.globalAlpha = 1;
    if (t < sigArr) {
      let i = 1; while (i < Pp.length - 1 && r.cum[i] < s) i++;
      const u = clamp01((s - r.cum[i - 1]) / Math.max(1e-6, r.cum[i] - r.cum[i - 1]));
      list.push({ x: Pp[i - 1].x + (Pp[i].x - Pp[i - 1].x) * u, y: Pp[i - 1].y + (Pp[i].y - Pp[i - 1].y) * u, a: sm(0, 90, t - sigT0), k: 1 });
    }
  }

  const tmp = {};
  const ringR0 = () => phone ? 10 : 13, ringR1 = () => phone ? 22 : 30;
  function renderAgents(t) {
    const g = ax;
    g.setTransform(DPR, 0, 0, DPR, 0, 0); g.clearRect(0, 0, W, Hc);
    const hand = t >= T.ignite ? outCubic((t - T.ignite) / T.markIn) : 0;
    const G = glowAt(t);
    // the field near the core, lit by it
    drawField(g, L, c => liftA(c, G), { color: COL.hive });
    // the field wakes: one soft wave runs out from the core in the first 0.7s
    if (t < T.wake) wave(g, maxD * 1.08 * outCubic(t / T.wake), 1.5 * P, 0.18 * (1 - sm(0.75 * T.wake, T.wake, t)));
    // ignition: one ripple runs from the core to the edges of the screen; each cell it crosses brightens (#1C1C21 toward
    // #3A3A42) and falls back within 400ms
    if (t >= T.ignite && t < T.ignite + T.ripple + 470) {
      drawField(g, L, c => {
        if (c.ring < 2) return 0;
        const e = t - ripAt(c.d); if (e < 0 || e > 460) return 0;
        return 0.5 * (e < 60 ? e / 60 : 1 - (e - 60) / 400) * (0.12 + 0.88 * sm(0, 56, c.qd)) * (1 - sm(Hc - 150, Hc - 6, c.y));
      }, { color: COL.hive });
      drawRipple(g, ripRad(t), 0.35 * (1 - ripE(t)));
    }
    // routes: every edge an agent has crossed stays as a quiet trace; the edge it is on lights to where it is, and
    // a crossed edge glows for 500ms after
    const quietL = [], hot = new Map(), seen = new Set();
    const putHot = (al, x0, y0, x1, y1, bright) => { const b = Math.round(al * 12); if (b <= 0) return; const key = (bright ? 100 : 0) + b; let arr = hot.get(key); if (!arr) hot.set(key, arr = []); arr.push(x0, y0, x1, y1); };
    for (const a of agents) {
      const n = a.parkIdx !== undefined ? a.parkIdx : a.path.length - 1;
      const bright = a.kind === 'go' && t >= a.tDecide;
      for (let k = 0; k < n; k++) {
        if (t <= a.tDep[k]) break;
        const u = a.path[k], v = a.path[k + 1], A = V[u], B = V[v];
        if (A.core || B.core) continue;
        const end = a.tArr[k + 1];
        if (t < end) { const f = hopE((t - a.tDep[k]) / (end - a.tDep[k])); putHot(bright ? 0.75 : 0.5, A.x, A.y, A.x + (B.x - A.x) * f, A.y + (B.y - A.y) * f, bright); break; }
        const key = u < v ? u * 65536 + v : v * 65536 + u;
        if (!seen.has(key)) { seen.add(key); quietL.push(A.x, A.y, B.x, B.y); }
        if (t < end + 220) putHot((bright ? 0.75 : 0.5) * (1 - (t - end) / 220), A.x, A.y, B.x, B.y, bright);
      }
    }
    const straces = [];
    for (let i = 0; i < sigEdges.length; i++) {
      const e = sigEdges[i];
      if (t < e.on) break;
      if (t >= e.off) { straces.push(e.x0, e.y0, e.x1, e.y1); continue; }
      const u = clamp01((sigS(t) - sroute.cum[i]) / Math.max(1e-6, sroute.cum[i + 1] - sroute.cum[i]));
      straces.push(e.x0, e.y0, e.x0 + (e.x1 - e.x0) * u, e.y0 + (e.y1 - e.y0) * u);
    }
    g.lineCap = 'round';
    const qa = 0.34 * (1 - sm(T.ignite + 80, T.ignite + T.fadeOut, t));
    if (quietL.length && qa > 0.01) {
      g.globalAlpha = qa; g.strokeStyle = COL.hive; g.lineWidth = phone ? 1.1 : 1.25; g.beginPath();
      for (let i = 0; i < quietL.length; i += 4) { g.moveTo(quietL[i], quietL[i + 1]); g.lineTo(quietL[i + 2], quietL[i + 3]); }
      g.stroke();
    }
    // the pulse's path goes back to the field within 600ms of landing, so the rest frame is clean
    const sa = SIG.trace * (1 - sm(sigArr, sigArr + SIG.fade, t));
    if (straces.length && sa > 0.01) {
      g.globalAlpha = sa; g.strokeStyle = COL.hive; g.lineWidth = 1.25; g.beginPath();
      for (let i = 0; i < straces.length; i += 4) { g.moveTo(straces[i], straces[i + 1]); g.lineTo(straces[i + 2], straces[i + 3]); }
      g.stroke();
    }
    g.lineWidth = phone ? 1.6 : 2;
    for (const [key, arr] of hot) {
      g.strokeStyle = key >= 100 ? COL.text : COL.muted; g.globalAlpha = (key % 100) / 12; g.beginPath();
      for (let i = 0; i < arr.length; i += 4) { g.moveTo(arr[i], arr[i + 1]); g.lineTo(arr[i + 2], arr[i + 3]); }
      g.stroke();
    }
    g.lineCap = 'butt'; g.globalAlpha = 1;

    const list = [];
    // the handoff: the pulse lights each edge it crosses; its head is the page's one agent glyph (drawn with the agents)
    drawPulse(g, t, list);
    // sensing: each agent opens a ring as it appears and at every corner it reaches (two at its junction)
    g.lineWidth = 1; g.strokeStyle = COL.muted;
    const r0 = ringR0(), r1 = ringR1();
    for (const a of agents) {
      const o = agentAt(a, t, tmp);
      if (o.a > 0.01) list.push({ x: o.x, y: o.y, a: o.a, k: o.k });
      if (o.a < 0.05) continue;
      if (o.lean > 0.01) { const A = V[a.path[a.probeAt]], Wv = V[a.leanTo]; g.globalAlpha = 0.55 * o.a; g.lineWidth = 1.3; g.beginPath(); g.moveTo(A.x, A.y); g.lineTo(A.x + (Wv.x - A.x) * Math.min(1, o.lean * 2.6), A.y + (Wv.y - A.y) * Math.min(1, o.lean * 2.6)); g.stroke(); g.lineWidth = 1; }
      // the decision: as it turns away, the branch it rejected flashes once (1px, 25%)
      if (a.probeAt >= 0 && a.leanTo >= 0) { const e = t - a.tDep[a.probeAt]; if (e >= 0 && e < 180) { const A = V[a.path[a.probeAt]], Wv = V[a.leanTo]; g.globalAlpha = 0.25 * (1 - e / 180); g.lineWidth = 1; g.strokeStyle = COL.text; g.beginPath(); g.moveTo(A.x, A.y); g.lineTo(Wv.x, Wv.y); g.stroke(); g.strokeStyle = COL.muted; } }
      const n = a.parkIdx !== undefined ? a.parkIdx : a.path.length - 1;
      const iO = a.kind === 'go' ? a.path.indexOf(a.gate.O) : n + 1;
      const pings = [a.born + 60];
      for (let k = 1; k <= n && k < iO; k++) { if (a.tArr[k] > t) break; if (t - a.tArr[k] < T.ring) pings.push(a.tArr[k]); }
      if (a.probeAt >= 0) pings.push(a.tArr[a.probeAt] + a.pauseD * 0.55);
      for (const p0 of pings) {
        const e = (t - p0) / T.ring;
        if (e < 0 || e > 1) continue;
        const pv = o.moving ? { x: o.x, y: o.y } : o;
        g.globalAlpha = 0.36 * (1 - e) * Math.min(1, o.a * 1.6); g.beginPath(); hexPath(g, pv.x, pv.y, r0 + (r1 - r0) * outCubic(e)); g.stroke();
      }
    }
    g.globalAlpha = 1;
    // the ghost of the Hive Core before the mark lands: the six neighbours in grey at 40%, each lighting as its first
    // agent reaches its gate, and the core's outline in dim gold, charging with every arrival
    if (hand < 1) {
      g.lineWidth = phone ? 1.5 : 1.75; g.strokeStyle = COL.hive; g.globalAlpha = 0.8 * (1 - hand); g.beginPath();
      for (const c of ring1) if (t < c.lit) hexPath(g, c.x, c.y, R * 0.97);
      g.stroke();
      // as its gate opens, each neighbour lights (clockwise with the rush)
      for (const c of ring1) {
        if (t < c.lit) continue;
        const f = sm(c.lit, c.lit + 160, t);
        g.lineWidth = (phone ? 1.5 : 1.75) + f; g.strokeStyle = f > 0.5 ? COL.muted : COL.hive;
        g.globalAlpha = (0.8 + 0.2 * f) * (1 - hand); g.beginPath(); hexPath(g, c.x, c.y, R * 0.97); g.stroke();
      }
      g.strokeStyle = COL.hive;
      const [n, tot] = absorbedAt(t);
      let flash = 0; for (const a of agents) if (a.kind === 'go' && a.parkV === undefined && t >= a.arr && t < a.arr + 220) flash = Math.max(flash, 1 - (t - a.arr) / 220);
      const coreA = Math.min(1, (0.34 + 0.56 * (tot ? n / tot : 0)) + 0.25 * flash) * (1 - hand);
      if (coreA > 0.01) { g.globalAlpha = coreA; g.strokeStyle = COL.gold; g.lineWidth = 1.5; g.beginPath(); hexPath(g, core.x, core.y, R * 0.825); g.stroke(); }
      g.globalAlpha = 1;
    }
    drawGlyphs(g, list, { r: gR, lw: phone ? 1.4 : 1.6, head: phone ? 2.4 : 3.1 });
    // ignition: the official mark crossfades in on the core cell over 250ms and settles from 0.92 to full size over
    // 450ms; the warm light opens under the field
    const sc = t >= T.ignite ? 0.92 + 0.08 * outCubic((t - T.ignite) / T.pulse) : 0.92;
    const ms = (hand ? hand.toFixed(3) : '0') + '|' + (sc < 0.9995 ? sc.toFixed(4) : '');
    if (ms !== lastMark) { mark.style.opacity = hand ? hand.toFixed(3) : '0'; mark.style.transform = sc < 0.9995 ? `scale(${sc.toFixed(4)})` : ''; lastMark = ms; }
    if (Math.abs(G - lastG) > 0.002 || (G === 0) !== (lastG === 0) || (G === 1) !== (lastG === 1)) {
      glowEl.style.opacity = G.toFixed(3);
      glowEl.style.transform = G < 1 ? `scale(${(0.7 + 0.3 * G).toFixed(4)})` : '';
      lastG = G;
    }
  }

  // Scout 03 follows the hero: SCANNING while the agents spread and sense, ANALYZING while they decide, converge and
  // the core lights, REPORTING when the pulse reaches the card (it goes behind it on wide screens; elsewhere as it
  // leaves the core). Its three step bars fill as progress bars (--p), and the spinner runs until the pulse lands.
  const repT = () => sroute ? (sroute.inS >= 0 ? sigT0 + sigTauAt(sroute.inS) : sigT0) : T.ignite;
  function updatePhase(t) {
    const t9 = 600 * K, tRep = repT(), tFull = sroute ? sigArr : T.ignite + 400 * K;
    const idx = t < t9 ? 0 : (t < tRep ? 1 : 2);
    if (card) {
      const pS = clamp01(t / t9), pA = clamp01((t - t9) / Math.max(1, tRep - t9));
      const pR = sroute ? clamp01((t - tRep) / Math.max(1, sigArr - tRep)) : clamp01((t - T.ignite) / (400 * K));
      const key = pS.toFixed(3) + ',' + pA.toFixed(3) + ',' + pR.toFixed(3);
      if (key !== lastBars) {
        lastBars = key;
        const li = card.querySelectorAll('.sc-steps li');
        [pS, pA, pR].forEach((v, k) => { if (li[k]) { li[k].style.setProperty('--p', v.toFixed(3)); li[k].classList.toggle('on', v > 0); li[k].classList.toggle('full', v >= 1); } });
      }
      const dots = card.querySelectorAll('.spin i');
      const on = t < tFull && !S.reduce ? Math.floor(t / 80) % 6 : -1;
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
  // the moment the pulse lands (or, with no route, the ripple reaches the button) on the hero's own clock, so the
  // button's light starts exactly then even if the clock was held back by a slow frame
  let landFired = false;
  function render(t) {
    renderAgents(t); updatePhase(t);
    const sg = window.SWARM && window.SWARM.heroSignal;
    if (live && !landFired && sg && t >= sg.land) { landFired = true; document.dispatchEvent(new CustomEvent('swarm:hero-land', { detail: sg })); }
  }

  /* ---------- lifecycle: a wall clock from first paint, paused offscreen and while the tab is hidden ---------- */
  let raf = 0, last = 0, clock = 0, visible = true, done = false;
  const live = !S.reduce && S.freeze == null;
  const canRun = () => live && !done && visible && !document.hidden;
  function finish() { clock = T.end; render(T.end + 1); done = true; document.documentElement.dataset.heroReady = '1'; }
  function frame(now) {
    raf = 0;
    if (!canRun()) return;
    // wall clock; a hidden tab or an offscreen hero resets `last`, so it never jumps, and a long stall (a busy first
    // second on a slow device) advances it by at most 250ms, so the opening is never skipped
    clock += last ? Math.min(250, now - last) : 0;
    last = now;
    if (clock >= T.end) { finish(); return; }
    render(clock);
    raf = requestAnimationFrame(frame);
  }
  function kick() { if (!raf && canRun()) { last = 0; raf = requestAnimationFrame(frame); } }

  // first paint: the honeycomb, the ghost of the core and the swarm (planned now, at 40% where each agent starts), so
  // the very first frame already shows the agents on their way in
  if (!live) { setup(); renderField(); render(S.reduce ? T.end + 1 : S.freeze); document.documentElement.dataset.heroReady = '1'; }
  else {
    setup(); renderField(); render(0);
    window.SWARM.heroT0 = performance.now() + 16;
    requestAnimationFrame(() => {
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
      const pts = agents.map(a => { const o = agentAt(a, t, {}); return { x: o.x, y: o.y, a: o.a, kind: a.kind }; }).filter(o => o.a > 0.3 && o.x > -gR && o.x < W + gR && o.y > -gR && Math.hypot(o.x - core.x, o.y - core.y) > 1.75 * P);
      for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
        const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
        if (d < worst.d) worst = { d: +d.toFixed(1), t, k: pts[i].kind + '/' + pts[j].kind, x: Math.round(pts[i].x), y: Math.round(pts[i].y) };
      }
    }
    return Object.assign(worst, { ratio: +(worst.d / (2 * gR)).toFixed(2) });
  };
  // tests: how many agents are visible at time t, and how many below the headline
  window.__heroAt = t => { const out = { vis: 0, low: 0 }; const subEl = hero.querySelector('.hero-sub'); const yl = subEl ? subEl.getBoundingClientRect().top - hero.getBoundingClientRect().top : 1e9; for (const a of agents) { const o = agentAt(a, t, {}); if (o.a > 0.2) { out.vis++; if (o.y > yl) out.low++; } } return out; };
  // tests: how many visible agents sit within r px of the core at time t (the crowd just before ignition)
  window.__heroNear = (t, r = 200) => { let n = 0; for (const a of agents) { const o = agentAt(a, t, {}); if (o.a > 0.2 && Math.hypot(o.x - core.x, o.y - core.y) < r) n++; } return n; };
  // frame-accurate captures: with ?t=<ms>, window.__heroSeek(ms) draws the frozen hero at another time
  if (!live) window.__heroSeek = t => { render(t); return t; };
  window.__heroSigDbg = () => {
    const yMax = Math.min(Hc - 10, floorY - 10);
    const ok = V.map(v => v.core || (ringBox && ringSD(v.x, v.y) > 0 && sigFree(v.x, v.y, yMax)));
    const eOK = (i, j) => { const A = V[i], B = V[j]; for (const f of [0.25, 0.5, 0.75]) if (!sigFree(A.x + (B.x - A.x) * f, A.y + (B.y - A.y) * f, yMax)) return false; return true; };
    // corners reachable from the core through allowed edges
    const seen = new Set(), q = []; V.forEach((v, i) => { if (v.core) { seen.add(i); q.push(i); } });
    for (let h = 0; h < q.length; h++) for (const j of V[q[h]].nb) if (!seen.has(j) && ok[j] && (V[q[h]].core && V[j].core || eOK(q[h], j))) { seen.add(j); q.push(j); }
    return { rects, relay, btnIdx, cardIdx, ringBox, yMax, W, Hc, free: V.filter((v, i) => ok[i]).map(v => [Math.round(v.x), Math.round(v.y)]), reach: [...seen].map(i => [Math.round(V[i].x), Math.round(V[i].y)]), all: V.map(v => [Math.round(v.x), Math.round(v.y)]) };
  };
  // the handoff's timing and route, for tests and reviews
  window.__heroInfo = () => ({ depart: sigT0, land: sigArr, end: T.end, fallback: !sroute, len: sroute ? Math.round(sroute.len) : 0, D: sroute ? Math.round(sroute.D) : 0,
    relayIn: sroute && sroute.inS >= 0 ? Math.round(sigT0 + sigTauAt(sroute.inS)) : null, relayOut: sroute && sroute.outS >= 0 ? Math.round(sigT0 + sigTauAt(sroute.outS)) : null,
    pos: sroute ? +sroute.pos.toFixed(2) : null, planMs: +planMs.toFixed(2), pts: sroute ? sroute.pts.map(p => [Math.round(p.x * 10) / 10, Math.round(p.y * 10) / 10]) : [], signal: window.SWARM && window.SWARM.heroSignal });

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
