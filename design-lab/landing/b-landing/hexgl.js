// Shared WebGL pieces for direction B: an instanced field of extruded hex plates (top, baked sides and rim in
// ONE draw call) and an agent layer (velocity ticks + 2px heads, two draw calls). Colours are passed as sRGB
// 0..1 and written straight out, so they match the kit hex values. No lights, no shadows, no text.
import * as THREE from 'three';

const FIELD_VS = `
attribute float aPart;   // 0 top, 1 side, 2 rim
attribute float aShade;  // baked side tone
attribute vec2 aOffset;  // per plate
attribute float aLift;   // per plate, px
attribute vec3 aTop;     // per plate top tone
attribute vec3 aRim;     // per plate rim tone
varying vec3 vColor;
void main() {
  vec3 p = position + vec3(aOffset, aLift);
  vColor = aPart > 1.5 ? aRim : (aPart > 0.5 ? aTop * aShade : aTop);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`;
const FIELD_FS = `
varying vec3 vColor;
void main() { gl_FragColor = vec4(vColor, 1.0); }`;

export function buildField(cells, { R, depth = 14, rimW = 1.1, light = [-0.35, -0.94] }) {
  const pr = R * 0.97;
  const pos = [], part = [], shade = [];
  const v = k => { const a = Math.PI / 180 * (60 * k + 90); return [pr * Math.cos(a), pr * Math.sin(a)]; };
  const push = (x, y, z, pa, sh) => { pos.push(x, y, z); part.push(pa); shade.push(sh); };
  // top cap
  for (let k = 0; k < 6; k++) { const a = v(k), b = v(k + 1); push(0, 0, 0, 0, 1); push(a[0], a[1], 0, 0, 1); push(b[0], b[1], 0, 0, 1); }
  // sides, shaded by how much they face the baked light direction
  const L = Math.hypot(light[0], light[1]);
  for (let k = 0; k < 6; k++) {
    const a = v(k), b = v(k + 1);
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, ml = Math.hypot(mx, my);
    const dot = (mx / ml) * (light[0] / L) + (my / ml) * (light[1] / L);
    const sh = 0.5 + 0.55 * Math.max(0, dot);
    push(a[0], a[1], 0, 1, sh); push(b[0], b[1], 0, 1, sh); push(b[0], b[1], -depth, 1, sh);
    push(a[0], a[1], 0, 1, sh); push(b[0], b[1], -depth, 1, sh); push(a[0], a[1], -depth, 1, sh);
  }
  // rim: a thin ring on the top edge
  const ri = pr - rimW / 2, ro = pr + rimW / 2, z = 0.35;
  for (let k = 0; k < 6; k++) {
    const a = v(k), b = v(k + 1);
    const ai = [a[0] * ri / pr, a[1] * ri / pr], ao = [a[0] * ro / pr, a[1] * ro / pr];
    const bi = [b[0] * ri / pr, b[1] * ri / pr], bo = [b[0] * ro / pr, b[1] * ro / pr];
    push(ai[0], ai[1], z, 2, 1); push(ao[0], ao[1], z, 2, 1); push(bo[0], bo[1], z, 2, 1);
    push(ai[0], ai[1], z, 2, 1); push(bo[0], bo[1], z, 2, 1); push(bi[0], bi[1], z, 2, 1);
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aPart', new THREE.Float32BufferAttribute(part, 1));
  g.setAttribute('aShade', new THREE.Float32BufferAttribute(shade, 1));
  const n = cells.length;
  const off = new Float32Array(n * 2), lift = new Float32Array(n), top = new Float32Array(n * 3), rim = new Float32Array(n * 3);
  cells.forEach((c, i) => { off[i * 2] = c.x; off[i * 2 + 1] = c.y; });
  g.setAttribute('aOffset', new THREE.InstancedBufferAttribute(off, 2));
  const aLift = new THREE.InstancedBufferAttribute(lift, 1); aLift.setUsage(THREE.DynamicDrawUsage);
  const aTop = new THREE.InstancedBufferAttribute(top, 3); aTop.setUsage(THREE.DynamicDrawUsage);
  const aRim = new THREE.InstancedBufferAttribute(rim, 3); aRim.setUsage(THREE.DynamicDrawUsage);
  g.setAttribute('aLift', aLift); g.setAttribute('aTop', aTop); g.setAttribute('aRim', aRim);
  g.instanceCount = n;
  const mat = new THREE.ShaderMaterial({ vertexShader: FIELD_VS, fragmentShader: FIELD_FS, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false;
  return {
    mesh, lift, top, rim,
    commit() { aLift.needsUpdate = true; aTop.needsUpdate = true; aRim.needsUpdate = true; },
  };
}

const AG_VS = `
attribute vec4 aColor;
uniform float uSize;
varying vec4 vColor;
void main() {
  vColor = aColor;
  gl_PointSize = uSize;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const AG_FS = `
varying vec4 vColor;
void main() { gl_FragColor = vColor; }`;

export function buildAgents(N, dpr) {
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
  const mk = size => new THREE.ShaderMaterial({ vertexShader: AG_VS, fragmentShader: AG_FS, transparent: true, depthWrite: false, uniforms: { uSize: { value: size } } });
  const lines = new THREE.LineSegments(lg, mk(1)); lines.frustumCulled = false; lines.renderOrder = 2;
  const points = new THREE.Points(pg, mk(2 * dpr)); points.frustumCulled = false; points.renderOrder = 3;
  return {
    lines, points,
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

export const C01 = hex => [((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255];
