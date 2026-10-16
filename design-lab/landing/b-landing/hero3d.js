// Direction B hero: a 3.9s drone shot over a plain of extruded hex plates. The camera skims low, banks,
// cranes up and lands exactly top-down, where 1 world unit = 1 CSS px, so the official swarm-mark.svg
// (a DOM <img>) registers on the core cell. The camera never moves again once it has landed.
import * as THREE from 'three';
import { buildField, buildAgents } from './hexgl.js';
import { T, sm, COL, plateTone } from './sim.js';

const easeInOutCubic = x => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const easeInOutSine = x => -(Math.cos(Math.PI * x) - 1) / 2;
const clamp01 = x => Math.min(1, Math.max(0, x));
const lerp = (a, b, k) => a + (b - a) * k;
const c01 = c => [c[0] / 255, c[1] / 255, c[2] / 255];
const mix = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];

export function createHero3D({ host, S, phone }) {
  const W = S.W, H = S.H;
  const DPR = Math.min(window.devicePixelRatio || 1, phone ? 1.5 : 2);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  if (!renderer.getContext()) throw new Error('no webgl');
  renderer.setPixelRatio(DPR); renderer.setSize(W, H, false); renderer.setClearColor(0x0B0B0D, 1);
  const canvas = renderer.domElement; canvas.setAttribute('aria-hidden', 'true'); canvas.className = 'hero-canvas';
  host.appendChild(canvas);

  const scene = new THREE.Scene();
  const FOV = 30, d = (H / 2) / Math.tan(THREE.MathUtils.degToRad(FOV / 2));
  const cam = new THREE.PerspectiveCamera(FOV, W / H, 2, d * 5);
  const field = buildField(S.cells, { R: S.R, depth: phone ? 10 : 16, rimW: 1.1 });
  const agents = buildAgents(S.agents.length, DPR);
  scene.add(field.mesh, agents.lines, agents.points);

  // final framing: look at the stage centre, in world coords (origin = core, +y up)
  const L = new THREE.Vector3(W / 2 - S.cx, S.cy - H / 2, 0);
  const A = new THREE.Vector3(L.x + (phone ? 40 : 140), L.y - (phone ? 520 : 560), 0);   // where the shot starts looking
  const amp = phone ? 18 : 30;
  const K = { text: c01(COL.text), muted: c01(COL.muted) };

  const pos = new THREE.Vector3(), look = new THREE.Vector3(), up = new THREE.Vector3(), fwd = new THREE.Vector3(), right = new THREE.Vector3();
  function placeCamera(t) {
    if (t >= T.land) {
      cam.fov = FOV; cam.updateProjectionMatrix();
      cam.position.set(L.x, L.y, d); cam.up.set(0, 1, 0); cam.lookAt(L); return;
    }
    const p = clamp01(t / T.land);
    const tilt = THREE.MathUtils.degToRad(64) * (1 - easeInOutCubic(clamp01((t - 450) / (T.land - 450))));
    const r = lerp(0.38 * d, d, easeInOutSine(p));
    const yaw = THREE.MathUtils.degToRad(-34) * (1 - easeInOutSine(p));
    const roll = THREE.MathUtils.degToRad(5) * Math.sin(Math.PI * p) * (1 - p);
    look.lerpVectors(A, L, easeInOutCubic(p));
    pos.set(look.x + r * Math.sin(tilt) * Math.sin(yaw), look.y - r * Math.sin(tilt) * Math.cos(yaw), r * Math.cos(tilt));
    // analytic up vector (never degenerate), then a small bank
    fwd.set(-Math.sin(yaw), Math.cos(yaw), 0);
    up.copy(fwd).multiplyScalar(Math.cos(tilt)).add(new THREE.Vector3(0, 0, Math.sin(tilt))).normalize();
    right.subVectors(look, pos).normalize().cross(up).normalize();
    up.multiplyScalar(Math.cos(roll)).addScaledVector(right, Math.sin(roll)).normalize();
    cam.fov = lerp(40, FOV, easeInOutSine(p)); cam.updateProjectionMatrix();
    cam.position.copy(pos); cam.up.copy(up); cam.lookAt(look);
  }

  function render(t) {
    const flat = sm(T.scanEnd, T.land, t);
    const nb = S.nb(t), markA = S.markOpacity(t), gold = S.coreGold(t);
    const cells = S.cells;
    for (let i = 0; i < cells.length; i++) {
      const c = cells[i];
      const rev = S.reveal(c, t);
      const n = 0.5 + 0.5 * (0.6 * Math.sin(c.x * 0.0042 + t * 0.0006 + 1.3) * Math.cos(c.y * 0.0037 - t * 0.00045) + 0.4 * Math.sin((c.x - c.y) * 0.0081 + c.h * 2.5 + t * 0.0011));
      const wave = S.waveAt(c, t);
      let lift = lerp(-60, amp * n * (1 - flat), easeInOutCubic(rev)) + c.ping * 12 + wave * 6 * (1 - sm(T.land - 200, T.land, t));
      if (c.ring === 0 && t >= T.land - 300) lift = 0;
      field.lift[i] = lift;
      const top = c01(plateTone(c, t, S));
      field.top.set(top, i * 3);
      let rim = mix(c01(COL.ground), c01(COL.line), c.fade * rev);
      const hi = Math.max(c.ping * 0.85, c.pulse * 0.9, wave);
      if (hi > 0) rim = mix(rim, c01(COL.hive), hi);
      if (S.isNeighbour.has(c.q + ',' + c.r)) rim = mix(rim, c01(COL.hive), nb * (1 - markA));
      if (c.ring === 0) rim = mix(rim, c01(COL.gold), gold);
      field.rim.set(rim, i * 3);
    }
    field.commit();
    const ag = S.agents;
    for (let i = 0; i < ag.length; i++) {
      const a = ag[i];
      if (!a.alive || t < a.delay) { agents.hide(i); continue; }
      const wake = sm(a.delay, a.delay + 300, t), scout = a.mode === 'travel';
      const z = a.z + (amp + 8) * (1 - flat), k = 0.085;
      agents.set(i, a.x, a.y, z, a.x - a.vx * k, a.y - a.vy * k, z, scout ? K.muted : K.text, (scout ? 0.85 : 1) * wake, 0);
    }
    agents.commit();
    placeCamera(t);
    renderer.render(scene, cam);
  }
  return {
    canvas, render,
    dispose() { renderer.dispose(); canvas.remove(); },
  };
}
