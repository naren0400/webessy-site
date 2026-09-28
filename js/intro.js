/* ==========================================================================
   INTRO — Ignition
   Plays once per browser session. The 0400 is traced by light, dust is pulled
   in, ink rises, a flash and shockwave fire, the name arrives, then the digits
   fly into the nav. Any scroll, click, touch or key press skips it.
   When finished it sets window.__introDone and fires the 'intro:done' event.
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var intro = document.getElementById('intro');
  var finished = false;
  var tl = null, drift = null, loopDead = false, flightStarted = false;

  function markDone() {
    window.__introDone = true;
    document.dispatchEvent(new CustomEvent('intro:done'));
  }

  /* Ends the intro from any state. instant = no fade (used for skips before
     the flight, for repeat visits, and for errors). */
  function finish(instant) {
    if (finished) return;
    finished = true;
    loopDead = true;
    if (typeof gsap !== 'undefined') gsap.ticker.lagSmoothing(500, 33);
    if (tl) tl.kill();
    if (drift) drift.kill();
    root.classList.add('nav-in', 'nav-done');
    root.classList.remove('intro-lock');
    try { sessionStorage.setItem('webessy-intro', '1'); } catch (e) { /* storage blocked: harmless */ }
    if (!intro) { markDone(); return; }
    if (instant || typeof gsap === 'undefined') {
      intro.style.display = 'none';
      markDone();
    } else {
      gsap.to(intro, { opacity: 0, duration: 0.35, ease: 'power1.out',
        onComplete: function () { intro.style.display = 'none'; markDone(); } });
    }
  }

  var seen = false;
  try { seen = sessionStorage.getItem('webessy-intro') === '1'; } catch (e) { /* ignore */ }
  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  if (!intro || typeof gsap === 'undefined' || seen || reduce) { finish(true); return; }

  try {
    run();
  } catch (err) {
    console.error('[intro] ' + err.message);
    finish(true);
  }

  function run() {
    var byId = function (s) { return document.getElementById(s); };
    function need(id) { var el = byId(id); if (!el) throw new Error('missing #' + id); return el; }

    var stage = need('introStage'), mark = need('mark'), cv = need('dust'), ctx = cv.getContext('2d');
    var introBg = need('introBg'), fx = need('introFx');
    var D = ['Vector', 'Vector_2', 'Vector_3', 'Vector_4'];
    var traces = D.map(function (k) { return need('tr-' + k); });
    var heads = D.map(function (k) { return need('hd-' + k); });
    var inks = D.map(function (k) { return need('inkr-' + k); });
    var words = ['name-the', 'name-webessy', 'name-studios'].map(need);
    var line = need('Line 1');
    var arrowGroups = [need('Arrow 1'), need('Arrow 2')];
    var arrowP = [].concat(
      Array.prototype.slice.call(arrowGroups[0].querySelectorAll('path')),
      Array.prototype.slice.call(arrowGroups[1].querySelectorAll('path')));
    var fadeParts = words.concat([line], arrowGroups, [need('traceLayer'), need('headLayer')]);

    root.classList.add('intro-lock');

    /* ---- stage: a 3:2 box. On phones it is wider than the screen so the
       logo is large enough to read. ---- */
    function layoutStage() {
      var W = window.innerWidth, H = window.innerHeight;
      var sw = H > W ? W * 1.85 : Math.min(W, H * 1.5);
      var sh = sw / 1.5;
      stage.style.width = sw + 'px'; stage.style.height = sh + 'px';
      stage.style.left = ((W - sw) / 2) + 'px'; stage.style.top = ((H - sh) / 2) + 'px';
    }
    layoutStage();

    tl = gsap.timeline({ paused: true });

    /* ---- dust sampled from the real digit outlines ---- */
    var MOBILE = window.innerWidth < 760;
    var STEP = MOBILE ? 12 : 5;
    var pts = [];
    traces.forEach(function (p) {
      var Lp = p.getTotalLength(), n = Math.max(8, Math.round(Lp / STEP));
      for (var i = 0; i < n; i++) { var q = p.getPointAtLength(i / n * Lp); pts.push({ px: q.x, py: q.y }); }
    });
    for (var i = pts.length - 1; i > 0; i--) { var j = (Math.random() * (i + 1)) | 0; var t = pts[i]; pts[i] = pts[j]; pts[j] = t; }

    var P = [], SF = 1, W = 1, H = 1;
    function sizeCv() {
      var r = stage.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = Math.max(1, r.width); H = Math.max(1, r.height);
      cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); SF = W / 1200;
      P = pts.map(function (p, i) {
        return { px: p.px, py: p.py, x: Math.random() * W, y: Math.random() * H,
          vx: (Math.random() - .5) * .7, vy: (Math.random() - .5) * .7,
          ph: Math.random() * 6.28, thr: i / pts.length, st: 0, a: 0, amb: Math.random() < 0.18 };
      });
    }
    sizeCv();
    window.addEventListener('resize', function () { if (!finished) { layoutStage(); sizeCv(); } });

    var mx = -9e9, my = -9e9;
    drift = gsap.timeline({ repeat: -1, yoyo: true })
      .to('#glow', { x: 300, y: 230, duration: 7, ease: 'sine.inOut' })
      .to('#glow', { x: 760, y: 440, duration: 8, ease: 'sine.inOut' });
    gsap.set('#glow', { x: 530, y: 340 });
    stage.addEventListener('mousemove', function (e) {
      drift.pause(); var r = stage.getBoundingClientRect();
      mx = e.clientX - r.left; my = e.clientY - r.top;
      gsap.to('#glow', { x: mx, y: my, duration: .9, ease: 'power3.out' });
    });

    var cl = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
    var waveR = 0, waveOn = 0;

    function frame() {
      if (loopDead) return;
      try {
        ctx.clearRect(0, 0, W, H);
        var p = tl.progress();
        var born = cl((p - 0.02) / 0.10), pull = cl((p - 0.14) / 0.30), now = performance.now();
        for (var i = 0; i < P.length; i++) {
          var a = P[i];
          if (a.st === 2 && !a.amb) continue;
          var tx = a.px * SF, ty = a.py * SF, eager = cl((pull - a.thr * 0.7) / 0.3);
          if (eager > 0 && a.st === 0) {
            a.vx += (tx - a.x) * .020 * eager; a.vy += (ty - a.y) * .020 * eager;
            if (Math.hypot(tx - a.x, ty - a.y) < 7) { a.st = 1; a.a = 1; }
          } else {
            a.vx += Math.sin(now / 1500 + a.ph) * .010; a.vy += Math.cos(now / 1700 + a.ph) * .010;
          }
          if (waveOn) {
            var dx = a.x - W / 2, dy = a.y - H * 0.43, d = Math.hypot(dx, dy) || 1;
            if (Math.abs(d - waveR) < 46) { a.vx += dx / d * 3.4; a.vy += dy / d * 3.4; if (a.st === 0 && !a.amb) a.st = 1; }
          }
          var rx = a.x - mx, ry = a.y - my, r2 = rx * rx + ry * ry;
          if (r2 < 12000 && r2 > .1) { var f = (12000 - r2) / 12000, dm = Math.sqrt(r2); a.vx += rx / dm * f * 2.5; a.vy += ry / dm * f * 2.5; }
          a.vx *= .90; a.vy *= .90; a.x += a.vx; a.y += a.vy;
          var al;
          if (a.st === 1) { a.a *= .90; al = a.a * 0.95; if (a.a < .02) a.st = 2; }
          else al = born * (0.10 + 0.30 * eager) * (a.amb ? 0.5 : 1);
          if (al <= 0.004) continue;
          ctx.fillStyle = 'rgba(223,217,201,' + al.toFixed(3) + ')';
          ctx.beginPath(); ctx.arc(a.x, a.y, a.st === 1 ? 1.5 : 0.8, 0, 6.2832); ctx.fill();
        }
        for (var k = 0; k < traces.length; k++) {
          var tr = traces[k], Lt = tr.getTotalLength();
          var off = parseFloat(tr.style.strokeDashoffset); if (isNaN(off)) off = Lt;
          var drawn = Lt - off;
          if (drawn > 1 && off > 0.5) { var q = tr.getPointAtLength(drawn); heads[k].setAttribute('cx', q.x); heads[k].setAttribute('cy', q.y); }
        }
      } catch (err) { console.error('[intro] frame: ' + err.message); finish(true); return; }
      requestAnimationFrame(frame);
    }

    /* ---- initial state ---- */
    traces.forEach(function (t) { var Lp = t.getTotalLength(); t.style.strokeDasharray = Lp; t.style.strokeDashoffset = Lp; });
    arrowP.forEach(function (p) { var Lp = p.getTotalLength(); p.style.strokeDasharray = Lp; p.style.strokeDashoffset = Lp; });
    gsap.set(words, { clipPath: 'inset(0 100% 0 0)' });
    gsap.set(line, { scaleX: 0 });
    var INKY = inks.map(function (r) { return parseFloat(r.getAttribute('y')); });
    var INKH = D.map(function (k) { return k === 'Vector_3' ? 148 : 112; });
    inks.forEach(function (r, i) { r.setAttribute('y', INKY[i]); r.setAttribute('height', 0); });

    /* ---- the Ignition timeline (unchanged beats, now ending in a flight) ---- */
    tl.to('#cam', { scale: 1.055, duration: 3.9, ease: 'none' }, 0)
      .to('#grid', { opacity: 1, duration: 1.6, ease: 'power2.out' }, 0.15)
      .to(heads, { opacity: 1, duration: .25, stagger: .34 }, 0.30)
      .to(traces, { strokeDashoffset: 0, duration: 1.55, stagger: .34, ease: 'power2.inOut' }, 0.30)
      .to(heads, { opacity: 0, duration: .22, stagger: .34 }, 1.62);
    inks.forEach(function (r, i) {
      tl.fromTo(r, { attr: { y: INKY[i], height: 0 } },
        { attr: { y: INKY[i] - INKH[i], height: INKH[i] }, duration: .62, ease: 'power2.out' }, 1.34 + i * 0.34);
    });
    var waveProxy = { v: 0 };
    tl.to('#flash', { opacity: .13, duration: .10, ease: 'power2.out' }, 2.52)
      .to('#flash', { opacity: 0, duration: .55, ease: 'power2.in' }, 2.62)
      .to('#traceLayer', { opacity: 0, duration: .45 }, 2.55)
      .set('#wave', { opacity: 1, scale: 1 }, 2.54)
      .to('#wave', { scale: 17, opacity: 0, duration: 1.25, ease: 'power2.out' }, 2.54)
      .call(function () { waveOn = 1; }, null, 2.54)
      .fromTo(waveProxy, { v: 0 }, { v: 1, duration: 1.25, ease: 'power2.out',
        onUpdate: function () { waveR = waveProxy.v * (W * 0.9); } }, 2.54)
      .call(function () { waveOn = 0; }, null, 3.79)
      .to(line, { scaleX: 1, duration: .65, ease: 'power3.inOut' }, 2.70)
      .to(arrowP, { strokeDashoffset: 0, duration: .70, ease: 'power2.out' }, 2.80)
      .set('#lbar', { opacity: 1, left: '45.55%' }, 2.92)
      .to('#lbar', { left: '67.18%', duration: .85, ease: 'power2.inOut' }, 2.92)
      .to('#lbar', { opacity: 0, duration: .3 }, 3.62)
      .to(words, { clipPath: 'inset(0 0% 0 0)', duration: .80, stagger: .13, ease: 'power3.out' }, 2.95)
      .to('#cam', { scale: 1, duration: .45, ease: 'power2.inOut' }, 3.9)
      .call(flight, null, 4.4);

    /* ---- the flight: the digits land exactly on the nav logo ---- */
    function flight() {
      flightStarted = true;
      var slot = document.getElementById('navMark');
      var digits = document.getElementById('num-0400');
      if (!slot || !digits) { finish(false); return; }
      var M = mark.getBoundingClientRect(), Dg = digits.getBoundingClientRect(), S = slot.getBoundingClientRect();
      if (!Dg.height || !S.height) { finish(false); return; }
      /* navMark viewBox is 405 192 404 160; the digits span x 413-802, y 200-344 */
      var T = { left: S.left + (8 / 404) * S.width, top: S.top + (8 / 160) * S.height, height: (144 / 160) * S.height };
      var s = T.height / Dg.height;
      var x = T.left - M.left - s * (Dg.left - M.left);
      var y = T.top - M.top - s * (Dg.top - M.top);
      gsap.set(mark, { transformOrigin: '0 0' });
      gsap.timeline({ onComplete: function () { finish(false); } })
        .to(mark, { x: x, y: y, scale: s, duration: 0.95, ease: 'power3.inOut' }, 0)
        .to(fadeParts.concat(byId('skipHint') ? [byId('skipHint')] : []), { opacity: 0, duration: .4, ease: 'power1.out' }, 0)
        .to([introBg, fx, cv, byId('grid'), byId('glow')], { opacity: 0, duration: .8, ease: 'power2.inOut' }, 0.08)
        .add(function () { root.classList.add('nav-in'); }, 0.3);
    }

    /* ---- skip: any intent to move on ends it ---- */
    function skip() {
      if (finished || flightStarted) return;
      finish(false);
    }
    ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(function (ev) {
      window.addEventListener(ev, skip, { passive: true, once: true });
    });

    tl.timeScale(1.3);
    /* Follow real time during the intro: on a slow device frames drop, but the
       intro still ends on schedule instead of stretching out with scroll locked. */
    gsap.ticker.lagSmoothing(0);
    /* Hard deadline: if the flight has not started 5 s after play, start it now. */
    setTimeout(function () {
      if (finished || flightStarted) return;
      tl.pause();
      tl.progress(0.999, true);          /* every beat complete, flight not yet fired */
      gsap.set('#cam', { scale: 1 });
      flight();
    }, 5300);
    /* lets the hero's safety net tell "slow" apart from "stuck" */
    var startedAt = performance.now();
    window.__introAlive = function () {
      if (finished || flightStarted) return true;                 /* ending on its own */
      if (tl && tl.isActive() && tl.progress() > 0) return true;  /* playing */
      return performance.now() - startedAt < 4000;                /* grace period to start */
    };
    frame();
    setTimeout(function () { if (!finished) tl.play(); }, 300);
  }
})();
