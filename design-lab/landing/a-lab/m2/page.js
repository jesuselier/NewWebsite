/* Swarm A, Core Glow: page controller.
   Motion toggle, nav state, the four product mocks (each plays once and settles inside about 5s), the Custom AI
   tools scout field (a 2D model rendered by tools3d.js in Three.js, or drawn flat as a still), the why-now strip,
   the pricing core, the final field, and the pricing switch with the Whop checkout stub.
   Every agent here uses the same language as the hero: hexagonal nodes hopping along the honeycomb's edges. */
(() => {
  'use strict';
  const S = window.SWARM || { reduce: false, freeze: null };
  const SL = window.SwarmLattice;
  const root = document.documentElement;
  const STATIC = S.reduce || S.freeze != null;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const later = (ms, f) => setTimeout(f, ms);
  const DPR = () => Math.min(window.devicePixelRatio || 1, 2);

  /* ---------- motion toggle (WCAG 2.2.2, for the looping crowd) ---------- */
  let motionOff = false;
  const toggles = $$('[data-motion-toggle]');
  function setMotion(off) {
    motionOff = off;
    root.classList.toggle('motion-off', off);
    toggles.forEach(b => { b.setAttribute('aria-pressed', String(off)); const l = b.querySelector('.ml'); if (l) l.textContent = off ? 'Play motion' : 'Pause motion'; });
    window.dispatchEvent(new CustomEvent('swarm:motion', { detail: { off } }));
  }
  toggles.forEach(b => b.addEventListener('click', () => setMotion(!motionOff)));

  /* ---------- nav ---------- */
  const nav = $('#nav');
  const onScroll = () => { if (nav) nav.classList.toggle('scrolled', window.scrollY > 8); };
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- the gold Join Swarm ring: pure CSS motion; offscreen buttons are paused ---------- */
  if ('IntersectionObserver' in window && !S.reduce) {
    const ringIO = new IntersectionObserver(es => { for (const e of es) e.target.classList.toggle('ring-off', !e.isIntersecting); }, { rootMargin: '80px 0px' });
    $$('.btn-gold').forEach(b => ringIO.observe(b));
  }

  // frame-accurate captures (?t= with window.__heroSeek): the frozen ring lights move with the seek time
  if (S.freeze != null && !S.reduce && typeof window.__heroSeek === 'function' && document.getAnimations) {
    const heroSeek = window.__heroSeek;
    window.__heroSeek = t => {
      const r = heroSeek(t);
      document.getAnimations().forEach(a => { if (a.animationName && a.animationName.indexOf('ring-') === 0) { a.pause(); a.currentTime = t; } });
      return r;
    };
  }

  /* ---------- play-once helper ---------- */
  function once(el, fn, threshold = 0.4) {
    if (!el) return;
    if (STATIC || !('IntersectionObserver' in window)) { fn(true); return; }
    const io = new IntersectionObserver(es => { for (const e of es) if (e.isIntersecting) { io.disconnect(); fn(motionOff); } }, { threshold });
    io.observe(el);
  }

  /* ---------- redacted words: members-only content as word-shaped bars ---------- */
  $$('.w[data-w]').forEach(el => {
    el.setAttribute('aria-hidden', 'true');
    for (const n of el.dataset.w.split(/\s+/)) { const i = document.createElement('i'); i.style.width = (+n) + 'px'; el.appendChild(i); }
  });

  /* ---------- six-dot hex spinners ---------- */
  $$('.spin').forEach(sp => {
    for (let k = 0; k < 6; k++) {
      const i = document.createElement('i');
      const a = Math.PI / 180 * (60 * k - 90);
      i.style.left = (6 + Math.cos(a) * 5.5).toFixed(2) + 'px';
      i.style.top = (6 + Math.sin(a) * 5.5).toFixed(2) + 'px';
      sp.appendChild(i);
    }
  });
  const setSpin = (sp, idx) => sp && sp.querySelectorAll('i').forEach((d, k) => d.classList.toggle('on', k === idx));

  /* ---------- agent console ---------- */
  const conRows = $$('#console .crow'), conSegs = $$('#console .con-seg i'), conLog = $('#con-log');
  // three states only: SCANNING, ANALYZING, REPORTING; the console ends with all three on screen
  const conInit = [['SCANNING', 'Scanning', 'the market'], ['SCANNING', 'Scanning', 'the watch list'], ['ANALYZING', 'Analyzing', 'a setup'], ['SCANNING', 'Scanning', 'for what changed']];
  const conSteps = [
    [900, 0, 'ANALYZING', 'Analyzing', 'what changed this week'],
    [1900, 3, 'ANALYZING', 'Analyzing', 'where attention is moving'],
    [2900, 1, 'SCANNING', 'Scanning', 'the market'],
    [3900, 2, 'REPORTING', 'Reporting', 'to the watch list']
  ];
  const logSteps = [
    [500, 'S02', 'Scanning', 'the watch list'],
    [900, 'S01', 'Analyzing', 'what changed this week'],
    [1900, 'S04', 'Analyzing', 'where attention is moving'],
    [2900, 'S02', 'Scanning', 'the market'],
    [3900, 'S03', 'Reporting', 'to the watch list']
  ];
  const stateLabel = st => st.charAt(0) + st.slice(1).toLowerCase();
  function applyCon(st, fade) {
    const [, i, state, verb, obj] = st, r = conRows[i]; if (!r) return;
    const set = () => {
      r.dataset.state = state; r.querySelector('.cst').textContent = stateLabel(state);
      r.querySelector('.cverb').textContent = verb; r.querySelector('.cobj').textContent = obj; r.classList.remove('swap');
      conRows.forEach(x => x.classList.toggle('hot', x === r));
      const lab = $(`.slabel[data-s="${i}"]`); $$('.slabel').forEach(l => l.classList.toggle('hot', l === lab && state === 'REPORTING'));
    };
    if (fade) { r.classList.add('swap'); later(200, set); } else set();
  }
  function pushLog(id, st, tx, anim) {
    if (!conLog) return;
    const li = document.createElement('li');
    li.innerHTML = `<span class="lid"></span><span class="lbody"><span class="lst"></span> <span class="ltx"></span></span>`;
    li.querySelector('.lid').textContent = id; li.querySelector('.lst').textContent = st; li.querySelector('.ltx').textContent = tx;
    if (anim) li.classList.add('enter');
    conLog.prepend(li);
    while (conLog.children.length > 5) conLog.lastElementChild.remove();
    if (anim) requestAnimationFrame(() => requestAnimationFrame(() => li.classList.remove('enter')));
  }
  function settleSpinners() { conRows.forEach(r => { const sp = r.querySelector('.spin'); setSpin(sp, -1); sp.classList.add('done'); }); }
  function setSeg(n) { conSegs.forEach((s, i) => s.classList.toggle('on', i < n)); }
  function playConsole(final) {
    if (final) { conSteps.forEach(s => applyCon(s, false)); logSteps.forEach(s => pushLog(s[1], s[2], s[3], false)); setSeg(3); settleSpinners(); conRows.forEach(r => r.classList.remove('hot')); return; }
    let k = 0;
    conRows.forEach(r => r.querySelector('.spin').classList.remove('done'));
    const iv = setInterval(() => { k = (k + 1) % 6; conRows.forEach((r, j) => setSpin(r.querySelector('.spin'), (k + j * 2) % 6)); }, 80);
    conSteps.forEach(s => later(s[0], () => applyCon(s, true)));
    logSteps.forEach(s => later(s[0], () => pushLog(s[1], s[2], s[3], true)));
    later(1200, () => setSeg(2)); later(3000, () => setSeg(3));
    later(4900, () => { clearInterval(iv); settleSpinners(); conRows.forEach(r => r.classList.remove('hot')); });
  }
  setSeg(1); settleSpinners();

  /* ---------- watch list: three state changes, then it rests ---------- */
  const wlRows = $$('#watch-mock .wl-row');
  function wlSet(i, text, cls) {
    const r = wlRows[i]; if (!r) return;
    const c = r.querySelector('.wchip'); c.textContent = text; c.className = 'wchip' + (cls ? ' ' + cls : '');
    r.classList.toggle('rem', cls === 'gone');
  }
  const wlSteps = [
    [1200, () => wlSet(1, 'New this week', 'new')],
    [2500, () => wlSet(4, 'Removed', 'gone')],
    [3800, () => wlSet(2, 'New this week', 'new')]
  ];
  function playWatch(final) {
    if (final) { wlSteps.forEach(s => s[1]()); return; }
    wlSteps.forEach(([ms, f]) => later(ms, () => {
      const box = $('#watch-mock');
      box.querySelectorAll('.wchip').forEach(c => c.style.opacity = '0.25');
      later(200, () => { f(); box.querySelectorAll('.wchip').forEach(c => c.style.opacity = ''); });
    }));
  }

  /* ---------- live call: the audio strip talks for a few seconds, the review moves down the list ---------- */
  const bars = $$('#calls-mock .bars i'), csRows = $$('#calls-mock .cs-row');
  const restH = [30, 46, 62, 40, 74, 58, 36, 66, 82, 52, 38, 60, 44, 70, 50, 34, 56, 40, 64, 48, 32, 54];
  const restBars = () => bars.forEach((b, i) => b.style.height = restH[i % restH.length] + '%');
  const csOn = i => csRows.forEach((r, j) => r.classList.toggle('on', j === i));
  function playCall(final) {
    if (final) { restBars(); csOn(2); return; }
    const r = SL.rng(11);
    const iv = setInterval(() => bars.forEach((b, i) => { const env = 0.35 + 0.65 * Math.abs(Math.sin(i * 0.7)); b.style.height = Math.round(18 + r() * 82 * env) + '%'; }), 110);
    later(1700, () => csOn(2));
    later(4500, () => { clearInterval(iv); restBars(); });
  }
  restBars(); csOn(1);

  /* ---------- trader room ---------- */
  const msgs = $$('#room-mock .msg'), typing = $('#room-mock .typing');
  function playRoom(final) {
    if (final) { msgs.forEach(m => m.classList.remove('pending')); return; }
    msgs.forEach((m, i) => later(300 + i * 900, () => m.classList.remove('pending')));
  }
  if (!STATIC) msgs.forEach(m => m.classList.add('pending'));
  if (typing && !STATIC) later(9000, () => root.classList.add('settled'));

  /* ---------- Custom AI tools: a scout field (2D model), rendered in 3D by tools3d.js or drawn flat ---------- */
  const toolsHost = $('#tools-3d'), still = $('#tools-still'), replay = $('#tools-replay');
  const labels = $$('.slabel'), leads = $$('#tools-lead path');
  function toolsModel() {
    const W = toolsHost.clientWidth, H = toolsHost.clientHeight, phone = window.innerWidth <= 640;
    const R = phone ? 14 : 16, P = 1.95 * R;
    const L = SL.lattice({ R, ox: 0, oy: 0, x0: -W * 0.62 - P, x1: W * 0.62 + P, y0: -H * 0.62 - P, y1: H * 0.62 + P });
    const maxD = Math.hypot(W / 2, H / 2);
    const T = { stop: 4300, end: 5300, tilt: 3900 };
    let rnd, sim, walk;
    function reset() {
      rnd = SL.rng(19);
      sim = SL.sim(L, 29, 650);
      walk = L.V.map(v => Math.abs(v.x) < W / 2 - 14 && Math.abs(v.y) < H / 2 - 14);
      for (const c of L.cells) c.ping = -1e9;
      const n = phone ? 22 : 34;
      // the four tracked scouts start one per quadrant, away from the edges
      const quad = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
      const pool = L.V.map((v, i) => i).filter(i => walk[i] && Math.abs(L.V[i].x) < W * 0.36 && Math.abs(L.V[i].y) < H * 0.34);
      const used = new Set();
      for (let k = 0; k < n; k++) {
        let id = pool[(rnd() * pool.length) | 0];
        if (k < 4) { const [sx, sy] = quad[k]; const c = pool.filter(i => Math.sign(L.V[i].x) === sx && Math.sign(L.V[i].y) === sy && Math.abs(L.V[i].x) > W * 0.1 && Math.abs(L.V[i].y) > H * 0.1); id = c[(rnd() * c.length) | 0]; }
        for (let tries = 0; tries < 20 && used.has(id); tries++) id = pool[(rnd() * pool.length) | 0];
        used.add(id);
        const a = sim.add(id, { kind: k < 4 || rnd() < 0.45 ? 1 : 0, born: 100 + rnd() * 500 });
        const nb = L.V[id].nb.filter(j => walk[j]);
        sim.hop(a, nb[(rnd() * nb.length) | 0], a.born + 80 + rnd() * 300, 200 + rnd() * 80);
      }
    }
    function policy(a, at) {
      if (at > T.stop) return;                                     // rest where it is
      const v = L.V[a.from];
      if (rnd() < 0.42) { const cs = v.cells.filter(c => at - c.ping > 900); if (cs.length) cs[(rnd() * cs.length) | 0].ping = at; }
      const opts = v.nb.filter(j => j !== a.prev && walk[j]);
      if (!opts.length) return;
      sim.hop(a, opts[(rnd() * opts.length) | 0], at + 60 + rnd() * 280, 190 + rnd() * 90);
    }
    reset();
    const M = { W, H, R, P, L, T, maxD, phone, get sim() { return sim; }, reset, advance: t => sim.advance(t, policy),
      fade: c => Math.max(0.18, 1 - SL.sm(0.45 * maxD, 1.02 * maxD, c.d)) };
    return M;
  }
  // labels ride their scouts: positions arrive in host pixels
  function placeLabels(pts) {
    labels.forEach((lab, i) => {
      const p = pts[i]; if (!p) return;
      const dx = p[0] > (toolsHost.clientWidth * 0.5) ? -54 : 16, dy = -30;
      lab.style.transform = `translate(${(p[0] + dx).toFixed(1)}px, ${(p[1] + dy).toFixed(1)}px)`;
      lab.classList.add('on');
      const lx = p[0] + dx + (dx < 0 ? 38 : 0), ly = p[1] + dy + 21;
      if (leads[i]) leads[i].setAttribute('d', `M${p[0].toFixed(1)} ${p[1].toFixed(1)} L${lx.toFixed(1)} ${ly.toFixed(1)}`);
    });
  }
  function drawToolsStill(M, fieldOnly) {
    const W = M.W, H = M.H, d = DPR();
    still.width = Math.round(W * d); still.height = Math.round(H * d); still.style.display = 'block';
    const g = still.getContext('2d'); g.setTransform(d, 0, 0, d, W / 2 * d, H / 2 * d); g.clearRect(-W, -H, 2 * W, 2 * H);
    SL.drawField(g, M.L, c => M.fade(c), {});
    if (fieldOnly) return;
    M.reset(); for (let t = 0; t <= M.T.end; t += 1000 / 60) M.advance(t);
    const tracked = new Set(M.sim.agents.slice(0, 4).map(a => M.L.V[a.from].cells[0]));
    SL.drawField(g, M.L, c => tracked.has(c) ? 1 : 0, { color: SL.COL.line, lw: 1.5 });
    SL.drawAgents(g, M.sim, M.T.end, { r: M.phone ? 2.6 : 3 });
    placeLabels(M.sim.agents.slice(0, 4).map(a => [a.x + W / 2, a.y + H / 2]));
  }
  let toolsScene = null, toolsVisible = false, toolsPlayed = false, toolsM = null;
  function startTools() {
    if (!toolsHost || !SL) return;
    toolsM = toolsModel();
    if (STATIC) { drawToolsStill(toolsM); playConsole(true); return; }
    drawToolsStill(toolsM, true);
    let loading = false;
    const loadIO = new IntersectionObserver(es => {
      if (!es.some(e => e.isIntersecting) || loading) return;
      loading = true; loadIO.disconnect();
      let ok = false;
      try { const c = document.createElement('canvas'); ok = !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { ok = false; }
      if (!ok) { drawToolsStill(toolsM); playConsole(true); return; }
      import('./tools3d.js').then(m => {
        toolsScene = m.createTools(toolsHost, toolsM, placeLabels);
        if (!toolsScene) throw new Error('no scene');
        still.style.display = 'none';
        toolsScene.renderAt(0);
        if (toolsVisible) playTools();
      }).catch(() => { drawToolsStill(toolsM); playConsole(true); });
    }, { rootMargin: '400px 0px' });
    loadIO.observe(toolsHost);
    new IntersectionObserver(es => {
      for (const e of es) {
        toolsVisible = e.isIntersecting;
        if (toolsScene) { if (toolsVisible) playTools(); else toolsScene.pause(); }
      }
    }, { threshold: 0.4 }).observe(toolsHost);
  }
  function playTools() {
    if (!toolsScene) return;
    if (!toolsPlayed) {
      toolsPlayed = true;
      if (motionOff) { toolsScene.renderAt(toolsM.T.end); playConsole(true); replay.hidden = false; return; }
      playConsole(false);
      toolsScene.play(() => { replay.hidden = false; });
    } else toolsScene.resume();
  }
  if (replay) replay.addEventListener('click', () => {
    if (!toolsScene) return;
    replay.hidden = true;
    conRows.forEach((r, i) => applyCon([0, i, ...conInit[i]], false));
    playConsole(false);
    toolsScene.replay(() => { replay.hidden = false; });
  });
  startTools();
  // rotation or resize: rebuild the scout field at the new size and show its settled frame
  let toolsW = toolsHost ? toolsHost.clientWidth : 0, toolsRT = 0;
  window.addEventListener('resize', () => {
    clearTimeout(toolsRT);
    toolsRT = setTimeout(() => {
      if (!toolsHost || toolsHost.clientWidth === toolsW) return;
      toolsW = toolsHost.clientWidth;
      toolsM = toolsModel();
      if (toolsScene) {
        toolsScene.dispose();
        import('./tools3d.js').then(m => { toolsScene = m.createTools(toolsHost, toolsM, placeLabels); if (toolsScene) toolsScene.renderAt(toolsM.T.end); else drawToolsStill(toolsM); });
      } else drawToolsStill(toolsM, !STATIC && !toolsPlayed);
    }, 200);
  });
  once($('#watch-mock'), playWatch);
  once($('#calls-mock'), playCall);
  once($('#room-mock'), playRoom);

  /* ---------- shared: a small lattice animation that plays once when seen, then settles ---------- */
  function lattice2D(cv, opts) {
    const g = cv.getContext('2d'); if (!g) return null;
    let W, H, d, L, sim, rnd, extra, t0 = null, raf = 0, played = false;
    function setup() {
      d = DPR(); W = cv.parentElement.clientWidth; H = opts.height ? opts.height(W) : cv.parentElement.clientHeight;
      cv.width = Math.round(W * d); cv.height = Math.round(H * d); cv.style.width = W + 'px'; cv.style.height = H + 'px';
      extra = opts.setup(W, H);
      L = extra.L; rnd = SL.rng(opts.seed || 5); sim = SL.sim(L, (opts.seed || 5) + 7, 600);
      opts.spawn(sim, rnd, extra);
    }
    function draw(t) {
      g.setTransform(d, 0, 0, d, 0, 0); g.clearRect(0, 0, W, H);
      opts.draw(g, t, sim, extra, W, H);
    }
    function run(t) { sim.advance(t, (a, at) => opts.policy(a, at, sim, rnd, extra)); }
    function settleAt(T) { setup(); for (let t = 0; t <= T; t += 1000 / 60) run(t); draw(T); }
    function play() {
      played = true;
      const T = opts.end;
      let simT = 0;
      const loop = now => {
        raf = 0;
        if (t0 === null) t0 = now;
        const target = Math.min(T, now - t0);
        while (simT + 1000 / 60 <= target) { simT += 1000 / 60; run(simT); }
        draw(simT);
        if (simT < T - 1000 / 60) raf = requestAnimationFrame(loop);
        else if (opts.done) opts.done();
      };
      raf = requestAnimationFrame(loop);
    }
    setup();
    if (STATIC) { settleAt(opts.end); if (opts.done) opts.done(); }
    else { draw(0); once(cv.parentElement, final => { if (final) { settleAt(opts.end); if (opts.done) opts.done(); } else play(); }, opts.threshold || 0.45); }
    let lw = W;
    window.addEventListener('resize', () => { const w = cv.parentElement.clientWidth; if (w !== lw) { lw = w; if (raf) cancelAnimationFrame(raf); raf = 0; settleAt(opts.end); } });
    return { settleAt };
  }
  const pick = (arr, rnd) => arr[(rnd() * arr.length) | 0];

  /* ---------- why now: the crowd's attention moves from the games basin to the AI basin ---------- */
  (function attention() {
    const box = $('#attn'); if (!box || !SL) return;
    const cv = box.querySelector('canvas');
    lattice2D(cv, {
      seed: 5, end: 5400, threshold: 0.5,
      setup(W, H) {
        const phone = W < 600, R = phone ? 11 : 18, P = 1.95 * R;
        const A = { x: W * (phone ? 0.25 : 0.24), y: H * 0.42 }, B = { x: W * (phone ? 0.75 : 0.76), y: H * 0.42 };
        const L = SL.lattice({ R, ox: W / 2, oy: H * 0.42, x0: -P, x1: W + P, y0: -P, y1: H + P });
        const rad = (phone ? 3.1 : 3.2) * P;
        for (const c of L.cells) { c.inA = Math.hypot(c.x - A.x, c.y - A.y) < rad; c.inB = Math.hypot(c.x - B.x, c.y - B.y) < rad; }
        const inA = L.V.map(v => v.cells.length === 3 && v.cells.every(c => c.inA));
        const inB = L.V.map(v => v.cells.length === 3 && v.cells.every(c => c.inB));
        const walk = L.V.map(v => v.cells.length === 3 && v.y > 10 && v.y < H - 46);
        // hop distances to a spread of landing corners inside the AI basin, so arrivals fill it
        const bIds = L.V.map((v, i) => i).filter(i => inB[i]).sort((i, j) => Math.atan2(L.V[i].y - B.y, L.V[i].x - B.x) - Math.atan2(L.V[j].y - B.y, L.V[j].x - B.x));
        const targets = [];
        for (let k = 0; k < 18; k++) targets.push(bIds[Math.floor((k + 0.5) * bIds.length / 18)]);
        const fields = targets.map(tg => {
          const dist = new Int32Array(L.V.length).fill(-1), q = [tg]; dist[tg] = 0;
          for (let h = 0; h < q.length; h++) for (const j of L.V[q[h]].nb) if (dist[j] < 0 && walk[j]) { dist[j] = dist[q[h]] + 1; q.push(j); }
          return dist;
        });
        return { L, A, B, rad, inA, inB, walk, fields, phone, W, H, P };
      },
      spawn(sim, rnd, X) {
        const ids = X.L.V.map((v, i) => i).filter(i => X.inA[i]);
        const n = X.phone ? 40 : 64;
        for (let k = 0; k < n; k++) {
          const id = pick(ids, rnd);
          const a = sim.add(id, { kind: 0, born: rnd() * 300, go: rnd() < 0.8 ? 450 + rnd() * 1100 : Infinity, tg: (k * 7) % 18 });
          const nb = X.L.V[id].nb.filter(j => X.inA[j]);
          sim.hop(a, pick(nb.length ? nb : X.L.V[id].nb, rnd), a.born + rnd() * 200, 200 + rnd() * 80);
        }
      },
      policy(a, at, sim, rnd, X) {
        const V = X.L.V, v = V[a.from];
        if (a.mode === 'scan' && at >= a.go && at < 2000) { a.mode = 'move'; a.kind = 1; }
        if (a.mode === 'move') {
          const dist = X.fields[a.tg];
          if (dist[a.from] === 0) { a.mode = 'there'; a.left = (rnd() * 2) | 0; }
          else {
            const down = v.nb.filter(j => dist[j] >= 0 && dist[j] < dist[a.from]);
            if (down.length) { sim.hop(a, pick(down, rnd), at, 52 + rnd() * 18); return; }
            a.mode = 'there';
          }
        }
        if (at > 3900 || (a.mode === 'there' && a.left-- <= 0)) return;
        const home = a.mode === 'there' ? X.inB : X.inA;
        if (rnd() < 0.3) { const cs = v.cells.filter(c => (a.mode === 'there' ? c.inB : c.inA) && at - c.ping > 800); if (cs.length) pick(cs, rnd).ping = at; }
        const opts = v.nb.filter(j => j !== a.prev && home[j]);
        if (opts.length) sim.hop(a, pick(opts, rnd), at + 40 + rnd() * 240, 200 + rnd() * 80);
      },
      draw(g, t, sim, X, W, H) {
        let moved = 0, n = 0; for (const a of sim.agents) { n++; if (a.mode !== 'scan') moved++; }
        const k = n ? moved / n : 0;
        const fade = c => Math.max(0, 1 - SL.sm(W * 0.36, W * 0.62, Math.abs(c.x - W / 2))) * (1 - SL.sm(H * 0.62, H - 30, c.y)) * SL.sm(0, H * 0.18, c.y);
        SL.drawField(g, X.L, c => c.inA || c.inB ? 0 : 0.85 * fade(c), {});
        SL.drawField(g, X.L, c => c.inA ? 1 - 0.55 * k : 0, { color: SL.COL.line });
        SL.drawField(g, X.L, c => c.inB ? 0.45 + 0.55 * k : 0, { color: SL.COL.line });
        SL.drawField(g, X.L, c => { const e = t - c.ping; if (e < 0 || e > 800) return 0; return (e < 120 ? e / 120 : e < 280 ? 1 : 1 - (e - 280) / 520) * 0.8; }, { color: SL.COL.hive });
        SL.drawEdges(g, sim, t, { base: [0.4, 0.75], lw: X.phone ? 1.2 : 1.4 });
        SL.drawAgents(g, sim, t, { r: X.phone ? 2.3 : 2.8, base: [0.7, 1] });
      }
    });
  })();

  /* ---------- pricing: "Lock in your seat" ----------
     The swarm routes along the honeycomb into the pricing card. Agents wake on the field around the card, scan,
     commit and route through ports in the card's outline (top, left and right; three along the top on phones) to the
     card's core cell. Each arrival lights the neighbour at that corner and one of the six dots in the lock badge.
     Once most have docked, the official mark lands on the core (the section's one lit cell), the founding $49 turns
     gold (the view's one gold number) and the badge reads LOCKED; one ring wave runs out and it all settles about
     4s after the price row came into view, then stops. It pauses while offscreen. Under ?reduce=1, ?t, or without
     JS or canvas, the card shows its settled state. ?lock=<ms> freezes the moment at that time and
     window.__lockSeek(ms) steps it, for frame-accurate captures. No text is drawn on canvas. */
  (function lockMoment() {
    const stage = $('#lock-stage'), fc = $('#join-field'), ac = $('#join-agents'), card = $('#pcard');
    const seat = card && $('.pc-seat', card), mk = $('#join-mark'), badge = $('#pc-lock'), row = $('.price-row');
    const dots = badge ? $$('.lk-dots i', badge) : [];
    const q = new URLSearchParams(location.search);
    const FREEZE = q.has('lock') && !S.reduce ? Math.max(0, parseFloat(q.get('lock')) || 0) : null;
    const T = { born: 340, commit0: 420, commit1: 980, arrive: 2050, lockMin: 2000, lockMax: 2600, markIn: 380, wave: 1350, tail: 1500 };
    const DT = 1000 / 60;
    function settleDom() {
      if (card) card.classList.remove('lock-pending');
      if (badge) badge.classList.add('is-locked');
      dots.forEach(i => i.classList.add('on'));
      if (mk) { mk.classList.add('lit'); mk.style.opacity = ''; mk.style.transform = ''; }
    }
    if (!stage || !fc || !ac || !card || !seat || !SL || !fc.getContext) { settleDom(); return; }
    const fx = fc.getContext('2d'), ax = ac.getContext('2d');
    if (!fx || !ax) { settleDom(); return; }
    const { COL, sm, outCubic, hexPath, drawField, drawAgents } = SL;
    const surface = (getComputedStyle(card).getPropertyValue('--swarm-surface') || '#111114').trim();

    let W, Hf, Ha, d, phone, R, P, core, box, seatB, Dm, L, V, walk, inside, dist, parent, innerNext, portOf, ports;
    let Sx, rnd, simT, locked, lockT, END, absorbed, routed, flashT, pinged, litN, lastHand = -1, lastN = -1;
    let started = false, done = false, raf = 0, clock = 0, last = null, onScreen = true, lastW = 0;

    /* ---------- geometry: the card, its open seat and the core, in stage pixels ---------- */
    function geometry() {
      d = DPR(); W = stage.clientWidth;
      const sr = stage.getBoundingClientRect(), cr = card.getBoundingClientRect(), se = seat.getBoundingClientRect();
      box = { x0: cr.left - sr.left, y0: cr.top - sr.top, x1: cr.right - sr.left, y1: cr.bottom - sr.top };
      seatB = se.bottom - sr.top;
      core = { x: (se.left + se.right) / 2 - sr.left, y: (se.top + se.bottom) / 2 - sr.top };
      phone = W <= 640;
      R = parseFloat(getComputedStyle(stage).getPropertyValue('--lockR')) || (phone ? 13 : 16);
      P = 1.95 * R;
      Dm = phone ? 380 : 640;
      Hf = Math.min(stage.clientHeight, Math.ceil(core.y + Dm * 0.86));
      Ha = Math.ceil(seatB + 2);
    }
    // inside the card's rounded outline, inset by m
    function inCard(x, y, m, bottom) {
      const r = 28, x0 = box.x0 + m, x1 = box.x1 - m, y0 = box.y0 + m, y1 = bottom - m;
      if (x < x0 || x > x1 || y < y0 || y > y1) return false;
      const cx = x < box.x0 + r ? box.x0 + r : (x > box.x1 - r ? box.x1 - r : x);
      if (y < box.y0 + r && cx !== x) return Math.hypot(x - cx, y - (box.y0 + r)) < r - m;
      return true;
    }
    const outside = (x, y) => x < box.x0 - 3 || x > box.x1 + 3 || y < box.y0 - 3 || y > box.y1 + 3;
    // the field outside the card: faint, wider than tall, fading with distance from the core and in at the top
    const outA = (x, y) => (1 - sm(0.2 * Dm, Dm, Math.hypot((x - core.x) * 0.9, (y - core.y) * 1.3))) * sm(6, 70, y);
    // inside the seat: the kit's line grey, so the network still reads on the card's surface
    const inA = c => (phone ? 0.78 : 0.92) - 0.4 * sm(2.5 * P, 8 * P, Math.hypot(c.x - core.x, c.y - core.y));
    // on the agent canvas: full strength in the seat, fading out beside the card before the canvas ends
    const mask = (x, y) => inCard(x, y, 0, seatB) ? 1 : 1 - sm(seatB - 76, seatB - 6, y);

    /* ---------- lattice, ports and routes ---------- */
    function setup() {
      geometry();
      L = SL.lattice({ R, ox: core.x, oy: core.y, x0: -P, y0: -P, x1: W + P, y1: Hf + P });
      V = L.V;
      inside = V.map(v => inCard(v.x, v.y, 3, seatB - 4));
      walk = V.map((v, i) => !v.core && !v.perim && v.ring >= 2 && v.y > 10 && v.y < seatB - 7 && v.x > 6 && v.x < W - 6 &&
        (inside[i] || (outside(v.x, v.y) && outA(v.x, v.y) > 0.28)));
      const cw = box.x1 - box.x0;
      ports = phone ? [[core.x, box.y0], [core.x - 0.31 * cw, box.y0], [core.x + 0.31 * cw, box.y0]]
                    : [[core.x, box.y0], [box.x0, core.y], [box.x1, core.y]];
      const portAt = (a, b) => {
        const mx = (V[a].x + V[b].x) / 2, my = (V[a].y + V[b].y) / 2;
        for (let k = 0; k < ports.length; k++) if (Math.hypot(mx - ports[k][0], my - ports[k][1]) < 0.8 * P) return k;
        return -1;
      };
      // breadth-first from the core's outer corners; crossing the card's outline is only allowed at a port
      dist = new Int32Array(V.length).fill(-1); portOf = new Int8Array(V.length).fill(-1);
      const qq = [];
      V.forEach((v, i) => { if (v.perim) { dist[i] = 0; qq.push(i); } });
      for (let h = 0; h < qq.length; h++) {
        const i = qq[h];
        for (const j of V[i].nb) {
          if (dist[j] >= 0 || !walk[j]) continue;
          let pk = portOf[i];
          if (!V[i].perim && inside[i] !== inside[j]) { pk = portAt(i, j); if (pk < 0) continue; }
          dist[j] = dist[i] + 1; portOf[j] = pk; qq.push(j);
        }
      }
      // among equally short ways in: outside the card head for the port (so streams merge as they near it),
      // inside the seat follow the six arteries leaving the cluster
      const art = V.filter(v => v.perim && v.cells.filter(c => c.ring === 1).length === 2).map(v => Math.atan2(v.y - core.y, v.x - core.x));
      const artDev = (x, y) => { const a = Math.atan2(y - core.y, x - core.x); let m = 9; for (const b of art) { let e = Math.abs(a - b); if (e > Math.PI) e = 2 * Math.PI - e; m = Math.min(m, e); } return m; };
      parent = new Int32Array(V.length).fill(-1);
      V.forEach((v, i) => {
        if (dist[i] <= 0) return;
        let best = -1, bs = 1e9;
        for (const j of v.nb) {
          if (dist[j] !== dist[i] - 1) continue;
          if (!V[j].perim && inside[i] !== inside[j] && portAt(i, j) < 0) continue;
          let s;
          if (!inside[i] && !inside[j] && portOf[j] >= 0) { const p = ports[portOf[j]]; s = Math.hypot(V[j].x - p[0], V[j].y - p[1]); }
          else s = artDev(V[j].x, V[j].y) * 100 + V[j].d * 1e-3;
          if (s < bs) { bs = s; best = j; }
        }
        parent[i] = best;
      });
      innerNext = new Int32Array(V.length).fill(-1);
      const dIn = new Int32Array(V.length).fill(-1), q2 = [];
      V.forEach((v, i) => { if (v.core) { dIn[i] = 0; q2.push(i); } });
      for (let h = 0; h < q2.length; h++) for (const j of V[q2[h]].nb) { if (dIn[j] >= 0 || !(V[j].perim || V[j].core)) continue; dIn[j] = dIn[q2[h]] + 1; innerNext[j] = q2[h]; q2.push(j); }
    }

    /* ---------- the swarm ---------- */
    const hopD = () => 175 + rnd() * 85;
    const pick = arr => arr[(rnd() * arr.length) | 0];
    function spawn() {
      for (const c of L.cells) { c.ping = -1e9; c.lit = -1e9; }
      rnd = SL.rng(29);
      Sx = SL.sim(L, 31, 600);
      const N = phone ? 30 : 80;
      const pool = [];
      V.forEach((v, i) => { if (walk[i] && dist[i] > 2 && v.ring >= 4 && v.y > 16) pool.push(i); });
      let maxH = 1; for (const i of pool) maxH = Math.max(maxH, dist[i]);
      const used = new Set();
      for (let n = 0; n < N && pool.length; n++) {
        let id = pool[0];
        for (let tries = 0; tries < 60; tries++) {
          id = pick(pool);
          if (used.has(id)) continue;
          const v = V[id], w = inside[id] ? (phone ? 0.12 : 0.3) : 0.3 + 0.7 * outA(v.x, v.y);
          if (rnd() < w) break;
        }
        used.add(id);
        const far = dist[id] / maxH;
        const a = Sx.add(id, { kind: 0, will: rnd() < 0.76, born: 30 + rnd() * T.born, ct: T.commit0 + rnd() * (T.commit1 - T.commit0) * (1 - 0.55 * far), jit: rnd() * 260 });
        const nx = V[id].nb.filter(j => walk[j] && inside[j] === inside[id]);
        if (nx.length) Sx.hop(a, pick(nx), a.born + 30 + rnd() * 200, hopD());
      }
      pinged = []; locked = false; lockT = Infinity; END = Infinity; absorbed = 0; routed = 0; flashT = -1e9; litN = 0;
      simT = 0; lastHand = -1; lastN = -1;
    }

    function policy(a, at) {
      const v = V[a.from];
      if (a.mode === 'scan') {
        if (!locked && rnd() < 0.42) {
          let live = 0; for (const c of pinged) if (at - c.ping < 800) live++;
          if (live < (phone ? 6 : 14)) {
            const cs = v.cells.filter(c => c.ring >= 2 && at - c.ping > 800);
            if (cs.length) { const c = pick(cs); c.ping = at; pinged.push(c); if (pinged.length > 40) pinged.splice(0, pinged.length - 40); }
          }
        }
        // the decision: a scout that commits turns bright and sets off for the card
        if (a.will && !locked && at >= a.ct && dist[a.from] > 0) {
          a.mode = 'route'; a.kind = 1; routed++;
          a.hd = Math.min(210, Math.max(48, Math.max(200, T.arrive + a.jit - at) / dist[a.from]));
          return policy(a, at);
        }
        if (locked) { if (a.fadeT < 0) { a.fadeT = at; a.fadeD = 300; } return; }
        let opts = v.nb.filter(j => j !== a.prev && walk[j] && inside[j] === inside[a.from] && V[j].ring >= 3);
        if (!opts.length) opts = v.nb.filter(j => walk[j] && inside[j] === inside[a.from]);
        if (!opts.length) return;
        // committed agents drift toward the card before they set off
        const bias = a.will ? 0.6 * sm(200, T.commit0, at) : 0;
        if (bias && rnd() < bias) { const down = opts.filter(j => dist[j] >= 0 && dist[j] < dist[a.from]); if (down.length) opts = down; }
        Sx.hop(a, pick(opts), at + 20 + rnd() * 150, hopD());
        return;
      }
      if (v.perim && a.mode === 'route') {
        for (const c of v.cells) if (c.ring === 1 && c.lit < -1e8) { c.lit = at; litN++; }
        if (locked) { a.fadeT = at; a.fadeD = 140; return; }
        a.mode = 'inner';
      }
      if (a.mode === 'inner') {
        if (v.core) { a.dead = true; absorbed++; flashT = at; return; }
        const nx = innerNext[a.from];
        if (nx < 0) { a.dead = true; return; }
        Sx.hop(a, nx, at, 105);
        return;
      }
      const p = parent[a.from];
      if (p < 0) { a.mode = 'scan'; a.kind = 0; return; }
      Sx.hop(a, p, at, a.hd);
    }

    function step(t) {
      Sx.advance(t, policy);
      if (!locked && ((t >= T.lockMin && routed > 0 && absorbed >= 0.62 * routed) || t >= T.lockMax)) {
        locked = true; lockT = t; END = t + T.tail;
        for (const c of L.rings[1] || []) if (c.lit < -1e8) { c.lit = t; litN++; }
        for (const a of Sx.agents) {
          if (a.dead || a.fadeT >= 0) continue;
          if (a.mode === 'scan') { a.fadeT = t + 80 + rnd() * 460; a.fadeD = 300; }
          else if (a.mode === 'route') { a.fadeT = t + 380 + rnd() * 260; a.fadeD = 220; }
        }
      }
    }
    const charge = () => Math.min(1, absorbed / Math.max(1, 0.62 * routed));

    /* ---------- drawing ---------- */
    function rrect(g, x0, y0, x1, y1, rt, rb) {
      g.moveTo(x0 + rt, y0); g.lineTo(x1 - rt, y0); g.arcTo(x1, y0, x1, y0 + rt, rt);
      if (rb) { g.lineTo(x1, y1 - rb); g.arcTo(x1, y1, x1 - rb, y1, rb); g.lineTo(x0 + rb, y1); g.arcTo(x0, y1, x0, y1 - rb, rb); }
      else { g.lineTo(x1, y1); g.lineTo(x0, y1); }
      g.lineTo(x0, y0 + rt); g.arcTo(x0, y0, x0 + rt, y0, rt); g.closePath();
    }
    function drawStatic() {
      fc.width = Math.round(W * d); fc.height = Math.round(Hf * d); fc.style.width = W + 'px'; fc.style.height = Hf + 'px';
      const g = fx;
      g.setTransform(d, 0, 0, d, 0, 0); g.clearRect(0, 0, W, Hf);
      // the seat's surface: the card leaves its top open so the field runs on into it
      g.fillStyle = surface; g.beginPath(); rrect(g, box.x0, box.y0, box.x1, seatB + 1, 28, 0); g.fill();
      g.save(); g.beginPath(); g.rect(0, 0, W, Hf); rrect(g, box.x0, box.y0, box.x1, box.y1, 28, 28); g.clip('evenodd');
      drawField(g, L, c => c.ring <= 1 ? 0 : outA(c.x, c.y), {});
      g.restore();
      g.save(); g.beginPath(); rrect(g, box.x0 + 1, box.y0 + 1, box.x1 - 1, seatB, 27, 0); g.clip();
      drawField(g, L, c => c.ring <= 1 ? 0 : inA(c), { color: COL.line });
      g.restore();
      ac.width = Math.round(W * d); ac.height = Math.round(Ha * d); ac.style.width = W + 'px'; ac.style.height = Ha + 'px';
      card.classList.add('seat-drawn');
    }
    // lit edges: the whole edge an agent is crossing lights as it sets off (so a moving node sits on a lit edge
    // instead of trailing a line), then fades over 600ms once crossed
    function drawRoutes(g, t) {
      const base = [0.34, 0.8], B = 12, groups = [new Map(), new Map()];
      const put = (k, a, p, q) => { const b = Math.round(a * B); if (b <= 0) return; let arr = groups[k].get(b); if (!arr) groups[k].set(b, arr = []); arr.push(p.x, p.y, q.x, q.y); };
      for (const e of Sx.edges.values()) {
        const age = t - e.t; if (age < 0 || age > Sx.edgeFade) continue;
        const p = V[e.a], q = V[e.b];
        put(e.k, base[e.k] * (1 - age / Sx.edgeFade) * mask((p.x + q.x) / 2, (p.y + q.y) / 2), p, q);
      }
      for (const a of Sx.agents) {
        if (a.dead || a.to < 0 || t <= a.t0) continue;
        const f = Math.min(1, (t - a.t0) / a.d);
        put(a.kind, base[a.kind] * Sx.vis(a, t) * Math.min(1, 0.35 + f * 1.6) * mask(a.x, a.y), V[a.from], V[a.to]);
      }
      g.lineWidth = phone ? 1.25 : 1.5; g.lineCap = 'round';
      const colr = [COL.muted, COL.text];
      for (let k = 0; k < 2; k++) {
        g.strokeStyle = colr[k];
        for (const [b, arr] of groups[k]) {
          g.globalAlpha = Math.min(1, b / B); g.beginPath();
          for (let i = 0; i < arr.length; i += 4) { g.moveTo(arr[i], arr[i + 1]); g.lineTo(arr[i + 2], arr[i + 3]); }
          g.stroke();
        }
      }
      g.globalAlpha = 1; g.lineCap = 'butt';
    }
    function draw(t) {
      const g = ax;
      g.setTransform(d, 0, 0, d, 0, 0); g.clearRect(0, 0, W, Ha);
      const hand = locked ? outCubic((t - lockT) / T.markIn) : 0;
      if (t < END) {
        // the lock: one ring wave runs out from the core across the seat and the field around the card
        if (locked && t < lockT + T.wave + 120) {
          drawField(g, L, c => {
            if (c.ring < 2 || c.y > seatB + R) return 0;
            const e = t - (lockT + 50 + c.ring * 34);
            if (e < 0) return 0;
            const env = e < 90 ? e / 90 : Math.max(0, 1 - (e - 90) / 560);
            return env * 0.6 * Math.max(0.22, 1 - c.ring / 26) * mask(c.x, c.y);
          }, { color: COL.hive });
        }
        // sensing: a visited cell's outline brightens briefly
        if (pinged.length) {
          drawField(g, L, c => {
            const e = t - c.ping; if (e < 0 || e > 800) return 0;
            const env = e < 120 ? e / 120 : e < 280 ? 1 : 1 - (e - 280) / 520;
            return env * 0.8 * mask(c.x, c.y);
          }, { color: COL.hive });
        }
        drawRoutes(g, t);
      }
      // the core cluster before the mark lands: neighbours light as agents reach their corners, the core charges
      if (hand < 1) {
        const ring1 = L.rings[1] || [];
        g.lineWidth = 1; g.strokeStyle = COL.line; g.globalAlpha = 1 - hand; g.beginPath();
        for (const c of ring1) if (c.lit < -1e8 || t < c.lit) hexPath(g, c.x, c.y, R * 0.97);
        g.stroke();
        g.lineWidth = 1.5; g.strokeStyle = COL.hive;
        for (const c of ring1) {
          if (c.lit < -1e8 || t < c.lit) continue;
          g.globalAlpha = sm(c.lit, c.lit + 220, t) * (1 - hand); g.beginPath(); hexPath(g, c.x, c.y, R * 0.97); g.stroke();
        }
        const flash = Math.max(0, 1 - (t - flashT) / 220);
        const coreA = Math.min(1, 0.3 + 0.6 * charge() + 0.25 * flash) * (1 - hand);
        if (coreA > 0.01) { g.globalAlpha = coreA; g.strokeStyle = COL.gold; g.lineWidth = 1.5; g.beginPath(); hexPath(g, core.x, core.y, R * 0.825); g.stroke(); }
        g.globalAlpha = 1;
      }
      if (t < END) drawAgents(g, Sx, t, { alphaAt: mask, r: phone ? 2.4 : 2.9, base: [0.9, 1] });
      // the page: the mark lands, the price turns gold, the badge fills dot by dot and locks
      if (hand !== lastHand) {
        mk.style.opacity = hand >= 1 ? '' : hand.toFixed(3);
        mk.style.transform = hand > 0 && hand < 1 ? `translate(-50%, -50%) scale(${(0.93 + 0.07 * hand).toFixed(4)})` : '';
        mk.classList.toggle('lit', hand >= 1);
        lastHand = hand;
      }
      let n = 0; for (const c of L.rings[1] || []) if (c.lit > -1e8 && t >= c.lit) n++;
      if (n !== lastN) { dots.forEach((i, k) => i.classList.toggle('on', k < n)); lastN = n; }
      card.classList.toggle('lock-pending', !locked);
      badge.classList.toggle('is-locked', locked);
    }

    /* ---------- time ---------- */
    function advanceTo(t) { while (simT + DT <= t) { simT += DT; step(simT); } }
    function render(t) {
      advanceTo(Math.min(t, END));
      draw(Math.min(t, END));
      if (t >= END && !done) finish();
    }
    function finish() {
      done = true;
      if (raf) cancelAnimationFrame(raf); raf = 0;
      ax.setTransform(1, 0, 0, 1, 0, 0); ax.clearRect(0, 0, ac.width, ac.height);
      settleDom();
    }
    function settle() { done = true; started = true; locked = true; ax.setTransform(1, 0, 0, 1, 0, 0); ax.clearRect(0, 0, ac.width, ac.height); settleDom(); }
    function seek(t) {
      if (t < simT || done) { done = false; spawn(); }
      render(t);
    }
    function loop(now) {
      raf = 0;
      if (done || !onScreen) return;
      // wall-clock time while on screen, so a slow phone still settles on schedule; offscreen time and a hidden
      // tab do not count (last is reset when the stage or the tab comes back)
      if (last === null) last = now;
      clock += Math.min(1000, Math.max(0, now - last)); last = now;
      render(clock);
      if (!done) raf = requestAnimationFrame(loop);
    }
    function start() {
      if (started) return;
      started = true; clock = 0; last = null;
      raf = requestAnimationFrame(loop);
    }

    /* ---------- wiring ---------- */
    const FROZEN = FREEZE !== null;
    const STILL = !FROZEN && (STATIC || motionOff || !('IntersectionObserver' in window));
    setup(); spawn(); drawStatic(); lastW = W;
    if (STILL) settle();
    else if (FROZEN) { started = true; seek(FREEZE); }
    else {
      draw(0);
      const io = new IntersectionObserver(es => { for (const e of es) if (e.isIntersecting) { io.disconnect(); start(); } }, { threshold: 0.75 });
      io.observe(row || card);
      // pause while the stage is offscreen, pick up where it left off when it comes back
      new IntersectionObserver(es => {
        for (const e of es) {
          onScreen = e.isIntersecting;
          if (onScreen && started && !done && !raf) { last = null; raf = requestAnimationFrame(loop); }
        }
      }).observe(stage);
      document.addEventListener('visibilitychange', () => { last = null; });
    }
    window.__lockDebug = () => ({ started, done, locked, clock: Math.round(clock), raf: !!raf, onScreen, ports: ports.map((p, k) => V.filter((v, i) => portOf[i] === k && walk[i]).length), walk: walk.filter(Boolean).length, reach: V.filter((v, i) => walk[i] && dist[i] > 0).length, out: Sx.agents.filter(a => !inside[a.from]).length, n: Sx.agents.length });
    window.__lockSeek = t => {
      started = true;
      seek(t);
      if (document.getAnimations) document.getAnimations().forEach(a => { if (a.animationName && a.animationName.indexOf('ring-') === 0) { a.pause(); a.currentTime = t; } });
      return { t, locked, lockT, absorbed, routed, n: litN };
    };
    // a new width rebuilds the field and shows the settled card; a new height only redraws the field
    if ('ResizeObserver' in window) new ResizeObserver(() => {
      const w = stage.clientWidth;
      if (w === lastW) { if (!started || done) { geometry(); setup(); spawn(); drawStatic(); if (done) settle(); else draw(0); } return; }
      lastW = w;
      if (raf) cancelAnimationFrame(raf); raf = 0;
      setup(); spawn(); drawStatic();
      if (FROZEN && !done) seek(FREEZE); else if (started || STILL) settle(); else draw(0);
    }).observe(stage);
  })();

  /* ---------- final CTA: the field, with a short pass of the swarm when it comes into view ---------- */
  (function finalField() {
    const sec = $('#final'), cv = $('#final-field'); if (!sec || !cv || !SL) return;
    lattice2D(cv, {
      seed: 21, end: 5200, threshold: 0.35,
      height: () => sec.clientHeight,
      setup(W, H) {
        const phone = W <= 640, R = phone ? 22 : 30, P = 1.95 * R;
        const L = SL.lattice({ R, ox: W / 2, oy: H / 2, x0: -P, x1: W + P, y0: -P, y1: H + P });
        const maxD = Math.hypot(W / 2, H / 2);
        const sr = sec.getBoundingClientRect(), boxes = [];
        sec.querySelectorAll('.h2 span, .btn-gold, .cancel').forEach(el => { const r = el.getBoundingClientRect(); boxes.push([r.left - sr.left - 18, r.top - sr.top - 14, r.right - sr.left + 18, r.bottom - sr.top + 14]); });
        const inBox = (x, y) => boxes.some(b => x > b[0] && x < b[2] && y > b[1] && y < b[3]);
        const fade = (x, y) => (1 - SL.sm(0.15 * maxD, 0.85 * maxD, Math.hypot((x - W / 2) * 0.8, y - H / 2))) * Math.min(SL.sm(0, 120, y), 1 - SL.sm(H - 120, H, y));
        const walk = L.V.map(v => fade(v.x, v.y) > 0.2);
        return { L, maxD, fade, inBox, walk, phone };
      },
      spawn(sim, rnd, X) {
        const ids = X.L.V.map((v, i) => i).filter(i => X.walk[i] && !X.inBox(X.L.V[i].x, X.L.V[i].y));
        const n = X.phone ? 22 : 46;
        for (let k = 0; k < n; k++) {
          const id = pick(ids, rnd);
          const a = sim.add(id, { kind: rnd() < 0.5 ? 1 : 0, born: rnd() * 600, fadeT: 3600 + rnd() * 500, fadeD: 420 });
          const nb = X.L.V[id].nb.filter(j => X.walk[j]);
          if (nb.length) sim.hop(a, pick(nb, rnd), a.born + rnd() * 200, 220 + rnd() * 80);
        }
      },
      policy(a, at, sim, rnd, X) {
        if (at > 3700) return;
        const v = X.L.V[a.from];
        const opts = v.nb.filter(j => j !== a.prev && X.walk[j]);
        if (opts.length) sim.hop(a, pick(opts, rnd), at + 60 + rnd() * 300, 220 + rnd() * 80);
      },
      draw(g, t, sim, X) {
        SL.drawField(g, X.L, c => X.fade(c.x, c.y), {});
        const m = (x, y) => X.inBox(x, y) ? 0.12 : 1;
        SL.drawEdges(g, sim, t, { base: [0.32, 0.55], alphaAt: m, lw: 1.4 });
        SL.drawAgents(g, sim, t, { r: X.phone ? 2.4 : 2.8, base: [0.75, 0.9], alphaAt: m });
      }
    });
  })();

  /* ---------- pricing: plan switch and Whop checkout stub ---------- */
  // Swap in the three Whop plan IDs (prefixed plan_) when Jesus has them. One line per plan.
  const PLANS = {
    founding: { name: 'Founding monthly', price: '$49', unit: '/mo', note: 'Yours for as long as you stay subscribed. Cancel whenever. 50 seats only.', chip: 'Founding seat', gold: true, lock: true, whopPlanId: null },
    standard: { name: 'Standard monthly', price: '$99', unit: '/mo', note: 'The price once the founding seats are gone.', chip: 'Renews monthly', gold: false, whopPlanId: null },
    yearly:   { name: 'Yearly', price: '$990', unit: '/yr', note: '2 months free.', chip: 'Billed yearly', gold: false, whopPlanId: null }
  };
  window.SWARM_PLANS = PLANS;
  let currentPlan = 'founding', mounted = null, opened = false;

  // Production: load Whop Elements (see RESEARCH-NOTES.md), destroy the previous mount, then
  //   mounted = window.WhopElements().checkout.create({ plan: plan.whopPlanId, returnUrl, onComplete });
  //   mounted.create('checkout').mount('#whop-checkout');
  // Each mount mints a checkout session, so only mount on an explicit Join click or a plan change after it.
  function mountCheckout(planKey) {
    const plan = PLANS[planKey], slot = $('#whop-checkout');
    if (!plan || !slot) return false;
    slot.querySelector('[data-slot-plan]').textContent = plan.name;
    if (!plan.whopPlanId) {
      slot.dataset.state = 'placeholder';
      $('#whop-status').textContent = 'The ' + plan.name.toLowerCase() + ' checkout mounts here once its Whop plan ID is added.';
      return false;
    }
    if (mounted && mounted.destroy) mounted.destroy();
    slot.dataset.state = 'mounted';
    return true;
  }
  function showPlan(key) {
    const p = PLANS[key]; if (!p) return;
    currentPlan = key;
    $('#pc-name').textContent = p.name;
    $('#pc-amt').textContent = p.price;
    $('#pc-unit').textContent = p.unit;
    $('#pc-note').textContent = p.note;
    $('#pc-chip').textContent = p.chip;
    $('#pcard').classList.toggle('is-gold', p.gold);
    $('#pcard').classList.toggle('has-lock', !!p.lock);
    const slot = $('#whop-checkout'); if (slot) slot.querySelector('[data-slot-plan]').textContent = p.name;
    if (opened) mountCheckout(key);
  }
  $('#pc-chip') && ($('#pc-chip').textContent = PLANS.founding.chip);
  $$('.seg-switch input').forEach(inp => inp.addEventListener('change', () => { if (inp.checked) showPlan(inp.value); }));
  const joinBtn = $('#join-btn');
  if (joinBtn) joinBtn.addEventListener('click', () => {
    opened = true;
    mountCheckout(currentPlan);
    const slot = $('#whop-checkout');
    slot.scrollIntoView({ behavior: S.reduce ? 'auto' : 'smooth', block: 'center' });
    slot.focus({ preventScroll: true });
  });
})();
