/* Swarm A, Core Glow: the shared honeycomb lattice and agent engine.
   Every agent on the page is a small pointy-top hexagonal node that lives ON the honeycomb: it hops from corner to
   corner along the channels between cells (the corridor lattice), one edge per hop with a short ease, and the edge it
   crosses lights for about 600ms. No tails, no trails, no curved paths, no glow. Cells it senses brighten briefly.
   Used by hero.js (hero convergence) and page.js (why-now band, pricing core, final field). No text on canvas.
   drawEdges / drawAgents take optional edgeMul(edge, t) and agentMul(agent, t) multipliers (the hero dims its
   scouts once the chosen agents set off). */
(() => {
  'use strict';
  const SQ3 = Math.sqrt(3);
  const COL = { faint: '#1C1C21', line: '#232328', hive: '#55555B', muted: '#8E8A80', text: '#EEEBE4', gold: '#F5C542' };
  const clamp01 = x => Math.min(1, Math.max(0, x));
  const sm = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const inOut = x => { x = clamp01(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const outCubic = x => 1 - Math.pow(1 - clamp01(x), 3);
  function rng(seed) { let s = seed % 2147483647; if (s <= 0) s += 2147483646; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
  const ID = (x, y) => [x, y, 1];

  // pointy-top hexagon path (corners at -90, -30, 30, 90, 150, 210 degrees)
  const CS = [], SN = [];
  for (let k = 0; k < 6; k++) { const a = Math.PI / 180 * (60 * k - 90); CS.push(Math.cos(a)); SN.push(Math.sin(a)); }
  function hexPath(g, x, y, r) {
    g.moveTo(x + r * CS[0], y + r * SN[0]);
    for (let k = 1; k < 6; k++) g.lineTo(x + r * CS[k], y + r * SN[k]);
    g.closePath();
  }
  // the same hexagon pushed through a projection (for the hero's tilted opening)
  function hexPathP(g, x, y, r, proj) {
    let p = proj(x + r * CS[0], y + r * SN[0]); g.moveTo(p[0], p[1]);
    for (let k = 1; k < 6; k++) { p = proj(x + r * CS[k], y + r * SN[k]); g.lineTo(p[0], p[1]); }
    g.closePath();
  }

  /* A field of cells with circumradius R (pitch 1.95R, copied from the mark), its rings around (ox, oy), and the
     corridor lattice: the channels between cells form their own honeycomb whose corners sit at P / sqrt(3)
     from each cell centre, three cells meeting at every corner. */
  function lattice({ R, ox, oy, x0, y0, x1, y1 }) {
    const P = 1.95 * R, Rc = P / SQ3;
    const cells = [], cellMap = new Map(), rings = [];
    const rq = Math.ceil(Math.max(Math.abs(x0 - ox), Math.abs(x1 - ox), Math.abs(y0 - oy) * 1.2, Math.abs(y1 - oy) * 1.2) / P) + 3;
    for (let r = -rq; r <= rq; r++) for (let q = -rq * 2; q <= rq * 2; q++) {
      const x = ox + P * (q + r / 2), y = oy + P * (SQ3 / 2) * r;
      if (x < x0 || x > x1 || y < y0 || y > y1) continue;
      const ring = (Math.abs(q) + Math.abs(q + r) + Math.abs(r)) / 2;
      const c = { i: cells.length, q, r, x, y, ring, d: Math.hypot(x - ox, y - oy), ping: -1e9, lit: -1e9 };
      cells.push(c); cellMap.set(q + ',' + r, c);
      (rings[ring] || (rings[ring] = [])).push(c);
    }
    const V = [], vmap = new Map();
    const vk = (x, y) => Math.round(x * 4) + ':' + Math.round(y * 4);
    for (const c of cells) {
      const ids = [];
      for (let k = 0; k < 6; k++) {
        const x = c.x + Rc * CS[k], y = c.y + Rc * SN[k], kk = vk(x, y);
        let id = vmap.get(kk);
        if (id === undefined) { id = V.length; vmap.set(kk, id); V.push({ i: id, x, y, nb: [], cells: [], ring: 99 }); }
        const v = V[id]; v.cells.push(c); v.ring = Math.min(v.ring, c.ring);
        ids.push(id);
      }
      for (let k = 0; k < 6; k++) {
        const a = ids[k], b = ids[(k + 1) % 6];
        if (!V[a].nb.includes(b)) V[a].nb.push(b);
        if (!V[b].nb.includes(a)) V[b].nb.push(a);
      }
    }
    for (const v of V) {
      v.d = Math.hypot(v.x - ox, v.y - oy);
      v.core = v.cells.some(c => c.ring === 0);
      v.perim = !v.core && v.cells.some(c => c.ring === 1);
    }
    return { R, P, Rc, ox, oy, cells, cellMap, rings, V };
  }
  const ekey = (a, b) => a < b ? a * 131072 + b : b * 131072 + a;

  /* Agent engine. A policy decides each agent's next hop when it arrives at a corner:
     policy(agent, arrivalTime, sim) sets agent.to / agent.t0 / agent.d, or leaves agent.to = -1 to rest. */
  function sim(L, seed, edgeFade = 600) {
    const S = { L, rnd: rng(seed), agents: [], edges: new Map(), edgeFade };
    S.add = (v, o) => { const a = Object.assign({ id: S.agents.length, from: v, to: -1, t0: 0, d: 1, kind: 0, born: 0, fadeT: -1, fadeD: 320, dead: false, x: L.V[v].x, y: L.V[v].y, prev: -1, mode: 'scan' }, o || {}); S.agents.push(a); return a; };
    S.hop = (a, to, t0, d) => { a.to = to; a.t0 = t0; a.d = d; };
    S.light = (a, b, t, k) => { S.edges.set(ekey(a, b), { a, b, t, k }); };
    S.advance = (t, policy) => {
      for (const a of S.agents) {
        if (a.dead) continue;
        let guard = 0;
        while (a.to >= 0 && t >= a.t0 + a.d && guard++ < 8) {
          const at = a.t0 + a.d;
          S.light(a.from, a.to, at, a.kind);
          a.prev = a.from; a.from = a.to; a.to = -1;
          policy(a, at, S);
          if (a.dead) break;
        }
        if (a.dead) continue;
        const A = L.V[a.from];
        if (a.to >= 0 && t > a.t0) {
          const B = L.V[a.to], f = inOut((t - a.t0) / a.d);
          a.x = A.x + (B.x - A.x) * f; a.y = A.y + (B.y - A.y) * f;
        } else { a.x = A.x; a.y = A.y; }
        if (a.fadeT >= 0 && t > a.fadeT + a.fadeD) a.dead = true;
      }
      if (S.edges.size > 64) for (const [k, e] of S.edges) if (t - e.t > S.edgeFade) S.edges.delete(k);
    };
    // visibility of an agent at time t (pops in over 160ms, fades out over fadeD)
    S.vis = (a, t) => {
      if (a.dead || t < a.born) return 0;
      let v = clamp01((t - a.born) / 160);
      if (a.fadeT >= 0) v *= 1 - clamp01((t - a.fadeT) / a.fadeD);
      return v;
    };
    return S;
  }

  /* Drawing. alphaAt(x, y) returns a multiplier (the hero uses it to keep everything faint behind the copy). */
  const BUCKETS = 12;
  function drawEdges(g, S, t, o) {
    const { alphaAt = null, base = [0.42, 0.72], lw = 1.5, edgeMul = null, agentMul = null } = o || {}; const proj = (o && o.proj) || ID;
    const V = S.L.V, groups = [new Map(), new Map()];
    const put = (k, a, x0, y0, x1, y1) => {
      const b = Math.round(a * BUCKETS); if (b <= 0) return;
      const m = groups[k]; let arr = m.get(b); if (!arr) m.set(b, arr = []); arr.push(x0, y0, x1, y1);
    };
    for (const e of S.edges.values()) {
      const age = t - e.t; if (age < 0 || age > S.edgeFade) continue;
      const A = V[e.a], B = V[e.b];
      let a = base[e.k] * (1 - age / S.edgeFade);
      if (edgeMul) a *= edgeMul(e, t);
      if (alphaAt && a > 0) a *= alphaAt((A.x + B.x) / 2, (A.y + B.y) / 2);
      put(e.k, a, A.x, A.y, B.x, B.y);
    }
    // the edge an agent is crossing right now lights up to where it is
    for (const ag of S.agents) {
      if (ag.dead || ag.to < 0 || t <= ag.t0) continue;
      const A = V[ag.from];
      let a = base[ag.kind] * S.vis(ag, t);
      if (agentMul) a *= agentMul(ag, t);
      if (alphaAt && a > 0) a *= alphaAt(ag.x, ag.y);
      put(ag.kind, a, A.x, A.y, ag.x, ag.y);
    }
    g.lineWidth = lw; g.lineCap = 'round';
    const colr = [COL.muted, COL.text];
    for (let k = 0; k < 2; k++) {
      g.strokeStyle = colr[k];
      for (const [b, arr] of groups[k]) {
        g.globalAlpha = Math.min(1, b / BUCKETS); g.beginPath();
        for (let i = 0; i < arr.length; i += 4) { const p = proj(arr[i], arr[i + 1]), q = proj(arr[i + 2], arr[i + 3]); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); }
        g.stroke();
      }
    }
    g.globalAlpha = 1; g.lineCap = 'butt';
  }
  function drawAgents(g, S, t, o) {
    const { alphaAt = null, r = 2.8, base = [0.9, 1], agentMul = null } = o || {}; const proj = (o && o.proj) || ID;
    const groups = [new Map(), new Map()];
    for (const a of S.agents) {
      const v = S.vis(a, t); if (v <= 0) continue;
      let al = base[a.kind] * v;
      if (agentMul) al *= agentMul(a, t);
      if (alphaAt && al > 0) al *= alphaAt(a.x, a.y);
      const b = Math.round(al * BUCKETS); if (b <= 0) continue;
      const m = groups[a.kind]; let arr = m.get(b); if (!arr) m.set(b, arr = []); arr.push(a);
    }
    const colr = [COL.muted, COL.text];
    for (let k = 0; k < 2; k++) {
      g.fillStyle = colr[k];
      for (const [b, arr] of groups[k]) {
        g.globalAlpha = Math.min(1, b / BUCKETS); g.beginPath();
        for (const a of arr) { const p = proj(a.x, a.y); hexPath(g, p[0], p[1], r * p[2]); }
        g.fill();
      }
    }
    g.globalAlpha = 1;
  }
  // a field of outlines, bucketed by alpha; alphaOf(cell) returns 0 to skip
  function drawField(g, L, alphaOf, o) {
    const { proj = null, color = COL.faint, lw = 1, scale = 0.97 } = o || {};
    const m = new Map();
    for (const c of L.cells) { const a = alphaOf(c); if (a <= 0.02) continue; const b = Math.round(a * 20); let arr = m.get(b); if (!arr) m.set(b, arr = []); arr.push(c); }
    g.strokeStyle = color; g.lineWidth = lw;
    for (const [b, arr] of m) {
      g.globalAlpha = Math.min(1, b / 20); g.beginPath();
      if (proj) for (const c of arr) hexPathP(g, c.x, c.y, L.R * scale, proj);
      else for (const c of arr) hexPath(g, c.x, c.y, L.R * scale);
      g.stroke();
    }
    g.globalAlpha = 1;
  }

  window.SwarmLattice = { SQ3, COL, clamp01, sm, inOut, outCubic, rng, hexPath, hexPathP, lattice, sim, ekey, drawEdges, drawAgents, drawField };
})();
