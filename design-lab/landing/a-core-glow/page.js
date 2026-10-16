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
  const RING_MS = 3600, HERO_RING_AT = 2350;               // hero clock: the six paths land from 2340ms, the core ignites at 2600ms
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
    const fontsReady = (S.fontsReady && S.fontsReady.then) ? S.fontsReady : Promise.resolve();
    fontsReady.then(() => later(150 + HERO_RING_AT, () => { heroGate = true; if (heroBtn && !heroBtn.dataset.ring && fullyIn(heroBtn)) ringPlay(heroBtn); }));
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
    while (conLog.children.length > 4) conLog.lastElementChild.remove();
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
  const CS0 = ['LIVE', 'UP NEXT', 'IN QUEUE', 'IN QUEUE'], CS1 = ['REVIEWED', 'LIVE', 'UP NEXT', 'IN QUEUE'];
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
    msgs.forEach((m, i) => later(300 + i * 900, () => m.classList.remove('pending')));
    // the typing dots move while the messages arrive, then rest
    if (roomMock) { roomMock.classList.add('room-typing'); later(3600, () => roomMock.classList.remove('room-typing')); }
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
    // plays once on its own clock, which only runs while the piece is on screen and the tab is visible
    function play() {
      played = true;
      const T = opts.end, DT = 1000 / 60;
      let simT = 0;
      const loop = now => {
        raf = 0;
        if (!onScreen || document.hidden) { parked = loop; return; }
        const dt = last ? Math.min(100, now - last) : DT; last = now;
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
    window.addEventListener('resize', () => { const w = cv.parentElement.clientWidth; if (w !== lw) { lw = w; if (raf) cancelAnimationFrame(raf); raf = 0; parked = null; settleAt(opts.end); } });
    return { settleAt };
  }
  const pick = (arr, rnd) => arr[(rnd() * arr.length) | 0];

  /* ---------- why now: the crowd moves from the games basin to the AI basin ----------
     The crowd starts packed in the 2021 games basin. From 0.3s, four in five set off one after another and stream
     across the field along the honeycomb's channels to a free corner in the AI basin, so the AI basin fills from the
     middle out; the rest stay behind. Lit edges trace the current. Everything rests by 4.6s. */
  (function attention() {
    const box = $('#attn'); if (!box || !SL) return;
    const cv = box.querySelector('canvas');
    lattice2D(cv, {
      seed: 5, end: 4600, threshold: 0.5,
      height: W => W < 600 ? 250 : 330,
      setup(W, H) {
        const phone = W < 600, R = phone ? 9 : 17, P = 1.95 * R;
        const A = { x: W * (phone ? 0.22 : 0.2), y: H * (phone ? 0.58 : 0.56) }, B = { x: W * (phone ? 0.78 : 0.8), y: A.y };
        const L = SL.lattice({ R, ox: W / 2, oy: A.y, x0: -P, x1: W + P, y0: -P, y1: H + P });
        const rad = (phone ? 3.1 : 3.3) * P;
        for (const c of L.cells) { c.inA = Math.hypot(c.x - A.x, c.y - A.y) < rad; c.inB = Math.hypot(c.x - B.x, c.y - B.y) < rad; }
        const inA = L.V.map(v => v.cells.length === 3 && v.cells.every(c => c.inA));
        const inB = L.V.map(v => v.cells.length === 3 && v.cells.every(c => c.inB));
        const walk = L.V.map(v => v.cells.length === 3 && v.y > 8 && v.y < H - 8);
        // landing corners in the AI basin, nearest the middle first
        const targets = L.V.map((v, i) => i).filter(i => inB[i]).sort((i, j) => Math.hypot(L.V[i].x - B.x, L.V[i].y - B.y) - Math.hypot(L.V[j].x - B.x, L.V[j].y - B.y));
        const fields = new Map();
        const field = tg => {
          if (fields.has(tg)) return fields.get(tg);
          const dist = new Int32Array(L.V.length).fill(-1), q = [tg]; dist[tg] = 0;
          for (let h = 0; h < q.length; h++) for (const j of L.V[q[h]].nb) if (dist[j] < 0 && walk[j]) { dist[j] = dist[q[h]] + 1; q.push(j); }
          fields.set(tg, dist); return dist;
        };
        return { L, A, B, rad, inA, inB, walk, targets, field, phone, W, H, P, moved: 0, movers: 0 };
      },
      spawn(sim, rnd, X) {
        const ids = X.L.V.map((v, i) => i).filter(i => X.inA[i]);
        for (let i = ids.length - 1; i > 0; i--) { const j = (rnd() * (i + 1)) | 0; [ids[i], ids[j]] = [ids[j], ids[i]]; }
        const n = Math.min(ids.length, X.phone ? 54 : 96);
        const movers = Math.min(Math.round(n * 0.8), X.targets.length);
        X.movers = movers;
        for (let k = 0; k < n; k++) {
          const id = ids[k], go = k < movers ? 300 + 1500 * (k / Math.max(1, movers - 1)) + rnd() * 120 : Infinity;
          const a = sim.add(id, { kind: 0, born: rnd() * 260, go, tg: k < movers ? X.targets[k] : -1 });
          const nb = X.L.V[id].nb.filter(j => X.inA[j]);
          if (nb.length) sim.hop(a, pick(nb, rnd), a.born + 80 + rnd() * 300, 220 + rnd() * 80);
        }
      },
      policy(a, at, sim, rnd, X) {
        const V = X.L.V, v = V[a.from];
        if (a.mode === 'scan' && at >= a.go) { a.mode = 'move'; a.kind = 1; X.moved++; }
        if (a.mode === 'move') {
          const dist = X.field(a.tg);
          if (dist[a.from] === 0) { a.mode = 'there'; return; }
          const down = v.nb.filter(j => dist[j] >= 0 && dist[j] < dist[a.from]);
          if (down.length) { sim.hop(a, pick(down, rnd), at, X.phone ? 72 + rnd() * 14 : 58 + rnd() * 12); return; }
          a.mode = 'there'; return;
        }
        if (a.mode === 'there' || at > 3400) return;
        if (rnd() < 0.25) { const cs = v.cells.filter(c => c.inA && at - c.ping > 800); if (cs.length) pick(cs, rnd).ping = at; }
        const opts = v.nb.filter(j => j !== a.prev && X.inA[j]);
        if (opts.length) sim.hop(a, pick(opts, rnd), at + 60 + rnd() * 260, 220 + rnd() * 80);
      },
      draw(g, t, sim, X, W, H) {
        let there = 0; for (const a of sim.agents) if (a.mode === 'there') there++;
        const k = X.movers ? there / X.movers : 0;
        const fade = c => Math.max(0, 1 - SL.sm(W * 0.4, W * 0.56, Math.abs(c.x - W / 2))) * (1 - SL.sm(H - 40, H, c.y)) * SL.sm(0, 30, c.y);
        SL.drawField(g, X.L, c => c.inA || c.inB ? 0 : 0.9 * fade(c), {});
        SL.drawField(g, X.L, c => c.inA ? 1 - 0.5 * k : 0, { color: SL.COL.line });
        SL.drawField(g, X.L, c => c.inB ? 0.55 + 0.45 * k : 0, { color: SL.COL.line });
        SL.drawField(g, X.L, c => { const e = t - c.ping; if (e < 0 || e > 800) return 0; return (e < 120 ? e / 120 : e < 280 ? 1 : 1 - (e - 280) / 520) * 0.7; }, { color: SL.COL.hive });
        SL.drawEdges(g, sim, t, { base: [0.3, 0.5], lw: X.phone ? 1.1 : 1.3 });
        SL.drawAgents(g, sim, t, { r: X.phone ? 2 : 2.6, base: [0.7, 1] });
      }
    });
  })();

  /* ---------- pricing: a small field around the mark; the swarm routes in and the core lights ---------- */
  (function joinField() {
    const art = $('.join-art'), cv = $('#join-field'), mk = $('#join-mark'); if (!art || !cv || !SL) return;
    lattice2D(cv, {
      seed: 13, end: 2600, threshold: 0.35,
      height: W => W <= 640 ? 240 : 300,
      setup(W, H) {
        const phone = W <= 640, S_ = phone ? 112 : 128, R = S_ / 7.5, P = 1.95 * R;
        const cx = W / 2, cy = phone ? 120 : 150;
        const L = SL.lattice({ R, ox: cx, oy: cy, x0: cx - 520, x1: cx + 520, y0: -P, y1: H + P });
        const maxD = phone ? 200 : 300;
        const walk = L.V.map(v => !v.core && v.d < maxD * 0.95);
        const dist = new Int32Array(L.V.length).fill(-1), q = [];
        L.V.forEach((v, i) => { if (v.core) { dist[i] = 0; q.push(i); } });
        for (let h = 0; h < q.length; h++) for (const j of L.V[q[h]].nb) if (dist[j] < 0 && (walk[j] || L.V[j].core)) { dist[j] = dist[q[h]] + 1; q.push(j); }
        return { L, cx, cy, maxD, walk, dist, phone, R, absorbed: 0 };
      },
      spawn(sim, rnd, X) {
        const ids = X.L.V.map((v, i) => i).filter(i => X.walk[i] && X.L.V[i].ring >= 3 && X.dist[i] > 0 && X.L.V[i].y > 6 && X.L.V[i].y < (X.phone ? 234 : 294));
        const n = X.phone ? 22 : 34;
        for (let k = 0; k < n; k++) {
          const id = pick(ids, rnd), h = X.dist[id];
          const a = sim.add(id, { kind: 1, born: rnd() * 260, hd: Math.max(70, Math.min(200, (1650 - rnd() * 250) / Math.max(1, h))) });
          const down = X.L.V[id].nb.filter(j => X.dist[j] >= 0 && X.dist[j] < h);
          sim.hop(a, pick(down, rnd), a.born + 60, a.hd);
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
        const lit = t > 1900 || STATIC;
        const hand = STATIC ? 1 : SL.clamp01((t - 1900) / 380);
        SL.drawField(g, X.L, c => c.ring <= 1 ? 0 : Math.max(0, 1 - SL.sm(X.maxD * 0.35, X.maxD, c.d)), {});
        SL.drawEdges(g, sim, t, { base: [0.4, 0.75], lw: 1.4 });
        if (hand < 1) {
          g.lineWidth = 1.5; g.strokeStyle = SL.COL.hive;
          for (const c of X.L.rings[1] || []) { if (c.lit < -1e8) continue; g.globalAlpha = SL.sm(c.lit, c.lit + 200, t) * (1 - hand); g.beginPath(); SL.hexPath(g, c.x, c.y, X.R * 0.97); g.stroke(); }
          g.globalAlpha = (0.35 + 0.6 * Math.min(1, X.absorbed / 20)) * (1 - hand); g.strokeStyle = SL.COL.gold; g.beginPath(); SL.hexPath(g, X.cx, X.cy, X.R * 0.825); g.stroke(); g.globalAlpha = 1;
        }
        SL.drawAgents(g, sim, t, { r: 2.6 });
        if (mk) { mk.classList.toggle('lit', lit); mk.style.opacity = STATIC ? '' : hand.toFixed(3); mk.style.transform = hand < 1 ? `scale(${(0.93 + 0.07 * hand).toFixed(4)})` : ''; }
      }
    });
  })();

  /* ---------- final CTA: the field, with a short pass of the swarm when it comes into view ---------- */
  (function finalField() {
    const sec = $('#final'), cv = $('#final-field'); if (!sec || !cv || !SL) return;
    lattice2D(cv, {
      seed: 21, end: 4500, threshold: 0.35,
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
          const a = sim.add(id, { kind: rnd() < 0.5 ? 1 : 0, born: rnd() * 500, fadeT: 3100 + rnd() * 500, fadeD: 420 });
          const nb = X.L.V[id].nb.filter(j => X.walk[j]);
          if (nb.length) sim.hop(a, pick(nb, rnd), a.born + rnd() * 200, 220 + rnd() * 80);
        }
      },
      policy(a, at, sim, rnd, X) {
        if (at > 3300) return;
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
    founding: { name: 'Founding monthly', price: '$49', unit: '/mo', note: 'Forever. Cancel whenever. 50 seats only.', chip: 'Founding seat', gold: true, whopPlanId: null },
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
