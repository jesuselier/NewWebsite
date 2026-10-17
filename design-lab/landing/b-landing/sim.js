// Swarm hero simulation, shared by the Three.js drone shot and the Canvas 2D fallback / reduced-motion still.
// World coordinates: origin at the core cell centre, +x right, +y up (screen y flipped), 1 unit = 1 CSS px
// once the camera has landed. Nothing here draws text.
//
// Kit rules this follows: the field is unfilled #1C1C21 outlines that fade toward the viewport edges, exactly one
// gold cell and its six neighbours outlined in #55555B. When the camera lands, the field's ring 0 and ring 1 hand
// over to the official swarm-mark.svg (shown whole by the page, registered on this lattice at 7.5R), so the mark is
// never redrawn or cropped. Agents are dimmed to a low floor inside the hero text column (the "safe rects").

export const T = {
  scanEnd: 1300,         // independent scanning ends, consensus starts
  consensusEnd: 2500,
  nbA: 1700, nbB: 2900,  // the six neighbours turn #55555B
  land: 3100,            // camera is exactly top-down and registered from here on
  resolveMin: 3150,      // the official SVG never appears before the camera has stopped
  resolveMax: 3500, fade: 260,
  cardsIn: 700,          // the two hero cards are in by about 1.3s
  still: 4700,
};
export const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
export const SQ3 = Math.sqrt(3);
export const NEIGH = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
export const COL = {
  ground: [11, 11, 13], surface: [17, 17, 20], raised: [22, 22, 26], line: [35, 35, 40],
  faint: [28, 28, 33], hive: [85, 85, 91], text: [238, 235, 228], muted: [142, 138, 128], gold: [245, 197, 66],
};
export const FEATHER = 40;
// inside the hero text column the field keeps 28% of its contrast and agents 14% of their opacity,
// so no glyph is ever crossed by anything at full strength
export const FLOOR = { field: 0.28, agent: 0.14 };
export function makeRng(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
const lerp = (a, b, k) => a + (b - a) * k;
export const mix = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
// 0 inside any rect, ramping to 1 at `feather` px outside all of them
export function safeMask(rects, x, y, feather = FEATHER) {
  if (!rects || !rects.length) return 1;
  let m = 1;
  for (const r of rects) {
    const dx = Math.max(r.x0 - x, x - r.x1, 0), dy = Math.max(r.y0 - y, y - r.y1, 0);
    m = Math.min(m, sm(0, feather, Math.hypot(dx, dy)));
  }
  return m;
}
const inRects = (rs, x, y, m = 0) => rs.some(r => x > r.x0 - m && x < r.x1 + m && y > r.y0 - m && y < r.y1 + m);
const segDist = (px, py, ax, ay, bx, by) => {
  const vx = bx - ax, vy = by - ay, k = Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / (vx * vx + vy * vy)));
  return Math.hypot(px - ax - vx * k, py - ay - vy * k);
};

// cube rounding for hex line draws (signal pulses hop cell to cell toward the core)
function cubeRound(x, y, z) {
  let rx = Math.round(x), ry = Math.round(y), rz = Math.round(z);
  const dx = Math.abs(rx - x), dy = Math.abs(ry - y), dz = Math.abs(rz - z);
  if (dx > dy && dx > dz) rx = -ry - rz; else if (dy > dz) ry = -rx - rz; else rz = -rx - ry;
  return [rx, rz];
}

export function createSim(o) {
  // o: { W, H, cx, cy, R, phone, N, seed, safe: [rects], keepOut: [rects], top, back, yaw0 }
  const rnd = makeRng(o.seed || 7);
  const R = o.R, P = 1.95 * R, phone = o.phone, W = o.W, H = o.H, cx = o.cx, cy = o.cy;
  const safe = o.safe || [], keepOut = o.keepOut || [], topY = o.top || 0;
  // the drone shot starts this far behind the core, looking along fwd (world coords)
  const yaw0 = o.yaw0 ?? -0.49, back = o.back ?? 1000;
  const fwd = [-Math.sin(yaw0), Math.cos(yaw0)];
  const A = [-fwd[0] * back, -fwd[1] * back];
  const c0 = [A[0] - fwd[0] * 420, A[1] - fwd[1] * 420], c1 = [fwd[0] * 520, fwd[1] * 520];   // corridor the low pass sees
  const corners = [[-cx, cy], [W - cx, cy], [-cx, cy - H], [W - cx, cy - H]];
  const needD = Math.max(...corners.map(([x, y]) => Math.hypot(x, y)), back + 420 + 900) + P;
  const rings = Math.ceil(needD / (P * SQ3 / 2)) + 1;
  const cells = [], map = new Map();
  for (let q = -rings; q <= rings; q++) {
    for (let r = Math.max(-rings, -q - rings); r <= Math.min(rings, -q + rings); r++) {
      const x = P * (q + r / 2), y = -P * (SQ3 / 2) * r;
      const ring = (Math.abs(q) + Math.abs(q + r) + Math.abs(r)) / 2;
      const sx = cx + x, sy = cy - y;
      // landed view: fill the viewport, fading toward its edges (and to nothing in the far bottom corners)
      const u = (sx - W / 2) / (W / 2), v = (sy - cy) / Math.max(1, H - cy);
      const onView = sx > -P && sx < W + P && sy > -P && sy < H + P;
      const fl = ring <= 1 ? 1 : onView ? 1 - sm(0.5, 1.28, Math.hypot(u * 0.95, v)) : 0;
      // low pass: everything along the flight corridor (the camera's distance fog does the horizon)
      const fp = ring <= 1 ? 1 : 1 - sm(560, 900, segDist(x, y, c0[0], c0[1], c1[0], c1[1]));
      if (fl <= 0.004 && fp <= 0.004) continue;
      const c = { i: cells.length, q, r, x, y, ring, fl, fp, h: rnd(), ping: 0, pingT: -1, pulse: 0, sx, sy, m: safeMask(safe, sx, sy) };
      cells.push(c); map.set(q + ',' + r, c);
    }
  }
  const core = map.get('0,0');
  const isNeighbour = new Set(NEIGH.map(([q, r]) => q + ',' + r));
  const blocked = c => c.ring <= 2 || inRects(safe, c.sx, c.sy, FEATHER * 0.6) || inRects(keepOut, c.sx, c.sy, R * 0.7);
  // cells agents work: the visible landed field outside the text column, the hero cards and the cluster
  let roam = cells.filter(c => c.fl > 0.16 && c.sx > R * 0.8 && c.sx < W - R * 0.8 && c.sy > topY + R * 0.4 && c.sy < H - R * 0.5 && !blocked(c));
  if (roam.length < 12) roam = cells.filter(c => c.ring > 2 && c.ring < 7 && !inRects(keepOut, c.sx, c.sy));
  const patrol = roam.filter(c => c.ring >= 3);

  // the streams: committed agents gather at a stage point, enter through one neighbour cell and land on the core
  const gateDeg = phone ? [180, 0, 136, 44] : [172, 8, 142, 38];
  const ymax = cy - topY - R * 0.3;   // keep stage points under the nav
  const gates = gateDeg.map(deg => {
    const a = deg * Math.PI / 180, ux = Math.cos(a), uy = Math.sin(a);
    let ds = (phone ? 3.4 : 4.6) * P;
    if (uy > 0) ds = Math.min(ds, ymax / uy);
    let lane = null, best = -2;
    NEIGH.forEach(([q, r]) => { const c = map.get(q + ',' + r); const d = (c.x * ux + c.y * uy) / Math.hypot(c.x, c.y); if (d > best) { best = d; lane = c; } });
    return { a, ux, uy, sx: ux * ds, sy: uy * ds, lane };
  });

  const N = o.N;
  const agents = [];
  for (let i = 0; i < N; i++) {
    const c = roam[Math.floor(rnd() * roam.length)];
    // agents fly in from outside: start beyond their first cell, pushed out toward the viewport edge
    const d = Math.hypot(c.x, c.y) || 1, push = (0.35 + rnd() * 0.65) * P * 3.2;
    const x = c.x + (c.x / d) * push + (rnd() - 0.5) * R, y = c.y + (c.y / d) * push + (rnd() - 0.5) * R;
    const ang = Math.atan2(y, x);
    let g = 0, gd = 9;
    gates.forEach((gt, k) => { let da = Math.abs(((ang - gt.a + Math.PI * 3) % (Math.PI * 2)) - Math.PI); if (da < gd) { gd = da; g = k; } });
    agents.push({
      i, x, y, vx: -(x / d) * P * 1.2, vy: -(y / d) * P * 1.2,
      z0: (phone ? 6 : 10) + rnd() * (phone ? 10 : 20), z: 0,
      mode: 'travel', target: c, wp: 0, dwell: 0, dwellFor: 220 + rnd() * 320,
      commit: rnd() < 0.66, delay: rnd() * 420, alive: true, gate: g,
      jx: (rnd() - 0.5) * P * 0.9, jy: (rnd() - 0.5) * P * 0.9,
    });
  }
  const commitCount = agents.filter(a => a.commit).length || 1;
  const S = {
    R, P, W, H, cx, cy, rings, cells, map, core, agents, isNeighbour, safe, keepOut, gates, A, fwd, back, yaw0,
    charge: 0, resolved: false, resolveT: Infinity, pulses: [], scans: [], links: [], linkAlpha: 0, t: 0,
    caps: { ping: phone ? 4 : 8, scan: phone ? 5 : 10, scanAfter: phone ? 1 : 2, pulse: phone ? 2 : 4, links: phone ? 44 : 110 },
  };

  function pickTarget(a, t) {
    const pool = S.resolved && patrol.length > 6 ? patrol : roam;
    const bias = sm(400, T.scanEnd, t), g = gates[a.gate];
    for (let k = 0; k < 14; k++) {
      const c = pool[Math.floor(rnd() * pool.length)];
      // committed agents drift toward their stream's side of the field while they scan
      if (a.commit && !S.resolved && rnd() < bias && (c.x * g.ux + c.y * g.uy) < Math.hypot(c.x, c.y) * 0.35) continue;
      a.target = c; return;
    }
    a.target = pool[Math.floor(rnd() * pool.length)];
  }

  function spawnPulse(c, t) {
    if (S.pulses.length >= S.caps.pulse || c.ring < 3) return;
    const n = c.ring, path = [];
    const ax = c.q, az = c.r, ay = -ax - az;
    for (let i = 1; i < n; i++) {
      const k = i / n;
      const [q, r] = cubeRound(ax * (1 - k) + 1e-6, ay * (1 - k) + 1e-6, az * (1 - k) - 2e-6);
      const cc = map.get(q + ',' + r); if (cc && cc.ring >= 2) path.push(cc);   // pulses stop at ring 2
    }
    S.pulses.push({ path: [c, ...path], t0: t });
  }

  S.step = function (t, dt) {
    S.t = t;
    const s = dt / 1000;
    const consensus = sm(T.scanEnd, T.consensusEnd, t);
    const vmaxBase = P * (phone ? 2.2 : 2.4);
    const flat = sm(T.scanEnd, T.land, t);
    const grid = new Map();
    for (const a of agents) if (a.alive) { const k = Math.floor(a.x / P) + ',' + Math.floor(a.y / P); let b = grid.get(k); if (!b) grid.set(k, b = []); b.push(a); }
    let activePings = 0; for (const c of cells) if (c.pingT >= 0) activePings++;
    const pingCap = S.resolved ? 0 : S.caps.ping;
    const scanCap = S.resolved ? S.caps.scanAfter : S.caps.scan;

    for (const a of agents) {
      if (!a.alive || t < a.delay) continue;
      if (a.commit && t > T.scanEnd && a.mode !== 'final') {
        const g = gates[a.gate];
        if (a.mode !== 'commit') { a.mode = 'commit'; a.wp = 0; }
        const wps = [[g.sx + a.jx, g.sy + a.jy], [g.lane.x, g.lane.y]];
        if (a.wp < 2 && Math.hypot(wps[a.wp][0] - a.x, wps[a.wp][1] - a.y) < P * 0.75) a.wp++;
        if (a.wp >= 2 || S.resolved) { a.mode = 'final'; }
        else a.target = { x: wps[a.wp][0], y: wps[a.wp][1] };
      }
      if (a.mode === 'final') a.target = core;
      const tx = a.target.x, ty = a.target.y;
      const ox = tx - a.x, oy = ty - a.y, dist = Math.hypot(ox, oy) || 1e-6;
      const vmax = a.mode === 'travel' ? vmaxBase * (S.resolved ? 0.55 : 1) : vmaxBase * (1 + 1.7 * consensus) * (S.resolved ? 1.6 : 1);
      const sp = a.mode === 'commit' ? vmax : Math.min(vmax, vmax * dist / (P * 0.9));
      const dvx = ox / dist * sp - a.vx, dvy = oy / dist * sp - a.vy;
      let sx = 0, sy = 0, ax = 0, ay = 0, ccx = 0, ccy = 0, n = 0;
      const gx = Math.floor(a.x / P), gy = Math.floor(a.y / P);
      for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
        const b = grid.get((gx + i) + ',' + (gy + j)); if (!b) continue;
        for (const o2 of b) {
          if (o2 === a) continue;
          const dx = a.x - o2.x, dy = a.y - o2.y, d2 = dx * dx + dy * dy;
          if (d2 < (0.36 * P) ** 2 && d2 > 0) { const d = Math.sqrt(d2); sx += dx / d / d; sy += dy / d / d; }
          if (o2.mode === a.mode && d2 < (1.1 * P) ** 2) { ax += o2.vx; ay += o2.vy; ccx += o2.x; ccy += o2.y; n++; }
        }
      }
      let fx = dvx * 3.4 + sx * vmax * 7, fy = dvy * 3.4 + sy * vmax * 7;
      // patrolling scouts steer around the lit cluster once the signal has landed
      if (S.resolved && a.mode === 'travel') { const dc = Math.hypot(a.x, a.y) || 1; if (dc < 2.6 * P) { const k = (1 - dc / (2.6 * P)) * vmax * 14; fx += a.x / dc * k; fy += a.y / dc * k; } }
      if (n && a.mode !== 'travel') {
        fx += (ax / n - a.vx) * 1.5 * consensus + (ccx / n - a.x) * 0.5 * consensus;
        fy += (ay / n - a.vy) * 1.5 * consensus + (ccy / n - a.y) * 0.5 * consensus;
      }
      const w = (1 - consensus) * vmax * 1.1; fx += (rnd() - 0.5) * w; fy += (rnd() - 0.5) * w;
      a.vx += fx * s; a.vy += fy * s;
      const v = Math.hypot(a.vx, a.vy), lim = vmax * 1.15; if (v > lim) { a.vx *= lim / v; a.vy *= lim / v; }
      a.x += a.vx * s; a.y += a.vy * s;
      a.z = a.mode === 'final' ? lerp(a.z0 * (1 - flat * 0.8), 2, sm(R * 3, 0, dist)) : a.z0 * (1 - flat * 0.8);
      if (a.mode === 'travel' && dist < R * 0.35) {
        a.dwell += dt;
        if (a.dwell > 120 && !a.pinged) {
          a.pinged = true;
          const c = a.target;
          if (c.pingT < 0 && activePings < pingCap && c.ring >= 3) {
            c.pingT = t; activePings++;
            if (rnd() < 0.3 + 0.6 * consensus) spawnPulse(c, t);
          }
          if (S.scans.length < scanCap && (!S.resolved || rnd() < 0.25)) S.scans.push({ x: c.x, y: c.y, t0: t });
        }
        if (a.dwell > a.dwellFor) { a.dwell = 0; a.pinged = false; a.dwellFor = 220 + rnd() * 320; pickTarget(a, t); }
      }
      if (a.mode === 'final' && dist < R * 0.45) { a.alive = false; S.charge = Math.min(1, S.charge + 1 / commitCount); }
    }
    // consensus links: committed agents in a stream tie to their two nearest stream-mates
    S.links.length = 0;
    S.linkAlpha = sm(T.scanEnd, T.scanEnd + 500, t) * (S.resolved ? Math.max(0, 1 - (t - S.resolveT) / 300) : 1);
    if (S.linkAlpha > 0.01) {
      const seen = new Set(), r2 = (1.5 * P) ** 2;
      for (const a of agents) {
        if (!a.alive || a.mode === 'travel' || S.links.length >= S.caps.links) continue;
        let b1 = null, b2 = null, d1 = r2, d2 = r2;
        const gx = Math.floor(a.x / P), gy = Math.floor(a.y / P);
        for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
          const b = grid.get((gx + i) + ',' + (gy + j)); if (!b) continue;
          for (const o2 of b) {
            if (o2 === a || !o2.alive || o2.mode === 'travel') continue;
            const dd = (a.x - o2.x) ** 2 + (a.y - o2.y) ** 2;
            if (dd < d1) { d2 = d1; b2 = b1; d1 = dd; b1 = o2; } else if (dd < d2) { d2 = dd; b2 = o2; }
          }
        }
        for (const b of [b1, b2]) {
          if (!b) continue;
          const key = a.i < b.i ? a.i * 4096 + b.i : b.i * 4096 + a.i;
          if (seen.has(key)) continue; seen.add(key);
          S.links.push([a, b]);
          if (S.links.length >= S.caps.links) break;
        }
      }
    }
    for (const c of cells) {
      if (c.pingT >= 0) {
        const e = t - c.pingT;
        c.ping = e < 120 ? e / 120 : e < 280 ? 1 : Math.max(0, 1 - (e - 280) / 520);
        if (e > 800) { c.pingT = -1; c.ping = 0; }
        if (S.resolved) c.ping *= Math.max(0, 1 - (t - S.resolveT) / 240);
      }
      c.pulse = 0;
    }
    S.scans = S.scans.filter(sc => t - sc.t0 < 680);
    S.pulses = S.pulses.filter(p => {
      const hops = p.path.length;
      for (let j = 0; j < hops; j++) {
        const since = t - (p.t0 + j * 70);
        if (since < 0) break;
        const v = since < 160 ? 1 : Math.max(0, 1 - (since - 160) / 400);
        const c = p.path[j]; if (v > c.pulse) c.pulse = v;
      }
      return t - p.t0 < hops * 70 + 600;
    });
    if (!S.resolved && t >= T.resolveMin && (S.charge >= 0.9 || t >= T.resolveMax)) { S.resolved = true; S.resolveT = t; }
  };

  // visual state of one cell at time t
  S.waveAt = function (c, t) {
    let w = 0;
    const waves = [[T.scanEnd, 0.32], [T.scanEnd + 400, 0.46], [T.scanEnd + 800, 0.6]];
    const span = Math.min(rings, 14);
    for (const [ts, amp] of waves) {
      if (t < ts || t > ts + 900) continue;
      const k = span * (1 - sm(ts, ts + 900, t));
      w = Math.max(w, amp * Math.max(0, 1 - Math.abs(c.ring - k) / 1.2));
    }
    return w * c.fl;
  };
  // the field is there from the first frame (a 0.3s fade-in with a slight random stagger)
  S.reveal = (c, t) => sm(0, 260, t - c.h * 90);
  S.fade = (c, t) => lerp(c.fp, c.fl, sm(1300, T.land, t));
  S.nb = t => sm(T.nbA, T.nbB, t);
  S.markOpacity = t => S.resolved ? sm(0, 1, (t - S.resolveT) / T.fade) : 0;
  S.glow = t => S.resolved ? sm(0, 1, (t - S.resolveT + 120) / 700) : 0;
  S.coreGold = t => Math.max(S.charge, sm(T.consensusEnd, T.resolveMax, t));
  S.settled = t => S.resolved && t > S.resolveT + T.fade + 300;
  S.run = function (target) { for (let t = 0; t <= target; t += 1000 / 60) S.step(t, 1000 / 60); };
  return S;
}

// Visual state of one cell, shared by both renderers.
// Returns { base, hi, hiAmt, width (px), rad (x R) } with colours 0..255; base and hiAmt already include the
// handoff to the official mark (ring 0 and ring 1 fade to ground as the SVG fades in, so they are never doubled).
// boost (0..1) lifts the outlines while the drone flies low so the floor reads; once landed every field outline is
// exactly the kit's #1C1C21 (faded by the mask).
const BOOST = [62, 62, 68];
export function cellLook(S, c, t, boost = 0) {
  const rev = S.reveal(c, t);
  const fade = c.ring <= 1 ? 1 : S.fade(c, t);
  const tone = boost > 0 ? mix(COL.faint, BOOST, boost) : COL.faint;
  let base = mix(COL.ground, tone, fade * rev);
  let width = 1, rad = 0.97, vis = 1;
  let hiAmt = Math.max(c.ping * 0.85, c.pulse * 0.9, S.waveAt(c, t)) * rev;
  if (c.ring === 1) {
    const nb = S.nb(t);
    base = mix(base, COL.hive, nb);
    width = 1 + (0.15 * S.R - 1) * nb; rad = 0.97 + 0.03 * nb;   // grows into the mark's own cell and stroke
    vis = 1 - S.markOpacity(t);
  } else if (c.ring === 0) {
    const gold = S.coreGold(t), nb = S.nb(t);
    base = mix(mix(base, COL.hive, rev * 0.85), COL.gold, gold);
    width = 1.5; rad = 0.97 + 0.03 * nb;
    vis = 1 - S.markOpacity(t);
  }
  if (vis < 1) { base = mix(COL.ground, base, vis); hiAmt *= vis; }
  return { base, hi: COL.hive, hiAmt, width, rad };
}

// --- Canvas 2D renderer (fallback when WebGL is missing, and the reduced-motion still) ---
const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
function hexPath(g, x, y, r) {
  g.beginPath();
  for (let k = 0; k < 6; k++) { const ang = Math.PI / 180 * (60 * k - 90); const px = x + r * Math.cos(ang), py = y + r * Math.sin(ang); k ? g.lineTo(px, py) : g.moveTo(px, py); }
  g.closePath();
}
// cache: an object kept by the caller; once revealed, the calm outlines are drawn once to an offscreen canvas and
// each frame only redraws the cells that change plus the agent layer.
export function draw2D(g, S, t, dpr, cache) {
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  const R = S.R;
  const onScreen = c => !(c.sx < -S.P || c.sx > S.W + S.P || c.sy < -S.P || c.sy > S.H + S.P) && c.fl > 0.004;
  const drawCell = (gg, c, tt, calm) => {
    const L = cellLook(S, c, tt, 0);
    const k = FLOOR.field + (1 - FLOOR.field) * c.m;
    let col = mix(COL.ground, L.base, c.ring <= 1 ? 1 : k);
    if (!calm && L.hiAmt > 0) col = mix(col, L.hi, L.hiAmt * c.m);
    if (Math.abs(col[0] - COL.ground[0]) + Math.abs(col[2] - COL.ground[2]) < 1.5) return;
    hexPath(gg, c.sx, c.sy, R * L.rad);
    gg.lineWidth = L.width; gg.lineJoin = 'round'; gg.strokeStyle = rgb(col); gg.stroke();
  };
  if (cache && t > 400) {
    if (!cache.base) {
      const b = document.createElement('canvas'); b.width = Math.round(S.W * dpr); b.height = Math.round(S.H * dpr);
      const bg = b.getContext('2d'); bg.setTransform(dpr, 0, 0, dpr, 0, 0);
      bg.fillStyle = rgb(COL.ground); bg.fillRect(0, 0, S.W, S.H);
      for (const c of S.cells) if (c.ring > 1 && onScreen(c)) drawCell(bg, c, T.still, true);
      cache.base = b;
    }
    g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(cache.base, 0, 0); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (const c of S.cells) {
      if (!onScreen(c)) continue;
      if (c.ring <= 1 || c.ping > 0 || c.pulse > 0 || S.waveAt(c, t) > 0) {
        if (c.ring > 1) { hexPath(g, c.sx, c.sy, R * 0.97); g.lineWidth = 2; g.strokeStyle = rgb(COL.ground); g.stroke(); }
        drawCell(g, c, t, false);
      }
    }
  } else {
    g.fillStyle = rgb(COL.ground); g.fillRect(0, 0, S.W, S.H);
    for (const c of S.cells) if (onScreen(c)) drawCell(g, c, t, false);
  }
  // scan rings
  for (const sc of S.scans) {
    const e = (t - sc.t0) / 650; if (e < 0 || e > 1) continue;
    const x = S.cx + sc.x, y = S.cy - sc.y, m = FLOOR.agent + (1 - FLOOR.agent) * safeMask(S.safe, x, y);
    g.globalAlpha = 0.3 * (1 - e) * m; g.strokeStyle = rgb(COL.text); g.lineWidth = 1.2;
    g.beginPath(); g.arc(x, y, R * (0.3 + 0.6 * e), 0, Math.PI * 2); g.stroke();
  }
  // consensus links
  if (S.linkAlpha > 0.01) {
    g.lineWidth = 1; g.strokeStyle = rgb(COL.hive);
    for (const [a, b] of S.links) {
      const x1 = S.cx + a.x, y1 = S.cy - a.y, x2 = S.cx + b.x, y2 = S.cy - b.y;
      g.globalAlpha = 0.9 * S.linkAlpha * (FLOOR.agent + (1 - FLOOR.agent) * Math.min(safeMask(S.safe, x1, y1), safeMask(S.safe, x2, y2)));
      g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
    }
  }
  // agents: small hex heads plus a velocity trail (never gold, no glow), dimmed inside the text column
  const hs = S.W <= 640 ? 2.2 : 2.6;
  for (const a of S.agents) {
    if (!a.alive || t < a.delay) continue;
    const x = S.cx + a.x, y = S.cy - a.y, k = a.mode === 'travel' ? 0.1 : 0.075;
    const m = FLOOR.agent + (1 - FLOOR.agent) * safeMask(S.safe, x, y);
    const wake = sm(a.delay, a.delay + 260, t) * m, scout = a.mode === 'travel';
    const col = scout ? COL.muted : COL.text;
    const grd = g.createLinearGradient(x - a.vx * k, y + a.vy * k, x, y);
    grd.addColorStop(0, rgb(col, 0)); grd.addColorStop(1, rgb(col, (scout ? 0.42 : 0.6) * wake));
    g.globalAlpha = 1; g.strokeStyle = grd; g.lineWidth = 1;
    g.beginPath(); g.moveTo(x - a.vx * k, y + a.vy * k); g.lineTo(x, y); g.stroke();
    g.globalAlpha = (scout ? 0.82 : 0.95) * wake; g.fillStyle = rgb(col);
    hexPath(g, x, y, hs); g.fill();
  }
  g.globalAlpha = 1;
}
