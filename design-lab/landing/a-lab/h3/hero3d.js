/* Swarm A, Core Glow, hero concept h3 "Push-in": the WebGL scene (Three.js r160, loaded by hero.js).

   The camera starts high above a vast honeycomb (tens of thousands of cells) where thousands of hexagonal agent
   nodes scan like a city at night. Committed agents route along a shared tree of corridors, so their lit edges
   merge into trunks that all run to one cell. Meanwhile the camera pushes in and down (distance, pitch and a slight
   yaw unwind together) and arrives exactly top-down at the hero composition, registered 1:1 with the 2D field the
   page settles on. At that moment the core resolves, the official mark (a DOM <img>, owned by hero.js) lands and
   the warm light opens. hero.js owns the clock, the light layers, the mark and the hand-off to the 2D still.

   The core stays on the optical axis the whole time (an off-centre frustum whose principal point is the core's
   screen position), so the target never moves on screen: everything flows into the point the eye is already on.

   Five draw calls, no lights, no post-processing, no text:
   1. the honeycomb: one plane with a procedural hex-outline shader (any number of cells, anti-aliased, fades its
      lines out before they get dense enough to shimmer); it also draws the six neighbours and the core outline
      before the mark lands, the boot wave and the ring wave;
   2. sensed cells (pings): instanced hex outlines;
   3. lit edges: instanced screen-space line quads in a ring buffer, each fading over 600ms after its hop;
   4. the edge each agent is crossing, lit up to where the agent is;
   5. agents: instanced hexagons, oriented with the grid, never smaller than about 1.5px.
   Colours are written in sRGB and blended like Canvas 2D (premultiplied, colour management off), so the top-down
   end frame matches the 2D field. A mask texture keeps agents, edges and pings faint behind the copy. */
import * as THREE from 'three';

THREE.ColorManagement.enabled = false;

const SQ3 = Math.sqrt(3);
const clamp01 = x => Math.min(1, Math.max(0, x));
const sm = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
function rng(seed) { let s = seed % 2147483647; if (s <= 0) s += 2147483646; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
// CSS cubic-bezier timing, solved by bisection (robust at the ends)
function bezier(x1, y1, x2, y2) {
  const bx = t => 3 * x1 * t * (1 - t) * (1 - t) + 3 * x2 * t * t * (1 - t) + t * t * t;
  const by = t => 3 * y1 * t * (1 - t) * (1 - t) + 3 * y2 * t * t * (1 - t) + t * t * t;
  return x => { x = clamp01(x); let lo = 0, hi = 1; for (let i = 0; i < 26; i++) { const m = (lo + hi) / 2; if (bx(m) < x) lo = m; else hi = m; } return by((lo + hi) / 2); };
}

const COL = { faint: [0x1C, 0x1C, 0x21], hive: [0x55, 0x55, 0x5B], muted: [0x8E, 0x8A, 0x80], text: [0xEE, 0xEB, 0xE4], gold: [0xF5, 0xC5, 0x42] };
const glc = c => `vec3(${(c[0] / 255).toFixed(5)}, ${(c[1] / 255).toFixed(5)}, ${(c[2] / 255).toFixed(5)})`;

/* ---------- shaders ---------- */
const COMMON = `
uniform float uT;
uniform float uDpr;
uniform vec2 uRes;      // canvas size, CSS px
uniform vec2 uResDev;   // drawing buffer size, device px
uniform sampler2D uMask;
uniform vec2 uMaskScale;
float maskHere() {
  vec2 css = vec2(gl_FragCoord.x, uResDev.y - gl_FragCoord.y) / uDpr;
  return texture2D(uMask, css * uMaskScale).r;
}
float hexd(vec2 l) { return max(abs(l.x), max(abs(0.5 * l.x + 0.8660254 * l.y), abs(0.5 * l.x - 0.8660254 * l.y))); }
float outline(float d, float r, float g, float lw) { return clamp(0.5 * lw * uDpr + 0.5 - abs(d - r) / g, 0.0, 1.0); }
`;
const PROJ = `
uniform float uT;
uniform float uDpr;
uniform vec2 uRes;
vec4 projH(vec2 h) { return projectionMatrix * modelViewMatrix * vec4(h.x, -h.y, 0.0, 1.0); }
vec2 toCss(vec4 c) { return c.xy / c.w * 0.5 * uRes; }
float inOut(float x) { x = clamp(x, 0.0, 1.0); return x < 0.5 ? 4.0 * x * x * x : 1.0 - pow(-2.0 * x + 2.0, 3.0) / 2.0; }
`;

const FIELD_VS = `
varying vec2 vH;
void main() { vH = vec2(position.x, -position.y); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const FIELD_FS = COMMON + `
uniform float uP, uR, uMaxD, uHc, uR1, uCoreA, uWaveT, uBoot;
uniform float uL0, uL1, uL2, uL3, uL4, uL5;
uniform vec2 uCore;
uniform mat4 uPV;
varying vec2 vH;
vec4 over(vec4 top, vec4 bot) { return top + bot * (1.0 - top.a); }
bool at(float q, float r, float a, float b) { return abs(q - a) < 0.5 && abs(r - b) < 0.5; }
void main() {
  float rf = vH.y / (uP * 0.8660254);
  float qf = vH.x / uP - 0.5 * rf;
  float sf = -qf - rf;
  float q = floor(qf + 0.5), r = floor(rf + 0.5), s = floor(sf + 0.5);
  float dq = abs(q - qf), dr = abs(r - rf), ds = abs(s - sf);
  if (dq > dr && dq > ds) q = -r - s; else if (dr > ds) r = -q - s;
  s = -q - r;
  vec2 c = vec2(uP * (q + 0.5 * r), uP * 0.8660254 * r);
  float d = hexd(vH - c);
  float g = max(length(vec2(dFdx(d), dFdy(d))), 1e-5);
  float ring = (abs(q) + abs(r) + abs(s)) * 0.5;
  vec4 cc = uPV * vec4(c.x, -c.y, 0.0, 1.0);
  vec2 sc = (cc.xy / cc.w * 0.5 + 0.5) * uRes; sc.y = uRes.y - sc.y;
  float dS = distance(sc, uCore);
  float pitch = uP / (g * uDpr);
  float ri = uR * 0.97 * 0.8660254;
  vec4 col = vec4(0.0);
  if (ring > 1.5) {
    float cov = outline(d, ri, g, 1.0) * smoothstep(2.4, 6.0, pitch);
    float vig = max(0.16, 1.0 - smoothstep(0.3 * uMaxD, 1.05 * uMaxD, dS)) * (1.0 - smoothstep(uHc - 170.0, uHc - 6.0, sc.y));
    // boot: a wave runs out from the core across the screen and lights the network as it passes
    float e = uBoot - dS / 1.9;
    float reveal = 0.4 + 0.6 * smoothstep(0.0, 320.0, e);
    col = vec4(${glc(COL.faint)}, 1.0) * (vig * reveal * cov);
    if (e > 0.0 && e < 1000.0) {
      float env = e < 110.0 ? e / 110.0 : 1.0 - pow((e - 110.0) / 890.0, 0.7);
      col = over(vec4(${glc(COL.hive)}, 1.0) * (env * 0.5 * max(0.3, vig) * cov), col);
    }
    // the signal: one ring wave runs out across the field as the mark lands
    float w = uT - (uWaveT + 60.0 + ring * 26.0);
    if (w > 0.0 && w < 610.0) {
      float env = w < 90.0 ? w / 90.0 : 1.0 - (w - 90.0) / 520.0;
      float mk = texture2D(uMask, sc * uMaskScale).r;
      col = over(vec4(${glc(COL.hive)}, 1.0) * (env * 0.5 * max(0.25, 1.0 - ring / 28.0) * mk * cov), col);
    }
  } else if (ring > 0.5) {
    float L = at(q, r, 1.0, 0.0) ? uL0 : at(q, r, 1.0, -1.0) ? uL1 : at(q, r, 0.0, -1.0) ? uL2 : at(q, r, -1.0, 0.0) ? uL3 : at(q, r, -1.0, 1.0) ? uL4 : uL5;
    if (L < 0.0) col = vec4(${glc(COL.faint)}, 1.0) * (uR1 * outline(d, ri, g, 1.0));
    else col = vec4(${glc(COL.hive)}, 1.0) * (L * outline(d, ri, g, 1.5));
  } else {
    col = vec4(${glc(COL.gold)}, 1.0) * (uCoreA * outline(d, uR * 0.825 * 0.8660254, g, 1.5));
  }
  gl_FragColor = col;
}
`;

const PING_VS = PROJ + `
uniform float uR;
attribute vec3 pC;
varying vec2 vH; varying vec2 vC; varying float vT0;
void main() {
  vC = pC.xy; vT0 = pC.z;
  float e = uT - vT0;
  if (e < 0.0 || e > 800.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
  vH = pC.xy + position.xy * uR * 1.08;
  gl_Position = projH(vH);
}
`;
const PING_FS = COMMON + `
uniform float uR;
varying vec2 vH; varying vec2 vC; varying float vT0;
void main() {
  float e = uT - vT0;
  float env = e < 120.0 ? e / 120.0 : e < 280.0 ? 1.0 : 1.0 - (e - 280.0) / 520.0;
  float d = hexd(vH - vC);
  float g = max(length(vec2(dFdx(d), dFdy(d))), 1e-5);
  float a = clamp(env, 0.0, 1.0) * 0.85 * maskHere() * outline(d, uR * 0.97 * 0.8660254, g, 1.0);
  gl_FragColor = vec4(${glc(COL.hive)}, 1.0) * a;
}
`;

// screen-space thick lines: corner.x = 0 at A, 1 at B; corner.y = -1 or 1 across
const LINE_VS = PROJ + `
uniform float uLw;
attribute vec2 corner;
#ifdef CURRENT
attribute vec4 aAB; attribute vec4 aTD; attribute vec2 aF;
#else
attribute vec4 eAB; attribute vec2 eT;
#endif
varying float vAcross; varying float vA; varying float vKind;
void main() {
#ifdef CURRENT
  // the edge this agent is crossing, lit up to where it is
  float vis = uT < aTD.z ? 0.0 : clamp((uT - aTD.z) / 160.0, 0.0, 1.0);
  if (aF.x >= 0.0) vis *= 1.0 - clamp((uT - aF.x) / aF.y, 0.0, 1.0);
  float pr = (uT - aTD.x) / aTD.y;
  vec2 A = aAB.xy, B = mix(aAB.xy, aAB.zw, inOut(pr));
  vKind = aTD.w;
  vA = (pr <= 0.0 || pr >= 1.0 || length(aAB.zw - aAB.xy) < 0.5) ? 0.0 : (vKind > 0.5 ? 0.78 : 0.44) * vis;
#else
  float age = uT - eT.x;
  vec2 A = eAB.xy, B = eAB.zw;
  vKind = eT.y;
  vA = (age < 0.0 || age > 600.0) ? 0.0 : (vKind > 0.5 ? 0.78 : 0.44) * (1.0 - age / 600.0);
#endif
  if (vA < 0.004) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
  vec4 cA = projH(A), cB = projH(B);
  vec2 sA = toCss(cA), sB = toCss(cB);
  vec2 dv = sB - sA; float len = length(dv);
  vec2 dir = len > 1e-4 ? dv / len : vec2(1.0, 0.0);
  vec2 nrm = vec2(-dir.y, dir.x);
  float hw = 0.5 * uLw + 1.0 / uDpr;
  vec4 c = corner.x < 0.5 ? cA : cB;
  vec2 off = nrm * corner.y * hw + dir * (corner.x * 2.0 - 1.0) * 0.5 * uLw;
  c.xy += off / (0.5 * uRes) * c.w;
  gl_Position = c;
  vAcross = corner.y * hw;
}
`;
const LINE_FS = COMMON + `
uniform float uLw;
varying float vAcross; varying float vA; varying float vKind;
void main() {
  float cov = clamp((0.5 * uLw - abs(vAcross)) * uDpr + 0.5, 0.0, 1.0);
  float a = vA * cov * maskHere();
  vec3 col = vKind > 0.5 ? ${glc(COL.text)} : ${glc(COL.muted)};
  gl_FragColor = vec4(col * a, a);
}
`;

// agents: a hexagon fan (centre plus six corners), drawn in the plane so it turns and tilts with the grid
const AGENT_VS = PROJ + `
uniform float uRw, uRmin;
attribute vec4 aAB; attribute vec4 aTD; attribute vec2 aF;
varying float vEdge; varying float vRpx; varying float vA; varying float vKind;
void main() {
  float vis = uT < aTD.z ? 0.0 : clamp((uT - aTD.z) / 160.0, 0.0, 1.0);
  if (aF.x >= 0.0) vis *= 1.0 - clamp((uT - aF.x) / aF.y, 0.0, 1.0);
  vKind = aTD.w;
  vA = (vKind > 0.5 ? 1.0 : 0.92) * vis;
  if (vA < 0.004) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
  vec2 Pp = mix(aAB.xy, aAB.zw, inOut((uT - aTD.x) / aTD.y));
  vec4 cc = projH(Pp), c1 = projH(Pp + vec2(1.0, 0.0));
  float ppw = max(length(toCss(c1) - toCss(cc)), 1e-4);
  float rpx = max(uRmin, uRw * ppw);
  float rout = rpx + 0.9 / uDpr;
  gl_Position = projH(Pp + position.xy * (rout / ppw));
  vEdge = position.z * rout * 0.8660254;
  vRpx = rpx;
}
`;
const AGENT_FS = COMMON + `
varying float vEdge; varying float vRpx; varying float vA; varying float vKind;
void main() {
  float cov = clamp((vRpx * 0.8660254 - vEdge) * uDpr + 0.5, 0.0, 1.0);
  float a = vA * cov * maskHere();
  vec3 col = vKind > 0.5 ? ${glc(COL.text)} : ${glc(COL.muted)};
  gl_FragColor = vec4(col * a, a);
}
`;

/* ---------- the scene ---------- */
export function createPushIn(o) {
  const { before, W, Hc, DPR, phone, tablet, R, core, maskAt, copyAt, freeze, T } = o;
  const P = 1.95 * R, Rc = P / SQ3, HH = P * SQ3 / 2;
  const maxD = Math.hypot(Math.max(core.x, W - core.x), Math.max(core.y, Hc - core.y));

  /* camera: focal length in CSS px; at the end the camera sits at distance F, so one world unit is one CSS px */
  const F = 1.1 * Hc;
  const Z0 = phone ? 5.4 : (tablet ? 6 : 6.6);
  const TH0 = (phone ? 40 : 44) * Math.PI / 180;
  const PS0 = (phone ? -13 : -16) * Math.PI / 180;
  const easeD = bezier(0.5, 0, 0.12, 1), easeP = bezier(0.42, 0, 0.1, 1);
  function pose(t) {
    const x = (t - T.camIn) / (T.camEnd - T.camIn);
    if (x >= 1) return { d: F, th: 0, ps: 0, k: 1 };
    const e = easeD(x), ep = easeP(clamp01((t - T.camIn - 140) / (T.camEnd - T.camIn - 140)));
    return { d: F * Math.pow(Z0, 1 - e), th: TH0 * (1 - ep), ps: PS0 * (1 - e), k: e };
  }
  const eul = new THREE.Euler(), quat = new THREE.Quaternion(), tmp = new THREE.Vector3();
  function rig(p) {
    eul.set(p.th, 0, p.ps, 'ZXY'); quat.setFromEuler(eul);
    const pos = new THREE.Vector3(0, 0, p.d).applyQuaternion(quat);
    return { q: quat.clone(), qi: quat.clone().invert(), pos };
  }
  // screen (CSS px) to the plane, in hero coordinates relative to the core (y down)
  function toPlane(c, sx, sy) {
    tmp.set((sx - core.x) / F, -(sy - core.y) / F, -1).applyQuaternion(c.q);
    if (tmp.z >= -1e-6) return null;
    const k = -c.pos.z / tmp.z;
    return [c.pos.x + tmp.x * k, -(c.pos.y + tmp.y * k)];
  }
  function toScreen(c, hx, hy) {
    tmp.set(hx, -hy, 0).sub(c.pos).applyQuaternion(c.qi);
    if (tmp.z > -1) return null;
    return [core.x + F * tmp.x / -tmp.z, core.y - F * tmp.y / -tmp.z];
  }
  const cam0 = rig(pose(0)), camF = rig({ d: F, th: 0, ps: 0 });

  /* ---------- the lattice the agents live on (typed arrays; the field shader draws the honeycomb itself) ---------- */
  let x0 = -core.x - 2 * P, x1 = W - core.x + 2 * P, y0 = -core.y - 2 * P, y1 = Hc - core.y + 2 * P;
  let reach = 0;
  for (let i = 0; i <= 12; i++) for (const [sx, sy] of [[W * i / 12, 0], [W * i / 12, Hc], [0, Hc * i / 12], [W, Hc * i / 12]]) {
    const p = toPlane(cam0, sx, sy); if (!p) continue;
    x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]);
    reach = Math.max(reach, Math.hypot(p[0], p[1]));
  }
  const LIM = phone ? 4200 : 9000;
  x0 = Math.max(x0 - 2 * P, -LIM); x1 = Math.min(x1 + 2 * P, LIM); y0 = Math.max(y0 - 2 * P, -LIM); y1 = Math.min(y1 + 2 * P, LIM);
  reach = Math.min(reach, LIM);
  const r0 = Math.floor(y0 / HH), r1 = Math.ceil(y1 / HH), NR = r1 - r0 + 1;
  const NQ = Math.ceil((x1 - x0) / P) + 3;
  const qOff = new Int32Array(NR);
  for (let i = 0; i < NR; i++) qOff[i] = Math.floor(x0 / P - (r0 + i) / 2) - 1;
  const NC = NR * NQ, NV = NC * 2;
  const cid = (q, r) => { const i = r - r0; if (i < 0 || i >= NR) return -1; const j = q - qOff[i]; return j < 0 || j >= NQ ? -1 : i * NQ + j; };
  const ringOf = (q, r) => (Math.abs(q) + Math.abs(r) + Math.abs(q + r)) / 2;
  const cQ = new Int32Array(NC), cR = new Int32Array(NC), cX = new Float32Array(NC), cY = new Float32Array(NC);
  for (let i = 0; i < NR; i++) for (let j = 0; j < NQ; j++) {
    const k = i * NQ + j, q = qOff[i] + j, r = r0 + i;
    cQ[k] = q; cR[k] = r; cX[k] = P * (q + r / 2); cY[k] = HH * r;
  }
  // vertex 2c is the top corner of cell c, 2c+1 its bottom corner; every corner of the lattice is exactly one of these
  const vX = new Float32Array(NV), vY = new Float32Array(NV), vRing = new Int16Array(NV), vNb = new Int32Array(NV * 3).fill(-1);
  const vCells = new Int32Array(NV * 3).fill(-1);
  for (let c = 0; c < NC; c++) {
    const q = cQ[c], r = cR[c], t = 2 * c, b = t + 1;
    vX[t] = cX[c]; vY[t] = cY[c] - Rc; vX[b] = cX[c]; vY[b] = cY[c] + Rc;
    const nt = [cid(q, r - 1), cid(q + 1, r - 1), cid(q + 1, r - 2)], nb = [cid(q, r + 1), cid(q - 1, r + 1), cid(q - 1, r + 2)];
    for (let k = 0; k < 3; k++) { vNb[t * 3 + k] = nt[k] < 0 ? -1 : 2 * nt[k] + 1; vNb[b * 3 + k] = nb[k] < 0 ? -1 : 2 * nb[k]; }
    vCells[t * 3] = c; vCells[t * 3 + 1] = cid(q, r - 1); vCells[t * 3 + 2] = cid(q + 1, r - 1);
    vCells[b * 3] = c; vCells[b * 3 + 1] = cid(q, r + 1); vCells[b * 3 + 2] = cid(q - 1, r + 1);
    vRing[t] = Math.min(ringOf(q, r), ringOf(q, r - 1), ringOf(q + 1, r - 1));
    vRing[b] = Math.min(ringOf(q, r), ringOf(q, r + 1), ringOf(q - 1, r + 1));
  }
  const cellRing = c => ringOf(cQ[c], cR[c]);
  const walk = new Uint8Array(NV);
  for (let v = 0; v < NV; v++) walk[v] = vRing[v] >= 2 ? 1 : 0;
  // routes go around the copy as it sits in the final composition (world equals screen there)
  const cost = new Uint8Array(NV);
  for (let v = 0; v < NV; v++) cost[v] = copyAt(core.x + vX[v], core.y + vY[v]) < 0.6 ? 2 : 1;

  // shortest corridor distance to the cluster, from its outer corners (Dijkstra, binary heap on typed arrays)
  const dist = new Float32Array(NV).fill(Infinity);
  {
    let hn = 0; const hv = new Int32Array(NV * 4), hd = new Float32Array(NV * 4);
    const push = (d, v) => { let k = hn++; hv[k] = v; hd[k] = d; while (k) { const p = (k - 1) >> 1; if (hd[p] <= hd[k]) break; const tv = hv[p], td = hd[p]; hv[p] = hv[k]; hd[p] = hd[k]; hv[k] = tv; hd[k] = td; k = p; } };
    const pop = () => { const v = hv[0], d = hd[0]; hn--; hv[0] = hv[hn]; hd[0] = hd[hn]; let k = 0; for (;;) { const l = 2 * k + 1, r = l + 1; let m = k; if (l < hn && hd[l] < hd[m]) m = l; if (r < hn && hd[r] < hd[m]) m = r; if (m === k) break; const tv = hv[m], td = hd[m]; hv[m] = hv[k]; hd[m] = hd[k]; hv[k] = tv; hd[k] = td; k = m; } return [d, v]; };
    for (let v = 0; v < NV; v++) if (vRing[v] === 1) { dist[v] = 0; push(0, v); }
    while (hn && hn < hv.length - 4) {
      const [d, i] = pop(); if (d > dist[i]) continue;
      for (let k = 0; k < 3; k++) { const j = vNb[i * 3 + k]; if (j < 0 || !walk[j]) continue; const nd = d + cost[i] + cost[j]; if (nd < dist[j]) { dist[j] = nd; push(nd, j); } }
    }
  }
  // among equally short ways in, prefer the one nearest one of the six arteries leaving the cluster, so routes merge into trunks
  const art = [];
  for (let v = 0; v < NV; v++) if (vRing[v] === 1) {
    let n1 = 0; for (let k = 0; k < 3; k++) { const c = vCells[v * 3 + k]; if (c >= 0 && cellRing(c) === 1) n1++; }
    if (n1 === 2) art.push(Math.atan2(vY[v], vX[v]));
  }
  const artDev = (x, y) => { const a = Math.atan2(y, x); let m = 9; for (const b of art) { let d = Math.abs(a - b); if (d > Math.PI) d = 2 * Math.PI - d; if (d < m) m = d; } return m; };
  const parent = new Int32Array(NV).fill(-1);
  for (let i = 0; i < NV; i++) {
    if (!walk[i] || dist[i] === Infinity) continue;
    let best = -1, bs = 1e9;
    for (let k = 0; k < 3; k++) {
      const j = vNb[i * 3 + k]; if (j < 0 || dist[j] === Infinity) continue;
      if (Math.abs(dist[j] + cost[i] + cost[j] - dist[i]) > 1e-3) continue;
      const dj = Math.hypot(vX[j], vY[j]);
      const s = artDev(vX[j], vY[j]) * (0.6 + 0.4 * Math.min(1, dj / (6 * P))) + dj * 1e-5;
      if (s < bs) { bs = s; best = j; }
    }
    parent[i] = best;
  }
  const hops = new Int32Array(NV).fill(-1);
  {
    const stack = new Int32Array(NV);
    for (let i = 0; i < NV; i++) {
      if (!walk[i] || hops[i] >= 0) continue;
      let n = 0, k = i;
      while (k >= 0 && vRing[k] !== 1 && hops[k] < 0 && n < NV) { stack[n++] = k; k = parent[k]; }
      let base = k < 0 ? 99999 : (vRing[k] === 1 ? 0 : hops[k]);
      for (let m = n - 1; m >= 0; m--) hops[stack[m]] = ++base;
    }
  }
  // inside the cluster: from its outer corners to the core's own corners
  const innerNext = new Int32Array(NV).fill(-1);
  {
    const dIn = new Int32Array(NV).fill(-1), qq = [];
    for (let v = 0; v < NV; v++) if (vRing[v] === 0) { dIn[v] = 0; qq.push(v); }
    for (let h = 0; h < qq.length; h++) for (let k = 0; k < 3; k++) {
      const j = vNb[qq[h] * 3 + k]; if (j < 0 || dIn[j] >= 0 || vRing[j] > 1) continue;
      dIn[j] = dIn[qq[h]] + 1; innerNext[j] = qq[h]; qq.push(j);
    }
  }
  const DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
  const dirOf = c => { for (let k = 0; k < 6; k++) if (cQ[c] === DIRS[k][0] && cR[c] === DIRS[k][1]) return k; return -1; };

  /* ---------- GL ---------- */
  const dprGL = Math.min(DPR, phone ? 1.5 : 2);
  const canvas = document.createElement('canvas');
  canvas.className = 'hero-gl';
  Object.assign(canvas.style, { width: W + 'px', height: Hc + 'px' });
  before.parentNode.insertBefore(canvas, before);
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, depth: false, stencil: false, premultipliedAlpha: true, preserveDrawingBuffer: !!freeze, powerPreference: 'high-performance' });
  } catch (e) { canvas.remove(); throw e; }
  renderer.setPixelRatio(dprGL);
  renderer.setSize(W, Hc, false);
  renderer.setClearColor(0x000000, 0);
  const resDev = renderer.getDrawingBufferSize(new THREE.Vector2());

  // the reading mask: 1 in the open, faint behind the copy, 0 under the rail and at the bottom of the art
  const MC = 4, MW = Math.ceil(W / MC) + 1, MH = Math.ceil(Hc / MC) + 1;
  const mdata = new Uint8Array(MW * MH * 4);
  const maskTex = new THREE.DataTexture(mdata, MW, MH, THREE.RGBAFormat, THREE.UnsignedByteType);
  maskTex.magFilter = maskTex.minFilter = THREE.LinearFilter; maskTex.generateMipmaps = false; maskTex.flipY = false;
  maskTex.wrapS = maskTex.wrapT = THREE.ClampToEdgeWrapping;
  function fillMask(fn) {
    for (let j = 0; j < MH; j++) for (let i = 0; i < MW; i++) { const m = Math.round(255 * clamp01(fn(i * MC + MC / 2, j * MC + MC / 2))); const k = (j * MW + i) * 4; mdata[k] = mdata[k + 1] = mdata[k + 2] = m; mdata[k + 3] = 255; }
    maskTex.needsUpdate = true;
  }
  fillMask(maskAt);

  const U = {
    uT: { value: 0 }, uDpr: { value: dprGL }, uRes: { value: new THREE.Vector2(W, Hc) }, uResDev: { value: resDev.clone() },
    uMask: { value: maskTex }, uMaskScale: { value: new THREE.Vector2(1 / (MW * MC), 1 / (MH * MC)) }
  };
  const mat = (vs, fs, extra, defines) => new THREE.ShaderMaterial({
    vertexShader: vs, fragmentShader: fs, uniforms: Object.assign({}, U, extra || {}), defines: defines || {},
    transparent: true, depthTest: false, depthWrite: false, premultipliedAlpha: true, blending: THREE.NormalBlending,
    extensions: { derivatives: true }
  });
  const scene = new THREE.Scene();
  const camera = new THREE.Camera();
  const meshes = [];
  const addMesh = (geo, m, order) => { const me = new THREE.Mesh(geo, m); me.frustumCulled = false; me.renderOrder = order; scene.add(me); meshes.push(me); return me; };

  // 1. field
  const FU = {
    uP: { value: P }, uR: { value: R }, uMaxD: { value: maxD }, uHc: { value: Hc }, uR1: { value: 0 }, uCoreA: { value: 0 }, uWaveT: { value: -1e9 }, uBoot: { value: 0 },
    uL0: { value: -1 }, uL1: { value: -1 }, uL2: { value: -1 }, uL3: { value: -1 }, uL4: { value: -1 }, uL5: { value: -1 },
    uCore: { value: new THREE.Vector2(core.x, core.y) }, uPV: { value: new THREE.Matrix4() }
  };
  const ext = 2 * LIM + 8 * P;
  addMesh(new THREE.PlaneGeometry(ext * 2, ext * 2, 1, 1), mat(FIELD_VS, FIELD_FS, FU), 0);

  // 2. pings
  const PCAP = phone ? 160 : 384;
  const pingArr = new Float32Array(PCAP * 3).fill(-1e9);
  const pingAttr = new THREE.InstancedBufferAttribute(pingArr, 3); pingAttr.setUsage(THREE.DynamicDrawUsage);
  const pingGeo = new THREE.InstancedBufferGeometry();
  pingGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3));
  pingGeo.setIndex([0, 1, 2, 0, 2, 3]);
  pingGeo.setAttribute('pC', pingAttr); pingGeo.instanceCount = PCAP;
  addMesh(pingGeo, mat(PING_VS, PING_FS, { uR: { value: R } }), 1);

  // 3. lit edges (ring buffer) and 4. the edge each agent is crossing
  const quad = () => {
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(12), 3));
    g.setAttribute('corner', new THREE.BufferAttribute(new Float32Array([0, -1, 1, -1, 1, 1, 0, 1]), 2));
    g.setIndex([0, 1, 2, 0, 2, 3]);
    return g;
  };
  const ECAP = phone ? 6144 : 16384;
  const eAB = new Float32Array(ECAP * 4), eT = new Float32Array(ECAP * 2);
  for (let i = 0; i < ECAP; i++) eT[i * 2] = -1e9;
  const eABa = new THREE.InstancedBufferAttribute(eAB, 4), eTa = new THREE.InstancedBufferAttribute(eT, 2);
  eABa.setUsage(THREE.DynamicDrawUsage); eTa.setUsage(THREE.DynamicDrawUsage);
  const edgeGeo = quad(); edgeGeo.setAttribute('eAB', eABa); edgeGeo.setAttribute('eT', eTa); edgeGeo.instanceCount = ECAP;
  const LW = { uLw: { value: 1 } };
  addMesh(edgeGeo, mat(LINE_VS, LINE_FS, LW), 2);

  const N = phone ? 1000 : (tablet ? 1700 : 2600);
  const aAB = new Float32Array(N * 4), aTD = new Float32Array(N * 4), aF = new Float32Array(N * 2);
  const aABa = new THREE.InstancedBufferAttribute(aAB, 4), aTDa = new THREE.InstancedBufferAttribute(aTD, 4), aFa = new THREE.InstancedBufferAttribute(aF, 2);
  for (const a of [aABa, aTDa, aFa]) a.setUsage(THREE.DynamicDrawUsage);
  const curGeo = quad(); curGeo.setAttribute('aAB', aABa); curGeo.setAttribute('aTD', aTDa); curGeo.setAttribute('aF', aFa); curGeo.instanceCount = N;
  addMesh(curGeo, mat(LINE_VS, LINE_FS, LW, { CURRENT: 1 }), 3);

  // 5. agents
  const hexPos = [0, 0, 0];
  for (let k = 0; k < 6; k++) { const a = Math.PI / 180 * (60 * k - 90); hexPos.push(Math.cos(a), Math.sin(a), 1); }
  const agentGeo = new THREE.InstancedBufferGeometry();
  agentGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(hexPos), 3));
  agentGeo.setIndex([0, 1, 2, 0, 2, 3, 0, 3, 4, 0, 4, 5, 0, 5, 6, 0, 6, 1]);
  agentGeo.setAttribute('aAB', aABa); agentGeo.setAttribute('aTD', aTDa); agentGeo.setAttribute('aF', aFa); agentGeo.instanceCount = N;
  const AU = { uRw: { value: phone ? 2.4 : 3 }, uRmin: { value: phone ? 1.35 : 1.5 } };
  addMesh(agentGeo, mat(AGENT_VS, AGENT_FS, AU), 4);

  /* ---------- the swarm ---------- */
  let rnd, agents, simT, resolved, eHead, eWrites, eLo, eHi, pHead, pDirty, cellPing, live, lit, flashT, absorbed;
  const DT = 1000 / 60;
  const hopD = () => 175 + rnd() * 85;
  const pick = arr => arr[(rnd() * arr.length) | 0];
  const rMin = 3.2 * P, rMax = Math.max(reach, 6 * P);
  const visStart = (x, y) => { const s = toScreen(cam0, x, y); return s && s[0] > -12 && s[0] < W + 12 && s[1] > -12 && s[1] < Hc + 12 ? s : null; };
  const inFinal = (x, y, m) => core.x + x > -m && core.x + x < W + m && core.y + y > -m && core.y + y < Hc + m;

  function writeAgent(a) {
    const i = a.id, A = a.from, B = a.to >= 0 ? a.to : a.from;
    aAB[i * 4] = vX[A]; aAB[i * 4 + 1] = vY[A]; aAB[i * 4 + 2] = vX[B]; aAB[i * 4 + 3] = vY[B];
    aTD[i * 4] = a.to >= 0 ? a.t0 : 0; aTD[i * 4 + 1] = a.to >= 0 ? a.d : 1; aTD[i * 4 + 2] = a.dead ? 1e9 : a.born; aTD[i * 4 + 3] = a.kind;
    aF[i * 2] = a.fadeT; aF[i * 2 + 1] = a.fadeD;
    a.dirty = false; agentsDirty = true;
  }
  let agentsDirty = true;
  function light(a, b, t, k) {
    const i = eHead; eHead = (eHead + 1) % ECAP; eWrites++;
    eAB[i * 4] = vX[a]; eAB[i * 4 + 1] = vY[a]; eAB[i * 4 + 2] = vX[b]; eAB[i * 4 + 3] = vY[b];
    eT[i * 2] = t; eT[i * 2 + 1] = k;
    if (i < eLo) eLo = i; if (i > eHi) eHi = i;
  }
  function ping(c, t) {
    cellPing[c] = t; live.push(t);
    const i = pHead; pHead = (pHead + 1) % PCAP;
    pingArr[i * 3] = cX[c]; pingArr[i * 3 + 1] = cY[c]; pingArr[i * 3 + 2] = t; pDirty = true;
  }

  function reset() {
    rnd = rng(23);
    simT = 0; resolved = false; eHead = 0; eWrites = ECAP + 1; eLo = 1e9; eHi = -1; pHead = 0; pDirty = true; live = []; flashT = -1e9; absorbed = 0;
    for (let i = 0; i < ECAP; i++) eT[i * 2] = -1e9;
    pingArr.fill(-1e9);
    cellPing = new Float32Array(NC).fill(-1e9);
    lit = new Float32Array(6).fill(-1e9);
    agents = [];
    const used = new Uint8Array(NV);
    for (let n = 0; n < N; n++) {
      let v = -1, sx = 0;
      for (let tries = 0; tries < 50 && v < 0; tries++) {
        // log-uniform in distance from the core: the same number of agents per screen at every altitude
        const rr = rMin * Math.pow(rMax / rMin, rnd()), an = rnd() * 2 * Math.PI;
        const x = rr * Math.cos(an), y = rr * Math.sin(an);
        const s0 = visStart(x, y), fin = inFinal(x, y, 0);
        if (!s0 && !fin) continue;
        // thinner behind the copy, at the start and in the final composition
        const m0 = s0 ? maskAt(s0[0], s0[1]) : 1, m1 = fin ? maskAt(core.x + x, core.y + y) : 1;
        if (Math.min(m0, m1) < 0.6 && rnd() > 0.35) continue;
        const qf = x / P - (y / HH) / 2, rf = y / HH;
        let q = Math.round(qf), r = Math.round(rf); const s = Math.round(-qf - rf);
        const dq = Math.abs(q - qf), dr = Math.abs(r - rf), ds = Math.abs(s + qf + rf);
        if (dq > dr && dq > ds) q = -r - s; else if (dr > ds) r = -q - s;
        const corners = [[q, r, 0], [q + 1, r - 1, 1], [q, r + 1, 0], [q, r, 1], [q - 1, r + 1, 0], [q, r - 1, 1]];
        const [cq, cr, kb] = corners[(rnd() * 6) | 0];
        const c = cid(cq, cr); if (c < 0) continue;
        const id = 2 * c + kb;
        if (!walk[id] || used[id] || vRing[id] < 3) continue;
        v = id; sx = rr;
      }
      if (v < 0) continue;
      used[v] = 1;
      const fr = Math.log(sx / rMin) / Math.log(rMax / rMin);
      const kind = rnd() < 0.66 ? 1 : 0;
      const a = { id: agents.length, from: v, to: -1, t0: 0, d: 1, kind, prev: -1, mode: 0, dead: false, fadeT: -1, fadeD: 300,
        born: T.wake + fr * T.wakeSpan + rnd() * 160, ct: T.commit0 + rnd() * (T.commit1 - T.commit0), jit: rnd() * 260, hd: 100, dirty: true };
      agents.push(a);
      const nx = []; for (let k = 0; k < 3; k++) { const j = vNb[v * 3 + k]; if (j >= 0 && walk[j]) nx.push(j); }
      if (nx.length) { a.to = pick(nx); a.t0 = a.born + 40 + rnd() * 220; a.d = hopD(); }
    }
    for (let i = agents.length; i < N; i++) { aTD[i * 4 + 2] = 1e9; aTD[i * 4] = 0; aTD[i * 4 + 1] = 1; aF[i * 2] = -1; }
    for (const a of agents) writeAgent(a);
  }

  function policy(a, at) {
    const v = a.from;
    if (a.fadeT >= 0 && at >= a.fadeT) return;    // fading out where it stands
    if (a.mode === 0) {
      // sense one of the three cells that meet at this corner
      if (!resolved && rnd() < (at < 900 ? 0.5 : 0.34)) {
        while (live.length && at - live[0] > 800) live.shift();
        if (live.length < (phone ? 40 : 110)) {
          const cs = [];
          for (let k = 0; k < 3; k++) { const c = vCells[v * 3 + k]; if (c >= 0 && cellRing(c) >= 3 && at - cellPing[c] > 800) cs.push(c); }
          if (cs.length) ping(pick(cs), at);
        }
      }
      if (a.kind === 1 && !resolved && at >= a.ct && hops[v] > 0 && hops[v] < 99999) {
        a.mode = 1;
        a.hd = Math.min(190, Math.max(phone ? 50 : 44, Math.max(160, T.arrive + a.jit - at) / hops[v]));
        return policy(a, at);
      }
      if (resolved) return;
      const minRing = at > T.commit0 ? 3 : 2;
      let opts = [];
      for (let k = 0; k < 3; k++) { const j = vNb[v * 3 + k]; if (j >= 0 && j !== a.prev && walk[j] && vRing[j] >= minRing) opts.push(j); }
      if (!opts.length) for (let k = 0; k < 3; k++) { const j = vNb[v * 3 + k]; if (j >= 0 && walk[j]) opts.push(j); }
      if (!opts.length) return;
      const bias = a.kind ? 0.62 * sm(350, T.commit0, at) : 0;
      if (bias && rnd() < bias) { const down = opts.filter(j => dist[j] < dist[v]); if (down.length) opts = down; }
      a.to = pick(opts); a.t0 = at + 20 + rnd() * 140; a.d = hopD();
      return;
    }
    if (vRing[v] === 1 && a.mode === 1) {
      for (let k = 0; k < 3; k++) { const c = vCells[v * 3 + k]; if (c >= 0 && cellRing(c) === 1) { const di = dirOf(c); if (di >= 0 && lit[di] < -1e8) lit[di] = at; } }
      a.mode = 2;
    }
    if (a.mode === 2) {
      if (vRing[v] === 0) { a.dead = true; absorbed++; flashT = at; return; }
      const nx = innerNext[v];
      if (nx < 0) { a.dead = true; return; }
      a.to = nx; a.t0 = at; a.d = 110;
      return;
    }
    const p = parent[v];
    if (p < 0) { a.mode = 0; return; }
    a.to = p; a.t0 = at; a.d = a.hd;
  }

  function step(t) {
    for (const a of agents) {
      if (a.dead) continue;
      let guard = 0, ch = false;
      while (a.to >= 0 && t >= a.t0 + a.d && guard++ < 8) {
        const at = a.t0 + a.d;
        light(a.from, a.to, at, a.kind);
        a.prev = a.from; a.from = a.to; a.to = -1;
        policy(a, at); ch = true;
        if (a.dead) break;
      }
      if (!a.dead && a.fadeT >= 0 && t > a.fadeT + a.fadeD) { a.dead = true; ch = true; }
      if (ch) writeAgent(a);
    }
    if (!resolved && t >= T.resolve) {
      resolved = true;
      for (let k = 0; k < 6; k++) if (lit[k] < -1e8) lit[k] = t;
      for (const a of agents) {
        if (a.dead || a.fadeT >= 0) continue;
        const A = a.from, B = a.to >= 0 ? a.to : a.from;
        if (!inFinal((vX[A] + vX[B]) / 2, (vY[A] + vY[B]) / 2, 24)) { a.dead = true; writeAgent(a); continue; }
        if (a.mode === 0) { a.fadeT = t + 60 + rnd() * 360; a.fadeD = 260; writeAgent(a); }
        else if (a.mode === 1) { a.fadeT = t + 380 + rnd() * 240; a.fadeD = 200; writeAgent(a); }
      }
    }
  }
  function simulateTo(t) {
    if (t < simT - 1e-6) reset();
    while (simT + DT <= t) { simT += DT; step(simT); }
  }

  /* ---------- per frame ---------- */
  const pv = new THREE.Matrix4();
  function render(t) {
    simulateTo(t);
    const p = pose(t), c = rig(p);
    camera.position.copy(c.pos); camera.quaternion.copy(c.q); camera.updateMatrixWorld(true);
    const n = 10;
    camera.projectionMatrix.makePerspective(-core.x / F * n, (W - core.x) / F * n, core.y / F * n, -(Hc - core.y) / F * n, n, 1e6);
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
    pv.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    FU.uPV.value.copy(pv);
    U.uT.value = t;
    const hand = resolved ? clamp01((t - T.resolve) / T.markIn) : 0, handE = 1 - Math.pow(1 - hand, 3);
    // the cluster before the mark lands: neighbours light as agents reach their corners, the core charges
    FU.uR1.value = sm(20, 340, t) * (1 - handE);
    for (let k = 0; k < 6; k++) FU['uL' + k].value = lit[k] < -1e8 || t < lit[k] ? -1 : sm(lit[k], lit[k] + 220, t) * (1 - handE);
    const charge = sm(T.commit1, T.resolve, t);
    const flash = Math.max(0, 1 - (t - flashT) / 220);
    FU.uCoreA.value = Math.min(1, sm(0, 260, t) * (0.34 + 0.56 * charge) + 0.25 * flash) * (1 - handE);
    FU.uWaveT.value = resolved ? T.resolve : -1e9;
    FU.uBoot.value = t;
    LW.uLw.value = 1 + ((phone ? 1.25 : 1.5) - 1) * p.k;
    if (agentsDirty) { aABa.needsUpdate = aTDa.needsUpdate = aFa.needsUpdate = true; agentsDirty = false; }
    if (eWrites > 0) {
      if (eWrites >= ECAP || eHi < eLo) { eABa.needsUpdate = eTa.needsUpdate = true; }
      else { eABa.addUpdateRange(eLo * 4, (eHi - eLo + 1) * 4); eTa.addUpdateRange(eLo * 2, (eHi - eLo + 1) * 2); eABa.needsUpdate = eTa.needsUpdate = true; }
      eWrites = 0; eLo = 1e9; eHi = -1;
    }
    if (pDirty) { pingAttr.needsUpdate = true; pDirty = false; }
    renderer.render(scene, camera);
    return { resolved, resolveT: T.resolve, charge, zoom: F / p.d, k: p.k };
  }

  let lost = false;
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); lost = true; if (o.onLost) o.onLost(); }, { once: true });

  reset();
  return {
    canvas, render,
    setMask() { fillMask(maskAt); },
    get lost() { return lost; },
    info: () => ({ cells: NC, vertices: NV, agents: agents.length, edgeCap: ECAP, dprGL, reach: Math.round(reach), Z0, extent: [Math.round(x0), Math.round(y0), Math.round(x1), Math.round(y1)] }),
    dispose() {
      for (const m of meshes) { m.geometry.dispose(); m.material.dispose(); }
      maskTex.dispose();
      renderer.dispose();
      try { renderer.forceContextLoss(); } catch (e) { /* already gone */ }
      canvas.remove();
    }
  };
}
