// Swarm hero simulation, shared by the Three.js drone shot and the Canvas 2D fallback / reduced-motion still.
// World coordinates: origin at the core cell centre, +x right, +y up (screen y flipped), 1 unit = 1 CSS px
// once the camera has landed. Nothing here draws text.
//
// Kit rules this follows: the field is unfilled #1C1C21 outlines that fade to nothing toward the edges (radial
// mask), exactly one gold cell (the official SVG's core, shown by the page) and its six neighbours outlined in
// #55555B at field scale. Agents keep out of the hero text column (the "safe rect") and its 40px feather.

export const T = {
  scanEnd: 2400, consensusEnd: 3600, nbA: 2800, nbB: 4400,
  land: 3900,            // camera is exactly top-down and registered from here on
  resolveMin: 3960,      // the official SVG never appears before the camera has stopped
  resolveMax: 4400, fade: 240, still: 4700,
};
export const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
export const SQ3 = Math.sqrt(3);
export const NEIGH = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
export const COL = {
  ground: [11, 11, 13], surface: [17, 17, 20], raised: [22, 22, 26], line: [35, 35, 40],
  faint: [28, 28, 33], hive: [85, 85, 91], text: [238, 235, 228], muted: [142, 138, 128], gold: [245, 197, 66],
};
export const FEATHER = 40;
export function makeRng(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
const lerp = (a, b, k) => a + (b - a) * k;
export const mix = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
// 0 inside the rect, ramping to 1 at `feather` px outside it
export function safeMask(rect, x, y, feather = FEATHER) {
  if (!rect) return 1;
  const dx = Math.max(rect.x0 - x, x - rect.x1, 0), dy = Math.max(rect.y0 - y, y - rect.y1, 0);
  return sm(0, feather, Math.hypot(dx, dy));
}
const inRect = (r, x, y, m = 0) => r && x > r.x0 - m && x < r.x1 + m && y > r.y0 - m && y < r.y1 + m;

// cube rounding for hex line draws (signal pulses hop cell to cell toward the core)
function cubeRound(x, y, z) {
  let rx = Math.round(x), ry = Math.round(y), rz = Math.round(z);
  const dx = Math.abs(rx - x), dy = Math.abs(ry - y), dz = Math.abs(rz - z);
  if (dx > dy && dx > dz) rx = -ry - rz; else if (dy > dz) ry = -rx - rz; else rz = -rx - ry;
  return [rx, rz];
}

export function createSim(o) {
  // o: { W, H, cx, cy, R, phone, N, seed, safe: {x0,y0,x1,y1}, keepOut: [rects], top, mask: { rx, ry, e0 } }
  const rnd = makeRng(o.seed || 7);
  const R = o.R, P = 1.95 * R, phone = o.phone, W = o.W, H = o.H;
  const mk = o.mask || { rx: 0.4 * W, ry: 0.4 * W, e0: 0.15 };
  const maxD = Math.hypot(Math.max(o.cx, W - o.cx), Math.max(o.cy, H - o.cy));
  const rings = Math.min(26, Math.ceil(Math.max(mk.rx, mk.ry) / (P * SQ3 / 2)) + 2);
  const cells = [], map = new Map();
  for (let q = -rings; q <= rings; q++) {
    for (let r = Math.max(-rings, -q - rings); r <= Math.min(rings, -q + rings); r++) {
      const x = P * (q + r / 2), y = -P * (SQ3 / 2) * r;
      const ring = (Math.abs(q) + Math.abs(q + r) + Math.abs(r)) / 2;
      const d = Math.hypot(x, y);
      const e = Math.hypot(x / mk.rx, y / mk.ry);
      const fade = ring <= 1 ? 1 : 1 - sm(mk.e0, 1, e);
      if (fade <= 0.003) continue;
      const c = { i: cells.length, q, r, x, y, ring, d, fade, h: rnd(), ping: 0, pingT: -1, pulse: 0, sx: o.cx + x, sy: o.cy - y };
      cells.push(c); map.set(q + ',' + r, c);
    }
  }
  const core = map.get('0,0');
  const isNeighbour = new Set(NEIGH.map(([q, r]) => q + ',' + r));
  const safe = o.safe || null, keepOut = o.keepOut || [], topY = o.top || 0;
  const blocked = c => inRect(safe, c.sx, c.sy, FEATHER + R * 0.6) || keepOut.some(k => inRect(k, c.sx, c.sy, R * 0.8));
  // cells agents may roam: visible field, on the final screen, outside the text column and the hero cards
  let roam = cells.filter(c => c.ring > 1 && c.fade > 0.22 && c.sx > R && c.sx < W - R && c.sy > topY + R * 0.6 && c.sy < H - R && !blocked(c));
  if (roam.length < 8) roam = cells.filter(c => c.ring > 1 && c.ring < 6 && !blocked(c));
  if (roam.length < 4) roam = cells.filter(c => c.ring > 1 && c.ring < 5);
  const patrol = roam.filter(c => c.ring >= 3).length >= 4 ? roam.filter(c => c.ring >= 3) : roam;

  const N = o.N;
  const agents = [];
  for (let i = 0; i < N; i++) {
    const c0 = roam[Math.floor(rnd() * roam.length)];
    agents.push({
      x: c0.x + (rnd() - 0.5) * R, y: c0.y + (rnd() - 0.5) * R, vx: 0, vy: 0,
      z0: (phone ? 8 : 12) + rnd() * (phone ? 12 : 22), z: 0,
      mode: 'travel', target: null, dwell: 0, dwellFor: 260 + rnd() * 340,
      commit: rnd() < 0.72, delay: 200 + rnd() * 600, alive: true, lane: null,
    });
  }
  const commitCount = agents.filter(a => a.commit).length || 1;
  const S = { R, P, W, H, cx: o.cx, cy: o.cy, maxD, rings, cells, map, core, agents, isNeighbour, safe, charge: 0, resolved: false, resolveT: Infinity, pulses: [], t: 0 };

  function pickTarget(a, t) {
    const pool = S.resolved ? patrol : roam;
    const bias = sm(800, T.scanEnd, t);
    for (let k = 0; k < 16; k++) {
      const c = pool[Math.floor(rnd() * pool.length)];
      if (a.commit && rnd() < bias && c.ring > 4) continue;   // committed agents drift toward the core while scanning
      a.target = c; return;
    }
    a.target = pool[Math.floor(rnd() * pool.length)];
  }
  agents.forEach(a => pickTarget(a, 0));

  function spawnPulse(c, t) {
    const cap = phone ? 2 : 4;
    if (S.pulses.length >= cap || c.ring < 2) return;
    // hex line from c to the core, stopping at ring 1 (pulses never light the core)
    const n = c.ring, path = [];
    const ax = c.q, az = c.r, ay = -ax - az;
    for (let i = 1; i < n; i++) {
      const k = i / n;
      const [q, r] = cubeRound(ax * (1 - k) + 1e-6, ay * (1 - k) + 1e-6, az * (1 - k) - 2e-6);
      const cc = map.get(q + ',' + r); if (cc && cc.ring >= 1 && !inRect(safe, cc.sx, cc.sy, FEATHER)) path.push(cc);
    }
    S.pulses.push({ path: [c, ...path], t0: t });
  }

  S.step = function (t, dt) {
    S.t = t;
    const s = dt / 1000;
    const consensus = sm(T.scanEnd, T.consensusEnd, t);
    const vmaxBase = P * (phone ? 2.0 : 2.2);
    const scoutSlow = S.resolved ? 0.6 : 1;
    const flat = sm(T.scanEnd, T.land, t);
    // spatial hash, cell size = pitch
    const grid = new Map();
    for (const a of agents) if (a.alive) { const k = Math.floor(a.x / P) + ',' + Math.floor(a.y / P); let b = grid.get(k); if (!b) grid.set(k, b = []); b.push(a); }
    let activePings = 0; for (const c of cells) if (c.pingT >= 0) activePings++;
    const pingCap = S.resolved ? 0 : (phone ? 3 : 6);   // the settled field has no stray lit outlines

    for (const a of agents) {
      if (!a.alive || t < a.delay) continue;
      if (a.commit && t > T.scanEnd && a.mode !== 'final') {
        if (!a.lane) {
          let bi = 0, bd = 1e9;
          NEIGH.forEach(([q, r], i) => { const c = map.get(q + ',' + r); const d = Math.hypot(c.x - a.x, c.y - a.y); if (d < bd) { bd = d; bi = i; } });
          a.lane = map.get(NEIGH[bi][0] + ',' + NEIGH[bi][1]); a.target = a.lane; a.mode = 'commit';
        }
        if (S.resolved || (t > T.consensusEnd - 300 && Math.hypot(a.lane.x - a.x, a.lane.y - a.y) < R * 1.3)) { a.mode = 'final'; a.target = core; }
      }
      const tx = a.target.x, ty = a.target.y;
      const ox = tx - a.x, oy = ty - a.y, dist = Math.hypot(ox, oy) || 1e-6;
      const vmax = a.mode === 'travel' ? vmaxBase * scoutSlow : vmaxBase * (1 + 1.2 * consensus);
      const sp = Math.min(vmax, vmax * dist / (P * 0.9));
      const dvx = ox / dist * sp - a.vx, dvy = oy / dist * sp - a.vy;
      let sx = 0, sy = 0, ax = 0, ay = 0, cx = 0, cy = 0, n = 0;
      const gx = Math.floor(a.x / P), gy = Math.floor(a.y / P);
      for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
        const b = grid.get((gx + i) + ',' + (gy + j)); if (!b) continue;
        for (const o2 of b) {
          if (o2 === a) continue;
          const dx = a.x - o2.x, dy = a.y - o2.y, d2 = dx * dx + dy * dy;
          if (d2 < (0.42 * P) ** 2 && d2 > 0) { const d = Math.sqrt(d2); sx += dx / d / d; sy += dy / d / d; }
          if (d2 < (1.1 * P) ** 2) { ax += o2.vx; ay += o2.vy; cx += o2.x; cy += o2.y; n++; }
        }
      }
      let fx = dvx * 3.2 + sx * vmax * 9, fy = dvy * 3.2 + sy * vmax * 9;
      // once the signal has landed, patrolling scouts steer around the lit cluster instead of crossing it
      if (S.resolved && a.mode === 'travel') { const dc = Math.hypot(a.x, a.y) || 1; if (dc < 2.4 * P) { const k = (1 - dc / (2.4 * P)) * vmax * 14; fx += a.x / dc * k; fy += a.y / dc * k; } }
      if (n && a.mode !== 'travel') {
        fx += (ax / n - a.vx) * 1.4 * consensus + (cx / n - a.x) * 0.6 * consensus;
        fy += (ay / n - a.vy) * 1.4 * consensus + (cy / n - a.y) * 0.6 * consensus;
      }
      const w = (1 - consensus) * vmax * 1.2; fx += (rnd() - 0.5) * w; fy += (rnd() - 0.5) * w;
      a.vx += fx * s; a.vy += fy * s;
      const v = Math.hypot(a.vx, a.vy), lim = vmax * 1.15; if (v > lim) { a.vx *= lim / v; a.vy *= lim / v; }
      a.x += a.vx * s; a.y += a.vy * s;
      a.z = a.mode === 'final' ? lerp(a.z0 * (1 - flat * 0.8), 2, sm(R * 3, 0, dist)) : a.z0 * (1 - flat * 0.8);
      if (a.mode === 'travel' && dist < R * 0.35) {
        a.dwell += dt;
        if (a.dwell > 120 && a.target.pingT < 0 && activePings < pingCap && !(t > T.scanEnd && a.target.ring < 3)) {
          a.target.pingT = t; activePings++;
          if (rnd() < 0.35 + 0.65 * consensus) spawnPulse(a.target, t);
        }
        if (a.dwell > a.dwellFor) { a.dwell = 0; a.dwellFor = 260 + rnd() * 340; pickTarget(a, t); }
      }
      if (a.mode === 'final' && (dist < R * 0.45 || (S.resolved && dist < P * 1.5))) { a.alive = false; S.charge = Math.min(1, S.charge + 1 / commitCount); }
    }
    for (const c of cells) {
      if (c.pingT >= 0) {
        const e = t - c.pingT;
        c.ping = e < 120 ? e / 120 : e < 280 ? 1 : Math.max(0, 1 - (e - 280) / 520);
        if (e > 800) { c.pingT = -1; c.ping = 0; }
        if (S.resolved) c.ping *= Math.max(0, 1 - (t - S.resolveT) / 240);   // the settled field keeps no lit outlines
      }
      c.pulse = 0;
    }
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

  // visual state of one cell at time t: reveal (0..1), rim highlight (0..1), neighbour grey (0..1)
  S.waveAt = function (c, t) {
    let w = 0;
    const waves = [[2400, 0.35], [2800, 0.5], [3200, 0.65]];
    for (const [ts, amp] of waves) {
      if (t < ts || t > ts + 900) continue;
      const k = rings * (1 - sm(ts, ts + 900, t));
      w = Math.max(w, amp * Math.max(0, 1 - Math.abs(c.ring - k) / 1.2));
    }
    return w * c.fade;
  };
  S.reveal = (c, t) => sm(c.ring * 45, c.ring * 45 + 300, t);
  S.nb = t => sm(T.nbA, T.nbB, t);
  S.markOpacity = t => S.resolved ? sm(0, 1, (t - S.resolveT) / T.fade) : 0;
  S.glow = t => S.resolved ? sm(0, 1, (t - S.resolveT + 120) / 700) : 0;
  S.coreGold = t => Math.max(S.charge, sm(T.consensusEnd, T.resolveMax, t)) * (S.resolved ? Math.max(0, 1 - (t - S.resolveT) / T.fade) : 1);
  S.run = function (target) { for (let t = 0; t <= target; t += 1000 / 60) S.step(t, 1000 / 60); };
  return S;
}

// Visual state of one cell, shared by both renderers. Returns { base, hi, hiAmt, width } with colours 0..255.
// boost (0..1) lifts the field outline a little while the drone flies low, so the tilted floor reads; it is 0
// once the camera has landed, where every field outline is exactly the kit's #1C1C21 (faded by the mask).
const BOOST = [44, 44, 50];
export function cellLook(S, c, t, boost = 0) {
  const rev = S.reveal(c, t);
  let base = mix(COL.ground, boost > 0 ? mix(COL.faint, BOOST, boost) : COL.faint, c.fade * rev);
  let width = 1;
  const hiAmt = Math.max(c.ping * 0.85, c.pulse * 0.9, S.waveAt(c, t)) * rev;
  if (S.isNeighbour.has(c.q + ',' + c.r)) {
    const nb = S.nb(t);
    base = mix(base, COL.hive, nb); width = 1 + 0.5 * nb;
  } else if (c.ring === 0) {
    const gold = S.coreGold(t);
    base = mix(mix(base, COL.hive, rev * 0.85), COL.gold, gold); width = 1.5;
  }
  return { base, hi: COL.hive, hiAmt, width };
}

// --- Canvas 2D renderer (fallback when WebGL is missing, and the reduced-motion still) ---
const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
function hexPath(g, x, y, r) {
  g.beginPath();
  for (let k = 0; k < 6; k++) { const ang = Math.PI / 180 * (60 * k - 90); const px = x + r * Math.cos(ang), py = y + r * Math.sin(ang); k ? g.lineTo(px, py) : g.moveTo(px, py); }
  g.closePath();
}
// cache: an object kept by the caller; once the reveal is done, the calm outlines are drawn once to an
// offscreen canvas and each frame only redraws the cells that change (cluster, pinged, pulsed) plus agents.
export function draw2D(g, S, t, dpr, cache) {
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  const R = S.R;
  const revealEnd = S.rings * 45 + 320;
  const onScreen = c => !(c.sx < -S.P || c.sx > S.W + S.P || c.sy < -S.P || c.sy > S.H + S.P);
  const drawCell = (gg, c, calm) => {
    if (S.reveal(c, t) <= 0.01) return;
    const L = cellLook(S, c, calm ? Math.max(t, T.still) : t, 0);
    let col = L.base;
    if (!calm && L.hiAmt > 0) col = mix(col, L.hi, L.hiAmt * safeMask(S.safe, c.sx, c.sy));
    hexPath(gg, c.sx, c.sy, R * 0.97);
    gg.lineWidth = L.width; gg.strokeStyle = rgb(col); gg.stroke();
  };
  if (cache && t > revealEnd) {
    if (!cache.base) {
      const b = document.createElement('canvas'); b.width = Math.round(S.W * dpr); b.height = Math.round(S.H * dpr);
      const bg = b.getContext('2d'); bg.setTransform(dpr, 0, 0, dpr, 0, 0);
      bg.fillStyle = rgb(COL.ground); bg.fillRect(0, 0, S.W, S.H);
      for (const c of S.cells) if (c.ring > 1 && onScreen(c)) drawCell(bg, c, true);
      cache.base = b;
    }
    g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(cache.base, 0, 0); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (const c of S.cells) {
      if (!onScreen(c)) continue;
      if (c.ring <= 1) drawCell(g, c, false);
      else if (c.ping > 0 || c.pulse > 0 || (t < 4200 && S.waveAt(c, t) > 0)) drawCell(g, c, false);
    }
  } else {
    g.fillStyle = rgb(COL.ground); g.fillRect(0, 0, S.W, S.H);
    for (const c of S.cells) if (onScreen(c)) drawCell(g, c, false);
  }
  // agents: 2px heads plus a velocity tick (never gold, no glow), invisible inside the text column
  g.lineWidth = 1;
  for (const a of S.agents) {
    if (!a.alive || t < a.delay) continue;
    const x = S.cx + a.x, y = S.cy - a.y, k = 0.075;
    const m = Math.min(safeMask(S.safe, x, y), safeMask(S.safe, x - a.vx * k, y + a.vy * k));
    if (m <= 0.004) continue;
    const wake = sm(a.delay, a.delay + 300, t) * m, scout = a.mode === 'travel';
    g.globalAlpha = (scout ? 0.32 : 0.5) * wake; g.strokeStyle = rgb(scout ? COL.muted : COL.text);
    g.beginPath(); g.moveTo(x - a.vx * k, y + a.vy * k); g.lineTo(x, y); g.stroke();
    g.globalAlpha = (scout ? 0.85 : 1) * wake; g.fillStyle = rgb(scout ? COL.muted : COL.text); g.fillRect(x - 1, y - 1, 2, 2);
  }
  g.globalAlpha = 1;
}
