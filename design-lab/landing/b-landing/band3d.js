// "Why this cycle" band: a tilted honeycomb field (kit outlines only, no plates) where attention is a basin. A current of agents leaves
// the 2020 games basin, arcs across the plain and lands on the core cell of the AI basin, which deepens as the
// first one fills back in. Plays once when the band is in view, then stops. Labels are DOM, placed by projection.
import * as THREE from 'three';
import { buildField, buildAgents } from './hexgl.js';
import { sm, SQ3, NEIGH, COL, makeRng } from './sim.js';

const lerp = (a, b, k) => a + (b - a) * k;
const c01 = c => [c[0] / 255, c[1] / 255, c[2] / 255];
const mix = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
const easeInOut = x => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const g2 = x => Math.exp(-x * x);
const bez = (p0, p1, p2, p3, s) => { const u = 1 - s; return u * u * u * p0 + 3 * u * u * s * p1 + 3 * u * s * s * p2 + s * s * s * p3; };
export const BAND_DUR = 5200;

export function createBand({ host, labelA, labelB }) {
  const W = host.clientWidth, H = host.clientHeight, phone = W < 640;
  const DPR = Math.min(window.devicePixelRatio || 1, phone ? 1.5 : 2);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  if (!renderer.getContext()) throw new Error('no webgl');
  renderer.setPixelRatio(DPR); renderer.setSize(W, H, false); renderer.setClearColor(0x0B0B0D, 1);
  const canvas = renderer.domElement; canvas.setAttribute('aria-hidden', 'true');
  host.prepend(canvas);
  const rnd = makeRng(23);
  const R = phone ? 15 : 24, P = 1.95 * R;
  const span = phone ? 0.3 : 0.27;
  const A = { x: -W * span, y: phone ? 10 : 0 }, B = { x: W * span, y: phone ? 10 : 0 };
  const rad = P * (phone ? 2.3 : 3.0), depthMax = phone ? 46 : 84;
  // cells covering what the tilted camera sees
  const cells = [], map = new Map();
  const qx = Math.ceil(W / P) + 6, ry = Math.ceil((H * 1.9) / (P * SQ3 / 2)) + 4;
  for (let r = -ry; r <= ry; r++) for (let q = -qx - Math.ceil(ry / 2); q <= qx + Math.ceil(ry / 2); q++) {
    const x = P * (q + r / 2), y = -P * (SQ3 / 2) * r;
    if (Math.abs(x) > W * 0.95 || y < -H * 0.95 || y > H * 1.25) continue;
    // fade toward every edge; the far rows fade sooner so the tilted lattice never packs into a moire band
    const ex = 1 - sm(W * 0.36, W * 0.9, Math.abs(x)), ey = y > 0.1 * H ? 1 - sm(H * 0.15, H * 0.85, y - 0.1 * H) : 1 - sm(H * 0.25, H * 1.0, 0.1 * H - y);
    const c = { q, r, x, y, fade: Math.max(0, ex * ey), dA: Math.hypot(x - A.x, y - A.y), dB: Math.hypot(x - B.x, y - B.y), h: rnd() };
    if (c.fade < 0.02) continue;
    cells.push(c); map.set(q + ',' + r, c);
  }
  // core cell of the AI basin: the cell nearest B
  let core = cells[0]; for (const c of cells) if (c.dB < core.dB) core = c;
  B.x = core.x; B.y = core.y;
  cells.forEach(c => { c.dB = Math.hypot(c.x - B.x, c.y - B.y); });
  const nbSet = new Set(NEIGH.map(([q, r]) => (core.q + q) + ',' + (core.r + r)));

  const scene = new THREE.Scene();
  const field = buildField(cells, { R });
  const N = phone ? 64 : 150;
  const agents = buildAgents(N, DPR);
  scene.add(field.mesh, agents.lines, agents.points);
  const FOV = 32, aspect = W / H, tilt = THREE.MathUtils.degToRad(phone ? 46 : 52);
  const hTan = Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * aspect;
  const dist = ((phone ? 1.12 : 1.12) * W / 2) / hTan;
  const cam = new THREE.PerspectiveCamera(FOV, aspect, 2, dist * 6);

  // agent plans
  const ag = [];
  for (let i = 0; i < N; i++) {
    ag.push({
      r0: P * (0.4 + rnd() * 2.0), a0: rnd() * Math.PI * 2, w: (0.6 + rnd() * 0.5) * (rnd() < 0.85 ? 1 : -1),
      dep: 0.12 + 0.42 * (i / N) + rnd() * 0.05, trip: 0.26 + rnd() * 0.08, lat: (rnd() - 0.5) * P * 2.4, arc: 30 + rnd() * 40,
      r1: P * (0.55 + rnd() * 1.1), a1: rnd() * Math.PI * 2, z0: 6 + rnd() * 10, px: 0, py: 0, pz: 0,
    });
  }
  const K = { text: c01(COL.text), muted: c01(COL.muted) };
  const c1 = { x: lerp(A.x, B.x, 0.3), y: H * (phone ? 0.42 : 0.5) }, c2 = { x: lerp(A.x, B.x, 0.7), y: H * (phone ? 0.42 : 0.5) };
  function agentAt(a, p, tms) {
    // returns position at normalised time p (0..1)
    const sDep = (p - a.dep) / a.trip;
    if (sDep <= 0) {
      const ang = a.a0 + a.w * tms * 0.0011;
      return [A.x + Math.cos(ang) * a.r0, A.y + Math.sin(ang) * a.r0 * 0.8, a.z0, 1];
    }
    if (sDep < 1) {
      const s = easeInOut(sDep);
      const ang0 = a.a0 + a.w * (a.dep * BAND_DUR) * 0.0011;
      const sx = A.x + Math.cos(ang0) * a.r0, sy = A.y + Math.sin(ang0) * a.r0 * 0.8;
      const ex = B.x + Math.cos(a.a1) * a.r1 * 1.6, ey = B.y + Math.sin(a.a1) * a.r1 * 1.2;
      const x = bez(sx, c1.x, c2.x, ex, s), y = bez(sy, c1.y + a.lat, c2.y + a.lat, ey, s);
      return [x, y, a.z0 + a.arc * Math.sin(Math.PI * s), 0];
    }
    // arrived: spiral in and land around the core
    const k = sm(0, 1, (sDep - 1) * 1.6);
    const ang = a.a1 + a.w * (sDep - 1) * 2.2 * (1 - k * 0.7);
    const rr = lerp(a.r1 * 1.6, a.r1, k);
    return [B.x + Math.cos(ang) * rr, B.y + Math.sin(ang) * rr * 0.8, lerp(a.z0, 3, k), 2];
  }
  const proj = new THREE.Vector3();
  function placeLabel(el, x, y, z) {
    proj.set(x, y, z).project(cam);
    const hw = el.offsetWidth / 2 + 12;
    const sx = Math.min(W - hw, Math.max(hw, (proj.x * 0.5 + 0.5) * W)), sy = Math.min(H - 14, (-proj.y * 0.5 + 0.5) * H);
    el.style.transform = `translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px) translate(-50%, -100%)`;
  }

  function render(tms) {
    const p = Math.min(1, tms / BAND_DUR);
    // attention: share of agents still in A / already in B
    let inA = 0, inB = 0;
    for (const a of ag) { const s = (p - a.dep) / a.trip; if (s <= 0) inA++; else if (s >= 1) inB++; }
    const fA = inA / N, fB = inB / N;
    const depthA = depthMax * lerp(0.15, 1, sm(0, 1, fA)), depthB = depthMax * lerp(0.15, 1, sm(0, 1, fB));
    const nbOn = sm(0.55, 0.9, fB);
    for (let i = 0; i < cells.length; i++) {
      const c = cells[i];
      const gA = g2(c.dA / rad), gB = g2(c.dB / rad);
      let lift = -depthA * gA - depthB * gB + Math.sin(c.x * 0.006 + c.h * 3 + tms * 0.0009) * 2.5 * (1 - p);
      if (c === core) lift = lerp(lift, 4, nbOn);
      field.lift[i] = lift;
      const glowA = gA * fA, glowB = gB * fB;
      // outlines only: base tone fades out toward the edges; basin rings and glow lift the outline to the hive grey
      let rim = mix(c01(COL.ground), c01(COL.line), c.fade);
      const ringA = g2((c.dA - rad * 1.05) / (P * 0.6)) * fA, ringB = g2((c.dB - rad * 1.05) / (P * 0.6)) * fB;
      rim = mix(rim, c01(COL.hive), Math.max(ringA * 0.55, ringB * 0.55, glowA * 0.75, glowB * 0.75) * c.fade);
      let w = 1;
      if (nbSet.has(c.q + ',' + c.r)) { rim = mix(rim, c01(COL.hive), nbOn); w = 1 + 0.5 * nbOn; }
      if (c === core) { rim = mix(rim, c01(COL.text), nbOn * 0.9); w = 1 + nbOn; }
      field.base.set(rim, i * 3); field.width[i] = w;
    }
    field.commit();
    const dt = 16;
    for (let i = 0; i < N; i++) {
      const a = ag[i];
      const [x, y, z, ph] = agentAt(a, p, tms);
      const [x0, y0] = agentAt(a, Math.max(0, p - dt / BAND_DUR), tms - dt);
      const gz = ph === 0 ? 0 : ph === 1 ? -depthA * g2(Math.hypot(x - A.x, y - A.y) / rad) : -depthB * g2(Math.hypot(x - B.x, y - B.y) / rad);
      const zz = z + gz + 4;
      const vx = (x - x0) / dt * 1000, vy = (y - y0) / dt * 1000;
      const k = 0.07;
      const col = ph === 1 ? K.muted : K.text;
      agents.set(i, x, y, zz, x - vx * k, y - vy * k, zz, col, ph === 1 ? 0.8 : 1, 0);
    }
    agents.commit();
    const camX = lerp(-W * 0.05, W * 0.04, easeInOut(p));
    const look = new THREE.Vector3(camX, H * (phone ? 0.02 : 0.06), 0);
    cam.position.set(look.x, look.y - dist * Math.sin(tilt), dist * Math.cos(tilt));
    cam.up.set(0, 0, 1); cam.lookAt(look);
    renderer.render(scene, cam);
    placeLabel(labelA, A.x, A.y - rad * 1.3, 0);
    placeLabel(labelB, B.x, B.y - rad * 1.3, 0);
    labelA.classList.toggle('dim', fA < 0.5);
    labelB.classList.toggle('dim', fB < 0.5);
  }
  return { render, canvas, dispose() { renderer.dispose(); canvas.remove(); } };
}
