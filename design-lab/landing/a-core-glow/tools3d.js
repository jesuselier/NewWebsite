/* Swarm A, Core Glow: the Custom AI tools card (Three.js r160, lazy-loaded).
   An instanced hex patch seen at an angle. Scouts move over it; cells they sense lift and light their rims,
   then settle. The camera cranes to a top-down view where 1 world unit = 1 CSS px, the patch ends flat,
   the six neighbours turn hive grey and the official swarm-mark.svg fades in exactly on the core cell.
   MeshBasicMaterial only (no lights, no shadows). Plays once in about 5 seconds, then stops rendering. */
import * as THREE from 'three';

export function createTools(host, mark, L) {
  const { W, H, R, coreX, coreY, rings: N, phone } = L;
  if (!W || !H) return null;
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'low-power' }); }
  catch (e) { return null; }
  const DPR = Math.min(window.devicePixelRatio || 1, phone ? 1.5 : 2);
  renderer.setPixelRatio(DPR);
  renderer.setSize(W, H, false);
  renderer.setClearColor(0x0B0B0D, 1);
  renderer.domElement.setAttribute('aria-hidden', 'true');
  host.prepend(renderer.domElement);

  const P = 1.95 * R, SQ3 = Math.sqrt(3);
  const T = { scanEnd: 2400, settle0: 2300, settle1: 3900, resolve: 4400, end: 5200 };
  const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  let seed = 19; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  const scene = new THREE.Scene();
  const dist = (H / 2) / Math.tan(THREE.MathUtils.degToRad(15));
  const cam = new THREE.PerspectiveCamera(30, W / H, 1, dist * 4);
  const look = new THREE.Vector3(W / 2 - coreX, -(H / 2 - coreY), 0);

  function hexShape(r) {
    const s = new THREE.Shape();
    for (let k = 0; k < 6; k++) { const a = Math.PI / 180 * (60 * k + 90); const x = r * Math.cos(a), y = r * Math.sin(a); k ? s.lineTo(x, y) : s.moveTo(x, y); }
    s.closePath(); return s;
  }
  const cells = [];
  for (let q = -N; q <= N; q++) for (let r = -N; r <= N; r++) {
    const ring = (Math.abs(q) + Math.abs(q + r) + Math.abs(r)) / 2;
    if (ring > N) continue;
    const x = P * (q + r / 2), y = -P * (SQ3 / 2) * r;
    cells.push({ q, r, ring, x, y, d: Math.hypot(x, y), lift: 0, sense: 0 });
  }
  const n = cells.length, maxD = N * P;

  const DEPTH = 9;
  const plateGeo = new THREE.ExtrudeGeometry(hexShape(R * 0.97 - 1.1), { depth: DEPTH, bevelEnabled: false, curveSegments: 1 });
  const ringShape = hexShape(R * 0.97 + 0.6); ringShape.holes.push(hexShape(R * 0.97 - 0.6));
  const ringGeo = new THREE.ShapeGeometry(ringShape);
  const capMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const sideMat = new THREE.MeshBasicMaterial({ color: 0x6e6e6e });
  const plates = new THREE.InstancedMesh(plateGeo, [capMat, sideMat], n);
  const rims = new THREE.InstancedMesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }), n);
  plates.frustumCulled = rims.frustumCulled = false;
  scene.add(plates, rims);
  const goldShape = hexShape(R * 0.82 + 0.75); goldShape.holes.push(hexShape(R * 0.82 - 0.75));
  const goldMat = new THREE.MeshBasicMaterial({ color: 0xF5C542, transparent: true, opacity: 0, depthWrite: false });
  const goldRim = new THREE.Mesh(new THREE.ShapeGeometry(goldShape), goldMat);
  goldRim.position.z = 0.6; scene.add(goldRim);

  // agents: heads (points) and heading ticks (segments)
  const NA = phone ? 30 : 46;
  const agents = [];
  for (let i = 0; i < NA; i++) {
    const c = cells[(rnd() * n) | 0];
    agents.push({ x: c.x + (rnd() - 0.5) * R, y: c.y + (rnd() - 0.5) * R, vx: 0, vy: 0, t: cells[(rnd() * n) | 0], commit: rnd() < 0.74, alive: true, delay: 150 + rnd() * 500, dwell: 0 });
  }
  const headPos = new Float32Array(NA * 3), segPos = new Float32Array(NA * 6);
  const headGeo = new THREE.BufferGeometry(); headGeo.setAttribute('position', new THREE.BufferAttribute(headPos, 3));
  const segGeo = new THREE.BufferGeometry(); segGeo.setAttribute('position', new THREE.BufferAttribute(segPos, 3));
  const headMat = new THREE.PointsMaterial({ color: 0xEEEBE4, size: 2.6 * DPR, sizeAttenuation: false, transparent: true, opacity: 1, depthWrite: false });
  const segMat = new THREE.LineBasicMaterial({ color: 0xEEEBE4, transparent: true, opacity: 0.5, depthWrite: false });
  const heads = new THREE.Points(headGeo, headMat), ticks = new THREE.LineSegments(segGeo, segMat);
  heads.frustumCulled = ticks.frustumCulled = false;
  scene.add(ticks, heads);

  const GROUND = new THREE.Color(0x0B0B0D), SURF = new THREE.Color(0x141418), LIFTC = new THREE.Color(0x24242A);
  const FAINT = new THREE.Color(0x1C1C21), HIVE = new THREE.Color(0x55555B);
  const m4 = new THREE.Matrix4(), col = new THREE.Color(), tmp = new THREE.Color();
  const coreCell = cells.find(c => c.ring === 0);
  const tops = new Float32Array(n);

  function step(t, dt) {
    const s = dt / 1000, cons = sm(T.scanEnd, 3600, t);
    for (const a of agents) {
      if (!a.alive || t < a.delay) continue;
      if (a.commit && t > T.scanEnd && a.t !== coreCell) a.t = coreCell;
      const ox = a.t.x - a.x, oy = a.t.y - a.y, d = Math.hypot(ox, oy) || 1e-6;
      const vmax = P * 2.3 * (1 + 1.3 * cons), sp = Math.min(vmax, vmax * d / (P * 0.9));
      a.vx += ((ox / d) * sp - a.vx) * 3.4 * s + (rnd() - 0.5) * (1 - cons) * vmax * 1.6 * s;
      a.vy += ((oy / d) * sp - a.vy) * 3.4 * s + (rnd() - 0.5) * (1 - cons) * vmax * 1.6 * s;
      a.x += a.vx * s; a.y += a.vy * s;
      if (a.t === coreCell) { if (d < R * 0.45) a.alive = false; }
      else if (d < R * 0.35) { a.dwell += dt; if (a.dwell > 220 + rnd() * 260) { a.dwell = 0; a.t = cells[(rnd() * n) | 0]; if (a.t.ring === 0) a.t = cells[(rnd() * n) | 0]; } }
    }
    // sensing: cells under an agent lift and light their rim, then settle
    for (const c of cells) {
      let near = 0;
      for (const a of agents) { if (!a.alive || t < a.delay) continue; const dd = Math.hypot(a.x - c.x, a.y - c.y); if (dd < P * 0.62) { near = 1; break; } }
      const target = (t < T.settle1 && c.ring > 0) ? near : 0;
      c.lift += (target - c.lift) * Math.min(1, s * (target > c.lift ? 9 : 3.2));
      c.sense = Math.max(c.sense * Math.exp(-s * 2.6), near && t < 3600 ? 1 : 0);
    }
  }

  function apply(t) {
    const flat = sm(T.settle0, T.settle1, t);
    const fillOut = sm(T.settle1 - 200, T.resolve + 200, t);
    const nb = sm(3300, 4200, t) * (1 - sm(T.resolve, T.resolve + 240, t));
    for (let i = 0; i < n; i++) {
      const c = cells[i];
      const reveal = sm(c.ring * 60, c.ring * 60 + 520, t);
      const rise = -36 * (1 - reveal);
      const h = rise + c.lift * 14 * (1 - flat);
      tops[i] = h;
      m4.makeTranslation(c.x, c.y, h - DEPTH); plates.setMatrixAt(i, m4);
      m4.makeTranslation(c.x, c.y, h + 0.15); rims.setMatrixAt(i, m4);
      const fade = Math.max(0.25, 1 - sm(0.55 * maxD, maxD * 1.02, c.d));
      // plate fill: surface while tilted, back to ground when flat (so the final frame is the kit's outline field)
      col.copy(GROUND).lerp(SURF, (1 - fillOut) * reveal * fade).lerp(LIFTC, c.lift * (1 - flat));
      plates.setColorAt(i, col);
      tmp.copy(GROUND).lerp(FAINT, reveal * fade);
      const lit = Math.max(c.sense * 0.9 * (1 - flat), c.ring === 1 ? nb : 0);
      tmp.lerp(HIVE, lit);
      if (c.ring === 0) tmp.copy(GROUND).lerp(FAINT, reveal * (1 - sm(3400, 4000, t)));
      rims.setColorAt(i, tmp);
    }
    plates.instanceMatrix.needsUpdate = rims.instanceMatrix.needsUpdate = true;
    plates.instanceColor.needsUpdate = rims.instanceColor.needsUpdate = true;
    goldMat.opacity = sm(3400, 4300, t) * (1 - sm(T.resolve, T.resolve + 240, t));
    // agents ride just above the plates
    const fadeA = 1 - sm(T.resolve, T.resolve + 600, t);
    let k = 0;
    for (let i = 0; i < NA; i++) {
      const a = agents[i], v = a.alive && t >= a.delay && fadeA > 0;
      const z = 4 + 14 * (1 - flat);
      headPos[i * 3] = v ? a.x : 1e6; headPos[i * 3 + 1] = a.y; headPos[i * 3 + 2] = z;
      const sp = Math.hypot(a.vx, a.vy) || 1, Lt = Math.min(14, 4 + sp * 0.06);
      segPos[k] = v ? a.x : 1e6; segPos[k + 1] = a.y; segPos[k + 2] = z;
      segPos[k + 3] = v ? a.x - (a.vx / sp) * Lt : 1e6; segPos[k + 4] = a.y - (a.vy / sp) * Lt; segPos[k + 5] = z; k += 6;
    }
    headGeo.attributes.position.needsUpdate = segGeo.attributes.position.needsUpdate = true;
    headMat.opacity = fadeA; segMat.opacity = 0.5 * fadeA;
    // camera: tilted orbit, then a crane to exactly top-down at the registered distance
    const tilt = THREE.MathUtils.degToRad(57) * (1 - flat);
    const yaw = (THREE.MathUtils.degToRad(-24) + 0.12 * Math.sin(t * 0.0006)) * (1 - flat);
    cam.position.set(look.x + Math.sin(yaw) * Math.sin(tilt) * dist, look.y - Math.cos(yaw) * Math.sin(tilt) * dist, Math.cos(tilt) * dist);
    cam.up.set(0, 1, 0); cam.lookAt(look);
    mark.style.opacity = String(Math.min(1, Math.max(0, (t - T.resolve) / 240)));
  }

  let simT = 0, raf = 0, last = 0, acc = 0, playing = false, onDone = null;
  const DT = 1000 / 60;
  function reset() {
    seed = 19; simT = 0;
    for (const c of cells) { c.lift = 0; c.sense = 0; }
    agents.forEach(a => { const c = cells[(rnd() * n) | 0]; a.x = c.x + (rnd() - 0.5) * R; a.y = c.y + (rnd() - 0.5) * R; a.vx = a.vy = 0; a.t = cells[(rnd() * n) | 0]; a.alive = true; a.dwell = 0; });
  }
  function frame(now) {
    raf = 0; if (!playing) return;
    acc += last ? Math.min(2500, now - last) : DT; last = now;
    while (acc >= DT) { simT += DT; step(simT, DT); acc -= DT; }
    apply(simT); renderer.render(scene, cam);
    if (simT >= T.end) { playing = false; const f = onDone; onDone = null; if (f) f(); return; }
    raf = requestAnimationFrame(frame);
  }
  function renderAt(t) {
    reset();
    while (simT + DT <= t) { simT += DT; step(simT, DT); }
    apply(t); renderer.render(scene, cam);
  }
  return {
    renderAt,
    play(done) { reset(); onDone = done || null; playing = true; last = 0; acc = 0; if (!raf) raf = requestAnimationFrame(frame); },
    replay(done) { this.play(done); },
    pause() { playing = false; if (raf) { cancelAnimationFrame(raf); raf = 0; } },
    resume() { if (simT < T.end && simT > 0 && !playing) { playing = true; last = 0; acc = 0; raf = requestAnimationFrame(frame); } },
    dispose() { this.pause(); renderer.dispose(); renderer.domElement.remove(); }
  };
}
