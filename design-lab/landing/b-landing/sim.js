// Swarm hero simulation, shared by the Three.js drone shot and the Canvas 2D fallback / reduced-motion still.
// World coordinates: origin at the core cell centre, +x right, +y up (screen y flipped), 1 unit = 1 CSS px
// once the camera has landed. Nothing here draws text.

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
export function makeRng(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
const lerp = (a, b, k) => a + (b - a) * k;

// cube rounding for hex line draws (signal pulses hop cell to cell toward the core)
function cubeRound(x, y, z) {
  let rx = Math.round(x), ry = Math.round(y), rz = Math.round(z);
  const dx = Math.abs(rx - x), dy = Math.abs(ry - y), dz = Math.abs(rz - z);
  if (dx > dy && dx > dz) rx = -ry - rz; else if (dy > dz) ry = -rx - rz; else rz = -rx - ry;
  return [rx, rz];
}

export function createSim(o) {
  // o: { W, H, cx, cy, R, phone, N, seed, avoid: {x0, x1, y0, y1} screen rect scouts keep clear of after landing }
  const rnd = makeRng(o.seed || 7);
  const R = o.R, P = 1.95 * R, phone = o.phone, W = o.W, H = o.H;
  const maxD = Math.hypot(Math.max(o.cx, W - o.cx), Math.max(o.cy, H - o.cy));
  const rings = Math.min(24, Math.ceil(maxD / (P * SQ3 / 2)) + 3);
  const cells = [], map = new Map();
  for (let q = -rings; q <= rings; q++) {
    for (let r = Math.max(-rings, -q - rings); r <= Math.min(rings, -q + rings); r++) {
      const x = P * (q + r / 2), y = -P * (SQ3 / 2) * r;
      const ring = (Math.abs(q) + Math.abs(q + r) + Math.abs(r)) / 2;
      const d = Math.hypot(x, y);
      const fade = d <= maxD ? Math.max(0.12, 1 - sm(0.22 * maxD, maxD, d)) : 0.12 * (1 - sm(maxD, maxD * 1.32, d));
      if (fade <= 0.004) continue;
      const c = { i: cells.length, q, r, x, y, ring, d, fade, h: rnd(), ping: 0, pingT: -1, pulse: 0, sx: o.cx + x, sy: o.cy - y };
      cells.push(c); map.set(q + ',' + r, c);
    }
  }
  const core = map.get('0,0');
  const isNeighbour = new Set(NEIGH.map(([q, r]) => q + ',' + r));
  // cells agents may roam: on the final screen, plus a margin
  const roam = cells.filter(c => c.ring > 0 && c.sx > R && c.sx < W - R && c.sy > R && c.sy < H - R);
  const avoid = o.avoid;
  const inAvoid = c => avoid && c.sx > avoid.x0 && c.sx < avoid.x1 && c.sy > avoid.y0 && c.sy < avoid.y1;

  const N = o.N;
  const agents = [];
  for (let i = 0; i < N; i++) {
    const c0 = roam[Math.floor(rnd() * roam.length)];
    agents.push({
      x: c0.x + (rnd() - 0.5) * R, y: c0.y + (rnd() - 0.5) * R, vx: 0, vy: 0,
      z0: (phone ? 10 : 16) + rnd() * (phone ? 16 : 28), z: 0,
      mode: 'travel', target: null, dwell: 0, dwellFor: 260 + rnd() * 340,
      commit: rnd() < 0.72, delay: 200 + rnd() * 600, alive: true, lane: null,
    });
  }
  const commitCount = agents.filter(a => a.commit).length || 1;
  const S = { R, P, W, H, cx: o.cx, cy: o.cy, maxD, rings, cells, map, core, agents, isNeighbour, charge: 0, resolved: false, resolveT: Infinity, pulses: [], t: 0 };

  function pickTarget(a, t) {
    const bias = sm(800, T.scanEnd, t);
    for (let k = 0; k < 16; k++) {
      const c = roam[Math.floor(rnd() * roam.length)];
      if (a.commit && rnd() < bias && c.ring > 4) continue;
      if (S.resolved && (c.ring < 3 || inAvoid(c))) continue;
      a.target = c; return;
    }
    a.target = roam[Math.floor(rnd() * roam.length)];
  }
  agents.forEach(a => pickTarget(a, 0));

  function spawnPulse(c, t) {
    const cap = phone ? 3 : 6;
    if (S.pulses.length >= cap || c.ring < 2) return;
    // hex line from c to the core, stopping at ring 1 (pulses never light the core)
    const n = c.ring, path = [];
    const ax = c.q, az = c.r, ay = -ax - az;
    for (let i = 1; i < n; i++) {
      const k = i / n;
      const [q, r] = cubeRound(ax * (1 - k) + 1e-6, ay * (1 - k) + 1e-6, az * (1 - k) - 2e-6);
      const cc = map.get(q + ',' + r); if (cc && cc.ring >= 1) path.push(cc);
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
    const pingCap = S.resolved ? 3 : (phone ? 4 : 8);

    for (const a of agents) {
      if (!a.alive || t < a.delay) continue;
      if (a.commit && t > T.scanEnd && a.mode !== 'final') {
        if (!a.lane) {
          let bi = 0, bd = 1e9;
          NEIGH.forEach(([q, r], i) => { const c = map.get(q + ',' + r); const d = Math.hypot(c.x - a.x, c.y - a.y); if (d < bd) { bd = d; bi = i; } });
          a.lane = map.get(NEIGH[bi][0] + ',' + NEIGH[bi][1]); a.target = a.lane; a.mode = 'commit';
        }
        if (t > T.consensusEnd - 300 && Math.hypot(a.lane.x - a.x, a.lane.y - a.y) < R * 1.3) { a.mode = 'final'; a.target = core; }
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
          if (!S.resolved && rnd() < 0.35 + 0.65 * consensus) spawnPulse(a.target, t);
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
    return w;
  };
  S.reveal = (c, t) => sm(c.ring * 45, c.ring * 45 + 300, t);
  S.nb = t => sm(T.nbA, T.nbB, t);
  S.markOpacity = t => S.resolved ? sm(0, 1, (t - S.resolveT) / T.fade) : 0;
  S.coreGold = t => Math.max(S.charge, sm(T.consensusEnd, T.resolveMax, t)) * (S.resolved ? Math.max(0, 1 - (t - S.resolveT) / T.fade) : 1);
  S.run = function (target) { for (let t = 0; t <= target; t += 1000 / 60) S.step(t, 1000 / 60); };
  return S;
}

// --- Canvas 2D renderer (fallback when WebGL is missing, and the reduced-motion still) ---
const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const mix = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
function hexPath(g, x, y, r) {
  g.beginPath();
  for (let k = 0; k < 6; k++) { const ang = Math.PI / 180 * (60 * k - 90); const px = x + r * Math.cos(ang), py = y + r * Math.sin(ang); k ? g.lineTo(px, py) : g.moveTo(px, py); }
  g.closePath();
}
export function plateTone(c, t, S) {
  // top tone of a plate: raised near the core, surface further out, ground at the edge; warm falloff after the charge
  const rev = S.reveal(c, t);
  const base = mix(COL.ground, c.d < S.maxD * 0.4 ? mix(COL.raised, COL.surface, c.d / (S.maxD * 0.4)) : COL.surface, c.fade * rev);
  const warm = sm(3500, 4500, t) * Math.exp(-c.d / (S.P * 1.6)) * 0.085;
  return mix(base, COL.gold, warm);
}
export function draw2D(g, S, t, dpr) {
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.fillStyle = rgb(COL.ground); g.fillRect(0, 0, S.W, S.H);
  const R = S.R, nb = S.nb(t), resolved = S.resolved, markA = S.markOpacity(t);
  for (const c of S.cells) {
    const rev = S.reveal(c, t); if (rev <= 0.01) continue;
    if (c.sx < -S.P || c.sx > S.W + S.P || c.sy < -S.P || c.sy > S.H + S.P) continue;
    hexPath(g, c.sx, c.sy, R * 0.97);
    g.fillStyle = rgb(plateTone(c, t, S)); g.fill();
    let rim = mix(COL.ground, COL.faint, c.fade * rev);
    const hi = Math.max(c.ping * 0.85, c.pulse * 0.9, S.waveAt(c, t));
    if (hi > 0) rim = mix(rim, COL.hive, hi);
    if (S.isNeighbour.has(c.q + ',' + c.r)) rim = mix(rim, COL.hive, nb * (1 - markA));
    if (c.ring === 0) { const gA = S.coreGold(t); rim = mix(rim, COL.gold, gA); g.lineWidth = gA > 0 ? 1.5 : 1; } else g.lineWidth = 1;
    g.strokeStyle = rgb(rim); g.stroke();
  }
  // agents: 2px heads plus a velocity tick (never gold, no glow)
  g.lineWidth = 1;
  for (const a of S.agents) {
    if (!a.alive || t < a.delay) continue;
    const wake = sm(a.delay, a.delay + 300, t), scout = a.mode === 'travel';
    const x = S.cx + a.x, y = S.cy - a.y, k = 0.075;
    g.globalAlpha = (scout ? 0.32 : 0.5) * wake; g.strokeStyle = rgb(scout ? COL.muted : COL.text);
    g.beginPath(); g.moveTo(x - a.vx * k, y + a.vy * k); g.lineTo(x, y); g.stroke();
    g.globalAlpha = (scout ? 0.85 : 1) * wake; g.fillStyle = rgb(scout ? COL.muted : COL.text); g.fillRect(x - 1, y - 1, 2, 2);
  }
  g.globalAlpha = 1;
}
