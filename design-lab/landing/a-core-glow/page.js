/* Swarm A, Core Glow: page controller.
   Nav state, the revolving light on the gold Join Swarm buttons, the four product mocks (each plays once and settles
   inside 5s), the Custom AI tools scout field (a 2D model rendered by tools3d.js in Three.js, or drawn flat as a
   still), the why-now band, the pricing core, the final field, and the pricing switch with the Whop checkout stub.
   Every motion piece plays once when it comes into view and settles within 5 seconds; nothing loops, so there is no
   pause control. Everything pauses offscreen and while the tab is hidden.
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

  // which pieces are on screen (the bounded timers below skip their ticks when not)
  const seen = new WeakMap();
  const visIO = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => seen.set(e.target, e.isIntersecting)), { threshold: 0 }) : null;
  const watchVis = el => { if (visIO && el) { seen.set(el, true); visIO.observe(el); } };
  const shown = el => !document.hidden && seen.get(el) !== false;

  /* ---------- nav ---------- */
  const nav = $('#nav');
  const onScroll = () => { if (nav) nav.classList.toggle('scrolled', window.scrollY > 8); };
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- the revolving light on the gold Join Swarm buttons ----------
     CSS draws it (core-glow.css). Each time a button comes into view it plays once (3.6s) and rests on a full ring;
     it plays again on hover or keyboard focus once the last run has finished. The hero's light starts as the six
     paths land on the core, so the eye goes from the lit cell to the button, and rests on its full ring by 6s. */
  const golds = $$('.btn-gold'), heroBtn = $('.btn-hero');
  const RING_MS = 3600, HERO_RING_AT = 2250;               // hero clock: the trains land from about 1.6s, the core ignites at 2.4s
  const ringPlay = b => { b.classList.remove('ring-run', 'ring-done'); void b.offsetWidth; b.classList.add('ring-run'); b.dataset.ring = 'run'; };
  if (S.reduce) {
    // the still: a full ring (CSS)
  } else if (S.freeze != null) {
    golds.forEach(b => { if (b !== heroBtn) b.classList.add('ring-done'); });
    // the hero's light follows the hero clock, so ?t= frames and frame renders show it travelling
    const seekRing = t => {
      if (!heroBtn) return;
      if (t < HERO_RING_AT) { heroBtn.classList.remove('ring-run'); return; }
      heroBtn.classList.add('ring-run');
      if (heroBtn.getAnimations) heroBtn.getAnimations({ subtree: true }).forEach(a => { a.pause(); a.currentTime = Math.min(RING_MS, t - HERO_RING_AT); });
    };
    seekRing(S.freeze);
    requestAnimationFrame(() => seekRing(S.freeze));
    const heroSeek = window.__heroSeek;
    if (typeof heroSeek === 'function') window.__heroSeek = t => { const r = heroSeek(t); seekRing(t); return r; };
  } else {
    let heroGate = false;
    const fullyIn = b => { const r = b.getBoundingClientRect(), vh = window.innerHeight || 800; return r.top >= -2 && r.bottom <= vh + 2 && r.width > 0; };
    golds.forEach(b => {
      b.addEventListener('animationend', e => { if (e.animationName === 'ring-f') b.dataset.ring = 'done'; });
      const again = () => { if (b.dataset.ring === 'done') ringPlay(b); };
      b.addEventListener('mouseenter', again);
      b.addEventListener('focus', () => { if (!b.matches || b.matches(':focus-visible')) again(); });
    });
    if ('IntersectionObserver' in window) {
      const ringIO = new IntersectionObserver(es => {
        for (const e of es) {
          const b = e.target;
          if (!e.isIntersecting) { b.classList.remove('ring-run', 'ring-done'); b.dataset.ring = ''; continue; }
          if (e.intersectionRatio >= 0.6 && !b.dataset.ring && (b !== heroBtn || heroGate)) ringPlay(b);
        }
      }, { threshold: [0, 0.6] });
      golds.forEach(b => ringIO.observe(b));
    } else golds.forEach(b => b.classList.add('ring-done'));
    // the hero starts at first paint and says when (hero.js); its light follows as the trains land
    const t0 = (window.SWARM && window.SWARM.heroT0) || performance.now();
    later(Math.max(0, t0 + HERO_RING_AT - performance.now()), () => { heroGate = true; if (heroBtn && !heroBtn.dataset.ring && fullyIn(heroBtn)) ringPlay(heroBtn); });
  }

  /* ---------- play-once helper ---------- */
  function once(el, fn, threshold = 0.4) {
    if (!el) return;
    if (STATIC || !('IntersectionObserver' in window)) { fn(true); return; }
    const io = new IntersectionObserver(es => { for (const e of es) if (e.isIntersecting) { io.disconnect(); fn(false); } }, { threshold });
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
  const conRows = $$('#console .crow'), conSegs = $$('#console .con-seg i'), conLog = $('#con-log'), toolsMockEl = $('#tools-mock');
  watchVis(toolsMockEl);
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
    while (conLog.children.length > 3) conLog.lastElementChild.remove();
    if (anim) requestAnimationFrame(() => requestAnimationFrame(() => li.classList.remove('enter')));
  }
  function settleSpinners() { conRows.forEach(r => { const sp = r.querySelector('.spin'); setSpin(sp, -1); sp.classList.add('done'); }); }
  function setSeg(n) { conSegs.forEach((s, i) => s.classList.toggle('on', i < n)); }
  function playConsole(final) {
    if (final) { conSteps.forEach(s => applyCon(s, false)); logSteps.forEach(s => pushLog(s[1], s[2], s[3], false)); setSeg(3); settleSpinners(); conRows.forEach(r => r.classList.remove('hot')); return; }
    let k = 0;
    conRows.forEach(r => r.querySelector('.spin').classList.remove('done'));
    const iv = setInterval(() => { if (!shown(toolsMockEl)) return; k = (k + 1) % 6; conRows.forEach((r, j) => setSpin(r.querySelector('.spin'), (k + j * 2) % 6)); }, 80);
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

  /* ---------- live call: the audio strip talks for a few seconds, the review moves one portfolio down ---------- */
  const callMock = $('#calls-mock'), bars = $$('#calls-mock .bars i'), csRows = $$('#calls-mock .cs-row'), csDetail = $('#calls-mock .cs-detail');
  watchVis(callMock);
  const restH = [30, 46, 62, 40, 74, 58, 36, 66, 82, 52, 38, 60, 44, 70, 50, 34, 56, 40, 64, 48, 32, 54];
  const restBars = () => bars.forEach((b, i) => b.style.height = restH[i % restH.length] + '%');
  const CS_LABEL = { REVIEWED: 'Reviewed', LIVE: 'Live', 'UP NEXT': 'Up next', 'IN QUEUE': 'In queue' };
  const CS0 = ['LIVE', 'UP NEXT', 'IN QUEUE', 'IN QUEUE', 'IN QUEUE'], CS1 = ['REVIEWED', 'LIVE', 'UP NEXT', 'IN QUEUE', 'IN QUEUE'];
  function csSet(st) {
    csRows.forEach((r, i) => { r.dataset.st = st[i]; r.querySelector('.cs-st').textContent = CS_LABEL[st[i]]; });
    const live = csRows[st.indexOf('LIVE')];
    if (live && csDetail) live.after(csDetail);
  }
  function playCall(final) {
    if (final) { restBars(); csSet(CS1); return; }
    const r = SL.rng(11);
    const iv = setInterval(() => { if (!shown(callMock)) return; bars.forEach((b, i) => { const env = 0.35 + 0.65 * Math.abs(Math.sin(i * 0.7)); b.style.height = Math.round(18 + r() * 82 * env) + '%'; }); }, 110);
    later(1700, () => { callMock.classList.add('cs-swap'); later(220, () => { csSet(CS1); callMock.classList.remove('cs-swap'); }); });
    later(4300, () => { clearInterval(iv); restBars(); });
  }
  restBars(); csSet(STATIC ? CS1 : CS0);

  /* ---------- trader room ---------- */
  const roomMock = $('#room-mock'), msgs = $$('#room-mock .msg');
  function playRoom(final) {
    if (final) { msgs.forEach(m => m.classList.remove('pending')); return; }
    msgs.forEach((m, i) => later(250 + i * 650, () => m.classList.remove('pending')));
  }
  if (!STATIC) msgs.forEach(m => m.classList.add('pending'));

  /* ---------- Custom AI tools: a scout field (2D model), rendered in 3D by tools3d.js or drawn flat ---------- */
  const toolsHost = $('#tools-3d'), still = $('#tools-still'), replay = $('#tools-replay');
  const labels = $$('.slabel'), leads = $$('#tools-lead path');
  function toolsModel() {
    const W = toolsHost.clientWidth, H = toolsHost.clientHeight, phone = window.innerWidth <= 640;
    const R = phone ? 14 : 16, P = 1.95 * R;
    const L = SL.lattice({ R, ox: 0, oy: 0, x0: -W * 0.62 - P, x1: W * 0.62 + P, y0: -H * 0.62 - P, y1: H * 0.62 + P });
    const maxD = Math.hypot(W / 2, H / 2);
    const T = { stop: 3700, end: 4900, tilt: 3500 };
    let rnd, sim, walk;
    // four squads, one per tracked scout (S01 to S04), each working its own patch of the field
    const SQ = [[-0.25, -0.2], [0.25, -0.2], [-0.25, 0.22], [0.25, 0.22]].map(([fx, fy]) => ({ x: fx * W, y: fy * H }));
    const rad = Math.min(W, H) * (phone ? 0.24 : 0.21);
    let squadOf;
    function reset() {
      rnd = SL.rng(19);
      sim = SL.sim(L, 29, 650);
      walk = L.V.map(v => Math.abs(v.x) < W / 2 - 14 && Math.abs(v.y) < H / 2 - 14);
      for (const c of L.cells) c.ping = -1e9;
      const n = phone ? 36 : 60;
      const used = new Set();
      squadOf = L.V.map(v => { let best = -1, bd = 1e9; SQ.forEach((c, k) => { const d = Math.hypot(v.x - c.x, v.y - c.y); if (d < bd) { bd = d; best = k; } }); return bd < rad ? best : -1; });
      for (let k = 0; k < n; k++) {
        const sq = k % 4, lead = k < 4;
        const pool = L.V.map((v, i) => i).filter(i => walk[i] && squadOf[i] === sq && !used.has(i) && (!lead || Math.hypot(L.V[i].x - SQ[sq].x, L.V[i].y - SQ[sq].y) < rad * 0.4));
        if (!pool.length) continue;
        const id = pool[(rnd() * pool.length) | 0];
        used.add(id);
        // the squad of the scout that ends up reporting (S03) is bright, like the four scouts themselves
        const a = sim.add(id, { kind: lead || sq === 2 ? 1 : 0, born: 100 + rnd() * 500, sq });
        const nb = L.V[id].nb.filter(j => walk[j] && squadOf[j] === sq);
        if (nb.length) sim.hop(a, nb[(rnd() * nb.length) | 0], a.born + 80 + rnd() * 300, 200 + rnd() * 80);
      }
    }
    function policy(a, at) {
      if (at > T.stop) return;                                     // rest where it is
      const v = L.V[a.from];
      if (rnd() < 0.42) { const cs = v.cells.filter(c => at - c.ping > 900); if (cs.length) cs[(rnd() * cs.length) | 0].ping = at; }
      const opts = v.nb.filter(j => j !== a.prev && walk[j] && squadOf[j] === a.sq);
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
    SL.drawAgents(g, M.sim, M.T.end, { r: M.phone ? 3.6 : 4.4, glyph: true, base: [0.8, 1] });
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
      try {
        const c = document.createElement('canvas'), gl = c.getContext('webgl2') || c.getContext('webgl');
        ok = !!gl;
        if (gl) { const ext = gl.getExtension('WEBGL_lose_context'); if (ext) ext.loseContext(); }
      } catch (e) { ok = false; }
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
        import('./tools3d.js').then(m => { toolsScene = m.createTools(toolsHost, toolsM, placeLabels); if (toolsScene) toolsScene.renderAt(toolsM.T.end); else drawToolsStill(toolsM); }).catch(() => { toolsScene = null; drawToolsStill(toolsM); });
      } else drawToolsStill(toolsM, !STATIC && !toolsPlayed);
    }, 200);
  });
  once($('#watch-mock'), playWatch);
  once($('#calls-mock'), playCall);
  once($('#room-mock'), playRoom);

  /* ---------- shared: a small lattice animation that plays once when seen, then settles ---------- */
  function lattice2D(cv, opts) {
    const g = cv.getContext('2d'); if (!g) return null;
    let W, H, d, L, sim, rnd, extra, raf = 0, played = false, onScreen = true, last = 0, parked = null;
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
    // plays once on its own wall clock, which only runs while the piece is on screen and the tab is visible; a slow
    // device gets fewer frames, never a longer animation
    function play() {
      played = true;
      setup();
      const T = opts.end, DT = 1000 / 60;
      let simT = 0;
      const loop = now => {
        raf = 0;
        if (!onScreen || document.hidden) { parked = loop; return; }
        const dt = last ? Math.min(500, now - last) : DT; last = now;
        const target = Math.min(T, simT + dt);
        while (simT + DT <= target + 0.01) { simT += DT; run(simT); }
        draw(simT);
        if (simT < T - DT) raf = requestAnimationFrame(loop);
        else if (opts.done) opts.done();
      };
      raf = requestAnimationFrame(loop);
    }
    const resume = () => { if (parked && !raf && onScreen && !document.hidden) { const f = parked; parked = null; last = 0; raf = requestAnimationFrame(f); } };
    if ('IntersectionObserver' in window) new IntersectionObserver(es => { for (const e of es) { onScreen = e.isIntersecting; resume(); } }, { threshold: 0 }).observe(cv.parentElement);
    document.addEventListener('visibilitychange', resume);
    setup();
    if (STATIC) { settleAt(opts.end); if (opts.done) opts.done(); }
    else { draw(0); once(cv.parentElement, final => { if (final) { settleAt(opts.end); if (opts.done) opts.done(); } else play(); }, opts.threshold || 0.45); }
    let lw = W;
    window.addEventListener('resize', () => {
      const w = cv.parentElement.clientWidth; if (w === lw) return; lw = w;
      if (raf) cancelAnimationFrame(raf); raf = 0; parked = null;
      if (played || STATIC) settleAt(opts.end); else { setup(); draw(0); }
    });
    return { settleAt, stop() { if (raf) cancelAnimationFrame(raf); raf = 0; parked = null; } };
  }
  const pick = (arr, rnd) => arr[(rnd() * arr.length) | 0];

  /* ---------- why now: the crowd's attention moves from the games cluster to the AI cluster ----------
     Two equal clusters of the honeycomb (a centre cell and two rings), one under each label. The crowd starts as the
     lit games cluster: one agent on every corner, its links drawn between the agents themselves. At 0.45s the whole
     cluster slides along the honeycomb to the AI cluster in one smooth move (one sine ease over 1.9s), the front a
     beat ahead of the back, so it stretches a little and gathers again, and its links travel with it: the shape never
     breaks apart. Behind it the games cluster stays as a quiet outline, and the corners it passes along the middle row
     keep seven dim agents, a trail from one cluster to the other. It lands whole: the AI centre cell lights and one
     ring opens around it. Settled by 3.1s, on that clean end picture. The reduced-motion still and ?t= frames show it. */
  (function attention() {
    const box = $('#attn'); if (!box || !SL) return;
    const cv = box.querySelector('canvas'), stage = box.querySelector('.attn-stage');
    const labA = box.querySelector('.attn-l.a1'), labB = box.querySelector('.attn-l.a2'), arrow = box.querySelector('.attn-arrow');
    const SQ3 = SL.SQ3, T = { go: 450, spread: 90, travel: 1900, end: 3100 };
    const easeS = x => { x = SL.clamp01(x); return 0.5 - 0.5 * Math.cos(Math.PI * x); };      // one gentle ease in and out
    const dxP = (A, B, P) => (B.x - A.x) / P;
    const CS6 = [], SN6 = [];
    for (let k = 0; k < 6; k++) { const an = Math.PI / 180 * (60 * k - 90); CS6.push(Math.cos(an)); SN6.push(Math.sin(an)); }
    function cluster(cx, cy, R, rings) {
      const P = 1.95 * R, Rc = P / SQ3, V = [], vm = new Map(), E = [], em = new Set(), cells = [];
      const key = (x, y) => Math.round(x * 2) + ':' + Math.round(y * 2);
      for (let r = -rings; r <= rings; r++) for (let q = -rings; q <= rings; q++) {
        if (Math.abs(q + r) > rings) continue;
        const x = cx + P * (q + r / 2), y = cy + P * (SQ3 / 2) * r, ids = [];
        for (let k = 0; k < 6; k++) {
          const vx = x + Rc * CS6[k], vy = y + Rc * SN6[k], kk = key(vx - cx, vy - cy);
          let id = vm.get(kk);
          if (id === undefined) { id = V.length; vm.set(kk, id); V.push({ x: vx, y: vy }); }
          ids.push(id);
        }
        for (let k = 0; k < 6; k++) { const u = ids[k], v = ids[(k + 1) % 6], ek = u < v ? u + ',' + v : v + ',' + u; if (!em.has(ek)) { em.add(ek); E.push([u, v, q === 0 && r === 0]); } }
        cells.push({ x, y, q, r });
      }
      return { V, E, cells, P, Rc };
    }
    const api = lattice2D(cv, {
      seed: 5, end: T.end, threshold: 0.5,
      height: W => W < 600 ? 250 : 330,
      setup(W, H) {
        const phone = W < 600, R = phone ? 8.5 : 15, P = 1.95 * R, Rc = P / SQ3;
        const k = Math.max(4, Math.round((W * (phone ? 0.56 : 0.6)) / P));     // the two clusters are k pitches apart
        const cy = phone ? H * 0.58 : H * 0.57;
        const A = { x: W / 2 - k * P / 2, y: cy }, B = { x: W / 2 + k * P / 2, y: cy };
        const CA = cluster(A.x, A.y, R, 2), CB = cluster(B.x, B.y, R, 2);
        const L = SL.lattice({ R, ox: A.x, oy: A.y, x0: -P, x1: W + P, y0: -P, y1: H + P });
        const dx = B.x - A.x;
        // the front leaves a beat before the back, so the cluster stretches a little in flight and gathers again
        const xs = CA.V.map(v => v.x), xmin = Math.min(...xs), xmax = Math.max(...xs);
        const dep = CA.V.map(v => T.go + (1 - (v.x - xmin) / Math.max(1, xmax - xmin)) * T.spread);
        const land = T.go + T.spread + T.travel;
        // the trail: six to eight distinct corners on the middle row, evenly spaced between the two clusters
        const trail = [], mEnd = Math.round(dxP(A, B, P)) - 4;
        let ms = null;
        for (const n of [7, 6, 8, 9, 5]) { for (const s0 of [3, 4]) if (!ms && (mEnd - s0) % (n - 1) === 0 && mEnd - s0 >= n - 1) ms = Array.from({ length: n }, (_, i) => s0 + i * (mEnd - s0) / (n - 1)); }
        if (!ms) ms = [...new Set(Array.from({ length: 7 }, (_, i) => Math.round(3 + i * (mEnd - 3) / 6)))];
        for (const m of ms) trail.push({ x: A.x + (m + 0.5) * P, y: A.y - Rc / 2 });
        // the quiet field, fading out well before every edge of the frame; the two clusters draw themselves
        const near = (c, o) => Math.hypot(c.x - o.x, c.y - o.y) < 2.6 * P;
        const top = phone ? 46 : 64;
        const fade = c => {
          const fx = Math.min(SL.sm(0, W * 0.1, c.x), 1 - SL.sm(W * 0.9, W, c.x));
          const fy = Math.min(SL.sm(top, top + 3.2 * P, c.y), 1 - SL.sm(H - 2.4 * P, H - 6, c.y));
          return Math.max(0, fx * fy);
        };
        const bg = document.createElement('canvas'), d = DPR();
        bg.width = Math.round(W * d); bg.height = Math.round(H * d);
        const gb = bg.getContext('2d'); gb.setTransform(d, 0, 0, d, 0, 0);
        SL.drawField(gb, L, c => (near(c, A) || near(c, B)) ? 0 : 0.95 * fade(c), {});
        // labels sit exactly over the two cluster centres
        if (labA && labB) {
          labA.style.left = A.x + 'px'; labB.style.left = B.x + 'px';
          if (arrow) requestAnimationFrame(() => {
            const sr = stage.getBoundingClientRect(), ra = labA.getBoundingClientRect(), rb = labB.getBoundingClientRect();
            arrow.style.left = (ra.right - sr.left + 14) + 'px'; arrow.style.right = (sr.right - rb.left + 18) + 'px';
          });
        }
        return { L, A, B, CA, CB, dx, dep, land, trail, P, Rc, phone, bg };
      },
      spawn() {},
      policy() {},
      draw(g, t, sim, X, W, H) {
        const { CA, CB, dx, dep, land, trail, P, phone } = X;
        g.drawImage(X.bg, 0, 0, W, H);
        const u = dep.map(d0 => easeS((t - d0) / T.travel));
        const pos = CA.V.map((v, i) => [v.x + dx * u[i], v.y]);
        const away = SL.sm(T.go, T.go + 500, t);                 // how far the crowd has left the games cluster
        const lit = SL.sm(land - 80, land + 260, t);              // the AI cluster has landed
        const HIVE = SL.COL.hive, TXT = SL.COL.text;
        const lines = (col, al, lw, segs) => { if (al <= 0.01 || !segs.length) return; g.strokeStyle = col; g.globalAlpha = Math.min(1, al); g.lineWidth = lw; g.beginPath(); for (const [x0, y0, x1, y1] of segs) { g.moveTo(x0, y0); g.lineTo(x1, y1); } g.stroke(); };
        g.lineCap = 'round';
        // the AI cluster waits as a faint outline; the games cluster stays behind as a quiet, legible outline
        lines(HIVE, 0.45, 1, CB.E.map(([a, b]) => [CB.V[a].x, CB.V[a].y, CB.V[b].x, CB.V[b].y]));
        lines(TXT, 0.3 * away, 1, CA.E.map(([a, b]) => [CA.V[a].x, CA.V[a].y, CA.V[b].x, CA.V[b].y]));
        // the travelling cluster: its links ride between its own agents, so the shape slides as one piece
        const ring = [], core = [];
        for (const [a, b, c] of CA.E) (c ? core : ring).push([pos[a][0], pos[a][1], pos[b][0], pos[b][1]]);
        lines(TXT, 0.5, phone ? 1.1 : 1.3, ring);
        lines(TXT, 0.62 + 0.38 * lit, phone ? 1.1 : 1.4, core);
        g.lineCap = 'butt'; g.globalAlpha = 1;
        // the AI centre cell lights as the cluster lands, and one ring opens around it
        if (lit > 0) {
          const cc = CB.cells.find(c => c.q === 0 && c.r === 0);
          g.globalAlpha = 0.16 * lit; g.fillStyle = TXT; g.beginPath(); SL.hexPath(g, cc.x, cc.y, (P / 1.95) * 0.9); g.fill();
          const e = (t - land) / 620;
          if (e > 0 && e < 1) { g.globalAlpha = 0.34 * (1 - e); g.strokeStyle = HIVE; g.lineWidth = 1; g.beginPath(); SL.hexPath(g, cc.x, cc.y, (P / 1.95) * (3.2 + 2.2 * SL.outCubic(e))); g.stroke(); }
          g.globalAlpha = 1;
        }
        // the trail: once the back of the cluster has passed a corner, a dim agent stays on it
        const back = Math.min(...pos.map(p => p[0]));
        const list = [];
        for (const p of trail) { const a = 0.9 * SL.sm(p.x, p.x + P, back); if (a > 0.01) list.push({ x: p.x, y: p.y, a, k: 0 }); }
        for (const p of pos) list.push({ x: p[0], y: p[1], a: 1, k: 1 });
        SL.drawGlyphs(g, list, { r: phone ? 2.7 : 4.3, lw: phone ? 0.9 : 1.1, head: phone ? 1.05 : 1.5 });
      }
    });
    if (api) window.__attnAt = ms => { api.stop(); api.settleAt(ms); };                 // frame renders and tests: draw the band at any time
  })();

  /* ---------- a small converge piece around an official mark: the pricing core and the final CTA ----------
     The agents route in along the honeycomb's channels, each neighbour lights as its first agent reaches it, the
     core's gold outline charges, and the official mark lands with its warm light. Plays once, settled under 3.2s. */
  function converge(cfg) {
    const { cv, mark, glow } = cfg;
    return lattice2D(cv, {
      seed: cfg.seed, end: cfg.end, threshold: 0.35, height: cfg.height,
      setup(W, H) {
        const phone = W <= 640, c = cfg.core(W, H, phone), R = c.R, P = 1.95 * R;
        const L = SL.lattice({ R, ox: c.x, oy: c.y, x0: -P, x1: W + P, y0: -P, y1: H + P });
        const boxes = cfg.boxes ? cfg.boxes() : [];
        const inBox = (x, y) => boxes.some(b => x > b[0] && x < b[2] && y > b[1] && y < b[3]);
        const maxD = c.maxD;
        const walk = L.V.map(v => !v.core && v.d < maxD * 0.95 && v.y > 6 && v.y < H - 6 && !inBox(v.x, v.y));
        const dist = new Int32Array(L.V.length).fill(-1), q = [];
        L.V.forEach((v, i) => { if (v.core) { dist[i] = 0; q.push(i); } });
        for (let h = 0; h < q.length; h++) for (const j of L.V[q[h]].nb) if (dist[j] < 0 && (walk[j] || L.V[j].core)) { dist[j] = dist[q[h]] + 1; q.push(j); }
        if (mark) Object.assign(mark.style, { left: (c.x - 3.75 * R) + 'px', top: (c.y - 3.75 * R) + 'px', width: 7.5 * R + 'px', height: 7.5 * R + 'px', marginLeft: '0', marginTop: '0' });
        if (glow) { const gw = c.glow[0], gh = c.glow[1], st = [[0, 0.34], [9, 0.25], [20, 0.14], [36, 0.065], [56, 0.024], [100, 0]];
          Object.assign(glow.style, { left: (c.x - gw) + 'px', top: (c.y - gh) + 'px', width: 2 * gw + 'px', height: 2 * gh + 'px', background: `radial-gradient(closest-side, ${st.map(([o, a]) => `rgba(245,197,66,${a}) ${o}%`).join(', ')})` }); }
        return { L, cx: c.x, cy: c.y, maxD, walk, dist, phone, R, inBox, absorbed: 0, total: 0 };
      },
      spawn(sim, rnd, X) {
        const ids = X.L.V.map((v, i) => i).filter(i => X.walk[i] && X.L.V[i].ring >= 3 && X.dist[i] > 0);
        const n = X.phone ? cfg.n[1] : cfg.n[0];
        const used = new Set();
        for (let k = 0; k < n && ids.length; k++) {
          let id = pick(ids, rnd); for (let tries = 0; tries < 12 && used.has(id); tries++) id = pick(ids, rnd);
          if (used.has(id)) continue; used.add(id);
          const h = X.dist[id];
          const a = sim.add(id, { kind: 1, born: rnd() * 260, hd: Math.max(70, Math.min(220, (cfg.arrive - rnd() * 300) / Math.max(1, h))) });
          const down = X.L.V[id].nb.filter(j => X.dist[j] >= 0 && X.dist[j] < h);
          if (down.length) sim.hop(a, pick(down, rnd), a.born + 60, a.hd);
          X.total++;
        }
      },
      policy(a, at, sim, rnd, X) {
        const v = X.L.V[a.from];
        for (const c of v.cells) if (c.ring === 1 && c.lit < -1e8) c.lit = at;
        if (v.core) { a.dead = true; X.absorbed++; return; }
        const down = v.nb.filter(j => X.dist[j] >= 0 && X.dist[j] < X.dist[a.from]);
        if (down.length) sim.hop(a, pick(down, rnd), at, a.hd);
      },
      draw(g, t, sim, X, W, H) {
        const hand = STATIC ? 1 : SL.clamp01((t - cfg.ignite) / 300);
        SL.drawField(g, X.L, c => c.ring <= 1 ? 0 : Math.max(0, 1 - SL.sm(X.maxD * 0.35, X.maxD, c.d)) * (X.inBox(c.x, c.y) ? 0.3 : 1) * (cfg.edge ? cfg.edge(c.x, c.y, W, H) : 1), {});
        SL.drawEdges(g, sim, t, { base: [0.4, 0.62], lw: 1.3 });
        if (hand < 1) {
          g.lineWidth = 1.5; g.strokeStyle = SL.COL.hive;
          for (const c of X.L.rings[1] || []) { if (c.lit < -1e8) continue; g.globalAlpha = SL.sm(c.lit, c.lit + 200, t) * (1 - hand); g.beginPath(); SL.hexPath(g, c.x, c.y, X.R * 0.97); g.stroke(); }
          g.globalAlpha = (0.35 + 0.6 * Math.min(1, X.absorbed / Math.max(1, X.total))) * (1 - hand); g.strokeStyle = SL.COL.gold; g.beginPath(); SL.hexPath(g, X.cx, X.cy, X.R * 0.825); g.stroke(); g.globalAlpha = 1;
        }
        SL.drawAgents(g, sim, t, { r: X.phone ? 3.6 : 4.4, glyph: true, base: [1, 1], lw: 1.1 });
        const bump = !STATIC && t >= cfg.ignite ? Math.sin(Math.PI * Math.pow(SL.clamp01((t - cfg.ignite) / 520), 0.7)) : 0;
        if (mark) { mark.style.opacity = STATIC ? '' : hand.toFixed(3); mark.style.transform = bump > 0.001 ? `scale(${(1 + 0.07 * bump).toFixed(4)})` : ''; }
        if (glow) { const gl = STATIC ? 1 : SL.outCubic(SL.clamp01((t - cfg.ignite) / 450)); glow.style.opacity = gl.toFixed(3); glow.style.transform = gl < 1 ? `scale(${(0.7 + 0.3 * gl).toFixed(3)})` : ''; }
      }
    });
  }

  /* pricing: a small field around the mark above "Early on purpose." */
  (function joinField() {
    const art = $('.join-art'), cv = $('#join-field'), mk = $('#join-mark'); if (!art || !cv || !SL) return;
    converge({ cv, mark: mk, seed: 13, end: 2600, ignite: 1900, arrive: 1650, n: [34, 22],
      height: W => W <= 640 ? 230 : 240,
      core: (W, H, phone) => ({ x: W / 2, y: phone ? 115 : 120, R: (phone ? 112 : 128) / 7.5, maxD: phone ? 200 : 280 }),
      edge: (x, y, W, H) => SL.sm(0, 40, y) * (1 - SL.sm(H - 110, H - 46, y)),
      boxes: () => [[-9999, 176, 9999, 9999]] });                        // the pill's band stays clear
  })();

  /* final CTA: the lit core returns above the last headline, as in the hero, with its warm light */
  (function finalField() {
    const sec = $('#final'), cv = $('#final-field'), mk = $('#final-mark'), spot = $('#final-core'); if (!sec || !cv || !SL || !spot) return;
    const glow = document.createElement('div'); glow.className = 'final-glow'; cv.before(glow);
    const start = () => converge({ cv, mark: mk, glow, seed: 21, end: 3000, ignite: 2200, arrive: 1900, n: [44, 24],
      height: () => sec.clientHeight,
      core: (W, H, phone) => {
        const sr = sec.getBoundingClientRect(), r = spot.getBoundingClientRect();
        const R = parseFloat(getComputedStyle(sec).getPropertyValue('--fR')) || (phone ? 20 : 26);
        return { x: W / 2, y: r.top - sr.top + (r.height - 26) / 2, R, maxD: phone ? 260 : 520, glow: phone ? [220, 170] : [460, 300] };
      },
      edge: (x, y, W, H) => SL.sm(0, 110, y) * (1 - SL.sm(H - 140, H - 10, y)),
      boxes: () => {
        const sr = sec.getBoundingClientRect(), out = [];
        sec.querySelectorAll('.h2 span, .btn-gold, .cancel, .final-facts li').forEach(el => { const r = el.getBoundingClientRect(); out.push([r.left - sr.left - 22, r.top - sr.top - 16, r.right - sr.left + 22, r.bottom - sr.top + 16]); });
        return out;
      } });
    // the copy's boxes are measured once the real fonts are in
    const fontsReady = (S.fontsReady && S.fontsReady.then) ? S.fontsReady : Promise.resolve();
    fontsReady.then(start);
  })();

  /* ---------- pricing: plan switch and Whop checkout stub ---------- */
  // Swap in the three Whop plan IDs (prefixed plan_) when Jesus has them. One line per plan.
  const PLANS = {
    founding: { name: 'Founding monthly', price: '$49', unit: '/mo', note: 'Forever, while you stay subscribed. Cancel whenever. 50 seats only.', sub: 'Cancel and rejoin after prices go up, and you pay the price at that time.', chip: 'Founding seat', gold: true, whopPlanId: null },
    standard: { name: 'Standard monthly', price: '$99', unit: '/mo', note: 'The price once the founding seats are gone.', sub: '', chip: 'Renews monthly', gold: false, whopPlanId: null },
    yearly:   { name: 'Yearly', price: '$990', unit: '/yr', note: '2 months free.', sub: '', chip: 'Billed yearly', gold: false, whopPlanId: null }
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
      $('#whop-status').textContent = 'Checkout for the ' + plan.name.toLowerCase() + ' plan opens here soon.';
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
    $('#pc-sub').textContent = p.sub;
    $('#pc-chip').textContent = p.chip;
    $('#pcard').classList.toggle('is-gold', p.gold);
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
