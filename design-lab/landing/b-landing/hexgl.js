// Shared WebGL pieces for direction B. The field is the kit's honeycomb: unfilled pointy-top hex OUTLINES only
// (no plate fills, no extrusion, no shading), drawn as thin instanced rings in ONE draw call. Each ring has a
// base colour (already faded toward the ground by the radial mask), an optional highlight (pings, pulses) and a
// width in CSS px at the landed camera. The agent layer is velocity ticks + 2px heads (two draw calls).
// Both layers take a screen-space "safe rect" (the hero text column): highlights and agents fade to zero inside
// it, with a feather, so nothing ever crosses a glyph. No lights, no text.
import * as THREE from 'three';

const SAFE_GLSL = `
uniform vec4 uSafe;      // x0, y0, x1, y1 in CSS px (top-left origin); far away = disabled
uniform vec2 uView;      // canvas size in CSS px
uniform float uFeather;  // px over which alpha ramps from 0 (rect edge) to 1
float outsideSafe(vec4 clip) {
  vec2 ndc = clip.xy / clip.w;
  vec2 s = vec2((ndc.x * 0.5 + 0.5) * uView.x, (0.5 - ndc.y * 0.5) * uView.y);
  vec2 d = max(uSafe.xy - s, s - uSafe.zw);
  return smoothstep(0.0, uFeather, length(max(d, 0.0)));
}`;
const safeUniforms = () => ({ uSafe: { value: new THREE.Vector4(-1e6, -1e6, -1e6, -1e6) }, uView: { value: new THREE.Vector2(1, 1) }, uFeather: { value: 40 } });

const FIELD_VS = `
attribute vec2 aOffset;  // per cell, world px
attribute float aLift;   // per cell, px
attribute vec3 aBase;    // per cell outline colour (radial mask already applied)
attribute vec4 aHi;      // per cell highlight colour + amount (masked by the safe rect)
attribute float aWidth;  // per cell outline width, px
uniform float uPr;       // outline radius (0.97 R)
${SAFE_GLSL}
varying vec3 vColor;
void main() {
  // position.xy = unit corner direction, position.z = -1 inner edge / +1 outer edge (mitred at the corners)
  float r = uPr + position.z * aWidth * 0.5 / 0.8660254;
  vec3 p = vec3(position.xy * r + aOffset, aLift);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  vColor = mix(aBase, aHi.rgb, aHi.a * outsideSafe(gl_Position));
}`;
const FIELD_FS = `
varying vec3 vColor;
void main() { gl_FragColor = vec4(vColor, 1.0); }`;

export function buildField(cells, { R }) {
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
  const off = new Float32Array(n * 2), lift = new Float32Array(n), base = new Float32Array(n * 3), hi = new Float32Array(n * 4), width = new Float32Array(n).fill(1);
  cells.forEach((c, i) => { off[i * 2] = c.x; off[i * 2 + 1] = c.y; });
  g.setAttribute('aOffset', new THREE.InstancedBufferAttribute(off, 2));
  const dyn = (arr, k) => { const a = new THREE.InstancedBufferAttribute(arr, k); a.setUsage(THREE.DynamicDrawUsage); return a; };
  const aLift = dyn(lift, 1), aBase = dyn(base, 3), aHi = dyn(hi, 4), aWidth = dyn(width, 1);
  g.setAttribute('aLift', aLift); g.setAttribute('aBase', aBase); g.setAttribute('aHi', aHi); g.setAttribute('aWidth', aWidth);
  g.instanceCount = n;
  const mat = new THREE.ShaderMaterial({ vertexShader: FIELD_VS, fragmentShader: FIELD_FS, side: THREE.DoubleSide, uniforms: { uPr: { value: R * 0.97 }, ...safeUniforms() } });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false;
  return {
    mesh, lift, base, hi, width,
    setSafe(rect, W, H, feather = 40) { setSafe(mat, rect, W, H, feather); },
    commit() { aLift.needsUpdate = true; aBase.needsUpdate = true; aHi.needsUpdate = true; aWidth.needsUpdate = true; },
  };
}

function setSafe(mat, rect, W, H, feather) {
  const u = mat.uniforms;
  if (rect) u.uSafe.value.set(rect.x0, rect.y0, rect.x1, rect.y1); else u.uSafe.value.set(-1e6, -1e6, -1e6, -1e6);
  u.uView.value.set(W, H); u.uFeather.value = feather;
}

const AG_VS = `
attribute vec4 aColor;
uniform float uSize;
uniform float uRef;   // camera distance at which a head is exactly uSize (the landed camera)
${SAFE_GLSL}
varying vec4 vColor;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = uRef > 0.0 ? clamp(uSize * uRef / -mv.z, uSize, uSize * 2.4) : uSize;
  gl_Position = projectionMatrix * mv;
  vColor = vec4(aColor.rgb, aColor.a * outsideSafe(gl_Position));
}`;
const AG_FS = `
varying vec4 vColor;
void main() { if (vColor.a < 0.004) discard; gl_FragColor = vColor; }`;

export function buildAgents(N, dpr, ref = 0) {
  const lp = new Float32Array(N * 6), lc = new Float32Array(N * 8);
  const pp = new Float32Array(N * 3), pc = new Float32Array(N * 4);
  const lg = new THREE.BufferGeometry();
  const lpa = new THREE.BufferAttribute(lp, 3), lca = new THREE.BufferAttribute(lc, 4);
  lpa.setUsage(THREE.DynamicDrawUsage); lca.setUsage(THREE.DynamicDrawUsage);
  lg.setAttribute('position', lpa); lg.setAttribute('aColor', lca);
  const pg = new THREE.BufferGeometry();
  const ppa = new THREE.BufferAttribute(pp, 3), pca = new THREE.BufferAttribute(pc, 4);
  ppa.setUsage(THREE.DynamicDrawUsage); pca.setUsage(THREE.DynamicDrawUsage);
  pg.setAttribute('position', ppa); pg.setAttribute('aColor', pca);
  const mk = size => new THREE.ShaderMaterial({ vertexShader: AG_VS, fragmentShader: AG_FS, transparent: true, depthWrite: false, uniforms: { uSize: { value: size }, uRef: { value: 0 }, ...safeUniforms() } });
  const lines = new THREE.LineSegments(lg, mk(1)); lines.frustumCulled = false; lines.renderOrder = 2;
  const points = new THREE.Points(pg, mk(2 * dpr)); points.frustumCulled = false; points.renderOrder = 3; points.material.uniforms.uRef.value = ref;
  return {
    lines, points,
    setSafe(rect, W, H, feather = 40) { setSafe(lines.material, rect, W, H, feather); setSafe(points.material, rect, W, H, feather); },
    // i, head xyz, tail xyz, rgb 0..1, head alpha, tail alpha
    set(i, x, y, z, tx, ty, tz, c, ah, at) {
      lp.set([tx, ty, tz, x, y, z], i * 6);
      lc.set([c[0], c[1], c[2], at, c[0], c[1], c[2], ah * 0.7], i * 8);
      pp.set([x, y, z], i * 3); pc.set([c[0], c[1], c[2], ah], i * 4);
    },
    hide(i) { lc[i * 8 + 3] = lc[i * 8 + 7] = 0; pc[i * 4 + 3] = 0; pp[i * 3] = 1e6; lp[i * 6] = lp[i * 6 + 3] = 1e6; },
    commit() { lpa.needsUpdate = lca.needsUpdate = ppa.needsUpdate = pca.needsUpdate = true; },
  };
}
