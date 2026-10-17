/* Swarm A, Core Glow, hero concept h1 "Rising Routes": the WebGL renderer (Three.js r160, lazy-loaded by hero.js).
   It draws what hero.js simulates, in true 3D: the honeycomb as instanced hex columns, the agents as small hexagonal
   nodes riding the column tops, and the lit edges of their routes. hero.js owns the simulation, the camera and the
   timeline and writes plain typed arrays every frame; this module only uploads them and draws.

   Four draw calls, all instanced:
   1. column bodies (ink sides, a roof that turns surface-grey as a column rises, the core's roof in the kit's core
      gradient), drawn first with a polygon offset so they hide the lines behind them (a hidden-line drawing);
   2. column outlines: one instance per cell, 18 screen-space anti-aliased line quads (top ring, six verticals, base
      ring), 1px like the 2D field;
   3. lit edges: one instance per segment, 1.5px;
   4. agents: small hex prisms.
   Colours are written in sRGB and blended in sRGB like Canvas 2D, so the top-down end frame matches the 2D field the
   hero hands back to. A mask texture keeps everything at 13% behind the copy, as in the 2D hero. No text, no lights,
   no shadows, no post-processing. */
import * as THREE from 'three';

THREE.ColorManagement.enabled = false;

const D2R = Math.PI / 180;
const HEX = [];
for (let k = 0; k < 6; k++) { const a = (60 * k - 90) * D2R; HEX.push([Math.cos(a), -Math.sin(a)]); }

const LINE_VS = `
uniform vec2 uRes;
uniform float uDpr;
vec4 fatLine(vec3 A, vec3 B, float lw, float e, float s, out float vd, out float hwOut) {
  mat4 PV = projectionMatrix * viewMatrix;
  vec4 cA = PV * vec4(A, 1.0), cB = PV * vec4(B, 1.0);
  vec2 hr = 0.5 * uRes;
  vec2 sA = cA.xy / cA.w * hr, sB = cB.xy / cB.w * hr;
  vec2 d = sB - sA; float len = length(d);
  vec2 dir = len > 1e-3 ? d / len : vec2(1.0, 0.0);
  vec2 nrm = vec2(-dir.y, dir.x);
  float w = lw * uDpr, hw = 0.5 * w + 1.0;
  vec4 c = e < 0.5 ? cA : cB;
  vec2 off = nrm * s * hw + dir * (e * 2.0 - 1.0) * 0.5 * w;
  c.xy += off / hr * c.w;
  vd = s * hw; hwOut = 0.5 * w;
  return c;
}
`;

const FIELD_VS = LINE_VS + `
attribute vec3 aB;
attribute vec2 aES;
attribute float aKind;
attribute vec4 iP;     // x, y, radius, height
attribute vec4 iTop;   // rgb, masked strength
attribute vec4 iSide;  // rgb, masked strength
attribute vec4 iBase;  // field alpha, line width, unmasked strength (top ring), side visibility
varying vec4 vCol; varying float vU; varying float vD; varying float vHW; varying float vBaseA; varying float vVis;
void main() {
  vec3 A = vec3(iP.xy + position.xy * iP.z, position.z * iP.w);
  vec3 B = vec3(iP.xy + aB.xy * iP.z, aB.z * iP.w);
  gl_Position = fatLine(A, B, iBase.y, aES.x, aES.y, vD, vHW);
  bool top = aKind < 0.5;
  vCol = top ? iTop : iSide;
  vU = top ? iBase.z : 0.0;
  if (aKind > 1.5) vCol.a = 0.0;
  vBaseA = iBase.x;
  vVis = top ? 1.0 : iBase.w;
}`;

const FIELD_FS = `
uniform sampler2D uMask; uniform vec2 uRes; uniform vec3 uGround; uniform vec3 uFaint;
varying vec4 vCol; varying float vU; varying float vD; varying float vHW; varying float vBaseA; varying float vVis;
void main() {
  float cov = clamp(vHW - abs(vD) + 0.5, 0.0, 1.0) * vVis;
  if (cov < 0.004) discard;
  vec2 m = texture2D(uMask, gl_FragCoord.xy / uRes).rg;
  vec3 base = mix(uGround, uFaint, clamp(vBaseA * m.g, 0.0, 1.0));
  float k = clamp(max(vCol.a * m.r, vU), 0.0, 1.0);
  gl_FragColor = vec4(mix(base, vCol.rgb, k), cov);
}`;

const SEG_VS = LINE_VS + `
attribute vec2 aES;
attribute vec4 iA;  // xyz, width
attribute vec4 iB;  // xyz, unused
attribute vec4 iC;  // rgb, alpha
varying vec4 vC; varying float vD; varying float vHW;
void main() {
  gl_Position = fatLine(iA.xyz, iB.xyz, iA.w, aES.x, aES.y, vD, vHW);
  vC = iC;
}`;

const SEG_FS = `
uniform sampler2D uMask; uniform vec2 uRes;
varying vec4 vC; varying float vD; varying float vHW;
void main() {
  float cov = clamp(vHW - abs(vD) + 0.5, 0.0, 1.0);
  float a = vC.a * cov * texture2D(uMask, gl_FragCoord.xy / uRes).r;
  if (a < 0.004) discard;
  gl_FragColor = vec4(vC.rgb, a);
}`;

const BODY_VS = `
attribute float aRoof;
attribute vec4 iP;   // x, y, radius, height
attribute vec4 iR;   // roof rgb, gold
varying vec3 vCol; varying vec2 vL; varying float vRoof; varying float vGold;
void main() {
  vec3 p = vec3(iP.xy + position.xy * iP.z, position.z * iP.w);
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
  vCol = iR.rgb; vGold = iR.a; vRoof = aRoof; vL = position.xy;
}`;

// the core's roof uses the mark's own core gradient (radial, centre 50% / 42%, radius 62% of its box)
const BODY_FS = `
uniform vec3 uSide;
varying vec3 vCol; varying vec2 vL; varying float vRoof; varying float vGold;
void main() {
  vec3 c = vRoof > 0.5 ? vCol : uSide;
  if (vGold > 0.0 && vRoof > 0.5) {
    float r = length(vec2(vL.x / 1.0739, (vL.y - 0.16) / 1.24));
    vec3 g = r < 0.45 ? mix(vec3(1.0, 0.9686, 0.8118), vec3(0.9686, 0.8275, 0.3529), r / 0.45)
                      : mix(vec3(0.9686, 0.8275, 0.3529), vec3(0.851, 0.6039, 0.1176), clamp((r - 0.45) / 0.55, 0.0, 1.0));
    c = mix(c, g, vGold);
  }
  gl_FragColor = vec4(c, 1.0);
}`;

const NODE_VS = `
attribute float aShade;
attribute vec4 iA;  // xyz, size
attribute vec4 iC;  // rgb, alpha
uniform vec2 uSize; // radius, height
varying vec4 vC;
void main() {
  vec3 p = iA.xyz + vec3(position.xy * uSize.x, position.z * uSize.y) * iA.w;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
  vC = vec4(iC.rgb * aShade, iC.a);
}`;

const NODE_FS = `
uniform sampler2D uMask; uniform vec2 uRes;
varying vec4 vC;
void main() {
  float a = vC.a * texture2D(uMask, gl_FragCoord.xy / uRes).r;
  if (a < 0.01) discard;
  gl_FragColor = vec4(vC.rgb, a);
}`;

/* ---------- geometry ---------- */
function quadIndex(nq) { const ix = []; for (let q = 0; q < nq; q++) { const o = q * 4; ix.push(o, o + 1, o + 2, o + 2, o + 1, o + 3); } return ix; }
function columnLines() {
  // 18 edges of a unit hex prism: top ring (kind 0), verticals (1), base ring (2); each a 4-vertex quad
  const A = [], B = [], ES = [], K = [];
  const edge = (a, b, kind) => { for (const [e, s] of [[0, -1], [0, 1], [1, -1], [1, 1]]) { A.push(...a); B.push(...b); ES.push(e, s); K.push(kind); } };
  for (let k = 0; k < 6; k++) {
    const p = HEX[k], q = HEX[(k + 1) % 6];
    edge([p[0], p[1], 1], [q[0], q[1], 1], 0);
    edge([p[0], p[1], 0], [p[0], p[1], 1], 1);
    edge([p[0], p[1], 0], [q[0], q[1], 0], 2);
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(A, 3));
  g.setAttribute('aB', new THREE.Float32BufferAttribute(B, 3));
  g.setAttribute('aES', new THREE.Float32BufferAttribute(ES, 2));
  g.setAttribute('aKind', new THREE.Float32BufferAttribute(K, 1));
  g.setIndex(quadIndex(18));
  return g;
}
function segLines() {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 3));
  g.setAttribute('aES', new THREE.Float32BufferAttribute([0, -1, 0, 1, 1, -1, 1, 1], 2));
  g.setIndex(quadIndex(1));
  return g;
}
function prism(shadeTop, shadeSide) {
  // unit hex prism: six side quads (z 0 to 1) and the top cap; aRoof marks the cap, aShade its brightness
  const P = [], R = [], S = [], ix = [];
  for (let k = 0; k < 6; k++) {
    const p = HEX[k], q = HEX[(k + 1) % 6], o = P.length / 3;
    P.push(p[0], p[1], 0, q[0], q[1], 0, p[0], p[1], 1, q[0], q[1], 1);
    R.push(0, 0, 0, 0); S.push(shadeSide, shadeSide, shadeSide, shadeSide);
    ix.push(o, o + 1, o + 2, o + 2, o + 1, o + 3);
  }
  const c = P.length / 3;
  P.push(0, 0, 1); R.push(1); S.push(shadeTop);
  for (let k = 0; k < 6; k++) { P.push(HEX[k][0], HEX[k][1], 1); R.push(1); S.push(shadeTop); }
  for (let k = 0; k < 6; k++) ix.push(c, c + 1 + k, c + 1 + (k + 1) % 6);
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('aRoof', new THREE.Float32BufferAttribute(R, 1));
  g.setAttribute('aShade', new THREE.Float32BufferAttribute(S, 1));
  g.setIndex(ix);
  return g;
}
function inst(g, name, n, size) {
  const a = new THREE.InstancedBufferAttribute(new Float32Array(n * size), size);
  a.setUsage(THREE.DynamicDrawUsage);
  g.setAttribute(name, a);
  return a;
}
const rgb = hex => new THREE.Vector3(((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255);

/* ---------- the renderer ---------- */
export function createRising(host, before) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance', stencil: false });
  } catch (e) { return null; }
  if (!renderer || !renderer.getContext()) return null;
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.setClearColor(0x0B0B0D, 1);
  renderer.sortObjects = true;
  const cv = renderer.domElement;
  cv.className = 'hero-gl';
  cv.setAttribute('aria-hidden', 'true');
  host.insertBefore(cv, before || null);

  const scene = new THREE.Scene();
  const cam = new THREE.Camera();
  cam.matrixAutoUpdate = false; cam.matrixWorldAutoUpdate = false;
  const res = new THREE.Vector2(1, 1);
  const maskTex = new THREE.DataTexture(new Uint8Array([255, 255, 0, 255]), 1, 1, THREE.RGBAFormat, THREE.UnsignedByteType);
  maskTex.magFilter = maskTex.minFilter = THREE.LinearFilter; maskTex.needsUpdate = true;
  const U = { uRes: { value: res }, uDpr: { value: 1 }, uMask: { value: maskTex } };

  const fieldMat = new THREE.ShaderMaterial({
    vertexShader: FIELD_VS, fragmentShader: FIELD_FS, side: THREE.DoubleSide, transparent: true, depthWrite: false, depthTest: true,
    uniforms: { ...U, uGround: { value: rgb(0x0B0B0D) }, uFaint: { value: rgb(0x1C1C21) } }
  });
  const segMat = new THREE.ShaderMaterial({ vertexShader: SEG_VS, fragmentShader: SEG_FS, side: THREE.DoubleSide, transparent: true, depthWrite: false, depthTest: true, uniforms: { ...U } });
  const bodyMat = new THREE.ShaderMaterial({
    vertexShader: BODY_VS, fragmentShader: BODY_FS, side: THREE.DoubleSide, depthWrite: true, depthTest: true,
    polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 2,
    uniforms: { uSide: { value: rgb(0x0B0B0D) } }
  });
  const nodeMat = new THREE.ShaderMaterial({
    vertexShader: NODE_VS, fragmentShader: NODE_FS, side: THREE.DoubleSide, transparent: true, depthWrite: true, depthTest: true,
    uniforms: { ...U, uSize: { value: new THREE.Vector2(3, 2.6) } }
  });

  let field = null, bodies = null, segs = null, nodes = null, A = null;

  function drop(m) { if (m) { scene.remove(m); m.geometry.dispose(); } }

  /* build for one lattice: n cells, na agents, ns segment slots */
  function build(o) {
    drop(field); drop(bodies); drop(segs); drop(nodes);
    const { W, H, dpr, n, na, ns, nodeR, nodeH } = o;
    renderer.setPixelRatio(dpr);
    renderer.setSize(W, H, false);
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    renderer.getDrawingBufferSize(res);
    U.uDpr.value = dpr;
    nodeMat.uniforms.uSize.value.set(nodeR, nodeH);

    const fg = columnLines();
    const iP = inst(fg, 'iP', n, 4), iTop = inst(fg, 'iTop', n, 4), iSide = inst(fg, 'iSide', n, 4), iBase = inst(fg, 'iBase', n, 4);
    fg.instanceCount = n;
    field = new THREE.Mesh(fg, fieldMat); field.frustumCulled = false; field.renderOrder = 1;

    const bg = prism(1, 1);
    const bP = inst(bg, 'iP', n + 1, 4), bR = inst(bg, 'iR', n + 1, 4);
    bg.instanceCount = 0;
    bodies = new THREE.Mesh(bg, bodyMat); bodies.frustumCulled = false; bodies.renderOrder = 0;

    const sg = segLines();
    const sA = inst(sg, 'iA', ns, 4), sB = inst(sg, 'iB', ns, 4), sC = inst(sg, 'iC', ns, 4);
    sg.instanceCount = 0;
    segs = new THREE.Mesh(sg, segMat); segs.frustumCulled = false; segs.renderOrder = 2;

    const ng = prism(1, 0.62);
    const nA = inst(ng, 'iA', na, 4), nC = inst(ng, 'iC', na, 4);
    ng.instanceCount = 0;
    nodes = new THREE.Mesh(ng, nodeMat); nodes.frustumCulled = false; nodes.renderOrder = 3;

    scene.add(bodies, field, segs, nodes);
    A = { iP, iTop, iSide, iBase, bP, bR, sA, sB, sC, nA, nC, n, na, ns };
    // hero.js writes straight into these
    return {
      cellP: iP.array, cellTop: iTop.array, cellSide: iSide.array, cellBase: iBase.array,
      bodyP: bP.array, bodyR: bR.array,
      segA: sA.array, segB: sB.array, segC: sC.array,
      nodeA: nA.array, nodeC: nC.array
    };
  }

  function setMask(data, mw, mh) {
    const t = new THREE.DataTexture(data, mw, mh, THREE.RGBAFormat, THREE.UnsignedByteType);
    t.magFilter = t.minFilter = THREE.LinearFilter; t.generateMipmaps = false; t.needsUpdate = true;
    const old = U.uMask.value; U.uMask.value = t; if (old) old.dispose();
  }

  const mV = new THREE.Matrix4(), mW = new THREE.Matrix4();
  /* draw one frame: view and projection are column-major arrays from hero.js; counts say how much of each buffer is live */
  function draw(V, P, counts) {
    if (!A) return;
    mV.fromArray(V); mW.copy(mV).invert();
    cam.matrixWorldInverse.copy(mV); cam.matrixWorld.copy(mW);
    cam.projectionMatrix.fromArray(P); cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert();
    A.iP.needsUpdate = A.iTop.needsUpdate = A.iSide.needsUpdate = A.iBase.needsUpdate = true;
    bodies.geometry.instanceCount = counts.bodies;
    if (counts.bodies) { A.bP.needsUpdate = A.bR.needsUpdate = true; }
    segs.geometry.instanceCount = counts.segs;
    if (counts.segs) { A.sA.needsUpdate = A.sB.needsUpdate = A.sC.needsUpdate = true; }
    nodes.geometry.instanceCount = counts.nodes;
    if (counts.nodes) { A.nA.needsUpdate = A.nC.needsUpdate = true; }
    renderer.render(scene, cam);
  }

  function setDpr(dpr, W, H) { renderer.setPixelRatio(dpr); renderer.setSize(W, H, false); renderer.getDrawingBufferSize(res); U.uDpr.value = dpr; }

  function dispose() {
    drop(field); drop(bodies); drop(segs); drop(nodes); field = bodies = segs = nodes = A = null;
    fieldMat.dispose(); segMat.dispose(); bodyMat.dispose(); nodeMat.dispose();
    if (U.uMask.value) U.uMask.value.dispose();
    renderer.dispose();
    try { renderer.forceContextLoss(); } catch (e) { /* ignore */ }
    cv.remove();
  }

  return { canvas: cv, build, setMask, draw, setDpr, dispose };
}
