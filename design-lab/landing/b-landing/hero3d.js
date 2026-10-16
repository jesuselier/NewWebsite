// Direction B hero: a 3.1s drone shot over the kit's honeycomb field (unfilled outlines only, fading toward the
// viewport edges). The camera skims low and fast over the whole first screen, banks, cranes up and lands exactly
// top-down, where 1 world unit = 1 CSS px, so the page's DOM layers (the core glow and the whole official
// swarm-mark.svg) register on the core cell. The camera never moves again once it has landed.
// 3 draw calls: field rings, agent lines (trails + consensus links), agent points (hex heads + scan rings).
import * as THREE from 'three';
import { buildField, buildAgents } from './hexgl.js';
import { T, sm, COL, cellLook, FEATHER, FLOOR } from './sim.js';

const easeInOutCubic = x => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const easeInOutSine = x => -(Math.cos(Math.PI * x) - 1) / 2;
const clamp01 = x => Math.min(1, Math.max(0, x));
const lerp = (a, b, k) => a + (b - a) * k;
const c01 = c => [c[0] / 255, c[1] / 255, c[2] / 255];

export function createHero3D({ host, S, phone }) {
  const W = S.W, H = S.H;
  const DPR = Math.min(window.devicePixelRatio || 1, phone ? 1.5 : 2);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  if (!renderer.getContext()) throw new Error('no webgl');
  renderer.setPixelRatio(DPR); renderer.setSize(W, H, false); renderer.setClearColor(0x0B0B0D, 1);
  const canvas = renderer.domElement; canvas.setAttribute('aria-hidden', 'true'); canvas.className = 'hero-canvas';
  host.insertBefore(canvas, host.firstChild);

  const scene = new THREE.Scene();
  const FOV = 30, d = (H / 2) / Math.tan(THREE.MathUtils.degToRad(FOV / 2));
  const cam = new THREE.PerspectiveCamera(FOV, W / H, 2, d * 6);
  const field = buildField(S.cells, { R: S.R, floor: FLOOR.field });
  const NS = S.caps.scan, NLK = S.caps.links;
  const agents = buildAgents(S.agents.length, { dpr: DPR, ref: d, nScan: NS, nLink: NLK, floor: FLOOR.agent });
  field.setSafe(S.safe, W, H, FEATHER); agents.setSafe(S.safe, W, H, FEATHER);
  scene.add(field.mesh, agents.lines, agents.points);

  // final framing: look at the stage centre, in world coords (origin = core, +y up)
  const L = new THREE.Vector3(W / 2 - S.cx, S.cy - H / 2, 0);
  const A = new THREE.Vector3(S.A[0], S.A[1], 0);
  const YAW0 = S.yaw0, TILT0 = THREE.MathUtils.degToRad(52), R0 = (phone ? 0.24 : 0.2) * d;
  const amp = phone ? 6 : 10;
  const K = { text: c01(COL.text), muted: c01(COL.muted), hive: c01(COL.hive) };
  const HEAD = phone ? 4.4 : 5;

  const pos = new THREE.Vector3(), look = new THREE.Vector3(), up = new THREE.Vector3(), fwd = new THREE.Vector3(), right = new THREE.Vector3(), zUp = new THREE.Vector3();
  let fov = FOV;
  function placeCamera(t) {
    if (t >= T.land) {
      fov = FOV; cam.fov = FOV; cam.updateProjectionMatrix();
      cam.position.set(L.x, L.y, d); cam.up.set(0, 1, 0); cam.lookAt(L); return d;
    }
    const p = clamp01(t / T.land);
    // fast at the start (a real skim over the floor), easing into the registered landing
    const travel = 1 - Math.pow(1 - p, 2.3);
    const tilt = TILT0 * (1 - easeInOutCubic(clamp01((t - 200) / (T.land - 200))));
    // the crane: most of the climb happens in the back half, so the landing is the climax
    const r = lerp(R0, d, easeInOutCubic(sm(0.16, 1, p)));
    const yaw = YAW0 * (1 - easeInOutSine(p));
    const roll = THREE.MathUtils.degToRad(5) * Math.sin(Math.PI * p) * (1 - p);
    look.lerpVectors(A, L, travel);
    pos.set(look.x + r * Math.sin(tilt) * Math.sin(yaw), look.y - r * Math.sin(tilt) * Math.cos(yaw), r * Math.cos(tilt));
    fwd.set(-Math.sin(yaw), Math.cos(yaw), 0);
    up.copy(fwd).multiplyScalar(Math.cos(tilt)).add(zUp.set(0, 0, Math.sin(tilt))).normalize();
    right.subVectors(look, pos).normalize().cross(up).normalize();
    up.multiplyScalar(Math.cos(roll)).addScaledVector(right, Math.sin(roll)).normalize();
    fov = lerp(44, FOV, easeInOutSine(p)); cam.fov = fov; cam.updateProjectionMatrix();
    cam.position.copy(pos); cam.up.copy(up); cam.lookAt(look);
    return pos.z;
  }

  let fieldDoneAt = -1;
  function render(t) {
    const alt = placeCamera(t);
    // distance fog relative to the camera's height: the low pass gets a soft horizon, the landed view none
    const f0 = alt * 2.6, f1 = alt * 6.5;
    field.setFog(f0, f1); agents.setFog(f0, f1); field.setView(fov, H);
    const flat = sm(T.scanEnd, T.land, t);
    // once the signal has landed the field no longer changes: skip the per-cell work (battery on phones)
    const settled = S.settled(t);
    if (!settled || fieldDoneAt < 0 || t < fieldDoneAt) {
      const boost = 1 - sm(1500, T.land, t);
      const cells = S.cells;
      for (let i = 0; i < cells.length; i++) {
        const c = cells[i];
        const n = 0.5 + 0.5 * (0.6 * Math.sin(c.x * 0.0042 + t * 0.0006 + 1.3) * Math.cos(c.y * 0.0037 - t * 0.00045) + 0.4 * Math.sin((c.x - c.y) * 0.0081 + c.h * 2.5));
        field.lift[i] = amp * n * (1 - flat) + c.ping * 10 * (1 - flat);
        const Lk = cellLook(S, c, t, boost);
        field.base[i * 3] = Lk.base[0] / 255; field.base[i * 3 + 1] = Lk.base[1] / 255; field.base[i * 3 + 2] = Lk.base[2] / 255;
        field.hi[i * 4] = Lk.hi[0] / 255; field.hi[i * 4 + 1] = Lk.hi[1] / 255; field.hi[i * 4 + 2] = Lk.hi[2] / 255; field.hi[i * 4 + 3] = Lk.hiAmt;
        field.width[i] = Lk.width; field.rad[i] = Lk.rad;
      }
      field.commit();
      if (settled && fieldDoneAt < 0) fieldDoneAt = t;
    }
    const ag = S.agents;
    for (let i = 0; i < ag.length; i++) {
      const a = ag[i];
      if (!a.alive || t < a.delay) { agents.hide(i); continue; }
      const wake = sm(a.delay, a.delay + 260, t), scout = a.mode === 'travel';
      const z = a.z + (amp + 6) * (1 - flat), k = scout ? 0.1 : 0.08;
      agents.set(i, a.x, a.y, z, a.x - a.vx * k, a.y - a.vy * k, z, scout ? K.muted : K.text, (scout ? 0.82 : 0.95) * wake, (scout ? 0.42 : 0.6) * wake, HEAD);
    }
    for (let j = 0; j < NS; j++) {
      const sc = S.scans[j];
      if (!sc) { agents.hideScan(j); continue; }
      const e = clamp01((t - sc.t0) / 650);
      agents.scan(j, sc.x, sc.y, 2 + amp * (1 - flat), 2 * S.R * (0.3 + 0.6 * e) + 3, K.text, 0.3 * (1 - e));
    }
    for (let j = 0; j < NLK; j++) {
      const lk = S.links[j];
      if (!lk) { agents.hideLink(j); continue; }
      const [a, b] = lk;
      const za = a.z + (amp + 6) * (1 - flat), zb = b.z + (amp + 6) * (1 - flat);
      agents.link(j, a.x, a.y, za, b.x, b.y, zb, K.hive, 0.9 * S.linkAlpha);
    }
    agents.commit();
    renderer.render(scene, cam);
  }
  return {
    canvas, render,
    dispose() { renderer.dispose(); canvas.remove(); },
  };
}
