// Shared WebGL pieces for direction B. The field is the kit's honeycomb: unfilled pointy-top hex OUTLINES only
// (no plate fills, no extrusion, no shading), drawn as thin instanced rings in ONE draw call. Ring width is held in
// screen pixels (so the low pass reads as thin lines, not thick near-camera bars), and a distance fog, scaled to the
// camera's height, fades the horizon. The agent layer is two draw calls: line segments (velocity trails and
// consensus links) and points (small hex heads and one-shot scan rings).
// Every layer takes up to four screen-space "safe rects" (the hero text column): inside them the field keeps a
// low share of its contrast and agents a low share of their opacity, so nothing crosses a glyph at full strength.
// No lights, no text.
import * as THREE from 'three';

const SAFE_GLSL = `
uniform vec4 uSafe[4];   // x0, y0, x1, y1 in CSS px (top-left origin); far away = unused
uniform vec2 uView;      // canvas size in CSS px
uniform float uFeather;  // px over which the mask ramps from 0 (rect edge) to 1
uniform vec2 uFog;       // fog start, end (view depth)
float outsideSafe(vec4 clip) {
  vec2 ndc = clip.xy / clip.w;
  vec2 s = vec2((ndc.x * 0.5 + 0.5) * uView.x, (0.5 - ndc.y * 0.5) * uView.y);
  float m = 1.0;
  for (int i = 0; i < 4; i++) {
    vec4 r = uSafe[i];
    vec2 d = max(r.xy - s, s - r.zw);
    m = min(m, smoothstep(0.0, uFeather, length(max(d, 0.0))));
  }
  return m;
}`;
const FAR = -1e6;
const safeUniforms = () => ({
  uSafe: { value: [0, 1, 2, 3].map(() => new THREE.Vector4(FAR, FAR, FAR, FAR)) },
  uView: { value: new THREE.Vector2(1, 1) }, uFeather: { value: 40 }, uFog: { value: new THREE.Vector2(1e7, 2e7) },
});
function applySafe(mat, rects, W, H, feather) {
  const u = mat.uniforms;
  for (let i = 0; i < 4; i++) { const r = rects && rects[i]; if (r) u.uSafe.value[i].set(r.x0, r.y0, r.x1, r.y1); else u.uSafe.value[i].set(FAR, FAR, FAR, FAR); }
  u.uView.value.set(W, H); u.uFeather.value = feather;
}

const FIELD_VS = `
attribute vec2 aOffset;  // per cell, world px
attribute float aLift;   // per cell, px
attribute vec3 aBase;    // per cell outline colour (edge fade and mark handoff already applied)
attribute vec4 aHi;      // per cell highlight colour + amount
attribute float aWidth;  // per cell outline width, CSS px on screen
attribute float aRad;    // per cell outline radius, in R
uniform float uR;
uniform float uPxK;      // world units per screen px at view depth 1 (2 tan(fov/2) / H)
uniform vec3 uGround;
uniform float uFloor;    // contrast kept inside the safe rects
${SAFE_GLSL}
varying vec3 vColor;
void main() {
  vec4 cmv = modelViewMatrix * vec4(aOffset, aLift, 1.0);
  float depth = max(1.0, -cmv.z);
  // position.xy = unit corner direction, position.z = -1 inner edge / +1 outer edge (mitred at the corners)
  float r = aRad * uR + position.z * aWidth * 0.5 * uPxK * depth / 0.8660254;
  vec3 p = vec3(position.xy * r + aOffset, aLift);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  float m = outsideSafe(gl_Position);
  vec3 col = mix(aBase, aHi.rgb, aHi.a * m);
  float fog = smoothstep(uFog.x, uFog.y, depth);
  vColor = mix(uGround, col, mix(uFloor, 1.0, m) * (1.0 - fog));
}`;
const FIELD_FS = `
varying vec3 vColor;
void main() { gl_FragColor = vec4(vColor, 1.0); }`;

export function buildField(cells, { R, floor = 0.28, ground = [11 / 255, 11 / 255, 13 / 255] }) {
  const pos = [];
  const dir = k => { const a = Math.PI / 180 * (60 * k + 90); return [Math.cos(a), Math.sin(a)]; };
  for (let k = 0; k < 6; k++) {
    const a = dir(k), b = dir(k + 1);
    pos.push(a[0], a[1], -1, a[0], a[1], 1, b[0], b[1], 1);
    pos.push(a[0], a[1], -1, b[0], b[1], 1, b[0], b[1], -1);
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  const n = cells.length;
  const off = new Float32Array(n * 2), lift = new Float32Array(n), base = new Float32Array(n * 3), hi = new Float32Array(n * 4);
  const width = new Float32Array(n).fill(1), rad = new Float32Array(n).fill(0.97);
  cells.forEach((c, i) => { off[i * 2] = c.x; off[i * 2 + 1] = c.y; });
  g.setAttribute('aOffset', new THREE.InstancedBufferAttribute(off, 2));
  const dyn = (arr, k) => { const a = new THREE.InstancedBufferAttribute(arr, k); a.setUsage(THREE.DynamicDrawUsage); return a; };
  const aLift = dyn(lift, 1), aBase = dyn(base, 3), aHi = dyn(hi, 4), aWidth = dyn(width, 1), aRad = dyn(rad, 1);
  g.setAttribute('aLift', aLift); g.setAttribute('aBase', aBase); g.setAttribute('aHi', aHi); g.setAttribute('aWidth', aWidth); g.setAttribute('aRad', aRad);
  g.instanceCount = n;
  const mat = new THREE.ShaderMaterial({
    vertexShader: FIELD_VS, fragmentShader: FIELD_FS, side: THREE.DoubleSide,
    uniforms: { uR: { value: R }, uPxK: { value: 0 }, uGround: { value: new THREE.Vector3(...ground) }, uFloor: { value: floor }, ...safeUniforms() },
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false;
  return {
    mesh, lift, base, hi, width, rad, mat,
    setSafe(rects, W, H, feather = 40) { applySafe(mat, rects, W, H, feather); },
    setView(fovDeg, H) { mat.uniforms.uPxK.value = 2 * Math.tan(THREE.MathUtils.degToRad(fovDeg / 2)) / H; },
    setFog(a, b) { mat.uniforms.uFog.value.set(a, b); },
    commit() { aLift.needsUpdate = true; aBase.needsUpdate = true; aHi.needsUpdate = true; aWidth.needsUpdate = true; aRad.needsUpdate = true; },
  };
}

const LINE_VS = `
attribute vec4 aColor;
uniform float uFloor;
${SAFE_GLSL}
varying vec4 vColor;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  float fog = smoothstep(uFog.x, uFog.y, -mv.z);
  vColor = vec4(aColor.rgb, aColor.a * mix(uFloor, 1.0, outsideSafe(gl_Position)) * (1.0 - fog));
}`;
const LINE_FS = `
varying vec4 vColor;
void main() { if (vColor.a < 0.004) discard; gl_FragColor = vColor; }`;
const PT_VS = `
attribute vec4 aColor;
attribute float aSize;   // CSS px at the landed camera
attribute float aKind;   // 0 = hex head, 1 = scan ring
uniform float uDpr;
uniform float uRef;      // camera distance at which a point is exactly aSize (the landed camera)
uniform float uFloor;
${SAFE_GLSL}
varying vec4 vColor;
varying float vKind;
varying float vPx;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  float sc = uRef > 0.0 ? clamp(uRef / max(1.0, -mv.z), 1.0, 2.2) : 1.0;
  vPx = aSize * uDpr * sc;
  gl_PointSize = vPx;
  gl_Position = projectionMatrix * mv;
  float fog = smoothstep(uFog.x, uFog.y, -mv.z);
  vColor = vec4(aColor.rgb, aColor.a * mix(uFloor, 1.0, outsideSafe(gl_Position)) * (1.0 - fog));
  vKind = aKind;
}`;
const PT_FS = `
varying vec4 vColor;
varying float vKind;
varying float vPx;
void main() {
  vec2 p = gl_PointCoord * 2.0 - 1.0;
  float a = vColor.a;
  float aa = 2.0 / max(vPx, 1.0);
  if (vKind < 0.5) {
    vec2 q = abs(p);   // pointy-top hexagon, circumradius 1
    float d = max(q.x - 0.866, dot(q, vec2(0.5, 0.866)) - 0.866);
    a *= 1.0 - smoothstep(-aa * 0.6, aa * 0.6, d);
  } else {
    float r = length(p);
    a *= 1.0 - smoothstep(aa * 0.5, aa * 1.4, abs(r - 0.86));
  }
  if (a < 0.004) discard;
  gl_FragColor = vec4(vColor.rgb, a);
}`;

// N agents, nScan scan rings, nLink consensus links
export function buildAgents(N, { dpr = 1, ref = 0, nScan = 0, nLink = 0, floor = 0.14 } = {}) {
  const NL = N + nLink, NP = N + nScan;
  const lp = new Float32Array(NL * 6).fill(1e6), lc = new Float32Array(NL * 8);
  const pp = new Float32Array(NP * 3).fill(1e6), pc = new Float32Array(NP * 4), ps = new Float32Array(NP), pk = new Float32Array(NP);
  for (let j = N; j < NP; j++) pk[j] = 1;
  const lg = new THREE.BufferGeometry();
  const lpa = new THREE.BufferAttribute(lp, 3), lca = new THREE.BufferAttribute(lc, 4);
  lpa.setUsage(THREE.DynamicDrawUsage); lca.setUsage(THREE.DynamicDrawUsage);
  lg.setAttribute('position', lpa); lg.setAttribute('aColor', lca);
  const pg = new THREE.BufferGeometry();
  const ppa = new THREE.BufferAttribute(pp, 3), pca = new THREE.BufferAttribute(pc, 4), psa = new THREE.BufferAttribute(ps, 1), pka = new THREE.BufferAttribute(pk, 1);
  [ppa, pca, psa].forEach(a => a.setUsage(THREE.DynamicDrawUsage));
  pg.setAttribute('position', ppa); pg.setAttribute('aColor', pca); pg.setAttribute('aSize', psa); pg.setAttribute('aKind', pka);
  const lmat = new THREE.ShaderMaterial({ vertexShader: LINE_VS, fragmentShader: LINE_FS, transparent: true, depthWrite: false, depthTest: false, uniforms: { uFloor: { value: floor }, ...safeUniforms() } });
  const pmat = new THREE.ShaderMaterial({ vertexShader: PT_VS, fragmentShader: PT_FS, transparent: true, depthWrite: false, depthTest: false, uniforms: { uFloor: { value: floor }, uDpr: { value: dpr }, uRef: { value: ref }, ...safeUniforms() } });
  const lines = new THREE.LineSegments(lg, lmat); lines.frustumCulled = false; lines.renderOrder = 2;
  const points = new THREE.Points(pg, pmat); points.frustumCulled = false; points.renderOrder = 3;
  const hideSeg = k => { lp[k * 6] = lp[k * 6 + 3] = 1e6; lc[k * 8 + 3] = lc[k * 8 + 7] = 0; };
  const hidePt = j => { pp[j * 3] = 1e6; pc[j * 4 + 3] = 0; };
  return {
    lines, points,
    setSafe(rects, W, H, feather = 40) { applySafe(lmat, rects, W, H, feather); applySafe(pmat, rects, W, H, feather); },
    setFog(a, b) { lmat.uniforms.uFog.value.set(a, b); pmat.uniforms.uFog.value.set(a, b); },
    // agent i: head xyz, tail xyz, rgb 0..1, head alpha, trail alpha at the head end, head size px
    set(i, x, y, z, tx, ty, tz, c, ah, at, size) {
      lp[i * 6] = tx; lp[i * 6 + 1] = ty; lp[i * 6 + 2] = tz; lp[i * 6 + 3] = x; lp[i * 6 + 4] = y; lp[i * 6 + 5] = z;
      lc[i * 8] = c[0]; lc[i * 8 + 1] = c[1]; lc[i * 8 + 2] = c[2]; lc[i * 8 + 3] = 0;
      lc[i * 8 + 4] = c[0]; lc[i * 8 + 5] = c[1]; lc[i * 8 + 6] = c[2]; lc[i * 8 + 7] = at;
      pp[i * 3] = x; pp[i * 3 + 1] = y; pp[i * 3 + 2] = z; pc[i * 4] = c[0]; pc[i * 4 + 1] = c[1]; pc[i * 4 + 2] = c[2]; pc[i * 4 + 3] = ah; ps[i] = size;
    },
    hide(i) { hideSeg(i); hidePt(i); },
    scan(j, x, y, z, diam, c, a) { const k = N + j; pp[k * 3] = x; pp[k * 3 + 1] = y; pp[k * 3 + 2] = z; pc[k * 4] = c[0]; pc[k * 4 + 1] = c[1]; pc[k * 4 + 2] = c[2]; pc[k * 4 + 3] = a; ps[k] = diam; },
    hideScan(j) { hidePt(N + j); },
    link(j, x1, y1, z1, x2, y2, z2, c, a) {
      const k = N + j;
      lp[k * 6] = x1; lp[k * 6 + 1] = y1; lp[k * 6 + 2] = z1; lp[k * 6 + 3] = x2; lp[k * 6 + 4] = y2; lp[k * 6 + 5] = z2;
      for (const o of [0, 4]) { lc[k * 8 + o] = c[0]; lc[k * 8 + o + 1] = c[1]; lc[k * 8 + o + 2] = c[2]; lc[k * 8 + o + 3] = a; }
    },
    hideLink(j) { hideSeg(N + j); },
    commit() { lpa.needsUpdate = lca.needsUpdate = ppa.needsUpdate = pca.needsUpdate = psa.needsUpdate = true; },
  };
}
