/* Swarm A, Core Glow, lab concept m1: "The Crowd" (Canvas 2D, one canvas plus DOM labels).
   The crypto curve as a scroll-driven moment. The stage pins under the nav and the visitor's scroll is the clock:
   a 1px bell curve over a faint honeycomb, three crowds of hexagonal agent nodes that live on the honeycomb's
   corridor lattice (they hop corner to corner along its channels, and the channel a node crosses lights briefly),
   and a YOU marker that rides the curve from left to right, steps off it and joins the right curve group.
     LEFT  one herd: every node steps the same way at almost the same moment, front first, followers after,
           and the shared heading keeps drifting ("You buy because everyone else is buying").
     MID   twitchy: nodes flinch a corner down and back at random moments, and the ones near the bottom keep
           stepping out below the baseline to the sidelines, then climbing back ("You sell too early and you
           watch the big moves from the sidelines"). A few are still out there at the end.
     RIGHT ranks: nodes on every other row of cells, perfectly aligned, never moving while the others churn.
           When YOU has joined their open slot they all step at once, in perfect unison, three cells forward.
   Then his 0:34 line lands in the DOM. Positions are a pure function of scroll progress, so nothing moves
   unless the visitor scrolls; when scrolling stops, nodes finish their hop onto a corner and lit channels fade,
   and the loop stops (within about a second). Offscreen it does nothing. No text is drawn on the canvas.
   Static picture (no JS, ?t=, ?reduce=1, prefers-reduced-motion): the settled final state, unpinned.
   ?crowd=<0..1> renders the static picture at that progress (for review). window.__crowdSeek(ms) steps the live
   scene on a virtual clock for frame-accurate captures. */
(() => {
  'use strict';
  const S = window.SWARM || { reduce: false, freeze: null };
  const SL = window.SwarmLattice;
  const sec = document.getElementById('curve');
  const track = document.getElementById('crowd-track');
  const fig = document.getElementById('crowd');
  const stage = document.getElementById('crowd-stage');
  const cv = document.getElementById('crowd-canvas');
  const youEl = document.getElementById('crowd-you');
  if (!sec || !track || !fig || !stage || !cv || !cv.getContext || !SL || !youEl) return;
  const pin = track.querySelector('.crowd-pin');
  const g = cv.getContext('2d');
  const yl = youEl.querySelector('.yl');
  const sideEl = document.getElementById('crowd-side'), illuEl = fig.querySelector('.c-illu');
  const tagEls = fig.querySelectorAll('[data-ztag]'), qEls = fig.querySelectorAll('[data-zq]');
  const { COL, clamp01, inOut, hexPath, rng } = SL;
  const qs = new URLSearchParams(location.search);
  const forceP = qs.has('crowd') ? clamp01(parseFloat(qs.get('crowd')) || 0) : null;
  const live = !S.reduce && S.freeze == null && forceP == null && 'IntersectionObserver' in window &&
    !!(window.CSS && CSS.supports && CSS.supports('position', 'sticky'));
  if (live) sec.classList.add('live');

  /* ---- the timeline, in scroll progress P (0 = stage pinned, 1 = about to unpin) ---- */
  const TL = {
    beats: [0, 0.95],                                            // left and mid crowds step over this span
    you: [[0.02, 0.035], [0.30, 0.34], [0.56, 0.66], [0.72, -1]], // YOU rides the curve; -1 = above its slot
    glide: [0.72, 0.745],                                        // steps off the curve onto the lattice
    drop: [0.745, 0.80],                                         // hops down into the open slot
    move: [0.83, 0.93],                                          // the right group, YOU included, moves as one
    land: 0.84                                                   // his 0:34 line takes the slot
  };
  const ZB = [0.34, 0.66], NB = 40;
  let NMOVE = 6;
  let SIG = 0.21;
  const bell = u => Math.exp(-0.5 * ((u - 0.5) / SIG) ** 2);
  const sstep = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };

  let W = 0, H = 0, DPR = 1, phone = false, R = 8.5, Rc = 1, P = 1, base = 0, peak = 0, x0 = 0, x1 = 1, mU = 0;
  let L = null, V = null, Z = [], YOU = null, slotV = -1, e0 = -1, uD = 0.75, nDrop = 0, lutL = null, lutM = null;
  let fieldCache = null, fieldKey = '', cOff = 0, navH = 68, pinH = 800, D = 1;
  const cy = x => base - peak * bell((x - x0) / (x1 - x0));
  const uOf = x => (x - x0) / (x1 - x0);
  const xOf = u => x0 + u * (x1 - x0);
  const zoneOf = u => u < ZB[0] ? 0 : u < ZB[1] ? 1 : 2;

  function youU(p) {
    const k = TL.you;
    if (p <= k[0][0]) return k[0][1];
    for (let i = 1; i < k.length; i++) {
      if (p <= k[i][0]) {
        const a = k[i - 1], b = k[i], ub = b[1] < 0 ? uD : b[1];
        let f = (p - a[0]) / (b[0] - a[0]);
        if (i === k.length - 1) f = 1 - (1 - f) * (1 - f);          // ease into the slot's column
        return a[1] + (ub - a[1]) * f;
      }
    }
    return uD;
  }

  /* ---- deterministic choreography, built once per layout ---- */
  function shuffle(arr, rnd) { for (let i = arr.length - 1; i > 0; i--) { const j = (rnd() * (i + 1)) | 0; const t = arr[i]; arr[i] = arr[j]; arr[j] = t; } return arr; }
  function scatter(cands, dmin, rnd) {
    const arr = shuffle(cands.slice(), rnd), picked = [], grid = new Map();
    for (const id of arr) {
      const v = V[id], gx = Math.floor(v.x / dmin), gy = Math.floor(v.y / dmin);
      let ok = true;
      for (let a = -1; a <= 1 && ok; a++) for (let b = -1; b <= 1 && ok; b++) {
        const l = grid.get((gx + a) + ',' + (gy + b));
        if (l) for (const w of l) if (Math.hypot(V[w].x - v.x, V[w].y - v.y) < dmin) { ok = false; break; }
      }
      if (ok) { picked.push(id); const k = gx + ',' + gy; let l = grid.get(k); if (!l) grid.set(k, l = []); l.push(id); }
    }
    return picked;
  }
  const mkZone = (z, ids, h) => ({ z, h, n: ids.length, st: [Int32Array.from(ids)], ph: [], x: new Float32Array(ids.length), y: new Float32Array(ids.length) });

  // LEFT: the herd. Beats come in surges: three hops toward one shared heading, then three hops back the way they
  // came, so the herd rushes together and returns. The heading drifts from surge to surge. The front of the herd
  // steps first and the followers a moment after; nodes pressed against the curve wait, and never pile up.
  const SURGE = 3;
  function buildHerd(ids, ok) {
    const Zo = mkZone(0, ids, 0.55), n = ids.length, moved = [];
    let cur = Zo.st[0];
    for (let k = 0; k < NB; k++) {
      const grp = Math.floor(k / (2 * SURGE)), j = k % (2 * SURGE), fwd = j < SURGE;
      const th = -0.9 + 0.36 * Math.sin(grp * 1.9 + 0.4), cx = Math.cos(th) * (fwd ? 1 : -1), sy = Math.sin(th) * (fwd ? 1 : -1);
      const next = Int32Array.from(cur), ph = new Float32Array(n);
      if (grp * 2 * SURGE + 2 * SURGE > NB) { Zo.st.push(next); Zo.ph.push(ph); cur = next; continue; }  // the tail end rests
      if (fwd) {
        const des = new Int32Array(n), blk = new Uint8Array(n);
        for (let i = 0; i < n; i++) {
          const v = V[cur[i]]; let best = -1, bs = -2;
          for (const w of v.nb) { const dx = V[w].x - v.x, dy = V[w].y - v.y, c = (dx * cx + dy * sy) / Math.hypot(dx, dy); if (c > bs) { bs = c; best = w; } }
          des[i] = best; if (best < 0 || !ok(V[best])) blk[i] = 1;
        }
        for (let changed = true; changed;) {
          changed = false;
          const occ = new Set(); for (let i = 0; i < n; i++) if (blk[i]) occ.add(cur[i]);
          const tgt = new Set();
          for (let i = 0; i < n && !changed; i++) {
            if (blk[i]) continue;
            if (occ.has(des[i]) || tgt.has(des[i])) { blk[i] = 1; changed = true; } else tgt.add(des[i]);
          }
        }
        for (let i = 0; i < n; i++) if (!blk[i]) next[i] = des[i];
        moved[j] = Zo.st[k];                       // remember where everyone was, to come back the same way
      } else {
        const back = moved[2 * SURGE - 1 - j];
        for (let i = 0; i < n; i++) next[i] = back[i];
      }
      let pmin = 1e9, pmax = -1e9;
      for (let i = 0; i < n; i++) { const pp = V[cur[i]].x * cx + V[cur[i]].y * sy; pmin = Math.min(pmin, pp); pmax = Math.max(pmax, pp); }
      for (let i = 0; i < n; i++) ph[i] = 0.3 * (pmax - (V[cur[i]].x * cx + V[cur[i]].y * sy)) / (pmax - pmin + 1e-6);
      Zo.st.push(next); Zo.ph.push(ph); cur = next;
    }
    return Zo;
  }

  // MID: twitchy. Idle nodes flinch a corner (mostly downward) and come back; the ones near the bottom walk out
  // below the baseline to the sidelines, wait, and climb back. A few go out late and stay out.
  function buildMid(ids, ok, rnd) {
    const Zo = mkZone(1, ids, 0.4), n = ids.length;
    const area = v => (v.in || v.line || v.side) && v.u > ZB[0] + mU && v.u < ZB[1] - mU;
    const dist = new Map(), par = new Map(), qu = [];
    for (const v of V) if (v.side && area(v)) { dist.set(v.i, 0); par.set(v.i, -1); qu.push(v.i); }
    for (let h = 0; h < qu.length; h++) {
      const a = qu[h];
      for (const b of V[a].nb) if (!dist.has(b) && area(V[b]) && V[b].y <= V[a].y + 0.5) { dist.set(b, dist.get(a) + 1); par.set(b, a); qu.push(b); }
    }
    const pathDown = id => { const p = [id]; let c = par.get(id); while (c !== undefined && c >= 0) { p.push(c); c = par.get(c); } return p; };
    const maxD = phone ? 5 : 7, nStay = phone ? 4 : 7;
    const cands = [];
    for (let i = 0; i < n; i++) { const d = dist.get(ids[i]); if (d !== undefined && d <= maxD) cands.push(i); }
    const plan = new Array(n).fill(null);
    // stayers: low nodes spread across the zone, out late, still on the sidelines at the end
    const low = cands.filter(i => dist.get(ids[i]) <= 4).sort((a, b) => V[ids[a]].x - V[ids[b]].x);
    const step = low.length / Math.max(1, nStay);
    for (let s = 0; s < nStay && low.length; s++) {
      const i = low[Math.min(low.length - 1, Math.floor((s + 0.5) * step))];
      if (plan[i]) continue;
      plan[i] = [{ start: NB - 15 + ((rnd() * 5) | 0), path: pathDown(ids[i]), dwell: 99, stay: true }];
    }
    for (const i of shuffle(cands.slice(), rnd)) {
      if (plan[i] || rnd() > 0.62) continue;
      const path = pathDown(ids[i]), len = path.length - 1, trips = [];
      let t0 = 1 + ((rnd() * 8) | 0);
      while (true) {
        const dwell = 2 + ((rnd() * 4) | 0), tot = 2 * len + dwell;
        if (t0 + tot > NB - 4) break;
        trips.push({ start: t0, path, dwell, stay: false });
        t0 += tot + 4 + ((rnd() * 10) | 0);
      }
      if (trips.length) plan[i] = trips;
    }
    const mode = new Uint8Array(n), idx = new Int16Array(n), until = new Int16Array(n), from = new Int32Array(n), wait = new Uint8Array(n), tripN = new Int16Array(n);
    let cur = Zo.st[0];
    for (let k = 0; k < NB; k++) {
      const next = Int32Array.from(cur), ph = new Float32Array(n), occ = new Set(cur), claim = new Set();
      const tryMove = (i, to) => { if (to === cur[i]) return true; if (occ.has(to) || claim.has(to)) return false; claim.add(to); next[i] = to; return true; };
      for (const i of shuffle([...Array(n).keys()], rnd)) {
        ph[i] = rnd() * 0.44;
        const tr = plan[i] && plan[i][tripN[i]];
        if (mode[i] === 0 && tr && k >= tr.start) { mode[i] = 2; idx[i] = 0; wait[i] = 0; }
        if (mode[i] === 2) {                                   // walking down to the sidelines
          const p = tr.path;
          if (idx[i] < p.length - 1 && tryMove(i, p[idx[i] + 1])) { idx[i]++; wait[i] = 0; } else if (idx[i] < p.length - 1) wait[i]++;
          if (idx[i] === p.length - 1 || wait[i] > 2) { mode[i] = tr.stay ? 5 : 3; until[i] = k + tr.dwell; }
        } else if (mode[i] === 3) {                            // watching from the sidelines
          if (k >= until[i]) mode[i] = 4;
        } else if (mode[i] === 4) {                            // climbing back
          const p = tr.path;
          if (idx[i] > 0 && tryMove(i, p[idx[i] - 1])) idx[i]--;
          if (idx[i] === 0) { mode[i] = 0; tripN[i]++; }
        } else if (mode[i] === 1) {                            // back from a flinch
          if (tryMove(i, from[i])) mode[i] = 0;
        } else if (mode[i] === 0 && rnd() < 0.17) {           // a flinch, mostly downward
          const v = V[cur[i]], opts = [];
          for (const w of v.nb) if (ok(V[w])) { const wt = V[w].y > v.y + 1 ? 3 : 1; for (let c = 0; c < wt; c++) opts.push(w); }
          if (opts.length) { const w = opts[(rnd() * opts.length) | 0]; if (tryMove(i, w)) { mode[i] = 1; from[i] = cur[i]; } }
        }
      }
      Zo.st.push(next); Zo.ph.push(ph); cur = next;
    }
    return Zo;
  }

  // RIGHT: ranks on every other row of cells (top corners), and the unison move: six hops along the zigzag that
  // carries a top corner exactly one cell to the right every two hops, so the whole formation slides as one.
  function zigzag(id, hops) {
    const p = [id];
    for (let h = 0; h < hops; h++) {
      const v = V[p[p.length - 1]]; let best = -1, bs = -2;
      for (const w of v.nb) { const dx = V[w].x - v.x, c = dx / Math.hypot(dx, V[w].y - v.y); if (c > bs + 1e-6 || (Math.abs(c - bs) < 1e-6 && V[w].y < V[best].y)) { bs = c; best = w; } }
      p.push(best);
    }
    return p;
  }

  function setup() {
    W = stage.clientWidth; H = stage.clientHeight;
    if (W < 60 || H < 60) return false;
    phone = W < 600;
    SIG = phone ? 0.235 : 0.21;
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    R = phone ? 5.6 : 8.5; P = 1.95 * R; Rc = P / Math.sqrt(3);
    NMOVE = phone ? 4 : 6;
    base = H - (phone ? 34 : 40);
    peak = base - (phone ? 30 : 38);
    x0 = phone ? 4 : 14; x1 = W - x0;
    mU = (phone ? 4 : 6) / (x1 - x0);
    L = SL.lattice({ R, ox: W / 2, oy: base - R, x0: -2 * R, y0: base - peak - 3 * R, x1: W + 2 * R, y1: base + 3 * R });
    V = L.V;
    const inset = phone ? 4.5 : 5.5;
    for (const v of V) {
      v.u = uOf(v.x); v.z = zoneOf(v.u);
      v.in = v.y < base - 2 && v.y > cy(v.x) + inset && v.u > 0.004 && v.u < 0.996;
      v.line = Math.abs(v.y - base) < 3;
      v.side = v.y > base + 4 && v.y < base + Rc * 1.3 + 2;
    }
    const okL = v => v.in && v.u < ZB[0] - mU;
    const okM = v => v.in && v.u > ZB[0] + mU && v.u < ZB[1] - mU;
    const okR = v => v.in && v.u > ZB[1] + mU;
    const rnd = rng(phone ? 41 : 17);
    const dmin = P * 0.98;
    const thin = ids => ids.filter(() => rnd() < (phone ? 0.85 : 0.78));   // a little air between nodes
    const candL = [], candM = [];
    // the herd rests a little back from the divider and the curve, so its surges have somewhere to go
    const homeL = v => okL(v) && v.u < ZB[0] - mU - (0.4 + 2.2 * rnd()) * P / (x1 - x0) && v.y > cy(v.x) + inset + 0.6 * P;   // a ragged edge
    for (const v of V) { if (homeL(v)) candL.push(v.i); else if (okM(v)) candM.push(v.i); }

    // right ranks first (so the slot and YOU's column are known)
    const top = new Int32Array(L.cells.length).fill(-1);
    for (const v of V) for (const c of v.cells) if (top[c.i] < 0 || v.y < V[top[c.i]].y) top[c.i] = v.i;
    const ranks = [];
    for (const c of L.cells) {
      if ((((c.r % 2) + 2) % 2) !== 0 || top[c.i] < 0) continue;
      const path = zigzag(top[c.i], NMOVE);
      if (path.every(id => id >= 0 && okR(V[id]))) ranks.push({ id: top[c.i], path });
    }
    // keep only full ranks (rows of three or more), so the formation reads as one block
    const rows = new Map();
    for (const r of ranks) { const k = Math.round(V[r.id].y); rows.set(k, (rows.get(k) || 0) + 1); }
    for (let i = ranks.length - 1; i >= 0; i--) if (rows.get(Math.round(V[ranks[i].id].y)) < 3) ranks.splice(i, 1);
    const inRanks = new Set(ranks.map(r => r.id));
    let slot = null, bestD = 1e9;
    for (const r of ranks) {
      const v = V[r.id];
      if (v.u < 0.70 || v.u > 0.79) continue;
      const d = v.y - cy(v.x) + v.u * 6;
      if (d < bestD) { bestD = d; slot = r; }
    }
    if (!slot) slot = ranks[0];
    slotV = slot ? slot.id : -1;
    // YOU's way in: the topmost free corner in the slot's column, then the shortest path down to the slot
    e0 = slotV; let ey = slotV >= 0 ? V[slotV].y : 0;
    if (slotV >= 0) for (const v of V) if (okR(v) && !inRanks.has(v.i) && Math.abs(v.x - V[slotV].x) <= Rc * 0.9 && v.y < ey) { ey = v.y; e0 = v.i; }
    let drop = [slotV];
    if (slotV >= 0 && e0 !== slotV) {
      const prev = new Map([[e0, -1]]), qu = [e0];
      for (let h = 0; h < qu.length && !prev.has(slotV); h++) for (const b of V[qu[h]].nb) if (!prev.has(b) && okR(V[b]) && (!inRanks.has(b) || b === slotV)) { prev.set(b, qu[h]); qu.push(b); }
      if (prev.has(slotV)) { drop = []; for (let c = slotV; c >= 0; c = prev.get(c)) drop.unshift(c); }
      else e0 = slotV;
    }
    uD = slotV >= 0 ? uOf(V[e0].x) : 0.75;
    nDrop = drop.length - 1;

    // right group (without the slot) and its move
    const rIds = ranks.filter(r => r.id !== slotV);
    const ZR = mkZone(2, rIds.map(r => r.id), 0.8);
    for (let h = 1; h <= NMOVE; h++) { ZR.st.push(Int32Array.from(rIds.map(r => r.path[h]))); ZR.ph.push(new Float32Array(rIds.length)); }
    // YOU as a one-node zone: drop hops, then the same six hops as the ranks
    YOU = mkZone(3, [drop[0]], 0.78);
    const yPath = drop.concat(slotV >= 0 ? zigzag(slotV, NMOVE).slice(1) : []);
    for (let h = 1; h < yPath.length; h++) { YOU.st.push(Int32Array.of(yPath[h])); YOU.ph.push(new Float32Array(1)); }

    const ZL = buildHerd(thin(scatter(candL, dmin, rnd)), okL);
    const ZM = buildMid(thin(scatter(candM, dmin, rnd)), okM, rnd);
    Z = [ZL, ZM, ZR];
    lutL = buildLut(0); lutM = buildLut(1);
    fieldCache = null; fieldKey = '';
    measure();
    placeLabels();
    return true;
  }

  // the left and mid crowds step faster while YOU is in their zone
  function buildLut(z) {
    const N = 480, lut = new Float32Array(N + 1), [pa, pb] = TL.beats;
    let acc = 0;
    for (let i = 0; i <= N; i++) {
      lut[i] = acc;
      const u = youU(pa + (pb - pa) * (i + 0.5) / N);
      const w = z === 0 ? 1 - sstep(0.31, 0.37, u) : sstep(0.31, 0.37, u) * (1 - sstep(0.63, 0.69, u));
      acc += 1 + 1.5 * w;
    }
    for (let i = 0; i <= N; i++) lut[i] = lut[i] / lut[N] * NB;
    return lut;
  }
  function lutAt(lut, p) {
    const [pa, pb] = TL.beats;
    if (p <= pa) return 0; if (p >= pb) return NB;
    const f = (p - pa) / (pb - pa) * (lut.length - 1), i = Math.floor(f);
    return lut[i] + (lut[i + 1] - lut[i]) * (f - i);
  }

  /* ---- drawing ---- */
  let rails = [];            // channels being crossed right now: z, from, to, light
  function poseZone(Zo, b) {
    const NBz = Zo.st.length - 1;
    if (NBz === 0) { for (let i = 0; i < Zo.n; i++) { const v = V[Zo.st[0][i]]; Zo.x[i] = v.x; Zo.y[i] = v.y; } return; }
    b = Math.min(NBz, Math.max(0, b));
    const k = Math.min(NBz - 1, Math.floor(b)), f = b - k, A = Zo.st[k], B = Zo.st[k + 1], ph = Zo.ph[k];
    for (let i = 0; i < Zo.n; i++) {
      const a = A[i], c = B[i], fr = clamp01((f - ph[i]) / Zo.h);
      if (a === c || fr <= 0) { Zo.x[i] = V[a].x; Zo.y[i] = V[a].y; }
      else if (fr >= 1) { Zo.x[i] = V[c].x; Zo.y[i] = V[c].y; }
      else {
        // the channel lights while the node crosses it, brightest mid-hop, so the node rides a lit wire
        // (light on both sides of it) and nothing trails behind it once it lands
        const e = inOut(fr); Zo.x[i] = V[a].x + (V[c].x - V[a].x) * e; Zo.y[i] = V[a].y + (V[c].y - V[a].y) * e;
        rails.push(Zo.z, a, c, Math.sin(Math.PI * e));
      }
    }
  }

  function drawFieldTo(c, az, xe) {
    // the kit's honeycomb, only under the curve; the zone YOU is in is a step brighter
    const groups = [[], []];
    for (const cell of L.cells) {
      if (cell.y > base - R * 0.45 || cell.y < cy(cell.x) + R * 0.75 || cell.x > xe) continue;
      groups[zoneOf(uOf(cell.x)) === az ? 1 : 0].push(cell);
    }
    c.lineWidth = 1;
    const cols = [COL.faint, COL.line];
    for (let k = 0; k < 2; k++) {
      c.strokeStyle = cols[k]; c.beginPath();
      for (const cell of groups[k]) hexPath(c, cell.x, cell.y, R * 0.97);
      c.stroke();
    }
  }
  function field(az, xe, full) {
    if (!full) { drawFieldTo(g, az, xe); return; }
    const key = az + ':' + W + ':' + H;
    if (fieldKey !== key) {
      if (!fieldCache) fieldCache = document.createElement('canvas');
      fieldCache.width = cv.width; fieldCache.height = cv.height;
      const c = fieldCache.getContext('2d');
      c.setTransform(DPR, 0, 0, DPR, 0, 0); c.clearRect(0, 0, W, H);
      drawFieldTo(c, az, W + 10);
      fieldKey = key;
    }
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(fieldCache, 0, 0); g.restore();
  }

  const BK = 12;
  function strokeBuckets(groups, colors, lw) {
    g.lineWidth = lw; g.lineCap = 'round';
    for (let k = 0; k < groups.length; k++) {
      g.strokeStyle = colors[k];
      for (const [b, arr] of groups[k]) {
        g.globalAlpha = Math.min(1, b / BK); g.beginPath();
        for (let i = 0; i < arr.length; i += 4) { g.moveTo(arr[i], arr[i + 1]); g.lineTo(arr[i + 2], arr[i + 3]); }
        g.stroke();
      }
    }
    g.globalAlpha = 1; g.lineCap = 'butt';
  }

  let lastAz = -1, lastSlot = -1, lastSide = null, drawP = 1, youVis = 0;
  function render(p, s) {
    rails = [];
    const az = p < TL.glide[0] ? zoneOf(youU(p)) : 2;
    const bS = b => b + (Math.round(b) - b) * s;
    const bL = bS(lutAt(lutL, p)), bM = bS(lutAt(lutM, p));
    const bR = bS(clamp01((p - TL.move[0]) / (TL.move[1] - TL.move[0])) * NMOVE);
    let bY = p < TL.drop[0] ? 0 : p < TL.drop[1] ? (p - TL.drop[0]) / (TL.drop[1] - TL.drop[0]) * nDrop : p < TL.move[0] ? nDrop : nDrop + clamp01((p - TL.move[0]) / (TL.move[1] - TL.move[0])) * NMOVE;
    bY = bS(bY);
    poseZone(Z[0], bL); poseZone(Z[1], bM); poseZone(Z[2], bR); poseZone(YOU, bY);

    const xe = x0 + drawP * (x1 - x0 + 12);
    g.setTransform(DPR, 0, 0, DPR, 0, 0); g.clearRect(0, 0, W, H);
    field(az, xe, drawP >= 1);
    // baseline and zone dividers
    g.strokeStyle = COL.line; g.lineWidth = 1; g.globalAlpha = 1; g.beginPath();
    g.moveTo(0, base + 0.5); g.lineTo(Math.min(W, xe + 20), base + 0.5);
    for (const b of ZB) { const x = Math.round(xOf(b)) + 0.5; if (x > xe) continue; g.moveTo(x, base); g.lineTo(x, cy(x) + 8); }
    g.stroke();

    // lit channels: thin and grey so they read as the grid answering, never as tails (inactive zones in hive grey,
    // the zone YOU is in muted, YOU's own path in text)
    const lit = [new Map(), new Map(), new Map()], BA = [0.75, 1, 1];
    const putL = (z, a, ea, eb) => {
      // the right group's unison move, the moment it matters, lights in text like YOU's own path
      const k = z === 3 || (z === 2 && az === 2) ? 2 : z === az ? 1 : 0, bk = Math.round(BA[k] * (z === 2 ? 0.8 : 1) * a * BK); if (bk <= 0) return;
      let arr = lit[k].get(bk); if (!arr) lit[k].set(bk, arr = []); arr.push(V[ea].x, V[ea].y, V[eb].x, V[eb].y);
    };
    for (let i = 0; i < rails.length; i += 4) putL(rails[i], rails[i + 3], rails[i + 1], rails[i + 2]);
    strokeBuckets(lit, [COL.hive, COL.muted, COL.text], phone ? 1 : 1.25);

    // the crowds as hexagonal nodes
    const r = phone ? 2.4 : 2.9, groups = [new Map(), new Map()];
    for (const Zo of Z) {
      const on = Zo.z === az, a0 = on ? 1 : 0.62 - (live ? 0.22 * sstep(0.80, 0.86, p) : 0);   // live: everyone else steps back at the end
      for (let i = 0; i < Zo.n; i++) {
        const x = Zo.x[i]; if (x > xe - 4) continue;
        const a = a0 * clamp01((xe - 4 - x) / 26), b = Math.round(a * BK); if (b <= 0) continue;
        const m = groups[on ? 1 : 0]; let arr = m.get(b); if (!arr) m.set(b, arr = []); arr.push(x, Zo.y[i]);
      }
    }
    const fills = [COL.muted, COL.text];
    for (let k = 0; k < 2; k++) {
      g.fillStyle = fills[k];
      for (const [b, arr] of groups[k]) { g.globalAlpha = Math.min(1, b / BK); g.beginPath(); for (let i = 0; i < arr.length; i += 2) hexPath(g, arr[i], arr[i + 1], r); g.fill(); }
    }
    g.globalAlpha = 1;

    // the open slot in the ranks: a grey hex outline until YOU fills it
    const slotA = drawP * (az === 2 ? 1 : 0.55) * (1 - sstep(0.775, 0.80, p));
    if (slotV >= 0 && slotA > 0.02) {
      g.globalAlpha = slotA; g.strokeStyle = COL.hive; g.lineWidth = 1; g.beginPath();
      hexPath(g, V[slotV].x, V[slotV].y, phone ? 4.6 : 5.6); g.stroke(); g.globalAlpha = 1;
    }

    // YOU: on the curve, then stepping off it, then one of the ranks
    let yx, yy, onCurve = 0;
    if (p < TL.glide[0]) { yx = xOf(youU(p)); yy = cy(yx); onCurve = 1; }
    else if (p < TL.glide[1] && slotV >= 0) {
      const f = inOut((p - TL.glide[0]) / (TL.glide[1] - TL.glide[0])), cx0 = xOf(uD), cy0 = cy(cx0), v = V[e0];
      yx = cx0 + (v.x - cx0) * f; yy = cy0 + (v.y - cy0) * f; onCurve = 1 - f;
    } else { yx = YOU.x[0]; yy = YOU.y[0]; }
    youVis = clamp01((drawP - 0.82) / 0.18);
    if (youVis > 0) {
      const ry = phone ? 3.6 : 4.3, rr = phone ? 6.6 : 8;
      g.globalAlpha = youVis * 0.55; g.strokeStyle = COL.text; g.lineWidth = 1; g.beginPath(); hexPath(g, yx, yy, rr); g.stroke();
      g.globalAlpha = youVis; g.fillStyle = COL.text; g.beginPath(); hexPath(g, yx, yy, ry); g.fill(); g.globalAlpha = 1;
    }

    // the curve, on top
    g.globalAlpha = 0.92; g.strokeStyle = COL.text; g.lineWidth = 1; g.beginPath();
    const xs = Math.min(x1, xe);
    for (let x = x0; x <= xs; x += 2) { const y = cy(x); x === x0 ? g.moveTo(x, y) : g.lineTo(x, y); }
    g.stroke(); g.globalAlpha = 1;

    // DOM: the YOU chip, its drop line, the zone tags and the slot
    youEl.style.transform = `translate(${yx.toFixed(1)}px, ${yy.toFixed(1)}px)`;
    youEl.style.opacity = youVis.toFixed(3);
    yl.style.height = Math.max(0, base - yy - 13) * (onCurve > 0.01 ? 1 : 0) + 'px';
    yl.style.opacity = (0.32 * onCurve).toFixed(3);
    if (az !== lastAz) {
      lastAz = az;
      tagEls.forEach(el => el.classList.toggle('on', +el.dataset.ztag === az));
      if (sideEl) sideEl.classList.toggle('on', az === 1);
    }
    const slot = !live ? -1 : p >= TL.land ? 3 : az;
    if (slot !== lastSlot) {
      lastSlot = slot;
      qEls.forEach(el => {
        const on = +el.dataset.zq === slot;
        el.classList.toggle('on', on);
        if (live) el.querySelectorAll('a').forEach(a => { a.tabIndex = on ? 0 : -1; });
      });
    }
  }

  function placeLabels() {
    if (sideEl) { sideEl.style.left = xOf(0.5).toFixed(1) + 'px'; sideEl.style.top = (base + (phone ? 15 : 19)) + 'px'; }
    if (illuEl) { illuEl.style.left = x0 + 'px'; illuEl.style.top = (base + (phone ? 15 : 19)) + 'px'; }
  }
  function measure() {
    if (!live) return;
    navH = parseFloat(getComputedStyle(pin).top) || 68;
    pinH = pin.offsetHeight;
    cOff = stage.getBoundingClientRect().top - pin.getBoundingClientRect().top;
  }
  function readP() {
    const r = track.getBoundingClientRect();
    D = Math.max(1, r.height - pinH);
    return (navH - r.top) / D;
  }
  function introAt(p) {
    // the curve draws in as the stage scrolls up into place (scroll-driven too)
    const vh = window.innerHeight || 800;
    const pinTop = p < 0 ? navH - p * D : navH, cTop = pinTop + cOff;
    const start = vh * 0.96, end = navH + cOff + vh * 0.1;
    return clamp01((start - cTop) / Math.max(1, start - end));
  }

  /* ---- static picture ---- */
  function renderStatic() {
    if (!setup()) return;
    drawP = 1;
    render(forceP == null ? 1 : forceP, 1);
  }

  if (!live) {
    renderStatic();
    let rt = 0, lw = 0, lh = 0;
    const re = () => { clearTimeout(rt); rt = setTimeout(() => { if (stage.clientWidth !== lw || stage.clientHeight !== lh) { lw = stage.clientWidth; lh = stage.clientHeight; renderStatic(); } }, 120); };
    window.addEventListener('resize', re);
    if (window.ResizeObserver) new ResizeObserver(re).observe(stage);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(re);
    return;
  }

  /* ---- live: scroll is the clock ---- */
  let raf = 0, nFrames = 0, last = 0, Pt = 0, Ps = 0, prevPt = NaN, lastMove = -1e9, settle = 1, visible = false, virtual = false, ready = false;
  function step(t) {
    if (!ready) return false;
    const dt = last ? Math.min(100, Math.max(0, t - last)) : 16.7; last = t;
    Pt = readP();
    if (Pt !== prevPt) { lastMove = t; prevPt = Pt; }
    Ps += (Pt - Ps) * (1 - Math.exp(-dt / 85));
    if (Math.abs(Pt - Ps) < 3e-5) Ps = Pt;
    const idle = Ps === Pt && t - lastMove > 140;
    settle = idle ? Math.min(1, settle + dt / 260) : Math.max(0, settle - dt / 110);
    drawP = introAt(Ps);
    const p = Math.min(1, Math.max(0, Ps));
    render(p, inOut(settle));
    return !(idle && settle >= 1);
  }
  function frame(now) { raf = 0; if (virtual || !visible) return; nFrames++; if (step(now)) raf = requestAnimationFrame(frame); }
  function kick() { if (!raf && !virtual && visible && ready) { last = 0; raf = requestAnimationFrame(frame); } }
  function init() {
    ready = setup();
    if (!ready) return;
    Pt = Ps = readP(); prevPt = Pt; settle = 1;
    drawP = introAt(Ps);
    render(Math.min(1, Math.max(0, Ps)), 1);
  }
  init();
  new IntersectionObserver(es => { for (const e of es) { visible = e.isIntersecting; if (visible) kick(); } }, { rootMargin: '120px 0px' }).observe(track);
  window.addEventListener('scroll', kick, { passive: true });
  let rt = 0, lw = stage.clientWidth, lh = stage.clientHeight;
  const re = () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      measure();
      if (stage.clientWidth !== lw || stage.clientHeight !== lh || !ready) { lw = stage.clientWidth; lh = stage.clientHeight; lastAz = -1; lastSlot = -1; init(); }
      kick();
    }, 120);
  };
  window.addEventListener('resize', re);
  if (window.ResizeObserver) new ResizeObserver(re).observe(stage);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(re);
  // frame-accurate captures: step the scene on a virtual clock (scroll first, then seek)
  window.__crowdSeek = ms => { virtual = true; if (raf) { cancelAnimationFrame(raf); raf = 0; } measure(); step(ms); };
  window.__crowdInfo = () => ({ frames: nFrames, running: !!raf, P: Pt, Ps, settle, drawP, agents: Z.map(z => z.n), nDrop, uD, D, pinH, navH, cOff, W, H });
})();
