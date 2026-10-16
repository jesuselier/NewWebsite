// Swarm | Three Cycles: page components (classic script, deferred).
// Crowd under the curve, the YOU tick, founder timeline, agent swimlanes, watch list, live call bars,
// plan switch and the Whop checkout stub. No words are drawn into any canvas.
(function () {
  'use strict';
  var M = window.SwarmMotion || { reduce: false, paused: false, on: function () {}, set: function () {} };
  var REDUCE = M.reduce;
  var smooth = function (a, b, x) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  var clamp01 = function (x) { return Math.min(1, Math.max(0, x)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var pageT0 = performance.now();

  // shared pause buttons
  document.querySelectorAll('[data-motion-toggle]').forEach(function (b) {
    b.addEventListener('click', function () { M.set(!M.paused); });
  });

  // nav background after scrolling
  var nav = document.getElementById('nav');
  var onScrollNav = function () { nav.classList.toggle('scrolled', window.scrollY > 8); };
  window.addEventListener('scroll', onScrollNav, { passive: true }); onScrollNav();

  // a tiny visibility helper
  function watch(el, fn, opts) {
    if (!('IntersectionObserver' in window)) { fn(true); return; }
    new IntersectionObserver(function (es) { es.forEach(function (e) { fn(e.isIntersecting, e); }); }, opts || { threshold: 0 }).observe(el);
  }

  // seeded random so stills are repeatable
  function rng(seed) { var s = seed; return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; }

  // ------------------------------------------------------------ 2. the crowd under the curve
  (function crowd() {
    var box = document.getElementById('crowd'); if (!box) return;
    var cv = document.getElementById('crowdCanvas'), ctx = cv.getContext('2d');
    var you = document.getElementById('youTick');
    var zones = [].slice.call(document.querySelectorAll('.zone'));
    var W, H, dpr, base, cx, sig, A, agents = [], visible = false, raf = 0, running = false, last = null, tc = 0, drawn = REDUCE ? 1 : 0, lastDraw = 0;
    var MUT = '142,138,128', TXT = '238,235,228';
    function curveY(x) { return base - A * Math.exp(-0.5 * Math.pow((x - cx) / sig, 2)); }
    function layout() {
      var r = box.getBoundingClientRect();
      W = Math.max(300, r.width); H = W < 640 ? 230 : 320;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.height = H + 'px';
      base = H - 16; cx = W / 2; sig = W * 0.205; A = H - 44;
      var rnd = rng(11), n = W < 640 ? 96 : 228;
      var counts = [Math.round(n * 0.3), Math.round(n * 0.42), 0]; counts[2] = n - counts[0] - counts[1];
      agents = [];
      for (var z = 0; z < 3; z++) {
        var x0 = z === 0 ? W * 0.035 : W * z / 3 + 7, x1 = z === 2 ? W * 0.965 : W * (z + 1) / 3 - 7;
        var made = 0, guard = 0;
        while (made < counts[z] && guard++ < 6000) {
          var x = lerp(x0, x1, rnd());
          var top = curveY(x) + 7, bot = base - 5;
          if (bot - top < 4) continue;
          if (rnd() > (base - curveY(x)) / A + 0.18) continue;
          var y = lerp(top, bot, rnd());
          var ok = true;
          for (var i = 0; i < agents.length; i++) { var o = agents[i]; if ((o.hx - x) * (o.hx - x) + (o.hy - y) * (o.hy - y) < 56) { ok = false; break; } }
          if (!ok) continue;
          agents.push({ z: z, hx: x, hy: y, x: x, y: y, px: x, py: y, hd: -Math.PI / 2, jx: 0, jy: 0, jt: rnd() * 400, out: 0, outT: 1500 + rnd() * 6000, outS: -1, outDur: 1600 + rnd() * 1100, sx: (rnd() - 0.5) * 22, rnd: rnd() });
          made++;
        }
      }
    }
    function update(t, dt) {
      var herdX = Math.sin(t * 0.00042) * Math.min(26, W * 0.028), herdY = Math.sin(t * 0.00084 + 1.1) * 5;
      var herdVX = Math.cos(t * 0.00042), herdVY = Math.cos(t * 0.00084 + 1.1) * 0.4;
      var herdHd = Math.atan2(herdVY, herdVX);
      // right curve: hold, step out together, sit on the baseline, step back in. 7.6 s cycle
      var rp = (t % 7600) / 7600;
      var rOut = rp < 0.6 ? 0 : rp < 0.68 ? smooth(0.6, 0.68, rp) : rp < 0.84 ? 1 : rp < 0.95 ? 1 - smooth(0.84, 0.95, rp) : 0;
      var rMoving = (rp > 0.6 && rp < 0.68) || (rp > 0.84 && rp < 0.95);
      var midOut = 0; for (var k = 0; k < agents.length; k++) if (agents[k].z === 1 && agents[k].outS >= 0) midOut++;
      for (var i = 0; i < agents.length; i++) {
        var a = agents[i]; a.px = a.x; a.py = a.y;
        if (a.z === 0) {
          var x = a.hx + herdX + Math.sin(t * 0.002 + a.rnd * 9) * 0.8, y = a.hy + herdY;
          var cy = curveY(x) + 4; if (y < cy) y = cy; if (y > base - 3) y = base - 3;
          a.x = x; a.y = y; a.hd = herdHd;
        } else if (a.z === 1) {
          a.jt -= dt;
          if (a.jt <= 0) { a.jx = (Math.random() - 0.5) * 9; a.jy = (Math.random() - 0.5) * 7; a.jt = 140 + Math.random() * 300; }
          // stepping out to the sidelines, one by one
          if (a.outS < 0 && t > a.outT && midOut < agents.length * 0.06) { a.outS = t; midOut++; }
          var o = 0;
          if (a.outS >= 0) {
            var e = t - a.outS;
            o = e < 380 ? smooth(0, 380, e) : e < 380 + a.outDur ? 1 : 1 - smooth(380 + a.outDur, 980 + a.outDur, e);
            if (e > 1000 + a.outDur) { a.outS = -1; a.outT = t + 3500 + Math.random() * 7000; o = 0; }
          }
          var tx = a.hx + a.jx + a.sx * o, ty = lerp(a.hy + a.jy, base - 2, o);
          var nx = a.x + (tx - a.x) * 0.32, ny = a.y + (ty - a.y) * 0.32;
          if (Math.hypot(nx - a.x, ny - a.y) > 0.4) a.hd = Math.atan2(ny - a.y, nx - a.x);
          a.x = nx; a.y = ny;
        } else {
          var ty2 = lerp(a.hy, base - 2, rOut);
          a.x = a.hx; a.y = ty2;
          a.hd = rMoving ? (rp < 0.75 ? Math.PI / 2 : -Math.PI / 2) : -Math.PI / 3;
        }
      }
    }
    function draw(t) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      // zone dividers and baseline
      ctx.lineWidth = 1; ctx.strokeStyle = '#232328';
      ctx.beginPath(); ctx.moveTo(0, base + 0.5); ctx.lineTo(W, base + 0.5); ctx.stroke();
      for (var z = 1; z < 3; z++) { var x = Math.round(W * z / 3) + 0.5; ctx.beginPath(); ctx.moveTo(x, base); ctx.lineTo(x, curveY(x) + 6); ctx.stroke(); }
      // curve (draws once)
      var p = drawn;
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W * p + 2, H); ctx.clip();
      ctx.strokeStyle = 'rgba(' + TXT + ',0.6)'; ctx.lineWidth = 1.25;
      ctx.beginPath();
      for (var i = 0; i <= 200; i++) { var xx = W * i / 200, yy = curveY(xx); i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
      ctx.stroke(); ctx.restore();
      // agents: 2 px heads with a short tail along their heading
      for (var k = 0; k < agents.length; k++) {
        var a = agents[k];
        var vis = clamp01((W * p - a.x) / 40); if (vis <= 0) continue;
        var col = a.z === 2 ? TXT : MUT;
        var tl = a.z === 2 ? 7 : 6;
        ctx.strokeStyle = 'rgba(' + col + ',' + (0.42 * vis).toFixed(3) + ')'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(a.x - Math.cos(a.hd) * tl, a.y - Math.sin(a.hd) * tl); ctx.lineTo(a.x, a.y); ctx.stroke();
        ctx.fillStyle = 'rgba(' + col + ',' + ((a.z === 2 ? 1 : 0.85) * vis).toFixed(3) + ')';
        ctx.fillRect(a.x - 1, a.y - 1, 2, 2);
      }
    }
    // YOU travels once, left curve to right curve, when the section first comes into view, then parks on the
    // right curve (the promise). Reduced motion shows it parked.
    var youX = REDUCE ? 0.78 : 0.1, youState = REDUCE ? 2 : 0;
    var zls = [].slice.call(box.querySelectorAll('.crowd-zl li'));
    function placeYou() {
      if (!W) return;
      var x = W * youX, y = curveY(x);
      you.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) translate(-50%, -100%)';
      var zi = Math.min(2, Math.floor(x / (W / 3)));
      zones.forEach(function (el, i) { el.classList.toggle('on', i === zi); });
      zls.forEach(function (el, i) { el.classList.toggle('on', i === zi); });
    }
    function travelYou() {
      if (youState) return; youState = 1;
      var t0 = performance.now(), D = 2800;
      var ease = function (u) { return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };
      (function f(now) {
        var u = clamp01((now - t0) / D);
        youX = lerp(0.1, 0.78, ease(u)); placeYou();
        if (u < 1) requestAnimationFrame(f); else youState = 2;
      })(t0);
    }
    function frame(now) {
      raf = 0; if (!running) return;
      var dt = last === null ? 16 : Math.min(80, now - last); last = now;
      tc += dt;
      if (drawn < 1) drawn = clamp01(drawn + dt / 1500);
      update(tc, dt);
      if (now - lastDraw > 30) { draw(tc); lastDraw = now; }
      raf = requestAnimationFrame(frame);
    }
    function sync() {
      var should = visible && !REDUCE && !document.hidden && !M.paused;
      if (should && !running) { running = true; last = null; if (!raf) raf = requestAnimationFrame(frame); }
      else if (!should && running) { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }
    }
    layout(); update(0, 16); draw(0); placeYou();
    if (REDUCE) { update(5200, 16); draw(5200); }
    watch(box, function (v) { visible = v; sync(); });
    watch(box, function (v) { if (v) travelYou(); }, { threshold: 0.35 });
    document.addEventListener('visibilitychange', sync); M.on(sync);
    var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { layout(); update(tc, 16); draw(tc); placeYou(); }, 160); });
  })();

  // ------------------------------------------------------------ 6.1 agent swimlanes (logic analyzer)
  (function lanes() {
    var box = document.getElementById('lanes'); if (!box) return;
    var cvWrap = box.querySelector('.lane-cv'), cv = document.getElementById('lanesCanvas'), ctx = cv.getContext('2d');
    var idsEl = box.querySelector('.lane-ids'), statesEl = box.querySelector('.lane-states');
    var clock = document.getElementById('laneClock');
    var STATES = ['Scanning', 'Watching', 'Flagged for review', 'Idle', 'Syncing'];
    var DUR = [[1200, 3600], [1500, 4200], [700, 1300], [800, 2600], [420, 900]];
    var WEIGHT = [0.38, 0.27, 0.07, 0.16, 0.12];
    var WINDOW = 22000, ROW = 26, rnd = rng(23);
    var nLanes = 8, lanesData = [], W = 0, H = 0, dpr = 1, visible = false, running = false, raf = 0, lastDraw = 0;
    function pick(prev) {
      for (;;) { var u = rnd(), s = 0, acc = 0; for (s = 0; s < 5; s++) { acc += WEIGHT[s]; if (u < acc) break; } s = Math.min(4, s); if (s !== prev) return s; }
    }
    function extend(l, until) {
      while (l.end < until) {
        var s = pick(l.segs.length ? l.segs[l.segs.length - 1].s : -1);
        var d = lerp(DUR[s][0], DUR[s][1], rnd());
        l.segs.push({ s: s, t0: l.end, t1: l.end + d }); l.end += d;
      }
      while (l.segs.length && l.segs[0].t1 < until - WINDOW - 4000) l.segs.shift();
    }
    function build() {
      idsEl.innerHTML = ''; statesEl.innerHTML = ''; lanesData = [];
      for (var i = 0; i < nLanes; i++) {
        var li = document.createElement('li'); li.textContent = 'Scout ' + (i < 9 ? '0' : '') + (i + 1); idsEl.appendChild(li);
        var ls = document.createElement('li'); statesEl.appendChild(ls);
        var l = { segs: [], end: -WINDOW - rnd() * 3000, el: ls, cur: -1 };
        extend(l, 4000); lanesData.push(l);
      }
    }
    function layout() {
      var r = cvWrap.getBoundingClientRect();
      W = Math.max(100, r.width); H = nLanes * ROW; dpr = Math.min(2, window.devicePixelRatio || 1);
      cvWrap.style.height = H + 'px';
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    }
    function rr(x, y, w, h, r) {
      if (w < 0.5) return;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2)); else ctx.rect(x, y, w, h);
    }
    function draw(now) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      var x0t = now - WINDOW;
      // time ticks every 2 s, quiet
      ctx.strokeStyle = 'rgba(35,35,40,0.9)'; ctx.lineWidth = 1;
      for (var tt = Math.ceil(x0t / 2000) * 2000; tt < now; tt += 2000) { var tx = Math.round((tt - x0t) / WINDOW * W) + 0.5; ctx.beginPath(); ctx.moveTo(tx, 0); ctx.lineTo(tx, H); ctx.stroke(); }
      for (var i = 0; i < lanesData.length; i++) {
        var l = lanesData[i]; extend(l, now + 6000);
        var cy = i * ROW + ROW / 2;
        for (var j = 0; j < l.segs.length; j++) {
          var sg = l.segs[j]; if (sg.t1 < x0t || sg.t0 > now) continue;
          var xa = Math.max(0, (sg.t0 - x0t) / WINDOW * W) + 1, xb = Math.min(W, (Math.min(sg.t1, now) - x0t) / WINDOW * W) - 1, w = xb - xa;
          if (w <= 0) continue;
          switch (sg.s) {
            case 0: ctx.fillStyle = 'rgba(142,138,128,0.5)'; rr(xa, cy - 4, w, 8, 3); ctx.fill(); break;
            case 1: ctx.fillStyle = 'rgba(238,235,228,0.86)'; rr(xa, cy - 4, w, 8, 3); ctx.fill(); break;
            case 2: ctx.fillStyle = 'rgba(238,235,228,0.16)'; rr(xa + 0.5, cy - 5.5, w - 1, 11, 3); ctx.fill(); ctx.strokeStyle = '#EEEBE4'; ctx.lineWidth = 1; ctx.stroke(); break;
            case 3: ctx.fillStyle = '#232328'; ctx.fillRect(xa, cy - 1, w, 2); break;
            case 4: ctx.setLineDash([2, 2]); ctx.strokeStyle = 'rgba(142,138,128,0.9)'; ctx.lineWidth = 1; rr(xa + 0.5, cy - 3.5, w - 1, 7, 3); ctx.stroke(); ctx.setLineDash([]); break;
          }
          if (sg.t0 <= now && sg.t1 > now && l.cur !== j + sg.t0) {
            l.cur = j + sg.t0; l.el.textContent = STATES[sg.s]; l.el.dataset.s = String(sg.s);
          }
        }
      }
      // the visitor's own "now"
      ctx.fillStyle = 'rgba(238,235,228,0.7)'; ctx.fillRect(W - 1, 0, 1, H);
      var secs = Math.floor((performance.now() - pageT0) / 1000);
      clock.textContent = (secs / 60 < 10 ? '0' : '') + Math.floor(secs / 60) + ':' + (secs % 60 < 10 ? '0' : '') + (secs % 60);
    }
    var simNow = 0, lastReal = null;
    function frame(ts) {
      raf = 0; if (!running) return;
      var dt = lastReal === null ? 16 : Math.min(100, ts - lastReal); lastReal = ts; simNow += dt;
      if (ts - lastDraw > 40) { draw(simNow); lastDraw = ts; }
      raf = requestAnimationFrame(frame);
    }
    function sync() {
      var should = visible && !REDUCE && !document.hidden && !M.paused;
      if (should && !running) { running = true; lastReal = null; if (!raf) raf = requestAnimationFrame(frame); }
      else if (!should && running) { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }
    }
    function init() { nLanes = window.innerWidth < 640 ? 6 : 8; build(); layout(); simNow = 0; draw(0); }
    init();
    watch(box, function (v) { visible = v; sync(); });
    document.addEventListener('visibilitychange', sync); M.on(sync);
    var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { var want = window.innerWidth < 640 ? 6 : 8; if (want !== nLanes) init(); else { layout(); draw(simNow); } }, 160); });
    setInterval(function () { if (!running) { var secs = Math.floor((performance.now() - pageT0) / 1000); clock.textContent = (secs / 60 < 10 ? '0' : '') + Math.floor(secs / 60) + ':' + (secs % 60 < 10 ? '0' : '') + (secs % 60); } }, 1000);
  })();

  // ------------------------------------------------------------ 6.2 watch list: three state changes, then still
  (function watchlist() {
    var list = document.getElementById('watchlist'); if (!list || REDUCE) return;
    var rows = [].slice.call(list.querySelectorAll('.wl-row'));
    var LABEL = { watching: 'Watching', 'new': 'New this week', removed: 'Removed' };
    var script = [[4, 'new'], [1, 'watching'], [2, 'removed']];
    var step = 0, timer = 0, hover = false, visible = false;
    function next() {
      timer = 0;
      if (step >= script.length) return;
      if (hover || M.paused || !visible || document.hidden) { timer = setTimeout(next, 600); return; }
      var row = rows[script[step][0]], s = script[step][1];
      row.classList.add('swap');
      setTimeout(function () { row.dataset.s = s; row.querySelector('.wl-chip').textContent = LABEL[s]; row.classList.remove('swap'); }, 200);
      step++;
      if (step < script.length) timer = setTimeout(next, 3500);
    }
    list.addEventListener('mouseenter', function () { hover = true; });
    list.addEventListener('mouseleave', function () { hover = false; });
    list.addEventListener('focusin', function () { hover = true; });
    list.addEventListener('focusout', function () { hover = false; });
    watch(list, function (v) { visible = v; if (v && !timer && step < script.length) timer = setTimeout(next, 2200); });
  })();

  // ------------------------------------------------------------ 6.3 live call level strip
  (function bars() {
    var el = document.getElementById('callBars'); if (!el) return;
    var r = rng(5), html = '';
    for (var i = 0; i < 22; i++) {
      var d = (0.7 + r() * 0.8).toFixed(2), dl = (-r() * 1.4).toFixed(2), h = (8 + r() * 14).toFixed(0);
      html += '<i style="height:' + h + 'px;animation-duration:' + d + 's;animation-delay:' + dl + 's"></i>';
    }
    el.innerHTML = html;
    watch(el, function (v) { el.classList.toggle('off', !v); });
  })();

  // CSS loops (chips marquee, typing dots) pause when their section is offscreen
  (function cssLoops() {
    var hero = document.getElementById('top'), room = document.querySelector('.room');
    if (hero) watch(hero, function (v) { hero.classList.toggle('off', !v); });
    if (room) watch(room, function (v) { room.classList.toggle('off', !v); });
  })();

  // ------------------------------------------------------------ 8. plans and the Whop checkout slot
  // Swap in the three Whop plan IDs (prefixed plan_) when Jesus has them. One line per plan.
  var PLANS = {
    founding: { label: 'Founding Monthly', price: '$49', per: '/mo', note: 'Forever. Cancel whenever. 50 seats only.', renew: 'Renews at $49.00 per month.', whopPlanId: null },
    standard: { label: 'Standard Monthly', price: '$99', per: '/mo', note: 'The price once the founding seats are gone.', renew: '', whopPlanId: null },
    yearly: { label: 'Yearly', price: '$990', per: '/yr', note: '2 months free.', renew: '', whopPlanId: null }
  };
  var current = 'founding';
  var WS_TEXT = 'Opens here soon (Whop, card or ACH)';
  function mountCheckout(planKey) {
    var plan = PLANS[planKey];
    document.getElementById('wsLabel').textContent = 'Checkout · ' + plan.label;
    if (!plan.whopPlanId) {
      // Preview: no Whop script may load here. Production (Whop Elements):
      //   const checkout = window.WhopElements().checkout.create({ plan: plan.whopPlanId, returnUrl, onComplete });
      //   checkout.create('checkout').mount('#whopSlot');   // destroy and remount to change plans
      document.getElementById('wsText').textContent = 'Not connected in this preview. The Whop checkout for ' + plan.label + ' mounts in this row.';
      return false;
    }
    return true;
  }
  window.SwarmCheckout = { PLANS: PLANS, mountCheckout: mountCheckout };
  document.querySelectorAll('input[name="plan"]').forEach(function (inp) {
    inp.addEventListener('change', function () {
      if (!inp.checked) return;
      current = inp.value; var p = PLANS[current];
      document.getElementById('pcPlan').textContent = p.label;
      document.getElementById('pcNum').textContent = p.price;
      document.getElementById('pcPer').textContent = p.per;
      document.getElementById('pcNote').textContent = p.note;
      document.getElementById('pcRenew').textContent = p.renew;
      document.getElementById('wsLabel').textContent = 'Checkout · ' + p.label;
      document.getElementById('wsText').textContent = WS_TEXT;
    });
  });
  var joinBtn = document.getElementById('joinBtn');
  if (joinBtn) joinBtn.addEventListener('click', function () {
    mountCheckout(current);
    var slot = document.getElementById('whopSlot');
    slot.scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth', block: 'center' });
    slot.focus({ preventScroll: true });
  });

  // ------------------------------------------------------------ gentle reveal for section heads and cards
  (function reveal() {
    if (REDUCE || !('IntersectionObserver' in window)) return;
    var els = [].slice.call(document.querySelectorAll('.sec-head, .crowd, .zones, .pq, .poster, .founder-grid, .mcard, .wcard, .price-wrap, .step-row, .faq-list, .h2-final'));
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.01 });
    els.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight) return; // already on screen: never hide it
      el.classList.add('rv'); io.observe(el);
    });
  })();
})();
