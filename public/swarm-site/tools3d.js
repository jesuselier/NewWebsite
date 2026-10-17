/* Swarm A, Core Glow: the Custom AI tools card (Three.js r160, lazy-loaded).
   Renders page.js's scout-field model in 3D: an instanced hex patch seen at an angle, scouts as small hexagonal
   nodes hopping corner to corner along the channels between plates, each crossed edge lit for 650ms, sensed plates
   lifting and lighting their rims. The camera cranes to top-down, where 1 world unit = 1 CSS px, and the patch ends
   flat: an unlit #1C1C21 field with the scouts resting on it. No lit cell here: the page's lit cell is the hero's.
   MeshBasicMaterial only (no lights, no shadows), in three draw calls: the plates and their rims as one instanced
   mesh (the rim colour rides a per-instance attribute), the lit edges, and the scout nodes. Plays once in under 5
   seconds, then stops. */
import * as THREE from 'three';

export function createTools(host, M, onLabels) {
  const { W, H, R, L, T } = M;
  if (!W || !H) return null;
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'low-power' }); }
  catch (e) { return null; }
  const DPR = Math.min(window.devicePixelRatio || 1, M.phone ? 1.5 : 2);
  renderer.setPixelRatio(DPR);
  renderer.setSize(W, H, false);
  renderer.setClearColor(0x0B0B0D, 1);
  renderer.domElement.setAttribute('aria-hidden', 'true');
  host.prepend(renderer.domElement);

  const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const scene = new THREE.Scene();
  const dist = (H / 2) / Math.tan(THREE.MathUtils.degToRad(15));
  const cam = new THREE.PerspectiveCamera(30, W / H, 1, dist * 4);
  const look = new THREE.Vector3(0, 0, 0);

  function hexShape(r) {
    const s = new THREE.Shape();
    for (let k = 0; k < 6; k++) { const a = Math.PI / 180 * (60 * k + 90); const x = r * Math.cos(a), y = r * Math.sin(a); k ? s.lineTo(x, y) : s.moveTo(x, y); }
    s.closePath(); return s;
  }
  const cells = L.cells, n = cells.length;
  const DEPTH = 8;
  // one geometry for a plate and its rim: plate tops at full tone, plate sides at 43%, the rim ring just above the top
  const plateGeo = new THREE.ExtrudeGeometry(hexShape(R * 0.97 - 1.1), { depth: DEPTH, bevelEnabled: false, curveSegments: 1 });
  const ringShape = hexShape(R * 0.97 + 0.6); ringShape.holes.push(hexShape(R * 0.97 - 0.6));
  const ringGeo = new THREE.ShapeGeometry(ringShape).toNonIndexed();
  const pp = plateGeo.attributes.position, pn = plateGeo.attributes.normal, rp = ringGeo.attributes.position;
  const nv = pp.count + rp.count, pos = new Float32Array(nv * 3), shade = new Float32Array(nv * 3), isRim = new Float32Array(nv);
  for (let i = 0; i < pp.count; i++) {
    pos[i * 3] = pp.getX(i); pos[i * 3 + 1] = pp.getY(i); pos[i * 3 + 2] = pp.getZ(i);
    const k = Math.abs(pn.getZ(i)) > 0.5 ? 1 : 0.43; shade[i * 3] = shade[i * 3 + 1] = shade[i * 3 + 2] = k;
  }
  for (let i = 0; i < rp.count; i++) {
    const o = pp.count + i;
    pos[o * 3] = rp.getX(i); pos[o * 3 + 1] = rp.getY(i); pos[o * 3 + 2] = DEPTH + 0.15;
    shade[o * 3] = shade[o * 3 + 1] = shade[o * 3 + 2] = 1; isRim[o] = 1;
  }
  const cellGeo = new THREE.BufferGeometry();
  cellGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  cellGeo.setAttribute('color', new THREE.BufferAttribute(shade, 3));
  cellGeo.setAttribute('isRim', new THREE.BufferAttribute(isRim, 1));
  const rimCol = new THREE.InstancedBufferAttribute(new Float32Array(cells.length * 3), 3);
  cellGeo.setAttribute('rimColor', rimCol);
  plateGeo.dispose(); ringGeo.dispose();
  const cellMat = new THREE.MeshBasicMaterial({ color: 0xffffff, vertexColors: true });
  cellMat.onBeforeCompile = sh => {
    sh.vertexShader = 'attribute float isRim;\nattribute vec3 rimColor;\n' + sh.vertexShader.replace('#include <color_vertex>', '#include <color_vertex>\n\tvColor.xyz = mix( vColor.xyz, rimColor, isRim );');
  };
  const plates = new THREE.InstancedMesh(cellGeo, cellMat, n);
  plates.frustumCulled = false;
  scene.add(plates);

  // agents: the page's agent glyph, flat: a hex outline with a head node, one geometry, one instanced draw
  const NA = M.sim.agents.length;
  const gr = M.phone ? 3.8 : 4.6;
  const rimS = hexShape(gr + 0.6); rimS.holes.push(hexShape(gr - 0.6));
  const headS = hexShape(gr * 0.33);
  const rimG = new THREE.ShapeGeometry(rimS).toNonIndexed(), headG = new THREE.ShapeGeometry(headS).toNonIndexed();
  const gp = new Float32Array((rimG.attributes.position.count + headG.attributes.position.count) * 3);
  gp.set(rimG.attributes.position.array, 0); gp.set(headG.attributes.position.array, rimG.attributes.position.count * 3);
  const nodeGeo = new THREE.BufferGeometry(); nodeGeo.setAttribute('position', new THREE.BufferAttribute(gp, 3));
  rimG.dispose(); headG.dispose();
  const nodes = new THREE.InstancedMesh(nodeGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, depthWrite: false }), NA);
  nodes.frustumCulled = false; nodes.renderOrder = 3;
  // lit edges
  const MAXE = 420;
  const ePos = new Float32Array(MAXE * 6), eCol = new Float32Array(MAXE * 6);
  const eGeo = new THREE.BufferGeometry();
  eGeo.setAttribute('position', new THREE.BufferAttribute(ePos, 3));
  eGeo.setAttribute('color', new THREE.BufferAttribute(eCol, 3));
  const edges = new THREE.LineSegments(eGeo, new THREE.LineBasicMaterial({ vertexColors: true, depthWrite: false }));
  edges.frustumCulled = false; edges.renderOrder = 2;
  scene.add(edges, nodes);

  const GROUND = new THREE.Color(0x0B0B0D), SURF = new THREE.Color(0x111114), LIFTC = new THREE.Color(0x232328);
  const LINE = new THREE.Color(0x232328), FAINT = new THREE.Color(0x1C1C21), HIVE = new THREE.Color(0x55555B), MUTED = new THREE.Color(0x8E8A80), TEXT = new THREE.Color(0xEEEBE4);
  const m4 = new THREE.Matrix4(), col = new THREE.Color(), tmp = new THREE.Color(), bg = new THREE.Color(), v3 = new THREE.Vector3();
  const lift = new Float32Array(n);
  const tops = new Float32Array(n);
  const cellIndex = new Map(cells.map((c, i) => [c, i]));
  const vertTop = v => { let h = 0; for (const c of v.cells) { const i = cellIndex.get(c); if (i !== undefined) h = Math.max(h, tops[i]); } return h; };

  function apply(t) {
    const sim = M.sim;
    const flat = sm(T.tilt - 1700, T.tilt, t);
    const tracked = new Set(sim.agents.slice(0, 4).map(a => L.V[a.from].cells[0]));
    const fillOut = sm(T.tilt - 300, T.tilt + 500, t);
    for (let i = 0; i < n; i++) {
      const c = cells[i];
      const reveal = sm(c.ring * 50, c.ring * 50 + 480, t);
      const e = t - c.ping, ping = e < 0 || e > 900 ? 0 : (e < 140 ? e / 140 : e < 320 ? 1 : 1 - (e - 320) / 580);
      lift[i] += ((ping > 0.2 ? 1 : 0) - lift[i]) * 0.18;
      const h = -34 * (1 - reveal) + lift[i] * 13 * (1 - flat);
      tops[i] = h;
      m4.makeTranslation(c.x, -c.y, h - DEPTH); plates.setMatrixAt(i, m4);
      const fade = M.fade(c);
      col.copy(GROUND).lerp(SURF, (1 - fillOut) * reveal * fade).lerp(LIFTC, lift[i] * (1 - flat));
      plates.setColorAt(i, col);
      tmp.copy(GROUND).lerp(FAINT, reveal * fade).lerp(HIVE, ping * 0.9);
      if (tracked.has(c)) tmp.lerp(LINE, sm(T.stop, T.stop + 500, t));
      rimCol.setXYZ(i, tmp.r, tmp.g, tmp.b);
    }
    plates.instanceMatrix.needsUpdate = true;
    plates.instanceColor.needsUpdate = true; rimCol.needsUpdate = true;
    bg.copy(GROUND).lerp(SURF, 1 - fillOut);

    // lit edges, drawn as colour fading into the plate below
    let k = 0;
    const put = (A, B, bx, by, a, kind) => {
      if (k >= MAXE) return;
      const za = vertTop(A) + 1.2, zb = vertTop(B) + 1.2, o = k * 6;
      ePos[o] = A.x; ePos[o + 1] = -A.y; ePos[o + 2] = za; ePos[o + 3] = bx; ePos[o + 4] = -by; ePos[o + 5] = zb;
      tmp.copy(bg).lerp(kind ? TEXT : MUTED, a);
      eCol[o] = eCol[o + 3] = tmp.r; eCol[o + 1] = eCol[o + 4] = tmp.g; eCol[o + 2] = eCol[o + 5] = tmp.b;
      k++;
    };
    for (const e of sim.edges.values()) {
      const age = t - e.t; if (age < 0 || age > sim.edgeFade) continue;
      const A = L.V[e.a], B = L.V[e.b];
      put(A, B, B.x, B.y, (e.k ? 0.8 : 0.5) * (1 - age / sim.edgeFade), e.k);
    }
    for (const a of sim.agents) if (!a.dead && a.to >= 0 && t > a.t0) put(L.V[a.from], L.V[a.to], a.x, a.y, a.kind ? 0.8 : 0.5, a.kind);
    // squad links: each squad's scouts joined by a minimum spanning tree, 1px at 30%, so the field reads as four teams
    if (M.links) {
      tmp.copy(bg).lerp(MUTED, 0.3 * sm(150, 700, t));
      for (const [a, b] of M.links()) {
        if (k >= MAXE || sim.vis(a, t) <= 0 || sim.vis(b, t) <= 0) continue;
        const o = k * 6, za = vertTop(L.V[a.from]) + 1, zb = vertTop(L.V[b.from]) + 1;
        ePos[o] = a.x; ePos[o + 1] = -a.y; ePos[o + 2] = za; ePos[o + 3] = b.x; ePos[o + 4] = -b.y; ePos[o + 5] = zb;
        eCol[o] = eCol[o + 3] = tmp.r; eCol[o + 1] = eCol[o + 4] = tmp.g; eCol[o + 2] = eCol[o + 5] = tmp.b;
        k++;
      }
    }
    for (let i = k * 6; i < MAXE * 6; i++) ePos[i] = 0;
    eGeo.setDrawRange(0, k * 2);
    eGeo.attributes.position.needsUpdate = eGeo.attributes.color.needsUpdate = true;

    // nodes ride just above the plates
    const pts = [];
    for (let i = 0; i < NA; i++) {
      const a = sim.agents[i], vis = sim.vis(a, t);
      const v = L.V[a.from], z = vertTop(v) + 2.4 + 6 * (1 - flat);
      m4.makeScale(vis, vis, 1); m4.setPosition(a.x, -a.y, z + 0.5);
      nodes.setMatrixAt(i, m4);
      nodes.setColorAt(i, a.kind ? TEXT : MUTED);
      if (i < 4) pts.push([a.x, -a.y, z]);
    }
    nodes.instanceMatrix.needsUpdate = true; if (nodes.instanceColor) nodes.instanceColor.needsUpdate = true;

    // camera: tilted orbit, then a crane to exactly top-down at the registered distance
    const tilt = THREE.MathUtils.degToRad(56) * (1 - flat);
    const yaw = (THREE.MathUtils.degToRad(-22) + 0.1 * Math.sin(t * 0.0006)) * (1 - flat);
    cam.position.set(look.x + Math.sin(yaw) * Math.sin(tilt) * dist, look.y - Math.cos(yaw) * Math.sin(tilt) * dist, Math.cos(tilt) * dist);
    cam.up.set(0, 1, 0); cam.lookAt(look); cam.updateMatrixWorld();
    if (onLabels) onLabels(pts.map(p => { v3.set(p[0], p[1], p[2]).project(cam); return [(v3.x + 1) / 2 * W, (1 - v3.y) / 2 * H]; }));
  }

  let simT = 0, raf = 0, last = 0, acc = 0, playing = false, onDone = null;
  const DT = 1000 / 60;
  function reset() { M.reset(); simT = 0; lift.fill(0); }
  function frame(now) {
    raf = 0; if (!playing || document.hidden) return;
    acc += last ? Math.min(2500, now - last) : DT; last = now;
    while (acc >= DT) { simT += DT; M.advance(simT); acc -= DT; }
    apply(simT); renderer.render(scene, cam);
    if (simT >= T.end) { playing = false; const f = onDone; onDone = null; if (f) f(); return; }
    raf = requestAnimationFrame(frame);
  }
  function renderAt(t) {
    reset();
    while (simT + DT <= t) { simT += DT; M.advance(simT); }
    for (let i = 0; i < 30; i++) apply(t);
    renderer.render(scene, cam);
  }
  // a hidden tab stops rAF; on return, pick the pass up where it was instead of jumping ahead
  const onVis = () => { last = 0; acc = 0; if (!document.hidden && playing && !raf) raf = requestAnimationFrame(frame); };
  document.addEventListener('visibilitychange', onVis);
  return {
    renderAt,
    play(done) { reset(); onDone = done || null; playing = true; last = 0; acc = 0; if (!raf) raf = requestAnimationFrame(frame); },
    replay(done) { this.play(done); },
    pause() { playing = false; if (raf) { cancelAnimationFrame(raf); raf = 0; } },
    resume() { if (simT < T.end && simT > 0 && !playing) { playing = true; last = 0; acc = 0; raf = requestAnimationFrame(frame); } },
    dispose() { this.pause(); document.removeEventListener('visibilitychange', onVis); renderer.dispose(); renderer.domElement.remove(); }
  };
}
