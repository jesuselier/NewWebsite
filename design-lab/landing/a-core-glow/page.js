/* Swarm A, Core Glow: page controller.
   Motion toggle, nav state, fact-chip marquee, the four product mocks (play once, settle inside 5s),
   the lazy Three.js patch in the Custom AI tools card, the why-now attention strip, the final field,
   and the pricing switch with the Whop checkout stub. */
(() => {
  'use strict';
  const S = window.SWARM || { reduce: false, freeze: null };
  const root = document.documentElement;
  const STATIC = S.reduce || S.freeze != null;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const SQ3 = Math.sqrt(3);

  /* ---------- motion toggle (WCAG 2.2.2) ---------- */
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
  const onScroll = () => nav && nav.classList.toggle('scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- fact chips: a duplicate list makes the phone marquee seamless ---------- */
  const facts = $('.facts');
  if (facts) { const c = facts.cloneNode(true); c.classList.add('facts-clone'); c.setAttribute('aria-hidden', 'true'); c.removeAttribute('aria-label'); facts.parentElement.appendChild(c); }

  /* ---------- play-once helper ---------- */
  function once(el, fn, threshold = 0.4) {
    if (!el) return;
    if (STATIC || !('IntersectionObserver' in window)) { fn(true); return; }
    const io = new IntersectionObserver(es => {
      for (const e of es) if (e.isIntersecting) { io.disconnect(); fn(motionOff); }
    }, { threshold });
    io.observe(el);
  }
  const later = (ms, f) => setTimeout(f, ms);

  /* ---------- six-dot hex spinners ---------- */
  const spinners = $$('.spin');
  spinners.forEach(sp => {
    for (let k = 0; k < 6; k++) {
      const i = document.createElement('i');
      const a = Math.PI / 180 * (60 * k - 90);
      i.style.left = (6 + Math.cos(a) * 5.5).toFixed(2) + 'px';
      i.style.top = (6 + Math.sin(a) * 5.5).toFixed(2) + 'px';
      sp.appendChild(i);
    }
  });
  function setSpin(sp, idx) { sp.querySelectorAll('i').forEach((d, k) => d.classList.toggle('on', k === idx)); }

  /* ---------- agent console ---------- */
  const conRows = $$('#console .crow');
  const conSteps = [
    [1100, 2, 'FLAGGED FOR REVIEW', 'Flagged', 'a change for Jesus to review'],
    [2200, 3, 'SCANNING', 'Reading', 'the market for the watch list'],
    [3300, 0, 'WATCHING', 'Watching', 'a name on the watch list'],
    [4300, 1, 'SYNCING', 'Preparing', 'notes for the weekly live call']
  ];
  function applyCon(st, fade) {
    const [, i, state, verb, obj] = st, r = conRows[i]; if (!r) return;
    const set = () => { r.dataset.state = state; r.querySelector('.cst').textContent = state.toLowerCase(); r.querySelector('.cverb').textContent = verb; r.querySelector('.cobj').textContent = obj; r.classList.remove('swap'); };
    if (fade) { r.classList.add('swap'); later(200, set); } else set();
  }
  function settleSpinners() { conRows.forEach(r => setSpin(r.querySelector('.spin'), r.dataset.state === 'IDLE' ? -1 : 0)); }
  function playConsole(final) {
    if (final) { conSteps.forEach(s => applyCon(s, false)); settleSpinners(); return; }
    let k = 0;
    const iv = setInterval(() => { k = (k + 1) % 6; conRows.forEach((r, j) => setSpin(r.querySelector('.spin'), r.dataset.state === 'IDLE' ? -1 : (k + j * 2) % 6)); }, 80);
    conSteps.forEach(s => later(s[0], () => applyCon(s, true)));
    later(4900, () => { clearInterval(iv); settleSpinners(); });
  }
  settleSpinners();

  /* ---------- watch list ---------- */
  const wlRows = $$('#watch-mock .wl-row');
  function wlSet(i, text, cls) {
    const r = wlRows[i]; if (!r) return;
    const c = r.querySelector('.wchip'); c.textContent = text; c.className = 'wchip' + (cls ? ' ' + cls : '');
    r.classList.toggle('rem', cls === 'gone');
  }
  const wlSteps = [
    [1400, () => { wlSet(1, 'Watching', ''); wlSet(4, 'Reviewing', 'rev'); }],
    [2800, () => { wlSet(4, 'Removed', 'gone'); wlSet(2, 'Reviewing', 'rev'); }],
    [4200, () => { wlSet(2, 'New this week', 'new'); wlSet(0, 'Reviewing', 'rev'); }]
  ];
  function playWatch(final) {
    if (final) { wlSteps.forEach(s => s[1]()); return; }
    wlSteps.forEach(([ms, f]) => later(ms, () => {
      const box = $('#watch-mock');
      box.querySelectorAll('.wchip').forEach(c => c.style.opacity = '0.2');
      later(200, () => { f(); box.querySelectorAll('.wchip').forEach(c => c.style.opacity = ''); });
    }));
  }

  /* ---------- live call bars ---------- */
  const bars = $$('#calls-mock .bars i');
  const restH = [30, 46, 62, 40, 74, 58, 36, 66, 82, 52, 38, 60, 44, 70, 50, 34, 56, 40];
  const restBars = () => bars.forEach((b, i) => b.style.height = restH[i % restH.length] + '%');
  function playBars(final) {
    if (final) { restBars(); return; }
    let s = 11; const r = () => (s = s * 16807 % 2147483647) / 2147483647;
    const iv = setInterval(() => bars.forEach((b, i) => { const env = 0.35 + 0.65 * Math.abs(Math.sin(i * 0.7 + s * 1e-9)); b.style.height = Math.round(18 + r() * 82 * env) + '%'; }), 110);
    later(4500, () => { clearInterval(iv); restBars(); });
  }
  restBars();

  /* ---------- trader room ---------- */
  const msgs = $$('#room-mock .msg');
  function playRoom(final) {
    if (final) { msgs.forEach(m => m.classList.remove('pending')); return; }
    msgs.forEach((m, i) => later(300 + i * 1000, () => m.classList.remove('pending')));
  }
  if (!STATIC) msgs.forEach(m => m.classList.add('pending'));

  /* ---------- Custom AI tools: lazy 3D hex patch, 2D still for reduced motion and fallback ---------- */
  const toolsHost = $('#tools-3d'), toolsMark = $('#tools-mark'), still = $('#tools-still'), replay = $('#tools-replay');
  function toolsLayout() {
    const W = toolsHost.clientWidth, H = toolsHost.clientHeight, phone = window.innerWidth <= 640;
    const R = phone ? 15 : 18;
    const coreX = (phone || W < 640) ? Math.round(W / 2) : Math.round((W - Math.min(W * 0.47, 400) - 14) / 2);
    const coreY = Math.round(H * (phone ? 0.5 : 0.54));
    return { W, H, R, coreX, coreY, rings: phone ? 5 : 6, phone };
  }
  function placeToolsMark(L) {
    const Sz = 7.5 * L.R;
    Object.assign(toolsMark.style, { width: Sz + 'px', height: Sz + 'px', left: (L.coreX - Sz / 2) + 'px', top: (L.coreY - Sz / 2) + 'px' });
  }
  function drawToolsStill() {
    if (!toolsHost || !still) return;
    const L = toolsLayout(), DPR = Math.min(window.devicePixelRatio || 1, 2);
    still.width = Math.round(L.W * DPR); still.height = Math.round(L.H * DPR);
    const g = still.getContext('2d'); g.setTransform(DPR, 0, 0, DPR, 0, 0); g.clearRect(0, 0, L.W, L.H);
    const P = 1.95 * L.R, N = L.rings, maxD = N * P;
    g.lineWidth = 1; g.strokeStyle = '#1C1C21';
    for (let q = -N; q <= N; q++) for (let r = -N; r <= N; r++) {
      const ring = (Math.abs(q) + Math.abs(q + r) + Math.abs(r)) / 2; if (ring > N || ring < 1) continue;
      const x = L.coreX + P * (q + r / 2), y = L.coreY + P * (SQ3 / 2) * r, d = Math.hypot(x - L.coreX, y - L.coreY);
      g.globalAlpha = Math.max(0.25, 1 - sm(0.55 * maxD, maxD * 1.02, d));
      g.beginPath();
      for (let k = 0; k < 6; k++) { const a = Math.PI / 180 * (60 * k - 90); const px = x + L.R * 0.97 * Math.cos(a), py = y + L.R * 0.97 * Math.sin(a); k ? g.lineTo(px, py) : g.moveTo(px, py); }
      g.closePath(); g.stroke();
    }
    g.globalAlpha = 1;
    placeToolsMark(L);
    toolsMark.style.opacity = '1';
    still.style.display = 'block';
  }
  let toolsScene = null, toolsVisible = false, toolsPlayed = false;
  function hasWebGL() { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } }
  function startTools() {
    if (!toolsHost) return;
    if (STATIC || !hasWebGL()) { drawToolsStill(); playConsole(true); return; }
    let loading = false;
    const loadIO = new IntersectionObserver(es => {
      if (!es.some(e => e.isIntersecting) || loading) return;
      loading = true; loadIO.disconnect();
      import('./tools3d.js').then(m => {
        const L = toolsLayout(); placeToolsMark(L);
        toolsScene = m.createTools(toolsHost, toolsMark, L);
        if (!toolsScene) throw new Error('no scene');
        still.style.display = 'none';
        toolsScene.renderAt(0);
        if (toolsVisible) playTools();
      }).catch(() => { drawToolsStill(); playConsole(true); });
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
      if (motionOff) { toolsScene.renderAt(5200); playConsole(true); replay.hidden = false; return; }
      playConsole(false);
      toolsScene.play(() => { replay.hidden = false; });
    } else toolsScene.resume();
  }
  if (replay) replay.addEventListener('click', () => {
    if (!toolsScene) return;
    replay.hidden = true;
    conRows.forEach((r, i) => { const init = [['SCANNING', 'Scanning', 'the watch list'], ['WATCHING', 'Watching', 'where attention is moving'], ['SYNCING', 'Comparing', "with last week's review"], ['IDLE', 'Waiting', 'for the next scan']][i]; applyCon([0, i, ...init], false); });
    playConsole(false);
    toolsScene.replay(() => { replay.hidden = false; });
  });
  startTools();
  once($('#tools-mock'), final => { if (!toolsScene && (STATIC || final)) playConsole(true); });
  once($('#watch-mock'), playWatch);
  once($('#calls-mock'), playBars);
  once($('#room-mock'), playRoom);

  /* ---------- why now: the crowd's attention moves from games to AI ---------- */
  (function attention() {
    const box = $('#attn'); if (!box) return;
    const cv = box.querySelector('canvas'), g = cv.getContext('2d'); if (!g) return;
    let W, H, DPR, A, B, ag = [], basinR, cellR, phone;
    function setup() {
      let s = 5; const r = () => (s = s * 16807 % 2147483647) / 2147483647;
      DPR = Math.min(window.devicePixelRatio || 1, 2); W = box.clientWidth; H = cv.clientHeight || 210;
      cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
      phone = W < 600;
      A = { x: W * (phone ? 0.21 : 0.2), y: H * 0.5 }; B = { x: W * (phone ? 0.77 : 0.8), y: H * 0.5 };
      cellR = phone ? 9 : 13; basinR = cellR * 1.95 * 2.2;
      const N = phone ? 46 : 84; ag = [];
      for (let i = 0; i < N; i++) {
        const stay = r() < 0.2;
        const ang0 = r() * 6.283, rr0 = Math.sqrt(r()) * basinR * 0.82;
        const ang1 = r() * 6.283, rr1 = Math.sqrt(r()) * basinR * 0.82;
        ag.push({ stay, sx: A.x + Math.cos(ang0) * rr0, sy: A.y + Math.sin(ang0) * rr0 * 0.8, ex: B.x + Math.cos(ang1) * rr1, ey: B.y + Math.sin(ang1) * rr1 * 0.8, delay: r() * 1.7, dur: 1.4 + r() * 0.9, lat: (r() - 0.5) * (phone ? 26 : 44), hd: r() * 6.283 });
      }
    }
    function pos(a, t) {
      if (a.stay) return [a.sx, a.sy, 0];
      const e = sm(0, 1, (t - a.delay) / a.dur);
      const cx = (a.sx + a.ex) / 2, cy = Math.min(a.sy, a.ey) - H * 0.42 + a.lat;
      const u = e, v = 1 - u;
      return [v * v * a.sx + 2 * v * u * cx + u * u * a.ex, v * v * a.sy + 2 * v * u * cy + u * u * a.ey, e];
    }
    function hexAt(x, y, r) { for (let k = 0; k < 6; k++) { const an = Math.PI / 180 * (60 * k - 90); const px = x + r * Math.cos(an), py = y + r * Math.sin(an); k ? g.lineTo(px, py) : g.moveTo(px, py); } g.closePath(); }
    function basin(c, lit) {
      const P = cellR * 1.95;
      g.lineWidth = 1; g.strokeStyle = '#1C1C21';
      for (let q = -3; q <= 3; q++) for (let r = -3; r <= 3; r++) {
        const ring = (Math.abs(q) + Math.abs(q + r) + Math.abs(r)) / 2; if (ring > 3 || ring === 0) continue;
        g.globalAlpha = ring === 3 ? 0.45 : 1; g.beginPath(); hexAt(c.x + P * (q + r / 2), c.y + P * (SQ3 / 2) * r, cellR * 0.97); g.stroke();
      }
      g.globalAlpha = lit; g.strokeStyle = '#55555B'; g.beginPath(); hexAt(c.x, c.y, cellR * 0.97); g.stroke();
    }
    function draw(t) {
      g.setTransform(DPR, 0, 0, DPR, 0, 0); g.clearRect(0, 0, W, H);
      let moved = 0, n = 0; for (const a of ag) if (!a.stay) { moved += sm(0, 1, (t - a.delay) / a.dur); n++; } moved /= n || 1;
      basin(A, 1 - 0.6 * moved); basin(B, 0.35 + 0.65 * moved);
      g.globalAlpha = 1; g.strokeStyle = '#232328'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(A.x, A.y - basinR * 0.7); g.quadraticCurveTo(W / 2, A.y - H * 0.5, B.x, B.y - basinR * 0.7); g.stroke();
      const groups = [[], [], []];   // resting, moving, stayed behind
      for (const a of ag) { const p = pos(a, t), q = pos(a, t - 0.07); groups[a.stay ? 2 : (p[2] > 0.02 && p[2] < 0.98 ? 1 : 0)].push([p, q, a]); }
      const col = ['#EEEBE4', '#EEEBE4', '#8E8A80'], ta = [0.3, 0.55, 0.22], ha = [0.85, 1, 0.55];
      for (let i = 0; i < 3; i++) {
        if (!groups[i].length) continue;
        g.globalAlpha = ta[i]; g.strokeStyle = col[i]; g.beginPath();
        for (const [p, q, a] of groups[i]) {
          let dx = p[0] - q[0], dy = p[1] - q[1], L = Math.hypot(dx, dy);
          if (L < 0.3) { dx = Math.cos(a.hd); dy = Math.sin(a.hd); L = 1; }
          const len = i === 1 ? Math.min(18, 4 + L * 1.4) : 5;
          g.moveTo(p[0], p[1]); g.lineTo(p[0] - dx / L * len, p[1] - dy / L * len);
        }
        g.stroke();
        g.globalAlpha = ha[i]; g.fillStyle = col[i]; g.beginPath();
        for (const [p] of groups[i]) g.rect(p[0] - 1.25, p[1] - 1.25, 2.5, 2.5);
        g.fill();
      }
      g.globalAlpha = 1;
    }
    setup(); draw(STATIC ? 10 : 0);
    once(box, final => {
      if (final) { draw(10); return; }
      let t0 = null;
      const loop = now => { if (t0 === null) t0 = now; const t = (now - t0) / 1000; draw(t); if (t < 4.2) requestAnimationFrame(loop); else draw(10); };
      requestAnimationFrame(loop);
    }, 0.5);
    let lw = W; window.addEventListener('resize', () => { if (box.clientWidth !== lw) { lw = box.clientWidth; setup(); draw(10); } });
  })();

  /* ---------- final CTA: a quiet honeycomb field, no lit cell ---------- */
  (function finalField() {
    const sec = $('#final'), cv = $('#final-field'); if (!sec || !cv) return;
    function draw() {
      const DPR = Math.min(window.devicePixelRatio || 1, 2), W = sec.clientWidth, H = sec.clientHeight;
      cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR); cv.style.width = W + 'px'; cv.style.height = H + 'px';
      const g = cv.getContext('2d'); g.setTransform(DPR, 0, 0, DPR, 0, 0); g.clearRect(0, 0, W, H);
      const R = W <= 640 ? 22 : 34, P = 1.95 * R, cx = W / 2, cy = H / 2, maxD = Math.hypot(W / 2, H / 2);
      const rq = Math.ceil(maxD / P) + 2;
      g.strokeStyle = '#1C1C21'; g.lineWidth = 1;
      const buckets = new Map();
      for (let q = -rq; q <= rq; q++) for (let r = -rq; r <= rq; r++) {
        const x = cx + P * (q + r / 2), y = cy + P * (SQ3 / 2) * r;
        if (x < -P || x > W + P || y < -P || y > H + P) continue;
        const d = Math.hypot((x - cx) * 0.8, y - cy);
        const a = Math.round((1 - sm(0.15 * maxD, 0.85 * maxD, d)) * Math.min(sm(0, 120, y), 1 - sm(H - 120, H, y)) * 20) / 20;
        if (a < 0.05) continue;
        let b = buckets.get(a); if (!b) buckets.set(a, b = []); b.push([x, y]);
      }
      for (const [a, list] of buckets) {
        g.globalAlpha = a; g.beginPath();
        for (const [x, y] of list) for (let k = 0; k < 6; k++) { const an = Math.PI / 180 * (60 * k - 90); const px = x + R * 0.97 * Math.cos(an), py = y + R * 0.97 * Math.sin(an); k ? g.lineTo(px, py) : g.moveTo(px, py); if (k === 5) g.closePath(); }
        g.stroke();
      }
      g.globalAlpha = 1;
    }
    draw();
    let lw = sec.clientWidth; window.addEventListener('resize', () => { if (sec.clientWidth !== lw) { lw = sec.clientWidth; draw(); } });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
  })();

  /* ---------- pricing: plan switch and Whop checkout stub ---------- */
  // Swap in the three Whop plan IDs (prefixed plan_) when Jesus has them. One line per plan.
  const PLANS = {
    founding: { name: 'Founding monthly', price: '$49', unit: '/mo', note: 'Forever. Cancel whenever. 50 seats only.', chip: '50 seats only', gold: true, whopPlanId: null },
    standard: { name: 'Standard monthly', price: '$99', unit: '/mo', note: 'The price once the founding seats are gone.', chip: '', gold: false, whopPlanId: null },
    yearly:   { name: 'Yearly', price: '$990', unit: '/yr', note: '2 months free.', chip: '2 months free', gold: false, whopPlanId: null }
  };
  window.SWARM_PLANS = PLANS;
  let currentPlan = 'founding', mounted = null;

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
    if (slot && slot.dataset.state !== 'placeholder-idle' && $('#whop-status').textContent) mountCheckout(key);
  }
  $$('.seg-switch input').forEach(inp => inp.addEventListener('change', () => { if (inp.checked) showPlan(inp.value); }));
  const joinBtn = $('#join-btn');
  if (joinBtn) joinBtn.addEventListener('click', () => {
    mountCheckout(currentPlan);
    const slot = $('#whop-checkout');
    slot.scrollIntoView({ behavior: S.reduce ? 'auto' : 'smooth', block: 'center' });
    slot.focus({ preventScroll: true });
  });
})();
