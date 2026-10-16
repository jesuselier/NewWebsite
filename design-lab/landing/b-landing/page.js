// Direction B page script. Hero drone shot (Three.js, loaded after first paint) with a Canvas 2D fallback and a
// reduced-motion still; the curve lanes; the why-now band; product mocks; plan switch and Whop placeholder.
// Query params: ?t=<ms> freezes the hero at that time, ?reduce=1 forces the reduced-motion still.
import { T, sm, createSim, draw2D, COL } from './sim.js';

const params = new URLSearchParams(location.search);
const FIXED_T = params.has('t') ? Math.max(0, +params.get('t') || 0) : null;
const REDUCE = params.get('reduce') === '1' || matchMedia('(prefers-reduced-motion: reduce)').matches;
const body = document.body;
if (REDUCE) body.classList.add('nomotion');
const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

// ---------- global motion state ----------
const motion = { paused: false, subs: new Set() };
function setPaused(p) {
  motion.paused = p; body.classList.toggle('paused', p);
  $$('[data-pause], #pauseBtn').forEach(b => { b.setAttribute('aria-pressed', String(p)); const tx = b.querySelector('.pause-text'); if (tx) tx.textContent = p ? 'Play motion' : 'Pause motion'; });
  motion.subs.forEach(fn => fn());
}
$$('[data-pause], #pauseBtn').forEach(b => b.addEventListener('click', () => setPaused(!motion.paused)));
document.addEventListener('visibilitychange', () => motion.subs.forEach(fn => fn()));
const canAnimate = () => !REDUCE && !motion.paused && !document.hidden;

// ---------- nav ----------
const nav = $('#nav');
const onScroll = () => nav.classList.toggle('solid', scrollY > 8);
addEventListener('scroll', onScroll, { passive: true }); onScroll();

// ---------- reveals ----------
if (!REDUCE && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  $$('.reveal').forEach(el => io.observe(el));
} else $$('.reveal').forEach(el => el.classList.add('in'));

// ======================================================================
// HERO
// ======================================================================
const stage = $('#heroStage'), mark = $('#heroMark'), glow = $('#heroGlow');
const cards = $$('.float-card');
const phaseWord = $('#phaseWord'), segs = [$('#seg1'), $('#seg2'), $('#seg3')];
let lockedW = 0;
function lockHeroHeight() { body.style.setProperty('--hero-h', Math.max(innerHeight, 560) + 'px'); lockedW = innerWidth; }
lockHeroHeight();

function heroGeom() {
  const W = stage.clientWidth, H = stage.clientHeight;
  const sr = stage.getBoundingClientRect(), ar = $('#coreAnchor').getBoundingClientRect();
  const cx = Math.round(ar.left + ar.width / 2 - sr.left), cy = Math.round(ar.top + ar.height / 2 - sr.top);
  const R = parseFloat(getComputedStyle(body).getPropertyValue('--R')) || 34;
  const phone = W <= 640, desk = W >= 1100;
  // the safe rect: the whole text column (chips, headline, body, CTA, watch link). No agent is drawn in it.
  const els = ['#chips', '#hero-h', '.hero-sub', '.hero .cta', '.watch'].map(s => $(s).getBoundingClientRect());
  const pad = phone ? 12 : 16;
  const safe = {
    x0: phone ? -1e4 : Math.min(...els.map(r => r.left)) - sr.left - pad, x1: phone ? 1e4 : Math.max(...els.map(r => r.right)) - sr.left + pad,
    y0: Math.min(...els.map(r => r.top)) - sr.top - pad, y1: Math.max(...els.map(r => r.bottom)) - sr.top + pad,
  };
  const keepOut = cards.filter(c => c.offsetParent).map(c => { const r = c.getBoundingClientRect(); return { x0: r.left - sr.left, x1: r.right - sr.left, y0: r.top - sr.top, y1: r.bottom - sr.top }; });
  const mask = phone ? { rx: 0.5 * W, ry: 0.42 * H, e0: 0.2 } : desk ? { rx: 0.4 * W, ry: 0.4 * W, e0: 0.12 } : { rx: 0.46 * W, ry: 0.5 * H, e0: 0.15 };
  // ~72% of agents commit, so the consensus phase carries about 80 agents on desktop and 35 on phone
  return { W, H, cx, cy, R, phone, safe, keepOut, mask, top: parseFloat(getComputedStyle(body).getPropertyValue('--nav')) || 64, N: phone ? 48 : desk ? 110 : 80 };
}

const hero = { S: null, r3: null, ctx2: null, canvas2: null, mode: null, t: 0, raf: 0, last: null, skip: false, visible: true, built: false };

function placeMark(S) {
  // the official swarm-mark.svg, registered at 7.5R on the field's core cell; CSS shows only its gold core
  const size = 7.5 * S.R;
  Object.assign(mark.style, { width: size + 'px', height: size + 'px', left: (S.cx - size / 2) + 'px', top: (S.cy - size / 2) + 'px' });
  const gr = S.phone ? 300 : 480;   // the core's soft glow: gold radial, <= 10% opacity
  Object.assign(glow.style, { width: gr * 2 + 'px', height: gr * 2 + 'px', left: (S.cx - gr) + 'px', top: (S.cy - gr) + 'px' });
}
function heroDom(t) {
  const S = hero.S;
  mark.style.opacity = String(S.markOpacity(t));
  glow.style.opacity = String(S.glow(t));
  cards.forEach(c => c.classList.toggle('on', S.resolved && t >= S.resolveT + 160));
  const ph = S.resolved ? 'Signal' : t >= T.scanEnd ? 'Consensus' : 'Scanning';
  if (phaseWord.textContent !== ph) phaseWord.textContent = ph;
  segs[0].classList.toggle('on', t >= 200); segs[1].classList.toggle('on', t >= T.scanEnd); segs[2].classList.toggle('on', S.resolved);
}
function render(t) {
  if (hero.mode === '3d') hero.r3.render(t);
  else draw2D(hero.ctx2, hero.S, t, hero.dpr2, hero.cache2);
  heroDom(t);
}
function make2D() {
  const c = document.createElement('canvas'); c.setAttribute('aria-hidden', 'true');
  const S = hero.S; hero.dpr2 = Math.min(devicePixelRatio || 1, 2);
  c.width = Math.round(S.W * hero.dpr2); c.height = Math.round(S.H * hero.dpr2);
  stage.prepend(c); hero.canvas2 = c; hero.ctx2 = c.getContext('2d'); hero.mode = '2d'; hero.cache2 = {};
}
function buildSim() {
  const g = heroGeom();
  hero.S = createSim({ ...g, seed: 7 });
  placeMark(hero.S);
}
function teardown() {
  cancelAnimationFrame(hero.raf); hero.raf = 0;
  if (hero.r3) { hero.r3.dispose(); hero.r3 = null; }
  if (hero.canvas2) { hero.canvas2.remove(); hero.canvas2 = null; }
}
const noTrans = () => [mark, glow, ...cards].forEach(el => { el.style.transition = 'none'; });
async function startHero() {
  buildSim();
  if (REDUCE) {
    make2D(); noTrans();
    hero.S.run(T.still); hero.t = T.still;
    hero.S.cells.forEach(c => { c.ping = 0; c.pulse = 0; });   // the still has no pings or pulses
    hero.cache2 = null; render(T.still);
    body.dataset.heroReady = '1';
    return;
  }
  // first paint has happened (we are called from a timeout after load); now bring in three.js
  try {
    if (params.get('gl') === '0') throw new Error('WebGL disabled by ?gl=0 (fallback test)');
    const m = await import('./hero3d.js');
    hero.r3 = m.createHero3D({ host: stage, S: hero.S, phone: hero.S.W <= 640 });
    hero.mode = '3d';
  } catch (e) {
    console.warn('3D hero unavailable, using 2D', e && e.message);
    make2D();
  }
  hero.built = true;
  if (FIXED_T !== null) {
    hero.S.run(FIXED_T); hero.t = FIXED_T; noTrans();
    render(FIXED_T); if (hero.r3) hero.r3.canvas.classList.add('on');
    body.dataset.heroReady = '1';
    return;
  }
  hero.t = 0; render(0);
  if (hero.r3) requestAnimationFrame(() => hero.r3.canvas.classList.add('on'));
  body.dataset.heroReady = '1';
  heroRun();
}
function heroFrame(now) {
  hero.raf = 0;
  if (!heroShouldRun()) { hero.last = null; return; }
  const S = hero.S;
  if (hero.last === null) hero.last = now;
  const settled = S.resolved && hero.t > S.resolveT + 900;
  if (settled) { hero.skip = !hero.skip; if (hero.skip) { hero.raf = requestAnimationFrame(heroFrame); return; } }   // ~30fps once landed
  // keep the shot on real time even when frames are slow: sub-step the simulation in <= 33ms slices
  let dt = Math.min(400, now - hero.last); hero.last = now;
  while (dt > 0) { const h = Math.min(33, dt); hero.t += h; S.step(hero.t, h); dt -= h; }
  render(hero.t);
  hero.raf = requestAnimationFrame(heroFrame);
}
const heroShouldRun = () => hero.built && FIXED_T === null && canAnimate() && hero.visible;
function heroRun() { if (heroShouldRun() && !hero.raf) { hero.last = null; hero.raf = requestAnimationFrame(heroFrame); } }
motion.subs.add(heroRun);
new IntersectionObserver(es => { hero.visible = es[0].isIntersecting; $('.hero').classList.toggle('off', !hero.visible); heroRun(); }, { threshold: 0 }).observe($('.hero'));
// rebuild on width change only (height changes come from mobile URL bars and full-page captures)
let rz = 0;
addEventListener('resize', () => {
  clearTimeout(rz);
  rz = setTimeout(async () => {
    if (Math.abs(innerWidth - lockedW) < 2 || !hero.built) return;
    lockHeroHeight(); teardown(); hero.built = false;
    buildSim();
    if (hero.mode === '3d') {
      try { const m = await import('./hero3d.js'); hero.r3 = m.createHero3D({ host: stage, S: hero.S, phone: hero.S.W <= 640 }); hero.r3.canvas.classList.add('on'); }
      catch (e) { make2D(); }
    } else make2D();
    hero.built = true; hero.S.run(T.still); hero.t = T.still; noTrans(); render(hero.t);
    requestAnimationFrame(() => { [mark, glow, ...cards].forEach(el => { el.style.transition = ''; }); heroRun(); });
  }, 220);
});
if (REDUCE) { $$('[data-pause], #pauseBtn').forEach(b => { b.hidden = true; }); }

const kick = () => setTimeout(startHero, 30);
if (document.readyState === 'complete') kick(); else addEventListener('load', kick, { once: true });

// ======================================================================
// THE CURVE: one canvas, three lanes of agents under a bell curve
// ======================================================================
(function curve() {
  const cv = $('#curveCanvas'); if (!cv) return;
  const g = cv.getContext('2d');
  let W = 0, H = 0, dpr = 1, lanes = [], t = 0, raf = 0, last = null, visible = false, drawn = 0, seed = 5;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const base = () => H - 16, curveH = () => H - 34;
  const gauss = x => Math.exp(-0.5 * ((x - W * 0.5) / (W * 0.17)) ** 2);
  const curveY = x => base() - curveH() * gauss(x);
  function lanePos(L, u, v) {
    const x = L.x0 + 10 + u * (L.x1 - L.x0 - 20);
    const top = curveY(x) + 14, bot = base() - 8;
    const room = Math.max(0, bot - top);
    return [x, bot - v * room];
  }
  function setup() {
    const box = cv.parentElement; W = box.clientWidth; H = box.clientHeight; dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    const small = W < 640;
    lanes = [0, 1, 2].map(k => ({ k, x0: (W / 3) * k, x1: (W / 3) * (k + 1), ag: [], hx: 0.8, hy: 0.35, exitT: 0 }));
    // left lane sits where the curve is still low, so give it more of its width
    // the crowd follows the distribution: thin tails, a packed middle
    lanes.forEach(L => {
      const n = L.k === 1 ? (small ? 34 : 70) : (small ? 16 : 30);
      for (let i = 0; i < n; i++) {
        const u = L.k === 0 ? 0.45 + rnd() * 0.55 : L.k === 2 ? rnd() * 0.55 : 0.04 + rnd() * 0.92;
        L.ag.push({ u, v: 0.12 + rnd() * 0.72, du: 0, dv: 0, hu: u, hv: 0, th: rnd() * 6.28, next: rnd() * 400, out: 0, outT: 0, ox: 0, oy: 0 });
      }
      L.ag.forEach(a => { a.hu = a.u; a.hv = a.v; });
    });
  }
  function step(dt) {
    const s = dt / 1000;
    // LEFT: one herd, one heading that drifts; the herd bounces as a block
    const Lh = lanes[0];
    let cu = 0, cv2 = 0; Lh.ag.forEach(a => { cu += a.u; cv2 += a.v; }); cu /= Lh.ag.length; cv2 /= Lh.ag.length;
    const turn = Math.sin(t * 0.0007) * 0.6 * s; const hx = Lh.hx * Math.cos(turn) - Lh.hy * Math.sin(turn), hy = Lh.hx * Math.sin(turn) + Lh.hy * Math.cos(turn); Lh.hx = hx; Lh.hy = hy;
    if ((cu > 0.72 && Lh.hx > 0) || (cu < 0.28 && Lh.hx < 0)) Lh.hx *= -1;
    if ((cv2 > 0.7 && Lh.hy > 0) || (cv2 < 0.25 && Lh.hy < 0)) Lh.hy *= -1;
    Lh.ag.forEach(a => {
      a.du += ((Lh.hx * 0.22 - a.du) * 3 + (cu - a.u) * 0.6 + (rnd() - 0.5) * 0.4) * s;
      a.dv += ((Lh.hy * 0.22 - a.dv) * 3 + (cv2 - a.v) * 0.6 + (rnd() - 0.5) * 0.4) * s;
      a.u = Math.min(1, Math.max(0, a.u + a.du * s)); a.v = Math.min(1, Math.max(0, a.v + a.dv * s));
    });
    // MID: twitchy, sudden turns, and some keep stepping out to the baseline early
    const Lm = lanes[1];
    Lm.ag.forEach(a => {
      a.next -= dt;
      if (a.out) {
        a.outT += dt;
        const target = a.outT < 1400 ? 0 : a.hv;
        a.v += (target - a.v) * Math.min(1, s * 5);
        if (a.outT > 2300) { a.out = 0; a.outT = 0; }
        a.th = a.outT < 1400 ? -Math.PI / 2 : Math.PI / 2;
        return;
      }
      if (a.next <= 0) {
        a.next = 140 + rnd() * 420; a.th = rnd() * Math.PI * 2;
        if (rnd() < 0.06) { a.out = 1; a.outT = 0; a.hv = 0.2 + rnd() * 0.65; }
      }
      a.du += (Math.cos(a.th) * 0.5 - a.du) * s * 9; a.dv += (Math.sin(a.th) * 0.5 - a.dv) * s * 9;
      a.u += a.du * s; a.v += a.dv * s;
      if (a.u < 0 || a.u > 1) { a.du *= -1; a.th = Math.PI - a.th; a.u = Math.min(1, Math.max(0, a.u)); }
      if (a.v < 0.1 || a.v > 1) { a.dv *= -1; a.th = -a.th; a.v = Math.min(1, Math.max(0.1, a.v)); }
    });
    // RIGHT: hold still, all facing the same way, then step out together and come back
    const Lr = lanes[2];
    const cyc = t % 7600, outK = cyc < 4600 ? 0 : cyc < 5600 ? sm(4600, 5600, cyc) : cyc < 6600 ? 1 : 1 - sm(6600, 7600, cyc);
    Lr.outK = outK;
    Lr.ag.forEach(a => { a.v = a.hv * (1 - outK) + 0.0 * outK + Math.sin(t * 0.0012 + a.th) * 0.006; a.u = a.hu + outK * 0.18; });
  }
  function draw() {
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    // lanes and baseline
    g.lineWidth = 1; g.strokeStyle = rgba(COL.line, 1);
    g.beginPath(); g.moveTo(0, base() + 0.5); g.lineTo(W, base() + 0.5); g.stroke();
    g.setLineDash([3, 5]);
    for (const x of [W / 3, (2 * W) / 3]) { g.beginPath(); g.moveTo(Math.round(x) + 0.5, base()); g.lineTo(Math.round(x) + 0.5, curveY(x) + 6); g.stroke(); }
    g.setLineDash([]);
    // the curve draws itself once
    const upto = W * drawn;
    g.strokeStyle = rgba(COL.muted, 0.9); g.lineWidth = 1.25; g.beginPath();
    for (let x = 0; x <= upto; x += 3) { const y = curveY(x); x ? g.lineTo(x, y) : g.moveTo(x, y); }
    g.stroke();
    // agents: heads with heading ticks
    const show = sm(0.15, 0.9, drawn);
    lanes.forEach(L => {
      const col = L.k === 2 ? COL.text : COL.muted;
      L.ag.forEach(a => {
        const [x, y] = lanePos(L, a.u, a.v);
        let th;
        if (L.k === 0) th = Math.atan2(-a.dv, a.du);
        else if (L.k === 1) th = a.out ? (a.outT < 1400 ? Math.PI / 2 : -Math.PI / 2) : Math.atan2(-a.dv, a.du);
        else th = (L.outK > 0.02 && L.outK < 0.98) ? Math.atan2(0.6, 0.35) : -0.62;
        const len = L.k === 1 ? 7 : 9;
        const alpha = (L.k === 1 && a.out ? 0.55 : 1) * show;
        g.globalAlpha = alpha * 0.5; g.strokeStyle = rgba(col, 1); g.lineWidth = 1;
        g.beginPath(); g.moveTo(x - Math.cos(th) * len, y - Math.sin(th) * len); g.lineTo(x, y); g.stroke();
        g.globalAlpha = alpha; g.fillStyle = rgba(col, 1); g.fillRect(x - 1.25, y - 1.25, 2.5, 2.5);
      });
    });
    g.globalAlpha = 1;
  }
  function frame(now) {
    raf = 0;
    if (!((visible || drawn < 1) && canAnimate())) { last = null; return; }
    if (last === null) last = now;
    const dt = Math.min(50, now - last); last = now; t += dt;
    drawn = Math.min(1, drawn + dt / 1200);
    step(dt); draw();
    raf = requestAnimationFrame(frame);
  }
  const run = () => { if (visible && canAnimate() && !raf) { last = null; raf = requestAnimationFrame(frame); } };
  setup();
  if (REDUCE) {
    drawn = 1; for (let i = 0; i < 90; i++) { t += 33; step(33); } draw();
  } else {
    draw();
    new IntersectionObserver(es => { visible = es[0].isIntersecting; run(); }, { threshold: 0.1 }).observe(cv);
    motion.subs.add(run);
  }
  let w0 = innerWidth; addEventListener('resize', () => { if (Math.abs(innerWidth - w0) < 2) return; w0 = innerWidth; setup(); drawn = 1; draw(); });
})();

// ======================================================================
// WHY NOW: second 3D moment, played once in view
// ======================================================================
(function band() {
  const host = $('#band'); if (!host) return;
  const la = $('#bandA'), lb = $('#bandB');
  let started = false;
  const io = new IntersectionObserver(async es => {
    if (!es[0].isIntersecting || started) return;
    started = true; io.disconnect();
    try {
      const m = await import('./band3d.js');
      const b = m.createBand({ host, labelA: la, labelB: lb });
      if (REDUCE) { b.render(m.BAND_DUR); return; }
      if (params.has('bandt')) { b.render(Math.min(m.BAND_DUR, +params.get('bandt') || 0)); return; }
      let t0 = null;
      const f = now => {
        if (t0 === null) t0 = now;
        const t = Math.min(m.BAND_DUR, now - t0);
        b.render(t);
        if (t < m.BAND_DUR) requestAnimationFrame(f);
      };
      requestAnimationFrame(f);
    } catch (e) {
      console.warn('band 3D unavailable', e && e.message);
      la.classList.add('dim'); lb.classList.remove('dim');
      la.style.transform = 'translate(25%, 40%)'; lb.style.transform = `translate(${host.clientWidth * 0.62}px, 40%)`;
    }
  }, { threshold: 0.35 });
  io.observe(host);
})();

// ======================================================================
// MOCKS
// ======================================================================
const whenSeen = (el, fn, threshold = 0.4) => {
  const io = new IntersectionObserver(es => { if (es[0].isIntersecting) { io.disconnect(); fn(); } }, { threshold });
  io.observe(el);
};
const isVisible = el => { const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; };

// 1) decision trace: six scouts, five pruned, one survivor lands as a members-only watch list update
(function trace() {
  const box = $('#trace'); if (!box) return;
  const svg = $('#traceSvg'), node = $('#traceNode'), out = $('#traceOut'), phase = $('#tracePhase');
  const tp = [$('#tp1'), $('#tp2'), $('#tp3')];
  const scouts = $$('.scout', box);
  const STATES = ['Scanning', 'Watching', 'Syncing', 'Scanning', 'Idle', 'Watching'];
  // what the surviving scout lands on: a members-only watch list update (illustrative, words from the video)
  const OUTS = { 2: ['Project 03', 'Real revenue'], 4: ['Project 05', 'Real users'], 0: ['Project 01', 'Attention moving in'], 5: ['Project 06', 'Real revenue, real users'] };
  const outName = $('#traceOutName'), outWhy = $('#traceOutWhy');
  const setOut = () => { const o = OUTS[survivor] || OUTS[2]; outName.textContent = o[0]; outWhy.textContent = o[1]; };
  // hex spinners: six dots on hex vertices
  scouts.forEach(s => {
    const sp = s.querySelector('.spin');
    sp.innerHTML = [0, 1, 2, 3, 4, 5].map(k => { const a = Math.PI / 180 * (60 * k - 90); return `<circle cx="${(6 + 4.6 * Math.cos(a)).toFixed(2)}" cy="${(6.5 + 4.6 * Math.sin(a)).toFixed(2)}" r="1.2"/>`; }).join('');
  });
  let spinK = 0, spinTimer = 0, cycle = 0, survivor = 2, timers = [];
  const ns = 'http://www.w3.org/2000/svg';
  function layout() {
    const b = box.getBoundingClientRect();
    const nx = b.width * (b.width < 400 ? 0.53 : 0.555), ny = b.height / 2;
    node.style.left = (nx - 7) + 'px'; node.style.top = (ny - 8) + 'px';
    out.style.top = (ny - out.offsetHeight / 2) + 'px';
    svg.setAttribute('viewBox', `0 0 ${b.width} ${b.height}`);
    svg.innerHTML = '';
    scouts.forEach((s, i) => {
      const r = s.getBoundingClientRect();
      const x0 = r.right - b.left, y0 = r.top + r.height / 2 - b.top;
      const p = document.createElementNS(ns, 'path');
      const dx = nx - x0;
      p.setAttribute('d', `M${x0},${y0} C${x0 + dx * 0.55},${y0} ${nx - dx * 0.45},${ny} ${nx - 8},${ny}`);
      p.setAttribute('pathLength', '1'); p.setAttribute('fill', 'none'); p.setAttribute('stroke', '#55555B'); p.setAttribute('stroke-width', '1');
      p.style.strokeDasharray = '1'; p.style.strokeDashoffset = '1';
      p.style.transition = 'stroke-dashoffset .7s cubic-bezier(.2,.7,.2,1), stroke .3s';
      p.dataset.i = i; svg.appendChild(p);
    });
    const ob = out.getBoundingClientRect();
    const c = document.createElementNS(ns, 'path');
    c.setAttribute('d', `M${nx + 8},${ny} L${ob.left - b.left},${ny}`);
    c.setAttribute('pathLength', '1'); c.setAttribute('fill', 'none'); c.setAttribute('stroke', '#8E8A80'); c.setAttribute('stroke-width', '1');
    c.style.strokeDasharray = '1'; c.style.strokeDashoffset = '1'; c.style.transition = 'stroke-dashoffset .4s cubic-bezier(.2,.7,.2,1)';
    c.id = 'traceCont'; svg.appendChild(c);
  }
  function setPhase(k) { phase.textContent = ['Scanning', 'Consensus', 'Signal'][k]; tp.forEach((s, i) => s.classList.toggle('on', i <= k)); }
  function spin(on) {
    clearInterval(spinTimer);
    if (!on) return;
    spinTimer = setInterval(() => {
      if (!canAnimate()) return;
      spinK = (spinK + 1) % 6;
      scouts.forEach((s, i) => { if (s.classList.contains('pruned')) return; s.querySelectorAll('circle').forEach((c, k) => c.classList.toggle('on', k === (spinK + i) % 6)); });
    }, 80);
  }
  function finalState() {
    const paths = $$('path', svg);
    paths.forEach(p => { p.style.transition = 'none'; p.style.strokeDashoffset = '0'; if (p.dataset.i !== undefined && +p.dataset.i !== survivor) p.setAttribute('stroke', '#232328'); if (+p.dataset.i === survivor) p.setAttribute('stroke', '#8E8A80'); });
    scouts.forEach((s, i) => { s.classList.toggle('pruned', i !== survivor); s.querySelector('.st').textContent = i === survivor ? 'Flagged for review' : 'Idle'; });
    node.style.color = '#EEEBE4'; setOut(); out.classList.add('on'); setPhase(2);
  }
  function play() {
    timers.forEach(clearTimeout); timers = [];
    const paths = $$('path', svg);
    const branch = paths.filter(p => p.dataset.i !== undefined), cont = $('#traceCont');
    branch.forEach(p => { p.style.transition = 'none'; p.style.strokeDashoffset = '1'; p.setAttribute('stroke', '#55555B'); });
    cont.style.transition = 'none'; cont.style.strokeDashoffset = '1';
    out.classList.remove('on'); node.style.color = '#55555B';
    scouts.forEach((s, i) => { s.classList.remove('pruned'); s.querySelector('.st').textContent = STATES[(i + cycle) % STATES.length]; });
    setPhase(0); spin(true);
    void svg.getBoundingClientRect();
    branch.forEach((p, i) => { p.style.transition = 'stroke-dashoffset .7s cubic-bezier(.2,.7,.2,1), stroke .3s'; timers.push(setTimeout(() => { p.style.strokeDashoffset = '0'; }, i * 120)); });
    timers.push(setTimeout(() => setPhase(1), 900));
    timers.push(setTimeout(() => {
      branch.forEach(p => { if (+p.dataset.i !== survivor) p.setAttribute('stroke', '#232328'); else p.setAttribute('stroke', '#8E8A80'); });
      scouts.forEach((s, i) => { if (i !== survivor) { s.classList.add('pruned'); s.querySelector('.st').textContent = 'Idle'; } else s.querySelector('.st').textContent = 'Flagged for review'; });
      node.style.color = '#EEEBE4';
    }, 1400));
    timers.push(setTimeout(() => { cont.style.transition = 'stroke-dashoffset .4s cubic-bezier(.2,.7,.2,1)'; cont.style.strokeDashoffset = '0'; }, 1450));
    timers.push(setTimeout(() => { setOut(); out.classList.add('on'); setPhase(2); spin(false); }, 1800));
    // replay a few times with a different survivor while visible and not paused
    timers.push(setTimeout(() => { if (cycle < 3 && canAnimate() && isVisible(box)) { cycle++; survivor = [4, 0, 5][cycle - 1]; play(); } }, 8200));
  }
  layout();
  if (REDUCE) { finalState(); return; }
  whenSeen($('#traceMock'), play);
  let w0 = innerWidth; addEventListener('resize', () => { if (Math.abs(innerWidth - w0) < 2) return; w0 = innerWidth; layout(); finalState(); });
})();

// 2) watch list: one state change every 3.5s, paused on hover or focus, stops after 3 steps.
// The HTML holds the settled state (used as is under reduced motion); the script starts one step earlier.
(function watchlist() {
  const m = $('#wlMock'); if (!m) return;
  const rows = $$('.wl-row:not(.hd)', m);
  if (REDUCE) return;
  // the story plays only while someone is actually looking: row 05 starts as a plain watch, then the left curve
  // bet gets removed. If the visitor scrolls on first, the list simply stays in its settled state.
  const r5 = rows[4], c5 = r5.querySelector('.chip'), w5 = r5.querySelector('.why');
  const steps = [
    () => { c5.className = 'chip watching'; c5.textContent = 'Watching'; w5.textContent = 'Left curve bet'; focus(4); },
    () => { c5.classList.add('fade'); setTimeout(() => { c5.className = 'chip removed'; c5.textContent = 'Removed'; w5.textContent = 'Left curve bet, removed'; }, 200); },
    () => focus(2),
  ];
  let n = 0, hold = false;
  function focus(i) { rows.forEach(r => r.classList.remove('focus')); rows[i].classList.add('focus'); }
  m.addEventListener('pointerenter', () => hold = true); m.addEventListener('pointerleave', () => hold = false);
  m.addEventListener('focusin', () => hold = true); m.addEventListener('focusout', () => hold = false);
  function tick() {
    if (n >= steps.length) return;
    if (n === 0 && !(canAnimate() && isVisible(m) && !hold)) { setTimeout(tick, 1000); return; }
    if (n === 1 || (!hold && canAnimate() && isVisible(m))) steps[n++]();   // once started, the removal always completes
    setTimeout(tick, n === 1 ? 1800 : 3500);
  }
  whenSeen(m, () => { setTimeout(tick, 900); }, 0.6);
})();

// 3) live call: audio bars
(function eq() {
  const e = $('#eq'); if (!e) return;
  let s = 3; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  e.innerHTML = Array.from({ length: 22 }, () => `<i style="animation-duration:${(0.55 + r() * 0.9).toFixed(2)}s;animation-delay:-${(r() * 1.2).toFixed(2)}s;height:${(18 + r() * 30).toFixed(0)}%"></i>`).join('');
  if (REDUCE) return;
  new IntersectionObserver(es => e.classList.toggle('run', es[0].isIntersecting), { threshold: 0 }).observe(e);
})();

// 4) trader room: posts arrive one at a time, then it stops. Topics are illustrative, in the video's words.
(function room() {
  const box = $('#msgs'), typing = $('#typing'); if (!box) return;
  const POSTS = [
    ['Trader · 3 cycles', 'How I see the market right now'],
    ['Trader · multi-cycle', 'Where the attention is moving'],
    ['Trader · 3 cycles', "What I'd skip if this were my first cycle"],
    ['Trader · multi-cycle', 'Real revenue, real users: what I check first'],
    ['Trader · 3 cycles', 'When I get out, and why'],
  ];
  let k = 0;
  function msg(enter) {
    const [tag, line] = POSTS[k++ % POSTS.length];
    const el = document.createElement('div'); el.className = 'msg' + (enter ? ' enter' : '');
    el.innerHTML = `<svg viewBox="0 0 20 22" aria-hidden="true" style="color:#55555B"><use href="#hx"/></svg><div><div class="mwho"><span class="t">${tag}</span></div><p class="mline">${line}</p></div>`;
    box.appendChild(el);
    while (box.children.length > 4) box.firstElementChild.remove();
    if (enter) requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove('enter')));
  }
  msg(false); msg(false); msg(false);
  if (REDUCE) { typing.style.visibility = 'hidden'; return; }
  let added = 0;
  function next() {
    if (added >= 2) { typing.classList.remove('run'); typing.style.visibility = 'hidden'; return; }
    if (!canAnimate() || !isVisible(box)) { setTimeout(next, 1000); return; }
    typing.classList.add('run');
    setTimeout(() => { msg(true); added++; setTimeout(next, 2400); }, 1300);
  }
  whenSeen($('#roomMock'), () => setTimeout(next, 900));
})();

// card tilt toward the pointer (desktop, max 4 degrees)
if (FINE && !REDUCE) {
  $$('[data-tilt]').forEach(card => {
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `rotateX(${(-y * 4).toFixed(2)}deg) rotateY(${(x * 4).toFixed(2)}deg)`;
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  });
}

// ======================================================================
// PRICING: plan switch + Whop checkout slot
// ======================================================================
// Swap in the three Whop plan IDs (prefixed plan_) when Jesus has them: one line per plan.
const PLANS = {
  founding: { name: 'Founding monthly', amt: '$49', unit: '/mo', seats: '50 seats only', note: 'Forever. Cancel whenever. 50 seats only.', sub: 'Renews at $49.00 per month.', gold: true, whopPlanId: null },
  standard: { name: 'Standard monthly', amt: '$99', unit: '/mo', seats: 'Monthly', note: 'The price once the founding seats are gone.', sub: 'Renews at $99 per month. Cancel anytime.', gold: false, whopPlanId: null },
  yearly: { name: 'Yearly', amt: '$990', unit: '/yr', seats: '2 months free', note: '2 months free.', sub: 'Twelve months of Standard for the price of ten.', gold: false, whopPlanId: null },
};
let currentPlan = 'founding';
function showPlan(key) {
  const p = PLANS[key]; currentPlan = key;
  $('#planName').textContent = p.name; $('#planSeats').textContent = p.seats;
  const amt = $('#planAmt'); amt.textContent = p.amt; amt.classList.toggle('gold', p.gold);
  $('#planUnit').textContent = p.unit; $('#planNote').textContent = p.note; $('#planSub').textContent = p.sub;
  $('#coPlan').textContent = 'Checkout · ' + p.name;
  $$('#planSwitch [role="radio"]').forEach(b => { const on = b.dataset.plan === key; b.setAttribute('aria-checked', String(on)); b.tabIndex = on ? 0 : -1; });
}
// Production: load https://cdn.whop.com/elements/amber/elements.js, then
//   window.WhopElements({ appearance }).checkout.create({ plan: PLANS[key].whopPlanId, returnUrl }).create('checkout').mount('#checkout')
// Each mount mints a session, so mount on the Join click only, and destroy + remount when the plan changes.
function mountCheckout(planKey) {
  const p = PLANS[planKey], slot = $('#checkout');
  if (p.whopPlanId) { /* real Whop Elements mount goes here */ return; }
  slot.classList.add('armed');
  $('#coState').textContent = `Would mount Whop checkout for ${p.name} · plan ID needed`;
  slot.scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth', block: 'center' });
  slot.focus({ preventScroll: true });
}
const sw = $('#planSwitch');
sw.addEventListener('click', e => { const b = e.target.closest('[role="radio"]'); if (b) showPlan(b.dataset.plan); });
sw.addEventListener('keydown', e => {
  const keys = Object.keys(PLANS); let i = keys.indexOf(currentPlan);
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') i = (i + 1) % keys.length; else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') i = (i + keys.length - 1) % keys.length; else return;
  e.preventDefault(); showPlan(keys[i]); sw.querySelector(`[data-plan="${keys[i]}"]`).focus();
});
$('#joinBtn').addEventListener('click', () => mountCheckout(currentPlan));
// links from other CTAs keep the founding plan preselected
$$('a[href="#join"]').forEach(a => a.addEventListener('click', () => showPlan('founding')));

// ======================================================================
// FINAL CTA field: a calm honeycomb fading toward the edges (no lit cell here)
// ======================================================================
(function finalField() {
  const cv = $('#finalField'); if (!cv) return;
  function draw() {
    const box = cv.parentElement; const W = box.clientWidth, H = box.clientHeight, dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    const R = W < 640 ? 22 : 34, P = 1.95 * R, cx = W / 2, cy = H * 0.46;
    const maxD = Math.hypot(W / 2, H * 0.6);
    for (let r = -14; r <= 14; r++) for (let q = -24; q <= 24; q++) {
      const x = cx + P * (q + r / 2), y = cy + P * (Math.sqrt(3) / 2) * r;
      if (x < -P || x > W + P || y < -P || y > H + P) continue;
      const d = Math.hypot((x - cx) * 0.8, y - cy);
      const a = (1 - sm(0.1 * maxD, 0.85 * maxD, d)) * sm(0, H * 0.3, y) * (1 - sm(H * 0.82, H, y)); if (a < 0.02) continue;
      g.beginPath();
      for (let k = 0; k < 6; k++) { const an = Math.PI / 180 * (60 * k - 90); const px = x + R * 0.97 * Math.cos(an), py = y + R * 0.97 * Math.sin(an); k ? g.lineTo(px, py) : g.moveTo(px, py); }
      g.closePath();
      g.globalAlpha = a; g.strokeStyle = '#1C1C21'; g.lineWidth = 1; g.stroke();   // kit field: unfilled outlines only
    }
    g.globalAlpha = 1;
  }
  whenSeen(cv.parentElement, draw, 0);
  let w0 = innerWidth; addEventListener('resize', () => { if (Math.abs(innerWidth - w0) < 2) return; w0 = innerWidth; draw(); });
})();
