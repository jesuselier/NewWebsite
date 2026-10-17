/* Swarm A, Core Glow: page controller.
   Nav state, the revolving light on the gold Join Swarm buttons, the four product mocks (each plays once and settles
   inside 5s), the Custom AI tools scout field (a 2D model rendered by tools3d.js in Three.js, or drawn flat as a
   still), the why-now band, the pricing lock moment, the final field, and the pricing switch with the Whop checkout stub.
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
  // a mock's own clock: it only runs while the mock is on screen and the tab is visible, so a quick scroll past never
  // reaches the end unseen (each mock's steps are bounded under 5s of its own time)
  function mockClock(el) {
    watchVis(el);
    let t = 0, last = 0, iv = 0, q = [];
    const tick = () => {
      const now = performance.now(); if (shown(el)) t += Math.min(250, now - last); last = now;
      q = q.filter(([ms, f]) => { if (t >= ms) { f(); return false; } return true; });
      if (!q.length) { clearInterval(iv); iv = 0; }
    };
    return { at(ms, f) { q.push([ms, f]); if (!iv) { last = performance.now(); iv = setInterval(tick, 40); } }, reset() { t = 0; q = []; if (iv) { clearInterval(iv); iv = 0; } } };
  }

  /* ---------- nav ---------- */
  const nav = $('#nav');
  const onScroll = () => { if (nav) nav.classList.toggle('scrolled', window.scrollY > 8); };
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- the revolving light on the gold Join Swarm buttons ----------
     CSS draws it (core-glow.css): at rest a quiet 1px track in the kit's line colour; each time a button comes into
     view a gold comet runs one lap (2.4s) and goes out. It plays again on hover or keyboard focus once the last run has
     finished. The hero's own light waits for the swarm's signal (hero.js publishes window.SWARM.heroSignal: when and
     where on the ring the pulse lands, about 2.75s on desktop; with no route, just after ignition at the point nearest
     the core). There the button's fill lifts once (400ms, toward the kit's light gold and back) and the comet leaves
     the contact point for one 1.4s lap (Web Animations, seekable for ?t=). If hero.js failed, the hero ring plays the
     same 1.4s lap from the top at 2.2s, so everything still settles inside 5s. */
  const golds = $$('.btn-gold'), heroBtn = $('.btn-hero');
  const RING_MS = 2400, HERO_RING_AT = 2200, SIG_EASE = 'cubic-bezier(.33,.7,.3,1)', SIG_LAP = 1400;
  const GOLD = '#F5C542', GOLD_LIFT = 'color-mix(in srgb, #F5C542 62%, #FFF7CF)';
  const heroSig = () => (window.SWARM && window.SWARM.heroSignal) || null;
  const ringPlay = b => { b.classList.remove('ring-run', 'ring-done'); void b.offsetWidth; b.classList.add('ring-run'); b.dataset.ring = 'run'; };
  // the handoff: the comet leaves the contact point (pathLength units) for one lap; the fill lifts as it lands
  function sigAnims(b, pos, lap) {
    const head = b.querySelector('.r-head');
    if (!head || !head.animate) return null;
    const o = { duration: lap, easing: SIG_EASE, fill: 'forwards' };
    const tails = Array.from(b.querySelectorAll('.r-t')).map((el, k) => {
      const len = [15, 12, 9, 7, 5][k] || 5, al = [0.08, 0.12, 0.18, 0.24, 0.3][k] || 0.2;
      return el.animate([{ strokeDashoffset: String(len - pos), opacity: 0 }, { opacity: al, offset: 0.08 }, { opacity: al, offset: 0.84 }, { strokeDashoffset: String(len - pos - 100), opacity: 0 }], o);
    });
    return [
      head.animate([{ strokeDashoffset: String(4 - pos), opacity: 1 }, { opacity: 1, offset: 0.84 }, { strokeDashoffset: String(4 - pos - 100), opacity: 0 }], o),
      ...tails,
      b.animate([{ backgroundColor: GOLD }, { backgroundColor: GOLD_LIFT, offset: 0.35 }, { backgroundColor: GOLD }], { duration: 400, easing: 'ease-in-out', fill: 'none' })
    ];
  }
  let sigRun = null;
  const sigStop = () => { if (sigRun) { sigRun.forEach(a => a.cancel()); sigRun = null; } };
  function playSig(b, pos, lap) {
    b.classList.remove('ring-run', 'ring-done'); sigStop();
    sigRun = sigAnims(b, pos, lap);
    if (!sigRun) { ringPlay(b); return; }
    b.dataset.ring = 'run';
    sigRun[0].finished.then(() => { b.classList.add('ring-done'); b.dataset.ring = 'done'; sigStop(); }, () => {});
  }
  if (S.reduce) {
    // the still: the lit ring, no comet (CSS)
  } else if (S.freeze != null) {
    golds.forEach(b => { if (b !== heroBtn) b.classList.add('ring-done'); });
    // the hero's light follows the hero clock, so ?t= frames and frame renders show it travelling
    let seekT = S.freeze, seekKey = '';
    const seekRing = t => {
      seekT = t;
      if (!heroBtn) return;
      const sg = heroSig() || { land: HERO_RING_AT, pos: 0, lap: SIG_LAP };
      // before the pulse lands: the track only; from the landing: the handoff lap, paused at the hero's time
      if (t < sg.land) { sigStop(); seekKey = ''; heroBtn.classList.remove('ring-run', 'ring-done'); return; }
      const key = sg.pos.toFixed(3) + '|' + sg.lap;
      if (!sigRun || key !== seekKey) { sigStop(); sigRun = sigAnims(heroBtn, sg.pos, sg.lap); seekKey = key; }
      if (sigRun) sigRun.forEach(a => { a.pause(); a.currentTime = Math.max(0, Math.min(sg.lap, t - sg.land)); });
      heroBtn.classList.toggle('ring-done', t - sg.land >= sg.lap);
    };
    seekRing(S.freeze);
    requestAnimationFrame(() => seekRing(seekT));
    // the plan moves a little once the real fonts are in: follow it
    document.addEventListener('swarm:hero-signal', () => seekRing(seekT));
    const heroSeek = window.__heroSeek;
    if (typeof heroSeek === 'function') window.__heroSeek = t => { const r = heroSeek(t); seekRing(t); return r; };
  } else {
    let heroGate = false, heroTimer = 0;
    const fullyIn = b => { const r = b.getBoundingClientRect(), vh = window.innerHeight || 800; return r.top >= -2 && r.bottom <= vh + 2 && r.width > 0; };
    golds.forEach(b => {
      b.addEventListener('animationend', e => { if (e.animationName === 'ring-h') { b.dataset.ring = 'done'; b.classList.add('ring-done'); } });
      const again = () => { if (b.dataset.ring === 'done') ringPlay(b); };
      b.addEventListener('mouseenter', again);
      b.addEventListener('focus', () => { if (!b.matches || b.matches(':focus-visible')) again(); });
    });
    if ('IntersectionObserver' in window) {
      const ringIO = new IntersectionObserver(es => {
        for (const e of es) {
          const b = e.target;
          if (!e.isIntersecting) { if (b === heroBtn) sigStop(); b.classList.remove('ring-run', 'ring-done'); b.dataset.ring = ''; continue; }
          if (e.intersectionRatio >= 0.6 && !b.dataset.ring && (b !== heroBtn || heroGate)) ringPlay(b);
        }
      }, { threshold: [0, 0.6] });
      golds.forEach(b => ringIO.observe(b));
    }
    // the hero says when (hero.js, on its own clock): the light starts when the swarm's signal lands on the button; if
    // the button is not fully in view then, it plays the normal lap when it comes into view. A late fallback timer
    // covers a hero that never runs (hero.js failed)
    const landHero = () => {
      if (!heroBtn || heroGate) return;
      clearTimeout(heroTimer); heroGate = true;
      const sg = heroSig() || { land: HERO_RING_AT, pos: 0, lap: SIG_LAP };
      if (heroBtn.dataset.ring || !fullyIn(heroBtn)) return;
      playSig(heroBtn, sg.pos, sg.lap);
    };
    const scheduleHero = () => {
      if (!heroBtn || heroGate) return;
      clearTimeout(heroTimer);
      const sg = heroSig() || { land: HERO_RING_AT }, t0 = (window.SWARM && window.SWARM.heroT0) || performance.now();
      heroTimer = later(Math.max(0, t0 + sg.land + (heroSig() ? 4000 : 0) - performance.now()), landHero);
    };
    scheduleHero();
    document.addEventListener('swarm:hero-land', landHero);
    document.addEventListener('swarm:hero-signal', scheduleHero);
    document.addEventListener('swarm:hero-start', scheduleHero);
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
  const conInit = [['SCANNING', 'Scanning', 'the market'], ['SCANNING', 'Scanning', 'the watch list'], ['ANALYZING', 'Analyzing', 'where attention is moving'], ['SCANNING', 'Scanning', 'for what changed']];
  const conSteps = [
    [900, 0, 'ANALYZING', 'Analyzing', 'what changed this week'],
    [1900, 3, 'ANALYZING', 'Analyzing', 'where attention is moving'],
    [2900, 1, 'SCANNING', 'Scanning', 'the market'],
    [3900, 2, 'REPORTING', 'Reporting', 'to the watch list']
  ];
  // the event log: two lines already there, four more as the scouts work (illustrative times, newest on top)
  const logInit = [['09:12', 'S04', 'Scanning', 'for changes'], ['09:15', 'S02', 'Scanning', 'watch list']];
  const logSteps = [
    [900, '09:19', 'S01', 'Analyzing', 'this week'],
    [1900, '09:24', 'S04', 'Analyzing', 'attention'],
    [2900, '09:27', 'S02', 'Scanning', 'the market'],
    [3900, '09:31', 'S03', 'Reporting', 'to watch list']
  ];
  const conClock = mockClock(toolsMockEl);
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
  function pushLog(tm, id, st, tx, anim) {
    if (!conLog) return;
    const li = document.createElement('li');
    li.innerHTML = `<span class="ltm"></span><span class="lid"></span><span class="lbody"><span class="lst"></span> <span class="ltx"></span></span>`;
    li.querySelector('.ltm').textContent = tm; li.querySelector('.lid').textContent = id; li.querySelector('.lst').textContent = st; li.querySelector('.ltx').textContent = tx;
    if (anim) li.classList.add('enter');
    conLog.prepend(li);
    while (conLog.children.length > 6) conLog.lastElementChild.remove();
    if (anim) requestAnimationFrame(() => requestAnimationFrame(() => li.classList.remove('enter')));
  }
  function settleSpinners() { conRows.forEach(r => { const sp = r.querySelector('.spin'); setSpin(sp, -1); sp.classList.add('done'); }); }
  function setSeg(n) { conSegs.forEach((s, i) => s.classList.toggle('on', i < n)); }
  function resetLog() { if (!conLog) return; conLog.textContent = ''; logInit.forEach(s => pushLog(s[0], s[1], s[2], s[3], false)); }
  function playConsole(final) {
    if (final) { conSteps.forEach(s => applyCon(s, false)); resetLog(); logSteps.forEach(s => pushLog(s[1], s[2], s[3], s[4], false)); setSeg(3); settleSpinners(); conRows.forEach(r => r.classList.remove('hot')); return; }
    let k = 0;
    resetLog(); conClock.reset();
    conRows.forEach(r => r.querySelector('.spin').classList.remove('done'));
    const iv = setInterval(() => { if (!shown(toolsMockEl)) return; k = (k + 1) % 6; conRows.forEach((r, j) => setSpin(r.querySelector('.spin'), (k + j * 2) % 6)); }, 80);
    conSteps.forEach(s => conClock.at(s[0], () => applyCon(s, true)));
    logSteps.forEach(s => conClock.at(s[0], () => pushLog(s[1], s[2], s[3], s[4], true)));
    conClock.at(1200, () => setSeg(2)); conClock.at(3000, () => setSeg(3));
    conClock.at(4900, () => { clearInterval(iv); settleSpinners(); conRows.forEach(r => r.classList.remove('hot')); });
  }
  setSeg(1); settleSpinners();
  if (!STATIC) resetLog();

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
  const wlClock = mockClock($('#watch-mock'));
  function playWatch(final) {
    if (final) { wlSteps.forEach(s => s[1]()); return; }
    wlSteps.forEach(([ms, f]) => wlClock.at(ms, () => {
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
  const callClock = mockClock(callMock);
  function playCall(final) {
    if (final) { restBars(); csSet(CS1); return; }
    const r = SL.rng(11);
    const iv = setInterval(() => { if (!shown(callMock)) return; bars.forEach((b, i) => { const env = 0.35 + 0.65 * Math.abs(Math.sin(i * 0.7)); b.style.height = Math.round(18 + r() * 82 * env) + '%'; }); }, 110);
    callMock.classList.add('talking');                               // the speaking seats' bars move for about 4s
    callClock.at(1700, () => callMock.classList.add('cs-swap'));
    callClock.at(1920, () => { csSet(CS1); callMock.classList.remove('cs-swap'); });
    callClock.at(4300, () => { clearInterval(iv); restBars(); callMock.classList.remove('talking'); });
  }
  restBars(); csSet(STATIC ? CS1 : CS0);

  /* ---------- trader room ---------- */
  const roomMock = $('#room-mock'), msgs = $$('#room-mock .msg');
  const roomClock = mockClock(roomMock);
  function playRoom(final) {
    if (final) { msgs.forEach(m => m.classList.remove('pending')); return; }
    msgs.forEach((m, i) => roomClock.at(250 + i * 700, () => m.classList.remove('pending')));
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
      const n = phone ? 32 : 44;                                    // four squads of 8 (phones) or 11
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
    // each squad reads as one team: its scouts joined by a minimum spanning tree of 1px links at 30%
    function links() {
      const out = [];
      for (let q = 0; q < 4; q++) {
        const pts = sim.agents.filter(a => a.sq === q && !a.dead);
        if (pts.length < 2) continue;
        const inT = [pts[0]], rest = pts.slice(1);
        while (rest.length) {
          let bi = -1, bj = -1, bd = 1e18;
          for (let i = 0; i < inT.length; i++) for (let j = 0; j < rest.length; j++) { const dd = (inT[i].x - rest[j].x) ** 2 + (inT[i].y - rest[j].y) ** 2; if (dd < bd) { bd = dd; bi = i; bj = j; } }
          out.push([inT[bi], rest[bj]]); inT.push(rest[bj]); rest.splice(bj, 1);
        }
      }
      return out;
    }
    const M = { W, H, R, P, L, T, maxD, phone, get sim() { return sim; }, reset, links, advance: t => sim.advance(t, policy),
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
    const g = still.getContext('2d'); if (!g) return;                // no canvas: the mock keeps its console and labels
    g.setTransform(d, 0, 0, d, W / 2 * d, H / 2 * d); g.clearRect(-W, -H, 2 * W, 2 * H);
    SL.drawField(g, M.L, c => M.fade(c), {});
    if (fieldOnly) return;
    M.reset(); for (let t = 0; t <= M.T.end; t += 1000 / 60) M.advance(t);
    const tracked = new Set(M.sim.agents.slice(0, 4).map(a => M.L.V[a.from].cells[0]));
    SL.drawField(g, M.L, c => tracked.has(c) ? 1 : 0, { color: SL.COL.line, lw: 1.5 });
    g.globalAlpha = 0.3; g.strokeStyle = SL.COL.muted; g.lineWidth = 1; g.beginPath();
    for (const [a, b] of M.links()) { g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); }
    g.stroke(); g.globalAlpha = 1;
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
     lit games cluster: one agent on every corner, its links drawn between the agents. From 0.4s it flows to the AI
     cluster in three streams, one along each of three channels of the honeycomb: each agent leaves its corner in turn
     (the corners nearest the channel first), rides the channel at one steady speed a fixed beat behind the agent ahead
     (so nobody ever closes the gap), and takes the deepest free corner of the AI cluster, which fills from the back.
     Games links go dark as their agents leave; AI links light once both of their corners are filled, and the AI centre
     cell lights as the last agent lands. The channels stay as worn traces; no agent is left between the clusters.
     Settled by about 3.2s on desktop (2.2s on phones). Positions are a pure function of time, so the reduced-motion
     still and ?t= frames show the same end picture. */
  (function attention() {
    const box = $('#attn'); if (!box || !SL) return;
    const cv = box.querySelector('canvas'), stage = box.querySelector('.attn-stage');
    const labA = box.querySelector('.attn-l.a1'), labB = box.querySelector('.attn-l.a2'), arrow = box.querySelector('.attn-arrow');
    const SQ3 = SL.SQ3;
    const CS6 = [], SN6 = [];
    for (let k = 0; k < 6; k++) { const an = Math.PI / 180 * (60 * k - 90); CS6.push(Math.cos(an)); SN6.push(Math.sin(an)); }
    // a cluster: a centre cell and its rings, as lattice corners and links (corners shared between cells once)
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
    let END = 3200;
    const api = lattice2D(cv, {
      seed: 5, get end() { return END; }, threshold: 0.5,
      height: W => W < 600 ? 250 : 350,
      setup(W, H) {
        const phone = W < 600, R = phone ? 10 : 23, P = 1.95 * R, Rc = P / SQ3;
        const k = Math.max(5, Math.round((W * (phone ? 0.56 : 0.6)) / P));      // the two clusters are k pitches apart
        const cy = H * 0.58;
        const A = { x: W / 2 - k * P / 2, y: cy }, B = { x: W / 2 + k * P / 2, y: cy };
        const CA = cluster(A.x, A.y, R, 2), CB = cluster(B.x, B.y, R, 2);
        const L = SL.lattice({ R, ox: A.x, oy: A.y, x0: -P, x1: W + P, y0: -P, y1: H + P });
        const V = L.V;
        const near = (x, y) => { let best = -1, bd = 1e9; for (let i = 0; i < V.length; i++) { const dd = Math.abs(V[i].x - x) + Math.abs(V[i].y - y); if (dd < bd) { bd = dd; best = i; } } return best; };
        const ga = CA.V.map(v => near(v.x, v.y)), gb = CB.V.map(v => near(v.x, v.y));
        const inA = new Set(ga), inB = new Set(gb);
        // the channel a corner sits on: the zigzag between cell rows k and k+1
        const bnd = v => Math.floor((v.y - cy - 0.25 * Rc) / (1.5 * Rc));
        const lanes = [-3, -1, 1];
        const v0 = phone ? 0.3 : 0.5, gap = phone ? 42 : 50, go = 400;   // px per ms; the beat between agents in a stream
        const lane = lanes.map((kb, s) => {
          const onB = i => bnd(V[i]) === kb;
          const E = ga.filter(onB).sort((x, y) => V[y].x - V[x].x)[0], X = gb.filter(onB).sort((x, y) => V[x].x - V[y].x)[0];
          // the channel: along the zigzag only, from the games cluster's last corner to the AI cluster's first
          const prev = new Map([[E, -1]]), qq = [E];
          for (let h = 0; h < qq.length && !prev.has(X); h++) for (const j of V[qq[h]].nb) if (!prev.has(j) && onB(j) && V[j].x >= V[E].x - 1 && V[j].x <= V[X].x + 1) { prev.set(j, qq[h]); qq.push(j); }
          const ch = []; for (let i = X; i !== -1 && i !== undefined; i = prev.get(i)) ch.push(i);
          ch.reverse();
          return { s, kb, E, X, ch, off: [60, 0, 120][s] };
        });
        // each cluster's corners split between the three channels: breadth-first from the channel ends, inside the cluster
        // each corner goes to the channel nearest its height (so the three streams are about the same size), reached
        // breadth-first inside its own band; any corner a band cannot reach joins a neighbouring one
        const laneY = lane.map(l => l.ch.reduce((m, i) => m + V[i].y, 0) / l.ch.length);
        const want = i => { let b2 = 0; for (let s2 = 1; s2 < laneY.length; s2++) if (Math.abs(V[i].y - laneY[s2]) < Math.abs(V[i].y - laneY[b2])) b2 = s2; return b2; };
        function regions(set, starts) {
          const reg = new Map(), dep = new Map(), par = new Map(), qq = [];
          starts.forEach((st, s2) => { reg.set(st, s2); dep.set(st, 0); par.set(st, -1); qq.push(st); });
          for (let pass = 0; pass < 2; pass++) {
            for (let h = 0; h < qq.length; h++) {
              const i = qq[h];
              const nbs = V[i].nb.filter(j => set.has(j) && !reg.has(j) && (pass || want(j) === reg.get(i))).sort((x, y) => V[x].y - V[y].y);
              for (const j of nbs) { reg.set(j, reg.get(i)); dep.set(j, dep.get(i) + 1); par.set(j, i); qq.push(j); }
            }
          }
          return { reg, dep, par };
        }
        const RA = regions(inA, lane.map(l => l.E)), RB = regions(inB, lane.map(l => l.X));
        const chainTo = (Rg, i) => { const out = []; for (let k2 = i; k2 !== -1 && k2 !== undefined; k2 = Rg.par.get(k2)) out.push(k2); return out; };   // corner -> channel end
        const agents = [];
        let land = 0;
        for (const l of lane) {
          const gc = ga.filter(i => RA.reg.get(i) === l.s).sort((x, y) => RA.dep.get(x) - RA.dep.get(y) || V[x].y - V[y].y);
          const bc = gb.filter(i => RB.reg.get(i) === l.s).sort((x, y) => RB.dep.get(y) - RB.dep.get(x) || V[x].y - V[y].y);
          const n = Math.min(gc.length, bc.length);
          for (let j = 0; j < n; j++) {
            const pre = chainTo(RA, gc[j]);                                // games corner ... channel start
            const post = chainTo(RB, bc[j]).reverse();                     // channel end ... AI corner
            const path = pre.concat(l.ch.slice(1, -1), post);
            const cum = [0]; for (let i = 1; i < path.length; i++) cum.push(cum[i - 1] + Math.hypot(V[path[i]].x - V[path[i - 1]].x, V[path[i]].y - V[path[i - 1]].y));
            const preLen = cum[pre.length - 1];
            const tE = go + l.off + j * gap;                               // when it reaches the channel
            const dep = tE - preLen / v0, arr = dep + cum[cum.length - 1] / v0;
            agents.push({ path, cum, dep, arr, home: gc[j], dest: bc[j], s: l.s });
            land = Math.max(land, arr);
          }
        }
        END = Math.ceil(land + 520);
        // when each corner empties (games) and fills (AI)
        const leftAt = new Map(), filledAt = new Map();
        for (const a of agents) { leftAt.set(a.home, a.dep); filledAt.set(a.dest, a.arr); }
        // the channel edges, each with the time the first agent crosses it
        const chFirst = new Map();
        for (const a of agents) for (let i = 1; i < a.path.length; i++) { const k2 = a.path[i - 1] * 65536 + a.path[i], tt = a.dep + a.cum[i] / v0; if (!chFirst.has(k2) || tt < chFirst.get(k2)) chFirst.set(k2, tt); }
        const chEdges = []; for (const l of lane) for (let i = 1; i < l.ch.length; i++) chEdges.push([l.ch[i - 1], l.ch[i], chFirst.get(l.ch[i - 1] * 65536 + l.ch[i])]);
        // the quiet field, fading out well before every edge of the frame; the two clusters draw themselves
        const nearC = (c, o) => Math.hypot(c.x - o.x, c.y - o.y) < 2.7 * P;
        const top = phone ? 46 : 70;
        const fade = c => {
          const fx = Math.min(SL.sm(0, W * 0.1, c.x), 1 - SL.sm(W * 0.9, W, c.x));
          const fy = Math.min(SL.sm(top, top + 2.4 * P, c.y), 1 - SL.sm(H - 1.8 * P, H - 6, c.y));
          return Math.max(0, fx * fy);
        };
        const bg = document.createElement('canvas'), d = DPR();
        bg.width = Math.round(W * d); bg.height = Math.round(H * d);
        const gbx = bg.getContext('2d'); gbx.setTransform(d, 0, 0, d, 0, 0);
        SL.drawField(gbx, L, c => (nearC(c, A) || nearC(c, B)) ? 0 : 0.95 * fade(c), {});
        // labels sit exactly over the two cluster centres
        if (labA && labB) {
          labA.style.left = A.x + 'px'; labB.style.left = B.x + 'px';
          if (arrow) requestAnimationFrame(() => {
            const sr = stage.getBoundingClientRect(), ra = labA.getBoundingClientRect(), rb = labB.getBoundingClientRect();
            arrow.style.left = (ra.right - sr.left + 14) + 'px'; arrow.style.right = (sr.right - rb.left + 18) + 'px';
          });
        }
        return { L, V, A, B, CA, CB, ga, gb, agents, lane, chEdges, leftAt, filledAt, land, v0, P, Rc, phone, bg };
      },
      spawn() {},
      policy() {},
      draw(g, t, sim, X, W, H) {
        const { V, CA, CB, ga, gb, agents, chEdges, leftAt, filledAt, land, v0, P, phone } = X;
        g.drawImage(X.bg, 0, 0, W, H);
        const HIVE = SL.COL.hive, TXT = SL.COL.text;
        const lines = (col, al, lw, segs) => { if (al <= 0.01 || !segs.length) return; g.strokeStyle = col; g.globalAlpha = Math.min(1, al); g.lineWidth = lw; g.beginPath(); for (const [x0, y0, x1, y1] of segs) { g.moveTo(x0, y0); g.lineTo(x1, y1); } g.stroke(); };
        g.lineCap = 'round';
        const lit = SL.sm(land - 80, land + 260, t);
        // the clusters' outlines: the AI one waits faint; the games one stays behind as a quiet, legible outline
        lines(HIVE, 0.45, 1, CB.E.map(([a, b]) => [CB.V[a].x, CB.V[a].y, CB.V[b].x, CB.V[b].y]));
        lines(TXT, 0.3 * SL.sm(400, 1400, t), 1, CA.E.map(([a, b]) => [CA.V[a].x, CA.V[a].y, CA.V[b].x, CA.V[b].y]));
        // the channels: each edge wears in as the stream crosses it, and stays as a quiet trace
        const worn = [];
        for (const [u, v, tt] of chEdges) if (tt !== undefined && t >= tt) worn.push([V[u].x, V[u].y, V[v].x, V[v].y]);
        lines(HIVE, 0.9, phone ? 1 : 1.25, worn);
        // links: a games link holds while both its agents are home; an AI link lights once both corners are filled
        const linkA = [], linkB = [], coreB = [];
        CA.E.forEach(([a, b]) => { if (t < leftAt.get(ga[a]) && t < leftAt.get(ga[b])) linkA.push([CA.V[a].x, CA.V[a].y, CA.V[b].x, CA.V[b].y]); });
        CB.E.forEach(([a, b, c]) => { const fa = filledAt.get(gb[a]), fb = filledAt.get(gb[b]); if (fa !== undefined && fb !== undefined && t >= Math.max(fa, fb)) (c ? coreB : linkB).push([CB.V[a].x, CB.V[a].y, CB.V[b].x, CB.V[b].y]); });
        lines(TXT, 0.5, phone ? 1.1 : 1.3, linkA);
        lines(TXT, 0.55, phone ? 1.1 : 1.3, linkB);
        lines(TXT, 0.6 + 0.4 * lit, phone ? 1.1 : 1.45, coreB);
        g.lineCap = 'butt'; g.globalAlpha = 1;
        // the AI centre cell lights as the last agent lands, and one ring opens around it
        if (lit > 0) {
          const cc = CB.cells.find(c => c.q === 0 && c.r === 0);
          const e = (t - land) / 620;
          if (e > 0 && e < 1) { g.globalAlpha = 0.34 * (1 - e); g.strokeStyle = HIVE; g.lineWidth = 1; g.beginPath(); SL.hexPath(g, cc.x, cc.y, (P / 1.95) * (3.2 + 2.2 * SL.outCubic(e))); g.stroke(); }
          g.globalAlpha = 1;
        }
        // the agents, and a small ring as each one sets off and as each one lands
        const list = [], pt = [0, 0], rr = phone ? 2.8 : 4.8;
        g.lineWidth = 1; g.strokeStyle = SL.COL.muted;
        for (const a of agents) {
          const sAt = Math.max(0, Math.min(a.cum[a.cum.length - 1], (t - a.dep) * v0));
          let i = 1; while (i < a.cum.length - 1 && a.cum[i] < sAt) i++;
          const f = (sAt - a.cum[i - 1]) / Math.max(1e-6, a.cum[i] - a.cum[i - 1]), A0 = V[a.path[i - 1]], B0 = V[a.path[i]];
          pt[0] = A0.x + (B0.x - A0.x) * f; pt[1] = A0.y + (B0.y - A0.y) * f;
          const moving = t > a.dep && t < a.arr;
          list.push({ x: pt[0], y: pt[1], a: moving || t >= a.arr ? 1 : 0.9, k: 1 });
          for (const t0 of [a.dep, a.arr]) {
            const e = (t - t0) / 260;
            if (e > 0 && e < 1) { g.globalAlpha = 0.4 * (1 - e); g.beginPath(); SL.hexPath(g, pt[0], pt[1], rr + (phone ? 4 : 7) + (phone ? 5 : 9) * SL.outCubic(e)); g.stroke(); }
          }
        }
        g.globalAlpha = 1;
        SL.drawGlyphs(g, list, { r: rr, lw: phone ? 0.9 : 1.15, head: phone ? 1.1 : 1.7 });
      }
    });
    if (api) window.__attnAt = ms => { api.stop(); api.settleAt(ms); };                 // frame renders and tests: draw the band at any time
    window.__attnInfo = () => ({ end: END });
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

  /* ---------- pricing: "Lock in your seat" ----------
     The card sits on the honeycomb. When its price row comes into view, agents on the field around the card scan,
     decide and route along the honeycomb's channels to three sockets on the card's edge (left, right and top on
     desktop; three along the top on phones) and dock under the card, one by one. Each socket lights as agents dock.
     Once most have docked the card locks: the founding $49 turns gold (the view's one gold number), one ring wave
     runs out across the field, and the routes stay as quiet traces. Plays once, settles about 3.4s after it starts,
     then stops; it pauses offscreen and while the tab is hidden. No lit cell here: the final CTA carries the core.
     Under ?reduce=1, ?t, or without JS or canvas, the card shows its settled state. ?lock=<ms> freezes the moment at
     that time and window.__lockSeek(ms) steps it, for frame-accurate captures. No text is drawn on canvas. */
  (function lockMoment() {
    const stage = $('#lock-stage'), fc = $('#join-field'), ac = $('#join-agents'), card = $('#pcard');
    const row = $('.price-row'), joinBtnEl = $('#join-btn');
    const q = new URLSearchParams(location.search);
    const FREEZE = q.has('lock') && !S.reduce ? Math.max(0, parseFloat(q.get('lock')) || 0) : null;
    const T = { born: 280, commit0: 360, commit1: 900, arrive: 1900, lockMin: 1850, lockMax: 2450, wave: 1100, tail: 1000 };
    const DT = 1000 / 60;
    const settleDom = () => { if (card) card.classList.remove('lock-pending'); };
    if (!stage || !fc || !ac || !card || !SL || !fc.getContext) { settleDom(); return; }
    const fx = fc.getContext('2d'), ax = ac.getContext('2d');
    if (!fx || !ax) { settleDom(); return; }
    const { COL, sm, drawField, drawAgents } = SL;

    let W, Hf, d, phone, R, P, box, yP, Dm, L, V, walk, dist, ports, docks, dockOf, traces;
    let Sx, rnd, simT, locked, lockT, END, absorbed, routed, hits, pinged;
    let started = false, done = false, raf = 0, clock = 0, last = null, onScreen = true, lastW = 0;

    /* ---------- geometry: the card and its sockets, in stage pixels ---------- */
    function geometry() {
      d = DPR(); W = stage.clientWidth;
      const sr = stage.getBoundingClientRect(), cr = card.getBoundingClientRect(), rr = (row || card).getBoundingClientRect();
      box = { x0: cr.left - sr.left, y0: cr.top - sr.top, x1: cr.right - sr.left, y1: cr.bottom - sr.top };
      yP = (rr.top + rr.bottom) / 2 - sr.top;
      phone = W <= 640;
      R = parseFloat(getComputedStyle(stage).getPropertyValue('--lockR')) || (phone ? 16 : 20);
      P = 1.95 * R;
      Dm = phone ? 0 : Math.min(5.5 * P, box.x0 - 8);
      Hf = Math.min(stage.clientHeight, Math.ceil(phone ? box.y0 + 4 : yP + 9 * P));
      const cx = (box.x0 + box.x1) / 2, cw = box.x1 - box.x0;
      ports = phone ? [[cx - 0.3 * cw, box.y0, 0, 1], [cx, box.y0, 0, 1], [cx + 0.3 * cw, box.y0, 0, 1]]
                    : [[box.x0, yP, 1, 0], [cx, box.y0, 0, 1], [box.x1, yP, -1, 0]];     // x, y, inward normal
    }
    const dBox = (x, y) => { const dx = Math.max(box.x0 - x, 0, x - box.x1), dy = Math.max(box.y0 - y, 0, y - box.y1); return Math.hypot(dx, dy); };
    const outside = (x, y, m) => x < box.x0 - m || x > box.x1 + m || y < box.y0 - m || y > box.y1 + m;
    // the field: strongest beside the card's top half, fading with distance from the card and down the page
    const outA = (x, y) => phone
      ? sm(4, 36, y) * (1 - sm(box.y0 - 12, box.y0 + 2, y)) * Math.min(sm(0, 40, x), 1 - sm(W - 40, W, x))
      : (1 - sm(0.3 * Dm, Dm, dBox(x, y))) * (1 - sm(yP + 3 * P, yP + 8.6 * P, y)) * sm(4, 64, y);

    /* ---------- lattice, sockets and routes ---------- */
    function setup() {
      geometry();
      L = SL.lattice({ R, ox: (box.x0 + box.x1) / 2, oy: box.y0, x0: -P, y0: -P, x1: W + P, y1: Hf + P });
      V = L.V;
      walk = V.map(v => v.y > 8 && v.y < Hf - 6 && v.x > 6 && v.x < W - 6 && outside(v.x, v.y, 5) && outA(v.x, v.y) > 0.16);
      // each socket: the open corner nearest the socket point, then one last hop under the card's edge
      docks = []; dockOf = new Map();
      ports.forEach((pt, k) => {
        let best = -1, bd = 1e9;
        V.forEach((v, i) => { if (!walk[i]) return; const dd = Math.hypot(v.x - pt[0], v.y - pt[1]); if (dd < bd) { bd = dd; best = i; } });
        if (best < 0 || bd > 2.2 * P) return;
        // the socket sits square to the card's edge, straight across from that corner
        if (pt[2]) pt[1] = V[best].y; else pt[0] = V[best].x;
        const dv = { i: V.length, x: pt[0] + pt[2] * 14, y: pt[1] + pt[3] * 14, nb: [best], cells: [], dock: k };
        V.push(dv); V[best].nb.push(dv.i); walk.push(false);
        docks.push(dv); dockOf.set(dv.i, k);
      });
      dist = new Int32Array(V.length).fill(-1);
      const qq = [];
      for (const dv of docks) { dist[dv.i] = 0; qq.push(dv.i); }
      for (let h = 0; h < qq.length; h++) for (const j of V[qq[h]].nb) if (dist[j] < 0 && walk[j]) { dist[j] = dist[qq[h]] + 1; qq.push(j); }
    }

    /* ---------- the swarm: 36 agents on desktop, 12 on phones ---------- */
    const hopD = () => 170 + rnd() * 80;
    const pick = arr => arr[(rnd() * arr.length) | 0];
    function spawn() {
      for (const c of L.cells) { c.ping = -1e9; }
      rnd = SL.rng(29);
      Sx = SL.sim(L, 31, 600);
      const N = phone ? 12 : 36;
      const pool = [];
      V.forEach((v, i) => { if (walk[i] && dist[i] > 2) pool.push(i); });
      const used = new Set();
      let maxH = 1; for (const i of pool) maxH = Math.max(maxH, dist[i]);
      for (let n = 0; n < N && pool.length; n++) {
        let id = -1;
        for (let tries = 0; tries < 60; tries++) { const c = pick(pool); if (used.has(c) || V[c].nb.some(j => used.has(j))) continue; if (rnd() < 0.25 + 0.75 * outA(V[c].x, V[c].y)) { id = c; break; } }
        if (id < 0) continue;
        used.add(id);
        const far = dist[id] / maxH;
        const a = Sx.add(id, { kind: 0, will: rnd() < 0.78, born: 30 + rnd() * T.born, ct: T.commit0 + rnd() * (T.commit1 - T.commit0) * (1 - 0.5 * far), jit: rnd() * 240 });
        const nx = V[id].nb.filter(j => walk[j]);
        if (nx.length) Sx.hop(a, pick(nx), a.born + 40 + rnd() * 200, hopD());
      }
      pinged = []; locked = false; lockT = Infinity; END = Infinity; absorbed = 0; routed = 0; hits = ports.map(() => -1e9); traces = new Map();
      simT = 0;
    }

    function policy(a, at) {
      const v = V[a.from];
      if (v.dock !== undefined) { a.dead = true; absorbed++; hits[v.dock] = at; return; }
      if (a.mode === 'scan') {
        if (!locked && rnd() < 0.4) {
          let live = 0; for (const c of pinged) if (at - c.ping < 800) live++;
          if (live < (phone ? 3 : 7)) { const cs = v.cells; if (cs.length) { const c = pick(cs); if (at - c.ping > 800) { c.ping = at; pinged.push(c); if (pinged.length > 40) pinged.splice(0, pinged.length - 40); } } }
        }
        // the decision: a scout that commits turns bright and sets off for the nearest socket
        if (a.will && !locked && at >= a.ct && dist[a.from] > 0) {
          a.mode = 'route'; a.kind = 1; routed++;
          a.hd = Math.min(200, Math.max(60, Math.max(200, T.arrive + a.jit - at) / dist[a.from]));
          return policy(a, at);
        }
        if (locked) { if (a.fadeT < 0) { a.fadeT = at; a.fadeD = 300; } return; }
        const opts = v.nb.filter(j => j !== a.prev && walk[j]);
        if (!opts.length) return;
        Sx.hop(a, pick(opts), at + 30 + rnd() * 160, hopD());
        return;
      }
      if (locked && dist[a.from] > 1) { a.fadeT = at; a.fadeD = 200; return; }
      const down = v.nb.filter(j => dist[j] >= 0 && dist[j] < dist[a.from]);
      if (!down.length) { a.mode = 'scan'; a.kind = 0; return; }
      const nx = pick(down);
      const k = nx < a.from ? nx * 65536 + a.from : a.from * 65536 + nx;
      if (V[nx].dock === undefined) traces.set(k, [a.from, nx]);
      Sx.hop(a, nx, at, V[nx].dock !== undefined ? 150 : a.hd);
    }

    function step(t) {
      Sx.advance(t, policy);
      if (!locked && ((t >= T.lockMin && routed > 0 && absorbed >= 0.62 * routed) || t >= T.lockMax)) {
        locked = true; lockT = t; END = t + T.tail;
        for (const a of Sx.agents) {
          if (a.dead || a.fadeT >= 0) continue;
          if (a.mode === 'scan') { a.fadeT = t + 60 + rnd() * 380; a.fadeD = 300; }
        }
      }
    }
    const charge = () => Math.min(1, absorbed / Math.max(1, 0.62 * routed));

    /* ---------- drawing ---------- */
    function drawStatic() {
      fc.width = Math.round(W * d); fc.height = Math.round(Hf * d); fc.style.width = W + 'px'; fc.style.height = Hf + 'px';
      fx.setTransform(d, 0, 0, d, 0, 0); fx.clearRect(0, 0, W, Hf);
      drawField(fx, L, c => outside(c.x, c.y, -2) ? outA(c.x, c.y) : 0, {});
      ac.width = Math.round(W * d); ac.height = Math.round(Hf * d); ac.style.width = W + 'px'; ac.style.height = Hf + 'px';
    }
    // the sockets: where a route meets the card. Its last edge (into the card's edge) lights as agents dock, and once
    // the card locks one agent stays on the corner outside each socket, as in the hero's rest frame
    function drawSockets(g, t, rest) {
      const list = [];
      g.lineCap = 'round'; g.strokeStyle = COL.text; g.lineWidth = phone ? 1.25 : 1.5;
      for (const dv of docks) {
        const k = dv.dock, tv = V[dv.nb[0]], pt = ports[k];
        const flash = Math.max(0, 1 - (t - hits[k]) / 300);
        const al = rest ? 0.75 : (hits[k] > -1e8 ? 0.35 + 0.4 * charge() + 0.25 * flash : 0);
        if (al > 0.01) { g.globalAlpha = Math.min(1, al); g.beginPath(); g.moveTo(tv.x, tv.y); g.lineTo(pt[0], pt[1]); g.stroke(); }
        const stay = rest ? 0.9 : (locked ? 0.9 * sm(lockT + 200, lockT + 600, t) : 0);
        if (stay > 0.01) list.push({ x: tv.x, y: tv.y, a: stay, k: 1 });
      }
      g.globalAlpha = 1; g.lineCap = 'butt';
      if (list.length) SL.drawGlyphs(g, list, { r: phone ? 3.6 : 4.4, lw: 1.1 });
    }
    function drawTraces(g, al) {
      if (!traces.size || al <= 0) return;
      g.globalAlpha = al; g.strokeStyle = COL.hive; g.lineWidth = phone ? 1.1 : 1.25; g.lineCap = 'round'; g.beginPath();
      for (const [a, b] of traces.values()) { g.moveTo(V[a].x, V[a].y); g.lineTo(V[b].x, V[b].y); }
      g.stroke(); g.globalAlpha = 1; g.lineCap = 'butt';
    }
    function draw(t) {
      const g = ax;
      g.setTransform(d, 0, 0, d, 0, 0); g.clearRect(0, 0, W, Hf);
      if (t < END) {
        // the lock: one ring wave runs out from the card across the field
        if (locked && t < lockT + T.wave + 120) {
          drawField(g, L, c => {
            if (!outside(c.x, c.y, -2)) return 0;
            const e = t - (lockT + 40 + (dBox(c.x, c.y) / P) * 70);
            if (e < 0) return 0;
            const env = e < 90 ? e / 90 : Math.max(0, 1 - (e - 90) / 520);
            return env * 0.6 * outA(c.x, c.y);
          }, { color: COL.hive });
        }
        // sensing: a visited cell's outline brightens briefly
        if (pinged.length) drawField(g, L, c => { const e = t - c.ping; if (e < 0 || e > 800) return 0; return (e < 120 ? e / 120 : e < 280 ? 1 : 1 - (e - 280) / 520) * 0.55; }, { color: COL.hive });
        drawTraces(g, 0.5 * Math.min(1, t / 900));
        SL.drawEdges(g, Sx, t, { base: [0.22, 0.75], lw: phone ? 1.25 : 1.5 });
        drawAgents(g, Sx, t, { glyph: true, r: phone ? 3.6 : 4.4, lw: 1.1, base: [0.55, 1] });
      }
      drawSockets(g, t, false);
      card.classList.toggle('lock-pending', !locked);
    }
    function drawRest() {
      ax.setTransform(d, 0, 0, d, 0, 0); ax.clearRect(0, 0, W, Hf);
      drawTraces(ax, 0.55); drawSockets(ax, 0, true);
    }

    /* ---------- time ---------- */
    function advanceTo(t) { while (simT + DT <= t) { simT += DT; step(simT); } }
    function render(t) {
      advanceTo(Math.min(t, END));
      draw(Math.min(t, END));
      if (t >= END && !done) finish();
    }
    function finish() { done = true; if (raf) cancelAnimationFrame(raf); raf = 0; drawRest(); settleDom(); }
    // the settled card: run the pass offscreen, so the rest frame keeps the same routes as a live run
    function settle() { done = true; started = true; spawn(); advanceTo(T.lockMax + T.tail + 200); locked = true; drawRest(); settleDom(); }
    function seek(t) {
      if (t < simT || done) { done = false; spawn(); }
      render(t);
    }
    function loop(now) {
      raf = 0;
      if (done || !onScreen || document.hidden) return;
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
    const resume = () => { if (started && !done && !raf && onScreen && !document.hidden) { last = null; raf = requestAnimationFrame(loop); } };

    /* ---------- wiring ---------- */
    const FROZEN = FREEZE !== null;
    const STILL = !FROZEN && (STATIC || !('IntersectionObserver' in window));
    setup(); spawn(); drawStatic(); lastW = W;
    if (STILL) settle();
    else if (FROZEN) { started = true; seek(FREEZE); }
    else {
      draw(0);
      // plays once, when the price row is 75% in view
      const io = new IntersectionObserver(es => { for (const e of es) if (e.isIntersecting) { io.disconnect(); start(); } }, { threshold: 0.75 });
      io.observe(row || card);
      new IntersectionObserver(es => { for (const e of es) { onScreen = e.isIntersecting; resume(); } }).observe(stage);
      document.addEventListener('visibilitychange', () => { last = null; resume(); });
    }
    window.__lockDebug = () => ({ started, done, locked, lockT: Math.round(lockT), end: Math.round(END), clock: Math.round(clock), raf: !!raf, onScreen, n: Sx.agents.length, routed, absorbed, docks: docks.length, traces: traces.size, Dm, Hf });
    window.__lockSeek = t => {
      started = true;
      seek(t);
      if (joinBtnEl && joinBtnEl.getAnimations) joinBtnEl.getAnimations({ subtree: true }).forEach(a => { a.pause(); a.currentTime = Math.min(RING_MS, t); });
      return { t, locked, lockT, absorbed, routed };
    };
    // a new width rebuilds the field and shows the settled card (rotation mid-play jumps to the end); a new height only
    // redraws the field
    if ('ResizeObserver' in window) new ResizeObserver(() => {
      const w = stage.clientWidth;
      if (w === lastW) { if (!started || done) { setup(); spawn(); drawStatic(); if (done) settle(); else draw(0); } return; }
      lastW = w;
      if (raf) cancelAnimationFrame(raf); raf = 0;
      setup(); spawn(); drawStatic();
      if (FROZEN && !done) seek(FREEZE); else if (started || STILL) settle(); else draw(0);
    }).observe(stage);
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
        sec.querySelectorAll('.h2 span, .btn-gold, .cancel').forEach(el => { const r = el.getBoundingClientRect(); out.push([r.left - sr.left - 22, r.top - sr.top - 16, r.right - sr.left + 22, r.bottom - sr.top + 16]); });
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
